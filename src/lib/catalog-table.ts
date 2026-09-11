import { createHash } from "node:crypto";
import { Prisma, type EntityStatus } from "@prisma/client";
export type TableKind="products"|"variants"|"prices";
export type TableRow=Record<string,unknown>;
export const tableHeaders:Record<TableKind,string[]>={products:["slug","name","brand","categorySlug","description","shortDescription","characteristics","image","promoImage","images","status","isNew","isPopular","sortOrder"],variants:["sku","productSlug","title","memory","color","colorHex","sim","price","oldPrice","stock","status","images","seoTitle","seoDescription","seoKeywords"],prices:["sku","price","oldPrice","stock","status"]};
export const tableLabels:Record<string,string>={slug:"Ссылка модели",name:"Название модели",brand:"Бренд",categorySlug:"Код категории",description:"Описание",shortDescription:"Краткое описание",characteristics:"Характеристики: Название: значение, каждая с новой строки",image:"Главное фото: https:// или /uploads/...",promoImage:"Промофото новинки",images:"Ссылки на фотографии через |",status:"active / draft / hidden / out_of_stock",isNew:"Новинка: 1 или 0",isPopular:"Популярный: 1 или 0",sortOrder:"Порядок",sku:"Уникальный артикул позиции",productSlug:"Ссылка существующей модели",title:"Название позиции",memory:"Память",color:"Цвет",colorHex:"Цвет #RRGGBB",sim:"SIM / eSIM",price:"Цена в рублях (целое число)",oldPrice:"Старая цена; 0 — убрать",stock:"Остаток (целое число)",seoTitle:"SEO заголовок",seoDescription:"SEO описание",seoKeywords:"Ключевые слова"};
const aliases:Record<string,string>={артикул:"sku",цена:"price",остаток:"stock",количество:"stock",стараяцена:"oldPrice",модель:"productSlug",название:"name",цвет:"color",память:"memory",статус:"status",бренд:"brand",категория:"categorySlug",новинка:"isNew"};
export function normalizeTableRow(row:TableRow,kind:TableKind){const result:TableRow={};for(const [key,value] of Object.entries(row)){const match=tableHeaders[kind].find(k=>k.toLowerCase()===key.trim().toLowerCase())||aliases[key.toLowerCase().replace(/\s+/g,"")];if(match)result[kind!=="products"&&match==="name"?"title":match]=value;}return result;}
function has(row:TableRow,key:string){return row[key]!==undefined&&row[key]!==null&&String(row[key]).trim()!=="";}
function str(row:TableRow,key:string,max=20000){const value=String(row[key]??"").trim();if(value.length>max)throw Error(`${key}: слишком длинное значение`);return value;}
function integer(row:TableRow,key:string){if(!has(row,key))return undefined;const raw=String(row[key]).replace(/[\s\u00a0]/g,"").replace(",",".");const value=Number(raw);if(!/^\d+(?:\.0+)?$/.test(raw)||!Number.isSafeInteger(value)||value>2147483647)throw Error(`${key}: нужно целое неотрицательное число`);return value;}
function bool(row:TableRow,key:string){if(!has(row,key))return undefined;const v=str(row,key).toLowerCase();if(["1","true","да"].includes(v))return true;if(["0","false","нет"].includes(v))return false;throw Error(`${key}: укажите 1 или 0`);}
function image(value:string){if(value&&!/^https:\/\/[^\s]+$|^\/(?!\/)[^\s\\]+$/.test(value))throw Error("Фото: требуется https:// ссылка или путь /uploads/...");return value;}
function storedImage(value:string,kind:"product"|"variant",key:string,field:string,current: string|string[]|undefined) {
 if(!value.startsWith("/api/public-image/")) return image(value);
 const url=new URL(value,"https://store.invalid");
 const expected=`/api/public-image/${kind}/${encodeURIComponent(key)}/${field}`;
 if(url.pathname!==expected) throw Error("Фото из выгрузки принадлежит другому товару; загрузите отдельную ссылку на изображение");
 const index=Number(url.searchParams.get("index")||0);
 const original=Array.isArray(current)?current[index]:current;
 if(!original) throw Error("Исходное фото не найдено. Выгрузите актуальную таблицу");
 return original;
}
function status(row:TableRow):EntityStatus|undefined {if(!has(row,"status"))return undefined;const v=str(row,"status");if(!["active","draft","hidden","out_of_stock"].includes(v))throw Error("status: неизвестный статус");return v as EntityStatus;}
export type TableAction={row:number;key:string;operation:"create"|"update";productId?:string;productVersion?:string;version:string|null;data:Prisma.ProductUncheckedCreateInput|Prisma.ProductVariantUncheckedCreateInput|Record<string,unknown>};
export async function prepareTable(rows:TableRow[],kind:TableKind,db:Prisma.TransactionClient){
 const actions:TableAction[]=[],errors:string[]=[],seen=new Set<string>();
 for(let i=0;i<rows.length;i++){
  const row=normalizeTableRow(rows[i],kind),key=str(row,kind==="products"?"slug":"sku",200);
  try{
   if(!key)throw Error(kind==="products"?"Не заполнена ссылка модели (slug)":"Не заполнен артикул (sku)");
   if(seen.has(key))throw Error(`Дубликат ${key} в таблице`);seen.add(key);
   if(kind==="products"){
    if(!/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(key))throw Error("slug: только буквы, цифры, дефис и подчёркивание");
    const current=await db.product.findUnique({where:{slug:key}});
    const data:Record<string,unknown>={slug:key};
    for(const field of ["name","brand","description","shortDescription","characteristics"])if(has(row,field))data[field]=str(row,field);
    for(const field of ["image","promoImage"])if(has(row,field))data[field]=storedImage(str(row,field),"product",key,field,current?.[field as "image"|"promoImage"]);
    if(has(row,"images"))data.images=str(row,"images").split("|").filter(s=>s.trim()).map(s=>storedImage(s.trim(),"product",key,"images",current?.images));
    if(has(row,"categorySlug")){const category=await db.category.findUnique({where:{slug:str(row,"categorySlug")}});if(!category)throw Error("Категория не найдена. Создайте её в админке или используйте код с листа Категории.");data.categorySlug=category.slug;data.categoryId=category.id;}
    const newStatus=status(row);if(newStatus)data.status=newStatus;
    for(const field of ["isNew","isPopular"]){const value=bool(row,field);if(value!==undefined)data[field]=value;}
    const order=integer(row,"sortOrder");if(order!==undefined)data.sortOrder=order;
    if(!current&&(!data.name||!data.brand||!data.categorySlug))throw Error("Для новой модели нужны name, brand, categorySlug");
    actions.push({row:i+2,key,operation:current?"update":"create",version:current?.updatedAt.toISOString()||null,data});
   }else{
    const current=await db.productVariant.findUnique({where:{sku:key}});
    if(kind==="prices"&&!current)throw Error("Артикул не найден. Новые позиции создаются таблицей «Позиции».");
    const data:Record<string,unknown>={};
    for(const field of ["price","oldPrice","stock"]){const v=integer(row,field);if(v!==undefined)data[field]=field==="oldPrice"&&v===0?null:v;}
    if(current&&data.price===undefined&&data.stock===undefined&&data.oldPrice===undefined&&!has(row,"status")&&kind==="prices")throw Error("Нет цены, остатка или статуса для обновления");
    const newStatus=status(row);if(newStatus)data.status=newStatus;else if(data.stock!==undefined&&(!current||["active","out_of_stock"].includes(current.status)))data.status=Number(data.stock)>0?"active":"out_of_stock";
    let parentVersion:string|undefined,parentId:string|undefined;
    if(kind==="variants"){
     for(const field of ["title","memory","color","colorHex","sim","seoTitle","seoDescription","seoKeywords"])if(has(row,field))data[field]=str(row,field);
     if(data.colorHex&&!/^#[\da-f]{6}$/i.test(String(data.colorHex)))throw Error("colorHex: формат #RRGGBB");
     if(has(row,"images"))data.images=str(row,"images").split("|").filter(s=>s.trim()).map(s=>storedImage(s.trim(),"variant",key,"images",current?.images));
     if(has(row,"productSlug")){const parent=await db.product.findUnique({where:{slug:str(row,"productSlug")}});if(!parent)throw Error("Модель не найдена. Сначала импортируйте модели товаров.");parentId=parent.id;parentVersion=parent.updatedAt.toISOString();if(current&&current.productId!==parent.id)throw Error("Артикул уже принадлежит другой модели");data.productId=parent.id;}
     if(!current){if(!data.productId||!data.title||data.price===undefined)throw Error("Для новой позиции нужны productSlug, title, price");data.sku=key;data.slug=key.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu,"-");data.stock=data.stock??0;data.status=data.status??"out_of_stock";}
    }
    actions.push({row:i+2,key,operation:current?"update":"create",version:current?.updatedAt.toISOString()||null,productId:parentId,productVersion:parentVersion,data});
   }
  }catch(e){errors.push(`Строка ${i+2}: ${e instanceof Error?e.message:"ошибка данных"}`);}
 }
 return {actions,errors};
}
export function tableDigest(kind:TableKind,actions:TableAction[]){return createHash("sha256").update(JSON.stringify({kind,actions})).digest("hex");}
export async function applyTable(actions:TableAction[],kind:TableKind,db:Prisma.TransactionClient){for(const action of actions){if(kind==="products"){if(action.operation==="create")await db.product.create({data:action.data as Prisma.ProductUncheckedCreateInput});else await db.product.update({where:{slug:action.key},data:action.data as Prisma.ProductUncheckedUpdateInput});}else{if(action.operation==="create")await db.productVariant.create({data:action.data as Prisma.ProductVariantUncheckedCreateInput});else await db.productVariant.update({where:{sku:action.key},data:action.data as Prisma.ProductVariantUncheckedUpdateInput});}}}
