"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowIcon } from "@/components/arrow-icon";
import { supportTopics as defaultSupportTopics, type SupportTopic } from "@/lib/support-topics";

type ChatMessage = {
  id: string;
  role: "CLIENT" | "MANAGER";
  name: string;
  text: string;
  createdAt: string;
};

type SupportRequest = {
  id: string;
  number: string;
  topicId: string;
  status: string;
  messages: ChatMessage[];
};

type AuthProfile = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
};

type AuthResponse = {
  authenticated?: boolean;
  user?: {
    role?: string;
    profile?: AuthProfile;
  };
};

const statusLabels: Record<string, string> = {
  NEW: "Новое",
  IN_PROGRESS: "В работе",
  WAITING_CLIENT: "Ждём ответа",
  CLOSED: "Закрыто",
};

function profileName(profile: AuthProfile | null) {
  if (!profile) return "";
  return [profile.name, profile.lastName].filter(Boolean).join(" ").trim();
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function HelpPage() {
  const [topics, setTopics] = useState<SupportTopic[]>(defaultSupportTopics);
  const [activeTopicId, setActiveTopicId] = useState(defaultSupportTopics[0].id);
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [requestsByTopic, setRequestsByTopic] = useState<Record<string, SupportRequest>>({});
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) ?? topics[0] ?? defaultSupportTopics[0],
    [activeTopicId, topics],
  );
  const activeRequest = requestsByTopic[activeTopicId];
  const messages = activeRequest?.messages ?? [];
  const authenticatedName = profileName(authProfile);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/support/topics", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { topics?: SupportTopic[] } | null) => {
        if (cancelled || !Array.isArray(payload?.topics) || payload.topics.length === 0) return;
        setTopics(payload.topics);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: AuthResponse | null) => {
        if (cancelled) return;

        const profile =
          payload?.authenticated && payload.user?.role === "customer"
            ? payload.user.profile ?? null
            : null;

        setAuthProfile(profile);

        if (profile) {
          setCustomerName(profileName(profile));
          setPhone(profile.phone || "");
          setEmail(profile.email || "");
        }
      })
      .catch(() => {
        if (!cancelled) setAuthProfile(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeRequest?.number || activeRequest.status === "CLOSED") return;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/support/requests/${activeRequest.number}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as { request: SupportRequest };
        setRequestsByTopic((current) => ({
          ...current,
          [data.request.topicId]: data.request,
        }));
      } catch {
        // Следующая попытка через несколько секунд.
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [activeRequest?.number, activeRequest?.status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeTopicId, messages.length]);

  function selectTopic(topicId: string) {
    setActiveTopicId(topicId);
    setMessage("");
    setError("");
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    setError("");

    try {
      const endpoint = activeRequest
        ? `/api/support/requests/${activeRequest.number}/messages`
        : "/api/support/requests";
      const payload = activeRequest
        ? {
            text: trimmedMessage,
            role: "CLIENT",
            name: authenticatedName || customerName.trim() || "Клиент",
          }
        : {
            topicId: activeTopic.id,
            message: trimmedMessage,
            customerName: authenticatedName || customerName.trim() || "Гость Neontech",
            phone: authProfile?.phone || phone.trim(),
            email: authProfile?.email || email.trim(),
            source: authProfile ? "Личный кабинет" : "Сайт",
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "Не удалось отправить обращение.");
      }

      const data = (await response.json()) as { request: SupportRequest };
      setRequestsByTopic((current) => ({
        ...current,
        [data.request.topicId]: data.request,
      }));
      setMessage("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Не получилось отправить сообщение. Попробуйте ещё раз.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="storefront storefront-page min-h-screen">
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-[1440px] flex-col">
        <SiteHeader />

        <section className="mt-4 shrink-0 sm:mt-6 lg:mt-7">
          <nav aria-label="Хлебные крошки" className="hidden items-center gap-2 text-sm text-muted sm:flex">
            <Link href="/" className="transition-colors hover:text-blue-500">Главная</Link>
            <span className="text-muted-soft inline-flex"><ArrowIcon width={12} height={12} direction="right" /></span>
            <span className="font-medium text-main">Поддержка</span>
          </nav>

          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500 sm:hidden">
            Связь с магазином
          </div>
          <h1 className="store-transaction-heading mt-1 text-[25px] font-bold leading-tight tracking-[-0.045em] sm:mt-5 sm:text-4xl lg:text-5xl">
            Поддержка
          </h1>
          <p className="mt-1.5 max-w-[680px] text-xs leading-relaxed text-muted sm:mt-3 sm:text-sm">
            Выберите тему и напишите сообщение. Ответ менеджера появится прямо здесь.
          </p>
        </section>

        <section className="mt-4 grid gap-3 sm:mt-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-6">
          <aside className="-mx-2 flex snap-x gap-2 overflow-x-auto px-2 pb-1 sm:-mx-4 sm:px-4 lg:mx-0 lg:grid lg:h-full lg:min-h-0 lg:content-start lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 lg:pr-1">
            {topics.map((topic) => {
              const isActive = topic.id === activeTopic.id;
              const request = requestsByTopic[topic.id];

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className={`relative flex min-w-[92px] snap-start flex-col items-center gap-2 rounded-2xl px-2.5 py-2.5 text-center transition-colors sm:min-w-[108px] sm:py-3 lg:min-w-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3.5 lg:text-left ${
                    isActive ? "bg-blue-600 text-white" : "card hover:bg-blue-soft"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold sm:h-10 sm:w-10 ${isActive ? "bg-white/15 text-white" : "bg-blue-500/10 text-blue-500"}`}>
                    {topic.icon}
                  </span>
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight sm:text-xs lg:text-sm">
                    {topic.shortTitle}
                  </span>
                  {request && request.status !== "CLOSED" ? (
                    <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ${isActive ? "bg-white" : "bg-red-500"}`} />
                  ) : null}
                </button>
              );
            })}
          </aside>

          <section className="card flex min-h-[620px] flex-col overflow-hidden rounded-[22px] sm:min-h-[700px] sm:rounded-[28px] lg:h-full lg:min-h-[680px] lg:rounded-[32px]">
            <header className="flex items-center gap-3 border-b border-theme px-4 py-3.5 sm:px-5 sm:py-4 lg:px-7 lg:py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-base font-bold text-white sm:h-11 sm:w-11">
                {activeTopic.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold tracking-[-0.035em] sm:text-xl lg:text-2xl">
                  {activeTopic.title}
                </h2>
                <p className="mt-0.5 truncate text-[10px] text-muted sm:text-xs">
                  {activeRequest
                    ? `${activeRequest.number} · ${statusLabels[activeRequest.status] ?? activeRequest.status}`
                    : "Обычно отвечаем в течение рабочего времени"}
                </p>
              </div>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" aria-label="Поддержка онлайн" />
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-[390px] flex-1 space-y-3 overflow-y-auto bg-blue-500/[0.025] px-3 py-4 sm:min-h-[470px] sm:px-5 sm:py-5 lg:min-h-0 lg:px-7 lg:py-7">
                <div className="flex items-end gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                    Н
                  </span>
                  <div className="max-w-[88%] rounded-[18px] rounded-bl-md bg-blue-soft px-3.5 py-3 text-xs leading-relaxed sm:max-w-[75%] sm:px-4 sm:text-sm">
                    <div className="mb-1 text-[10px] font-semibold text-blue-500 sm:text-xs">Neontech</div>
                    {activeTopic.intro}
                  </div>
                </div>

                {messages.map((chatMessage) => {
                  const clientMessage = chatMessage.role === "CLIENT";

                  return (
                    <div key={chatMessage.id} className={`flex items-end gap-2.5 ${clientMessage ? "justify-end" : "justify-start"}`}>
                      {!clientMessage ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">Н</span>
                      ) : null}
                      <div className={`max-w-[88%] px-3.5 py-2.5 text-xs leading-relaxed sm:max-w-[75%] sm:px-4 sm:py-3 sm:text-sm ${clientMessage ? "rounded-[18px] rounded-br-md bg-blue-600 text-white" : "rounded-[18px] rounded-bl-md bg-blue-soft text-main"}`}>
                        <div className="mb-1 flex items-center justify-between gap-4 text-[10px] opacity-65 sm:text-xs">
                          <span>{clientMessage ? "Вы" : chatMessage.name}</span>
                          <span>{formatMessageTime(chatMessage.createdAt)}</span>
                        </div>
                        <div className="whitespace-pre-wrap break-words">{chatMessage.text}</div>
                      </div>
                    </div>
                  );
                })}

                {!activeRequest && messages.length === 0 ? (
                  <div className="ml-10 grid max-w-[720px] gap-2 sm:ml-11 sm:grid-cols-2">
                    {activeTopic.quickMessages.slice(0, 4).map((quickMessage) => (
                      <button
                        key={quickMessage}
                        type="button"
                        onClick={() => {
                          setMessage(quickMessage);
                          window.requestAnimationFrame(() => messageInputRef.current?.focus());
                        }}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-theme bg-card px-3.5 py-2.5 text-left text-[11px] font-medium text-main transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:text-xs"
                      >
                        <span>{quickMessage}</span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">+</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              {!activeRequest && authReady && !authProfile ? (
                <div className="border-t border-theme px-3 py-3 sm:px-5">
                  <div className="mb-2 text-[11px] font-semibold text-muted sm:text-xs">
                    Контакты для ответа
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Имя"
                      className="min-h-10 rounded-xl bg-blue-soft px-3 text-xs outline-none placeholder:text-muted-soft focus:ring-1 focus:ring-blue-500/40 sm:text-sm"
                    />
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Телефон"
                      className="min-h-10 rounded-xl bg-blue-soft px-3 text-xs outline-none placeholder:text-muted-soft focus:ring-1 focus:ring-blue-500/40 sm:text-sm"
                    />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="E-mail"
                      className="min-h-10 rounded-xl bg-blue-soft px-3 text-xs outline-none placeholder:text-muted-soft focus:ring-1 focus:ring-blue-500/40 sm:text-sm"
                    />
                  </div>
                </div>
              ) : null}

              <form onSubmit={sendMessage} className="border-t border-theme bg-card p-3 sm:p-4 lg:p-5">

                <div className="flex items-end gap-2">
                  <textarea
                    ref={messageInputRef}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    placeholder={activeTopic.placeholder}
                    className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl bg-blue-soft px-4 py-3 text-xs leading-5 outline-none placeholder:text-muted-soft focus:ring-1 focus:ring-blue-500/40 sm:min-h-12 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="min-h-11 shrink-0 rounded-2xl bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-12 sm:px-6 sm:text-sm"
                  >
                    {isSending ? "..." : "Отправить"}
                  </button>
                </div>
                {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
              </form>
            </div>
          </section>
        </section>

        <details className="card mt-3 shrink-0 rounded-2xl lg:hidden">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-blue-500">
            Контакты магазина
          </summary>
          <div className="grid gap-2 border-t border-theme p-3 sm:grid-cols-3">
            <ContactCard label="Telegram" value="@netizen_store" />
            <ContactCard label="Телефон" value="8 (800) 123-45-67" />
            <ContactCard label="E-mail" value="info@netizen.store" />
          </div>
        </details>
      <SiteFooter />
      </div>
 </main>
  );
}

function ContactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-blue-soft p-3">
      <div className="text-[10px] text-muted sm:text-xs">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
