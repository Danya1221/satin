"use client";
import { ErrorReport } from "@/components/error-report";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="storefront storefront-page"><ErrorReport retry={reset}/></main>; }
