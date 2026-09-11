"use client";
import { PageExtras, usePageContent } from "@/components/page-content";
import type { PageKey } from "@/lib/page-builder-db";
export function InformationExtras({page}:{page:PageKey}) { const content=usePageContent(page); return <PageExtras content={content}/>; }
