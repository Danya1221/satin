/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let session = null;
let cookie = '';
let state;
const clone = value => structuredClone(value);
const makeDb = get => ({
  siteSetting: {
    findUnique: async ({where}) => get().settings[where.key] || null,
    upsert: async ({where,create,update}) => { const current = get().settings[where.key]; return get().settings[where.key] = current ? {...current,...update} : {...create,updatedAt:new Date()}; },
  },
  pageBlock: {
    findUnique: async ({where}) => get().blocks[where.id] || null,
    count: async ({where}) => Object.values(get().blocks).filter(b => b.pageKey === where.pageKey).length,
    findMany: async ({where}) => Object.values(get().blocks).filter(b => !where || b.pageKey === where.pageKey),
    createMany: async () => { throw new Error('Deleted blocks must not be recreated'); },
    update: async ({where,data}) => { if (!get().blocks[where.id]) throw new Error('missing'); return get().blocks[where.id] = {...get().blocks[where.id],...data,updatedAt:new Date()}; },
  },
  siteBanner: {
    findUnique: async ({where}) => get().banners?.[where.id] || null,
    update: async ({where,data}) => get().banners[where.id] = {...get().banners[where.id],...data,updatedAt:new Date()},
  },
  siteBenefit: {
    findUnique: async ({where}) => get().benefits?.[where.id] || null,
    update: async ({where,data}) => get().benefits[where.id] = {...get().benefits[where.id],...data,updatedAt:new Date()},
  },
  category: { findFirst: async ({where}) => where.slug === 'смартфон' ? {slug:'смартфон',name:'Смартфоны',description:'',image:'',seoTitle:'',seoDescription:''} : null },
  supportRequest: { findFirst: async ({where}) => get().requests.find(record => where.OR.some(condition => condition.id === record.id || condition.publicId === record.publicId)) || null },
});
const prisma = makeDb(() => state);
prisma.$transaction = async work => { const draft = clone(state); const result = await work(makeDb(() => draft)); state = draft; return result; };
const load = Module._load, resolve = Module._resolveFilename;
Module._load = function(request,...args) {
  if (request === 'server-only') return {};
  if (request === '@/lib/db') return { prisma };
  if (request === '@/lib/auth') return { getAuthSession: async () => session, normalizeAdminRoles: (roles, fallback = ['manager']) => roles?.length ? roles : fallback };
  if (request === 'next/headers') return { cookies: async () => ({get: () => cookie ? {value:cookie} : undefined}) };
  return load.call(this,request,...args);
};
Module._resolveFilename = function(request,...args) { return resolve.call(this,request.startsWith('@/') ? path.join(root,'src',request.slice(2)) : request,...args); };
for (const extension of ['.ts','.tsx']) Module._extensions[extension] = function(module,filename) { module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename); };
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { NextRequest } = require('next/server');
const { PATCH } = require('../src/app/api/admin/site-editor/route.ts');
const { getPublicCategoryBySlug } = require('../src/lib/public-categories-db.ts');
const { getPublicPageBlocks } = require('../src/lib/page-builder-db.ts');
const { defaultLegalSettings } = require('../src/lib/legal-settings.ts');
const { legalVersion, validateConsent } = require('../src/lib/legal-db.ts');
const { mayReadSupport, supportTokenHash } = require('../src/lib/support-access.ts');
const { adminSectionAccess, getAdminSection } = require('../src/lib/admin-policy.ts');
const { allowedAdminNavigation } = require('../src/lib/admin-navigation.ts');
const { safeStoreHref } = require('../src/lib/route-paths.ts');
const Home = require('../src/app/home-client.tsx').default;
const { ThemeProvider } = require('../src/components/theme-provider.tsx');
const { SiteFooter } = require('../src/components/site-footer.tsx');
const { GET: getAdminSettings } = require('../src/app/api/admin/site-settings/route.ts');
const stamp = '2026-09-09T00:00:00.000Z';
const block = (id,type='text-image',settings={}) => ({id,type,pageKey:'home',title:id,description:'',enabled:true,sortOrder:10,settings,updatedAt:new Date(stamp),createdAt:new Date(stamp)});
const inputBlock = item => ({...item,updatedAt:item.updatedAt.toISOString(),createdAt:item.createdAt.toISOString()});
const save = body => PATCH(new NextRequest('https://store.test/api/admin/site-editor',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
const render = element => renderToStaticMarkup(React.createElement(ThemeProvider,null,element));
beforeEach(() => { session = {role:'admin',roles:['owner']}; cookie = ''; state = {settings:{site:{key:'site',value:{branding:{storeName:'Исходный магазин'}}},legal:{key:'legal',value:defaultLegalSettings}},blocks:{a:block('a'),b:block('b')},requests:[]}; });
test('Cyrillic category route resolves the encoded segment and returns a canonical URL', async () => { const category = await getPublicCategoryBySlug('%D1%81%D0%BC%D0%B0%D1%80%D1%82%D1%84%D0%BE%D0%BD'); assert.equal(category.slug,'смартфон'); assert.equal(category.href,'/catalog/'+encodeURIComponent('смартфон')); });
test('Real unknown category remains not found', async () => { assert.equal(await getPublicCategoryBySlug('missing-category'),null); });
test('Save all commits both edited modules and site settings together', async () => { const response = await save({blocks:[{...inputBlock(state.blocks.a),settings:{title:'Первый'}},{...inputBlock(state.blocks.b),settings:{title:'Второй'}}],site:{branding:{storeName:'Новый магазин'}}}); assert.equal(response.status,200); assert.equal(state.blocks.a.settings.title,'Первый'); assert.equal(state.blocks.b.settings.title,'Второй'); assert.equal(state.settings.site.value.branding.storeName,'Новый магазин'); });
test('A stale module rolls back the entire save, including other modules and branding', async () => { const before = clone(state); const response = await save({blocks:[{...inputBlock(state.blocks.a),settings:{title:'Must not commit'}},{...inputBlock(state.blocks.b),updatedAt:'2020-01-01T00:00:00.000Z'}],site:{branding:{storeName:'Must not commit'}}}); assert.equal(response.status,409); assert.deepEqual(state,before); });
test('Support staff cannot publish editor changes', async () => { session.roles = ['support']; assert.equal((await save({blocks:[inputBlock(state.blocks.a)]})).status,403); });
test('An existing empty page stays empty after deleting its final block', async () => { state.blocks={}; state.settings['page-blocks-initialized:home']={value:true}; assert.deepEqual(await getPublicPageBlocks('home'),[]); });
test('An explicitly disabled homepage never restores default hero or sections', () => { const html=render(React.createElement(Home,{initialData:{pageBlocks:[],products:[],categories:[]}})); assert(!html.includes('store-hero')); assert(!html.includes('Ближе к тому')); assert(html.includes('store-footer')); });
test('Hero and support module copy from the editor is rendered', () => { const html=render(React.createElement(Home,{initialData:{pageBlocks:[{...block('hero','hero',{title:'Мой первый экран',subtitle:'Мой текст',buttonText:'Выбрать',buttonHref:'/new'}),updatedAt:stamp,createdAt:stamp},{...block('help','support',{title:'Моя поддержка',subtitle:'Мы рядом'}),sortOrder:20,updatedAt:stamp,createdAt:stamp}]}})); assert(html.includes('Мой первый экран')); assert(html.includes('Мой текст')); assert(html.includes('Моя поддержка')); assert(html.includes('Мы рядом')); });
test('Manual promotional content is not replaced by an unrelated library banner', () => { const html=render(React.createElement(Home,{initialData:{pageBlocks:[{...block('promo','promo-banner',{title:'Ручной заголовок',bannerId:''}),updatedAt:stamp,createdAt:stamp}],banners:[{id:'other',enabled:true,title:'Чужой баннер',sortOrder:1,placement:'manual'}]}})); assert(html.includes('Ручной заголовок')); assert(!html.includes('Чужой баннер')); });
test('Every footer page and every permitted admin tab has a route', () => { const html=render(React.createElement(SiteFooter)); for(const [,href] of html.matchAll(/href="(\/[^"?#]*)"/g)){const target=href==='/'?'src/app/page.tsx':`src/app${href}/page.tsx`; assert(fs.existsSync(path.join(root,target)),`Missing footer route: ${href}`);} for(const role of ['owner','admin','manager','content','support']) for(const link of allowedAdminNavigation([role])) { assert(fs.existsSync(path.join(root,'src/app',link.href,'page.tsx')),link.href); assert(adminSectionAccess[getAdminSection(link.href)].includes(role),`${role} cannot open advertised ${link.href}`); } });
test('Content staff cannot retrieve integration tokens through the all-settings scope', async () => { session.roles=['content']; const r=await getAdminSettings(new NextRequest('https://store.test/api/admin/site-settings?scope=all')); assert.equal(r.status,403); });
test('Unchecked and outdated personal-data consents are rejected', async () => { await assert.rejects(validateConsent({accepted:false},'order')); await assert.rejects(validateConsent({accepted:true,version:'old'},'order')); const proof=await validateConsent({accepted:true,version:legalVersion(defaultLegalSettings)},'order'); assert.equal(proof.purpose,'order'); assert(proof.documentText.includes('не включает рекламу')); assert.equal(proof.documentHash.length,64); });
test('Private support history is accessible only to its owner, authorized staff or the guest cookie', async () => { const secret='a'.repeat(64); state.requests=[{id:'r1',publicId:'SUP-1',customerId:'customer-1',guestTokenHash:supportTokenHash(secret)}]; session=null; assert.equal(await mayReadSupport('SUP-1'),false); cookie='b'.repeat(64); assert.equal(await mayReadSupport('SUP-1'),false); cookie=secret; assert.equal(await mayReadSupport('SUP-1'),true); cookie=''; session={role:'customer',customerId:'customer-2'}; assert.equal(await mayReadSupport('SUP-1'),false); session.customerId='customer-1'; assert.equal(await mayReadSupport('SUP-1'),true); session={role:'admin',roles:['support']}; assert.equal(await mayReadSupport('SUP-1'),true); session.roles=['content']; assert.equal(await mayReadSupport('SUP-1'),false); });
test('Unsafe editor links cannot execute scripts or change origin using a scheme-relative URL', () => { for (const href of ['javascript:alert(1)','//evil.test','/\\evil.test','data:text/html,test']) assert.equal(safeStoreHref(href),'/catalog'); assert.equal(safeStoreHref('/returns'),'/returns'); });

test('Editing banner text preserves the original stored image and saves with all page changes', async () => {
  state.banners = {hero:{id:'hero',adminTitle:'Hero',title:'Old title',imageLight:'data:image/png;base64,AA==',imageDark:'',imageMobile:'',createdAt:new Date(stamp),updatedAt:new Date(stamp)}};
  const banner = {...state.banners.hero,title:'New title',imageLight:'/api/public-image/banner/hero/imageLight?v=1',updatedAt:stamp,createdAt:stamp};
  const response = await save({blocks:[{...inputBlock(state.blocks.a),settings:{title:'Updated page'}}],media:{banners:[banner],benefits:[]}});
  assert.equal(response.status,200); assert.equal(state.banners.hero.title,'New title'); assert.equal(state.banners.hero.imageLight,'data:image/png;base64,AA=='); assert.equal(state.blocks.a.settings.title,'Updated page');
});
test('A concurrently changed banner rolls back page edits as part of save all', async () => {
  state.banners = {hero:{id:'hero',updatedAt:new Date(stamp)}};
  const before=clone(state); const response=await save({blocks:[{...inputBlock(state.blocks.a),settings:{title:'Do not publish'}}],media:{banners:[{id:'hero',title:'stale',updatedAt:'2020-01-01T00:00:00.000Z'}],benefits:[]}});
  assert.equal(response.status,409); assert.deepEqual(state,before);
});


test('Editor response provides timestamps for an immediate second save', async () => {
 const response = await save({blocks:[{...inputBlock(state.blocks.a),settings:{title:'First'}}]});
 assert.equal(response.status,200); const body=await response.json();
 const saved=body.blocks.find(item=>item.id==='a'); assert(saved.updatedAt);
 const second=await save({blocks:[{...saved,settings:{title:'Second'}}]});
 assert.equal(second.status,200); assert.equal(state.blocks.a.settings.title,'Second');
});


test('New information pages initialize without inserting an empty block batch', async () => {
 delete state.settings['page-blocks-initialized:delivery'];
 const blocks = await getPublicPageBlocks('delivery');
 assert.deepEqual(blocks, []);
 assert.equal(state.settings['page-blocks-initialized:delivery'].value, true);
});
