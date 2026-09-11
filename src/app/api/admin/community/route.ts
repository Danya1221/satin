import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
const allowed = async () => canAccessAdminSection(await getAuthSession(), "community");
export async function GET(request: Request) {
  if (!await allowed()) return NextResponse.json({error:"Нет доступа."},{status:403});
  const url=new URL(request.url), entity=url.searchParams.get("entity") || "questions";
  const search=(url.searchParams.get("search")||"").trim().slice(0,200);
  const state=url.searchParams.get("state") || "all";
  const page=Math.max(1,Math.min(10000,Math.floor(Number(url.searchParams.get("page"))||1)));
  const product=search?{OR:[{name:{contains:search,mode:"insensitive" as const}},{brand:{contains:search,mode:"insensitive" as const}}]}:undefined;
  const statusWhere=state==="new"?{readAt:null,answer:""}:state==="read"?{readAt:{not:null},answer:""}:state==="answered"?{answer:{not:""}}:{};
  const where={...(product?{product}:{}),...statusWhere};
  const base=product?{product}:{};
  const include={product:{select:{id:true,name:true,brand:true,slug:true}},customer:{select:{id:true,name:true,lastName:true,email:true,phone:true}}};
  try {
    if(entity==="reviews"||entity==="review"){
      const [reviews,total,all,fresh,read,answered]=await Promise.all([prisma.productReview.findMany({where,include,orderBy:{createdAt:"desc"},take:30,skip:(page-1)*30}),prisma.productReview.count({where}),prisma.productReview.count({where:base}),prisma.productReview.count({where:{...base,readAt:null,answer:""}}),prisma.productReview.count({where:{...base,readAt:{not:null},answer:""}}),prisma.productReview.count({where:{...base,answer:{not:""}}})]);
      return NextResponse.json({reviews,questions:[],total,page,counts:{all,new:fresh,read,answered}});
    }
    const [questions,total,all,fresh,read,answered]=await Promise.all([prisma.productQuestion.findMany({where,include,orderBy:{createdAt:"desc"},take:30,skip:(page-1)*30}),prisma.productQuestion.count({where}),prisma.productQuestion.count({where:base}),prisma.productQuestion.count({where:{...base,readAt:null,answer:""}}),prisma.productQuestion.count({where:{...base,readAt:{not:null},answer:""}}),prisma.productQuestion.count({where:{...base,answer:{not:""}}})]);
    return NextResponse.json({reviews:[],questions,total,page,counts:{all,new:fresh,read,answered}});
  }catch{return NextResponse.json({error:"Не удалось загрузить сообщения. Повторите попытку."},{status:503});}
}
export async function PATCH(request: Request) {
  if(!await allowed())return NextResponse.json({error:"Нет доступа."},{status:403});
  const body=await request.json().catch(()=>null);
  if(!body||!["review","question"].includes(body.entity)||typeof body.id!=="string")return NextResponse.json({error:"Не указан элемент."},{status:400});
  if(body.answer!==undefined&&(typeof body.answer!=="string"||body.answer.length>5000))return NextResponse.json({error:"Ответ: не более 5000 символов."},{status:400});
  const answer=typeof body.answer==="string"?body.answer.trim():undefined;
  const data={...(typeof body.isVisible==="boolean"?{isVisible:body.isVisible}:{}),...(typeof body.read==="boolean"?{readAt:body.read?new Date():null}:{}),...(answer!==undefined?{answer,answeredAt:answer?new Date():null,...(answer?{readAt:new Date()}: {})}:{})};
  try{const item=body.entity==="review"?await prisma.productReview.update({where:{id:body.id},data}):await prisma.productQuestion.update({where:{id:body.id},data});return NextResponse.json({item});}
  catch{return NextResponse.json({error:"Сообщение не сохранено. Обновите список и повторите."},{status:409});}
}
export async function DELETE(request: Request) {
  if(!await allowed())return NextResponse.json({error:"Нет доступа."},{status:403});
  const q=new URL(request.url).searchParams,id=q.get("id"),entity=q.get("entity");
  if(!id||!["review","question"].includes(entity||""))return NextResponse.json({error:"Не указан элемент."},{status:400});
  try{if(entity==="review")await prisma.productReview.delete({where:{id}});else await prisma.productQuestion.delete({where:{id}});return NextResponse.json({ok:true});}
  catch{return NextResponse.json({error:"Запись не найдена или уже удалена."},{status:404});}
}
