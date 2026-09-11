import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Используйте импорт с предпросмотром в разделе «Позиции»: выберите файл, проверьте строки и примените изменения." }, { status: 410 }); }
