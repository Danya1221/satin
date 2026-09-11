"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <html lang="ru"><body style={{fontFamily:"system-ui",background:"#faf7f4",color:"#242424",padding:32}}><main style={{maxWidth:620,margin:"48px auto"}}><h1>Не удалось загрузить сайт</h1><p>Попробуйте открыть страницу ещё раз. Если проблема повторяется, сообщите нам через поддержку.</p><button onClick={reset} style={{padding:14,marginRight:16}}>Повторить</button><a href="/help">Написать в поддержку</a></main></body></html>;
}
