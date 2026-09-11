const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');
const XLSX = require('xlsx');
const root = path.resolve(__dirname, '..');
let state, session;
function dbFor(get) {
 const model = name => ({
  findUnique: async ({where}) => get()[name].find(r => Object.entries(where).every(([k,v])=>r[k]===v)) || null,
  findMany: async () => get()[name].map(r=>name==='variants'?{...r,product:{slug:'phone-pro'}}:r),
  update: async ({where,data}) => {const record=get()[name].find(r=>Object.entries(where).every(([k,v])=>r[k]===v));if(!record)throw Error('missing');Object.assign(record,data,{updatedAt:new Date()});return record;},
  create: async ({data}) => {const record={...data,id:'created-'+get()[name].length,updatedAt:new Date()};get()[name].push(record);return record;},
 });
 return {product:model('products'),productVariant:model('variants'),category:model('categories')};
}
const prisma = dbFor(()=>state);
prisma.$transaction = async work => {const copy=structuredClone(state);const result=await work(dbFor(()=>copy));state=copy;return result;};
const load=Module._load, resolve=Module._resolveFilename;
Module._load=function(request,...args){if(request==='server-only')return {};if(request==='@/lib/db')return {prisma};if(request==='@/lib/auth')return {getAuthSession:async()=>session,normalizeAdminRoles:r=>r||[]};return load.call(this,request,...args);};
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(root,'src',request.slice(2)):request,...args);};
Module._extensions['.ts']=function(module,filename){module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);};
const {NextRequest}=require('next/server');
const {GET,POST}=require('../src/app/api/admin/positions/table/route.ts');
const {prepareTable,tableDigest}=require('../src/lib/catalog-table.ts');
const {deliveryQuote,normalizeDeliverySettings}=require('../src/lib/delivery-settings.ts');
beforeEach(()=>{session={role:'admin',roles:['owner']};state={products:[{id:'p1',slug:'phone-pro',name:'Phone Pro',brand:'Brand',categorySlug:'phones',categoryId:'c1',image:'data:image/png;base64,AA==',promoImage:'',images:['data:image/png;base64,BB=='],updatedAt:new Date('2026-09-01')}],categories:[{id:'c1',slug:'phones',name:'Телефоны'}],variants:[{id:'v1',productId:'p1',sku:'001-PRO',title:'Phone Pro',price:1000,oldPrice:1500,stock:3,status:'hidden',images:['data:image/png;base64,CC=='],updatedAt:new Date('2026-09-01')}]};});
function request(rows,kind='prices',extra={}){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Данные');const form=new FormData();form.set('file',new File([XLSX.write(wb,{type:'buffer',bookType:'xlsx'})],'prices.xlsx'));for(const [k,v]of Object.entries(extra))form.set(k,v);return new NextRequest(`https://store.test/api/admin/positions/table?kind=${kind}`,{method:'POST',body:form});}
test('Preview changes nothing; confirmation applies prices and preserves hidden status',async()=>{const rows=[{sku:'001-PRO',price:1200,stock:8,oldPrice:0}];const preview=await(await POST(request(rows))).json();assert.equal(preview.ok,true);assert.equal(state.variants[0].price,1000);const applied=await(await POST(request(rows,'prices',{apply:'1',digest:preview.digest}))).json();assert.equal(applied.applied,true);assert.equal(state.variants[0].price,1200);assert.equal(state.variants[0].status,'hidden');assert.equal(state.variants[0].oldPrice,null);});
test('One invalid row prevents all changes',async()=>{const before=structuredClone(state);const result=await(await POST(request([{sku:'001-PRO',price:2000},{sku:'unknown',stock:4}]))).json();assert.equal(result.ok,false);assert.deepEqual(state,before);});
test('A changed price after preview rejects stale confirmation',async()=>{const rows=[{sku:'001-PRO',price:2000}];const preview=await(await POST(request(rows))).json();state.variants[0].updatedAt=new Date('2026-09-12');state.variants[0].price=3000;const response=await POST(request(rows,'prices',{apply:'1',digest:preview.digest}));assert.equal(response.status,409);assert.equal(state.variants[0].price,3000);});
test('Negative, fractional and duplicate stock entries are rejected',async()=>{for(const stock of [-1,1.5,'wrong']){const plan=await prepareTable([{sku:'001-PRO',stock}],'prices',prisma);assert.equal(plan.errors.length,1);}const duplicate=await prepareTable([{sku:'001-PRO',stock:1},{sku:'001-PRO',stock:2}],'prices',prisma);assert.equal(duplicate.errors.length,1);});
test('Anonymous visitors and support staff cannot export or import catalog tables',async()=>{for(const who of [null,{role:'admin',roles:['support']}]){session=who;assert.equal((await GET(new NextRequest('https://store.test/api/admin/positions/table?kind=prices'))).status,403);assert.equal((await POST(request([{sku:'001-PRO',price:1}]))).status,403);}});
test('Blank workbook template has headers, instructions and no sample products to import accidentally',async()=>{const response=await GET(new NextRequest('https://store.test/api/admin/positions/table?kind=products&template=1'));assert.equal(response.status,200);const wb=XLSX.read(Buffer.from(await response.arrayBuffer()));assert(wb.SheetNames.includes('Инструкция'));assert.equal(XLSX.utils.sheet_to_json(wb.Sheets['Данные']).length,0);});
test('Exported inline photos survive a round trip without self-referential links',async()=>{const response=await GET(new NextRequest('https://store.test/api/admin/positions/table?kind=products'));const wb=XLSX.read(Buffer.from(await response.arrayBuffer()));const rows=XLSX.utils.sheet_to_json(wb.Sheets['Данные']);assert.match(rows[0].image,/^\/api\/public-image/);const plan=await prepareTable(rows,'products',prisma);assert.deepEqual(plan.errors,[]);assert.equal(plan.actions[0].data.image,state.products[0].image);assert.deepEqual(plan.actions[0].data.images,state.products[0].images);});
test('Variant templates preserve text SKU including leading zeros',async()=>{const response=await GET(new NextRequest('https://store.test/api/admin/positions/table?kind=variants'));const wb=XLSX.read(Buffer.from(await response.arrayBuffer()));const rows=XLSX.utils.sheet_to_json(wb.Sheets['Данные']);assert.equal(rows[0].sku,'001-PRO');const plan=await prepareTable(rows,'variants',prisma);assert.deepEqual(plan.errors,[]);assert.deepEqual(plan.actions[0].data.images,state.variants[0].images);});
test('New variants require a valid parent and do not move existing SKU to another model',async()=>{let plan=await prepareTable([{sku:'NEW',title:'New',price:100,productSlug:'missing'}],'variants',prisma);assert.equal(plan.errors.length,1);state.products.push({...state.products[0],id:'p2',slug:'different'});plan=await prepareTable([{sku:'001-PRO',productSlug:'different'}],'variants',prisma);assert.equal(plan.errors.length,1);});
test('Preview digest includes parent version and row contents',()=>{assert.notEqual(tableDigest('prices',[{key:'a',data:{price:1}}]),tableDigest('prices',[{key:'a',data:{price:2}}]));});
test('Delivery tariffs come only from configured zones; pickup is free and CDEK is agreed',()=>{const settings=normalizeDeliverySettings({zones:[{id:'center',name:'Центр',price:500,description:''}]});assert.deepEqual(deliveryQuote(settings,'pickup','center'),{fee:0,zone:''});assert.deepEqual(deliveryQuote(settings,'cdek','center'),{fee:null,zone:''});assert.deepEqual(deliveryQuote(settings,'courier','center'),{fee:500,zone:'Центр'});assert.deepEqual(deliveryQuote(settings,'courier','missing'),{fee:null,zone:''});});
test('Invalid delivery zones and unsafe map URLs are not accepted',()=>{const settings=normalizeDeliverySettings({mapImage:'javascript:alert(1)',zones:[{id:'a',name:'A',price:-1},{id:'b',name:'B',price:1.5}]});assert.equal(settings.mapImage,'');assert.deepEqual(settings.zones,[]);});
