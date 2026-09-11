"use client";
import Link from "next/link";
import { useState } from "react";
import { ConsentFields, emptyConsent } from "@/components/consent-fields";

export function ErrorReport({ missing = false, retry }: { missing?: boolean; retry?: () => void }) {
 const [message, setMessage] = useState("");
 const [consent, setConsent] = useState(emptyConsent);
 const [pending, setPending] = useState(false);
 const [number, setNumber] = useState("");
 const [error, setError] = useState("");
 async function report(event: React.FormEvent) {
  event.preventDefault(); if(pending) return; setPending(true); setError("");
  try {
   const response = await fetch("/api/support/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicId: "problem", customerName: "Посетитель сайта", message: `${missing ? "Страница не найдена" : "Ошибка страницы"}: ${window.location.pathname.slice(0,500)}\n${message}`, consent }) });
   const data = await response.json();
   if(!response.ok || !data.request?.number) throw new Error(data.error || "Не удалось отправить обращение. Попробуйте позже.");
   setNumber(data.request.number);
  } catch(e) { setError(e instanceof Error ? e.message : "Не удалось отправить обращение."); }
  finally { setPending(false); }
 }
 return <section className="store-error-card" style={{maxWidth:680,margin:"48px auto",padding:24}}>
  <span className="store-eyebrow">{missing ? "Страница не найдена" : "Не удалось открыть страницу"}</span>
  <h1 className="text-3xl font-bold my-4">{missing ? "Поможем найти нужное" : "Давайте попробуем ещё раз"}</h1>
  <p>Вы можете вернуться в каталог или сообщить о проблеме. Адрес страницы будет добавлен к обращению.</p>
  <div className="flex flex-wrap gap-4 my-6"><Link className="store-button" href="/catalog">В каталог</Link>{retry && <button className="store-button" onClick={retry}>Повторить</button>}<Link className="store-text-link" href="/">На главную</Link></div>
  {number ? <div role="status"><h2 className="text-xl font-bold">Обращение {number} создано</h2><p className="my-3">Ответ менеджера появится в разделе поддержки.</p><Link className="store-text-link" href="/help">Открыть поддержку</Link></div> : <form onSubmit={report} className="grid gap-4">
   <label htmlFor="error-details">Что произошло?</label><textarea id="error-details" className="store-input" rows={3} maxLength={3000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Например, перешёл к товару из каталога" />
   <ConsentFields value={consent} onChange={setConsent}/>
   {error && <p role="alert">{error}</p>}
   <button className="store-button" disabled={pending || !consent.accepted}>{pending ? "Отправляем…" : "Сообщить о проблеме"}</button>
  </form>}
 </section>;
}
