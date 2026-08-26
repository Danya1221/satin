"use client";

import { BackLink } from "@/components/back-link";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supportTopics } from "@/lib/support-topics";

type SupportStatus = "NEW" | "IN_PROGRESS" | "WAITING_CLIENT" | "CLOSED";

type SupportMessage = {
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
  topicTitle: string;
  customerName: string;
  phone: string;
  email: string;
  source: string;
  status: SupportStatus;
  assignedTo: string;
  lastMessage: string;
  unreadForManager: number;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

type TopicCount = {
  id: string;
  title: string;
  count: number;
  unread: number;
};

const statusLabels: Record<SupportStatus, string> = {
  NEW: "Новое",
  IN_PROGRESS: "В работе",
  WAITING_CLIENT: "Ожидает клиента",
  CLOSED: "Закрыто",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClass(status: SupportStatus) {
  if (status === "NEW") {
    return "border-blue-500/35 bg-blue-500/10 text-blue-400";
  }

  if (status === "IN_PROGRESS") {
    return "border-purple-500/35 bg-purple-500/10 text-purple-300";
  }

  if (status === "WAITING_CLIENT") {
    return "border-orange-500/35 bg-orange-500/10 text-orange-300";
  }

  return "border-green-500/35 bg-green-500/10 text-green-300";
}

export function SupportConsole() {
  const [activeTopicId, setActiveTopicId] = useState("all");
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [topicCounts, setTopicCounts] = useState<TopicCount[]>([]);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState("");
  const [reply, setReply] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.number === selectedRequestNumber) ?? requests[0],
    [requests, selectedRequestNumber],
  );

  const filteredRequests = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesTopic = activeTopicId === "all" || request.topicId === activeTopicId;
      const matchesQuery =
        !trimmedQuery ||
        [
          request.number,
          request.topicTitle,
          request.customerName,
          request.phone,
          request.email,
          request.lastMessage,
          statusLabels[request.status],
        ]
          .join(" ")
          .toLowerCase()
          .includes(trimmedQuery);

      return matchesTopic && matchesQuery;
    });
  }, [activeTopicId, query, requests]);

  async function loadRequests(keepSelected = true) {
    const shouldShowInitialLoading = !keepSelected && requests.length === 0;

    if (shouldShowInitialLoading) {
      setIsLoading(true);
    }

    try {
      const [requestsResponse, topicsResponse] = await Promise.all([
        fetch("/api/support/requests", { cache: "no-store" }),
        fetch("/api/support/topics", { cache: "no-store" }),
      ]);

      const requestsData = (await requestsResponse.json()) as { requests: SupportRequest[] };
      const topicsData = (await topicsResponse.json()) as { counts: TopicCount[] };

      setRequests(requestsData.requests ?? []);
      setTopicCounts(topicsData.counts ?? []);

      if (!keepSelected || !selectedRequestNumber) {
        setSelectedRequestNumber(requestsData.requests?.[0]?.number ?? "");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadRequests(true);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequestNumber]);

  async function updateStatus(status: SupportStatus) {
    if (!selectedRequest) {
      return;
    }

    const response = await fetch(`/api/support/requests/${selectedRequest.number}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      await loadRequests(true);
    }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequest || !reply.trim() || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`/api/support/requests/${selectedRequest.number}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply.trim(),
          role: "MANAGER",
          name: "Менеджер Neontech",
        }),
      });

      if (response.ok) {
        setReply("");
        await loadRequests(true);
      }
    } finally {
      setIsSending(false);
    }
  }

  const allCount = topicCounts.find((topic) => topic.id === "all");
  const newCount = requests.filter((request) => request.status === "NEW").length;
  const workCount = requests.filter((request) => request.status === "IN_PROGRESS").length;
  const unreadCount = requests.reduce((sum, request) => sum + request.unreadForManager, 0);

  return (
    <main className="min-h-screen bg-[#020814] px-6 py-6 text-white">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Обращения</span>
            <span>·</span>
            <span>темы и чаты</span>
          </div>

          <Link
            href="/help"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            Открыть поддержку
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console" label="В админку" variant="admin" />

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                Support inbox
              </div>

              <h1 className="mt-5 text-5xl font-bold tracking-[-0.055em]">Обращения</h1>

              <p className="mt-4 max-w-[820px] text-sm leading-relaxed text-white/55">
                Темы работают как папки: клиент выбирает тему на странице поддержки, а обращение сразу попадает в нужный чат здесь. Красный бейдж показывает новые непрочитанные сообщения.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void loadRequests(true)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Обновить
              </button>

              <Link
                href="/help"
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Создать обращение
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Всего обращений" value={String(allCount?.count ?? requests.length)} />
          <MetricCard label="Новые" value={String(newCount)} />
          <MetricCard label="В работе" value={String(workCount)} />
          <MetricCard label="Непрочитанные" value={String(unreadCount)} highlight={unreadCount > 0} />
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по номеру / клиенту / телефону / теме / сообщению"
            className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[260px_390px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4 xl:sticky xl:top-6 xl:self-start">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-blue-400">Темы</div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">Папки</h2>
              </div>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </div>

            <div className="grid gap-2">
              {topicCounts.map((topic) => {
                const isActive = topic.id === activeTopicId;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                      isActive
                        ? "border-blue-500/60 bg-blue-500/15 text-white"
                        : "border-white/10 bg-black/10 text-white/70 hover:border-blue-500/35 hover:bg-blue-500/10"
                    }`}
                  >
                    <span className="truncate font-medium">{topic.title}</span>
                    <span className="flex items-center gap-1.5">
                      {topic.unread > 0 ? (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                          {topic.unread}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                        {topic.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-blue-500/35 bg-blue-500/10 p-4 text-sm leading-relaxed text-blue-100/80">
              <div className="font-semibold text-blue-300">Логика</div>
              <p className="mt-2">Красный бейдж — новые сообщения клиента. Открыл чат или ответил менеджер — бейдж погаснет.</p>
            </div>
          </aside>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-blue-400">Диалоги</div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                  {activeTopicId === "all"
                    ? "Все обращения"
                    : supportTopics.find((topic) => topic.id === activeTopicId)?.shortTitle ?? "Тема"}
                </h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">{filteredRequests.length}</span>
            </div>

            <div className="grid min-h-[360px] max-h-[760px] content-start gap-3 overflow-y-auto pr-1">
              {!isLoading && filteredRequests.length === 0 ? (
                <EmptyState title="Обращений пока нет" text="Когда клиент напишет из поддержки, чат появится здесь." />
              ) : null}

              {filteredRequests.map((request) => {
                const isSelected = request.number === selectedRequest?.number;

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequestNumber(request.number)}
                    className={`rounded-[22px] border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-blue-500/60 bg-blue-500/15"
                        : "border-white/10 bg-black/10 hover:border-blue-500/35 hover:bg-blue-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-blue-300">{request.number}</span>
                          {request.unreadForManager > 0 ? (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                              {request.unreadForManager}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 text-lg font-bold tracking-[-0.035em]">{request.topicTitle}</h3>
                      </div>

                      <span className={`rounded-full border px-3 py-1 text-xs ${getStatusClass(request.status)}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-white/80">{request.customerName}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{request.lastMessage}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/35">
                      <span>{request.source}</span>
                      <span>{formatDate(request.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
            {selectedRequest ? (
              <div className="flex min-h-[760px] flex-col">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-blue-400">Выбранное обращение</div>
                    <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em]">{selectedRequest.topicTitle}</h2>
                    <p className="mt-2 text-sm text-white/55">
                      {selectedRequest.number} · {selectedRequest.customerName} · {selectedRequest.phone}
                    </p>
                  </div>

                  <span className={`w-fit rounded-full border px-4 py-2 text-sm ${getStatusClass(selectedRequest.status)}`}>
                    {statusLabels[selectedRequest.status]}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <InfoBox label="Клиент" value={selectedRequest.customerName} />
                  <InfoBox label="Телефон" value={selectedRequest.phone} />
                  <InfoBox label="E-mail" value={selectedRequest.email} />
                  <InfoBox label="Источник" value={selectedRequest.source} />
                  <InfoBox label="Менеджер" value={selectedRequest.assignedTo} />
                  <InfoBox label="Дата" value={formatDate(selectedRequest.createdAt)} />
                </div>

                <div className="mt-5 flex-1 rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-bold">Чат обращения</h3>
                    <Link
                      href={`/nz-console/support/${selectedRequest.number}`}
                      className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                    >
                      Открыть полностью
                    </Link>
                  </div>

                  <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
                    {selectedRequest.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === "MANAGER" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            message.role === "MANAGER" ? "bg-blue-600/35 text-white" : "bg-white/8 text-white/85"
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-4 text-xs text-white/45">
                            <span>{message.name}</span>
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendReply} className="mt-4 flex gap-3">
                    <input
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Написать ответ клиенту..."
                      className="h-12 flex-1 rounded-xl border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
                    />
                    <button
                      type="submit"
                      disabled={!reply.trim() || isSending}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Отправить
                    </button>
                  </form>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <button onClick={() => void updateStatus("IN_PROGRESS")} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition-colors hover:bg-blue-500">
                    В работу
                  </button>
                  <button onClick={() => void updateStatus("WAITING_CLIENT")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium transition-colors hover:border-orange-400/40 hover:bg-orange-500/10">
                    Ожидает клиента
                  </button>
                  <button onClick={() => void updateStatus("NEW")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium transition-colors hover:border-blue-400/40 hover:bg-blue-500/10">
                    Новое
                  </button>
                  <button onClick={() => void updateStatus("CLOSED")} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium transition-colors hover:border-green-400/40 hover:bg-green-500/10">
                    Закрыть
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState title="Выберите обращение" text="Справа появится чат клиента и действия менеджера." />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-[24px] border p-6 ${highlight ? "border-red-500/45 bg-red-500/10" : "border-white/10 bg-white/[0.035]"}`}>
      <div className="text-sm text-white/50">{label}</div>
      <div className={`mt-4 text-4xl font-bold tracking-[-0.05em] ${highlight ? "text-red-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-2 font-semibold">{value || "Не указано"}</div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/10 p-5 text-center">
      <div className="font-semibold text-white/80">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-white/45">{text}</p>
    </div>
  );
}
