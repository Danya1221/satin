import { publicImageUrl, publicImageUrls } from "@/lib/public-image-urls";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
import { applyTable,prepareTable,tableDigest,tableHeaders,tableLabels,type TableKind,type TableRow } from "@/lib/catalog-table";
export const dynamic="force-dynamic";
function kindOf(value:unknown):TableKind|null{return value==="products"||value==="variants"||value==="prices"?value:null;}
async function allowed(kind:TableKind){return canAccessAdminSection(await getAuthSession(),kind==="products"?"products":"positions");}
export async function GET(request:NextRequest){
 const kind=kindOf(request.nextUrl.searchParams.get("kind"));if(!kind)return NextResponse.json({error:"Выберите тип таблицы."},{status:400});
 if(!await allowed(kind))return NextResponse.json({error:"Нет доступа."},{status:403});
 const template=request.nextUrl.searchParams.get("template")==="1";
 try{
  let rows:TableRow[]=[];
  if(!template){if(kind==="products"){const items=await prisma.product.findMany({orderBy:{slug:"asc"}});rows=items.map(p=>({...p,image:publicImageUrl("product",p.slug,"image",p.image),promoImage:publicImageUrl("product",p.slug,"promoImage",p.promoImage),images:publicImageUrls("product",p.slug,"images",p.images).join("|"),isNew:p.isNew?1:0,isPopular:p.isPopular?1:0}));}else{const items=await prisma.productVariant.findMany({include:{product:{select:{slug:true}}},orderBy:{sku:"asc"}});rows=items.map(v=>({...v,oldPrice:v.oldPrice??0,productSlug:v.product.slug,images:publicImageUrls("variant",v.sku,"images",v.images).join("|")}));}}
  const wb=XLSX.utils.book_new(),headers=tableHeaders[kind];
  const sheet=XLSX.utils.aoa_to_sheet([headers,...rows.map(r=>headers.map(h=>r[h]??""))]);sheet["!cols"]=headers.map(h=>({wch:h==="description"||h==="characteristics"?45:24}));sheet["!autofilter"]={ref:sheet["!ref"]||"A1:A1"};XLSX.utils.book_append_sheet(wb,sheet,"Данные");
  const instructions=[["Поле","Что заполнить"],...headers.map(h=>[h,tableLabels[h]||h]),["Правило","Пустые ячейки не меняют существующее значение. oldPrice=0 удаляет старую цену."],["Порядок","Сначала категории, затем модели (Товары), затем варианты (Позиции)."],["Проверка","Выберите файл, проверьте предпросмотр, затем примените. При любой ошибке данные не меняются."],["Ограничение","До 1000 строк и 5 МБ за одну загрузку. Артикулы и коды записывайте текстом, чтобы сохранить начальные нули."]];
  const notes=XLSX.utils.aoa_to_sheet(instructions);notes["!cols"]=[{wch:25},{wch:100}];XLSX.utils.book_append_sheet(wb,notes,"Инструкция");
  const categories=await prisma.category.findMany({select:{slug:true,name:true},orderBy:{name:"asc"}});XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(categories),"Категории");
  if(kind!=="products"){const models=await prisma.product.findMany({select:{slug:true,name:true},orderBy:{name:"asc"}});XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(models),"Модели");}
  const bytes=XLSX.write(wb,{type:"buffer",bookType:"xlsx"});return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="${kind}-${template?"template":"export"}.xlsx"`,"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Таблицу не удалось подготовить. Повторите попытку."},{status:503});}
}
export async function POST(request:NextRequest){
 const kind=kindOf(request.nextUrl.searchParams.get("kind"));if(!kind)return NextResponse.json({error:"Выберите тип таблицы."},{status:400});
 if(!await allowed(kind))return NextResponse.json({error:"Нет доступа."},{status:403});
 if(Number(request.headers.get("content-length"))>6*1024*1024)return NextResponse.json({error:"Файл слишком большой."},{status:413});
 try{
  const form=await request.formData(),file=form.get("file");if(!(file instanceof File)||file.size>5*1024*1024||!/^.+\.(xlsx|xls|csv)$/i.test(file.name))return NextResponse.json({error:"Выберите XLSX, XLS или CSV до 5 МБ."},{status:400});
  const wb=XLSX.read(Buffer.from(await file.arrayBuffer()),{type:"buffer",sheetRows:1002});const sheet=wb.Sheets["Данные"]||wb.Sheets[wb.SheetNames[0]];if(!sheet)throw Error("Нет листа с данными.");
  const rows=XLSX.utils.sheet_to_json<TableRow>(sheet,{defval:"",raw:true});if(!rows.length||rows.length>1000)return NextResponse.json({error:"В таблице должно быть от 1 до 1000 строк."},{status:400});
  const commit=form.get("apply")==="1";
  const result=await prisma.$transaction(async tx=>{
   const plan=await prepareTable(rows,kind,tx);if(plan.errors.length)return {ok:false,errors:plan.errors,created:0,updated:0};
   const digest=tableDigest(kind,plan.actions);
   if(commit&&form.get("digest")!==digest)throw Error("STALE");
   if(commit)await applyTable(plan.actions,kind,tx);
   return {ok:true,applied:commit,digest,created:plan.actions.filter(a=>a.operation==="create").length,updated:plan.actions.filter(a=>a.operation==="update").length,preview:plan.actions.slice(0,50).map(a=>({row:a.row,key:a.key,operation:a.operation,changes:a.data})),total:plan.actions.length};
  },{isolationLevel:"Serializable",timeout:60000,maxWait:10000});
  return NextResponse.json(result);
 }catch(e){const conflict=e instanceof Error&&e.message==="STALE";return NextResponse.json({error:conflict?"Данные изменились после предпросмотра. Проверьте файл ещё раз.":"Импорт не выполнен; изменения отменены. Проверьте файл и повторите."},{status:conflict?409:400});}
}
