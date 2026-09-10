"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export type ConsentValue = { accepted: boolean; version: string; offerAccepted?: boolean };
export const emptyConsent: ConsentValue = { accepted: false, version: "", offerAccepted: false };
export function ConsentFields({ value, onChange, order = false }: { value: ConsentValue; onChange: (value: ConsentValue) => void; order?: boolean }) {
  const [version, setVersion] = useState("");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { let active = true; setFailed(false); fetch("/api/legal", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); const data = await r.json(); if (active) setVersion(data.version); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, [attempt]);
  return <div>{failed ? <p role="alert" className="store-consent">Не удалось загрузить документы. <button type="button" onClick={() => setAttempt(x => x + 1)}>Повторить</button></p> : <label className="store-consent"><input type="checkbox" checked={value.accepted && value.version === version} disabled={!version} onChange={e => onChange({ ...value, accepted: e.target.checked, version })} /><span>Даю <Link href="/consent" target="_blank">отдельное согласие на обработку персональных данных</Link> для этой формы. <Link href="/privacy" target="_blank">Политика обработки</Link>.</span></label>}{order && <label className="store-consent"><input type="checkbox" checked={Boolean(value.offerAccepted)} onChange={e => onChange({ ...value, offerAccepted: e.target.checked })}/><span>Принимаю <Link href="/offer" target="_blank">условия продажи</Link>, ознакомлен с <Link href="/delivery" target="_blank">доставкой</Link>, <Link href="/payment" target="_blank">оплатой</Link> и <Link href="/returns" target="_blank">порядком возврата</Link>.</span></label>}</div>;
}
