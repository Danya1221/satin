/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test, beforeEach } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let created;
let failure;
const prisma = {
  product: { findUnique: async () => ({id:'model-1'}) },
  productVariant: { create: async ({data}) => { if(failure) throw failure; created=data; return {id:'variant-1',...data}; } },
};
const originalLoad = Module._load, originalResolve = Module._resolveFilename;
Module._load = function(request,...args) {
  if (request === '@/lib/db') return {prisma};
  return originalLoad.call(this,request,...args);
};
Module._resolveFilename = function(request,...args) { return originalResolve.call(this,request.startsWith('@/') ? path.join(root,'src',request.slice(2)) : request,...args); };
for (const extension of ['.ts','.tsx']) Module._extensions[extension] = function(module,filename) { module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename); };
const { toggleConfiguration } = require('../src/lib/product-configuration.ts');
const { getCheckoutIssues } = require('../src/lib/checkout-validation.ts');
const { POST } = require('../src/app/api/admin/products/[id]/variants/route.ts');
const { NextRequest } = require('next/server');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const StoreImage = require('../src/components/store-image.tsx').default;
const { ProductDetailView } = require('../src/components/product-detail-view.tsx');
const { ThemeProvider } = require('../src/components/theme-provider.tsx');
const blue = {color:'Blue',memory:'256GB',sim:'eSIM'};
const silver = {color:'Silver',memory:'512GB',sim:'SIM'};
const empty = {color:'',memory:'',sim:''};
const validCheckout = () => ({customer:{name:'Тест',phone:'+79991234567'},delivery:{method:'pickup',address:'Магазин',savedAddress:'',city:'',deliveryKey:'pickup_main'},consent:{accepted:true,offerAccepted:true,version:'current'},hasItems:true,quoteLoading:false});
const body = () => ({sku:' IP-17% ',slug:'ip-17',title:' iPhone 17 ',price:111000,stock:3,images:['https://store.test/image.jpg'],...blue});
const save = data => POST(new NextRequest('https://store.test/api/admin/products/model-1/variants',{method:'POST',headers:{'Content-Type':'application/json'},body:typeof data === 'string' ? data : JSON.stringify(data)}),{params:Promise.resolve({id:'model-1'})});
beforeEach(() => { created=undefined; failure=undefined; });
test('A chosen configuration can be deselected and reselected without losing its other choices', () => {
  let current=blue;
  for(const key of ['color','memory','sim']) {
    const cleared=toggleConfiguration(current,key,current[key],[blue,silver]);
    assert.equal(cleared[key],'');
    assert.deepEqual(toggleConfiguration(cleared,key,current[key],[blue,silver]),current);
  }
  for(const key of ['color','memory','sim']) current=toggleConfiguration(current,key,current[key],[blue,silver]);
  assert.deepEqual(current,empty);
});
test('Choosing an incompatible color clears stale dimensions instead of leaving a nonexistent SKU selected', () => {
  assert.deepEqual(toggleConfiguration(blue,'color','Silver',[blue,silver]),{color:'Silver',memory:'',sim:''});
});
test('A normal product opening never selects its only configuration; an explicit SKU link does', () => {
  const position={...blue,sku:'sku-1',title:'Тестовый товар',price:'111 000 ₽',stock:3,status:'active',images:[]};
  const props={product:{slug:'phone',name:'Phone',brand:'Test',images:[],price:'111 000 ₽'},positions:[position]};
  const render=extra=>renderToStaticMarkup(React.createElement(ThemeProvider,null,React.createElement(ProductDetailView,{...props,...extra})));
  const initial=render({});
  assert(!initial.includes('aria-pressed="true"'));
  assert(initial.includes('Выберите конфигурацию'));
  const direct=render({selectedPosition:position});
  assert.equal((direct.match(/aria-pressed="true"/g)||[]).length,3);
  assert(!direct.includes('class="store-config-hint"'));
});
test('Checkout notice lists all missing sections, including both name and phone', () => {
  const input=validCheckout(); input.customer={name:'',phone:''}; input.delivery.method=null; input.consent={accepted:false,offerAccepted:false,version:''};
  const issues=getCheckoutIssues(input);
  assert.deepEqual(issues.map(i=>i.section),['Контактные данные','Доставка','Согласие на обработку данных','Условия продажи']);
  assert.match(issues[0].message,/имя и корректный телефон/);
});
test('Valid pickup and CDEK checkouts pass; incomplete courier address remains blocked', () => {
  const input=validCheckout(); assert.deepEqual(getCheckoutIssues(input),[]);
  input.delivery={method:'courier',city:'Москва',address:'',savedAddress:'',deliveryKey:'cdek'};
  assert.deepEqual(getCheckoutIssues(input),[]);
  input.delivery.deliveryKey='courier'; assert.equal(getCheckoutIssues(input)[0].section,'Доставка');
  input.delivery.address='ул. Тверская, д. 1'; assert.deepEqual(getCheckoutIssues(input),[]);
});
test('Quote still loading or invalid promo cannot bypass checkout validation', () => {
  assert.equal(getCheckoutIssues({...validCheckout(),quoteLoading:true})[0].section,'Стоимость заказа');
  assert.equal(getCheckoutIssues({...validCheckout(),promoError:'Не найден'})[0].section,'Промокод');
});
test('Create a position with photos, normalize text and preserve literal SKU percent signs', async () => {
  const response=await save(body()); assert.equal(response.status,201);
  assert.equal(created.sku,'IP-17%'); assert.equal(created.title,'iPhone 17'); assert.equal(created.images.length,1);
  const image=renderToStaticMarkup(React.createElement(StoreImage,{src:created.images[0],alt:'Фото',width:96,height:96}));
  assert.match(image,/width="96"/); assert.match(image,/height="96"/);
});
test('Malformed input and invalid numbers return useful JSON without writing a position', async () => {
  for(const input of ['{', {...body(),price:''}, {...body(),price:2147483648}, {...body(),stock:-1}, {...body(),stock:1.5}, {...body(),sku:'   '}]) {
    const response=await save(input); assert.equal(response.status,400); assert((await response.json()).error); assert.equal(created,undefined);
  }
});
test('Conflicting SKU and slug identify the field and preserve the existing position', async () => {
  for(const [target,text] of [[['sku'],/артикул/i],[['productId','slug'],/Ссылка позиции/]]) {
    failure={code:'P2002',meta:{target}}; const response=await save(body());
    assert.equal(response.status,409); assert.match((await response.json()).error,text); assert.equal(created,undefined);
  }
});
