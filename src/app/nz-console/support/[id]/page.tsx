import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportReplyForm } from "@/components/admin/support-reply-form";
import { getAuthSession } from "@/lib/auth";
import {
  formatSupportDate,
  getSupportRequest,
  getSupportStatusLabel,
  type SupportStatus,
} from "@/lib/support-store";

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

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, session] = await Promise.all([getSupportRequest(id), getAuthSession()]);

  if (!ticket) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#020814] px-6 py-6 text-white">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <Link
            href="/nz-console/support"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            Все обращения
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console/support" label="Назад к обращениям" variant="admin" />

          <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.035] p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-blue-400">
                  {ticket.number}
                </div>
                <h1 className="mt-3 text-5xl font-bold tracking-[-0.055em]">{ticket.topicTitle}</h1>
                <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/55">
                  Реальное обращение из поддержки. Ответы менеджера отправляются на общей странице обращений.
                </p>
              </div>

              <span className={`w-fit rounded-full border px-4 py-2 text-sm ${getStatusClass(ticket.status)}`}>
                {getSupportStatusLabel(ticket.status)}
              </span>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <InfoBox label="Клиент" value={ticket.customerName} />
              <InfoBox label="Телефон" value={ticket.phone} />
              <InfoBox label="E-mail" value={ticket.email} />
              <InfoBox label="Источник" value={ticket.source} />
              <InfoBox label="Менеджер" value={ticket.assignedTo} />
              <InfoBox label="Дата" value={formatSupportDate(ticket.createdAt)} />
              {ticket.orderPublicId ? (
                <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 md:col-span-3">
                  <div className="text-xs text-blue-300/70">Связанная заявка</div>
                  <Link href={`/nz-console/orders/${ticket.orderPublicId}`} className="mt-2 inline-block font-bold text-blue-300">
                    {ticket.orderPublicId} →
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.035] p-7">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-blue-400">Чат</div>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em]">Переписка</h2>
            </div>
            <Link
              href="/nz-console/support"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition-colors hover:bg-blue-500"
            >
              Ответить в общей панели
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {ticket.messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "MANAGER" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[760px] rounded-[24px] px-5 py-4 text-sm leading-relaxed ${
                    message.role === "MANAGER" ? "bg-blue-600/35 text-white" : "bg-white/8 text-white/85"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-5 text-xs text-white/45">
                    <span>{message.name}</span>
                    <span>{formatSupportDate(message.createdAt)}</span>
                  </div>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <SupportReplyForm requestId={ticket.number} managerName={session?.name || session?.login || "Менеджер Neontech"} />
        </section>
      </div>
    </main>
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
