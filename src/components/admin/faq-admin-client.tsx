"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ImageDropZone } from "@/components/admin/image-drop-zone";

type Question = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
};

type Category = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  icon: string;
  image: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  questions: Question[];
};

type Highlight = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
};

type EditorTab = "questions" | "highlights";

const inputClass = "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/60";

export function FaqAdminClient() {
  const [tab, setTab] = useState<EditorTab>("questions");
  const [categories, setCategories] = useState<Category[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? categories[0],
    [categories, selectedId],
  );

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/faq", { cache: "no-store" });
      const payload = await response.json();
      const nextCategories = Array.isArray(payload.categories) ? payload.categories : [];
      setCategories(nextCategories);
      setHighlights(Array.isArray(payload.highlights) ? payload.highlights : []);
      setSelectedId((current) =>
        nextCategories.some((item: Category) => item.id === current)
          ? current
          : nextCategories[0]?.id ?? "",
      );
    } catch {
      setMessage("Не удалось загрузить FAQ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save(method: "POST" | "PATCH", body: Record<string, unknown>) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/faq", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось сохранить.");
      setMessage("Сохранено.");
      await load();
      return payload.item;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function remove(entity: "category" | "question" | "highlight", id: string) {
    if (!window.confirm(entity === "category" ? "Удалить раздел вместе со всеми вопросами?" : "Удалить запись?")) return;
    const response = await fetch(`/api/admin/faq?entity=${entity}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { setMessage("Не удалось удалить."); return; }
    setMessage("Удалено.");
    await load();
  }

  function patchCategory(id: string, patch: Partial<Category>) {
    setCategories((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function patchQuestion(id: string, patch: Partial<Question>) {
    setCategories((current) => current.map((category) => ({
      ...category,
      questions: category.questions.map((item) => item.id === id ? { ...item, ...patch } : item),
    })));
  }

  function patchHighlight(id: string, patch: Partial<Highlight>) {
    setHighlights((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function createCategory() {
    const item = await save("POST", {
      entity: "category",
      title: "Новый раздел",
      slug: `section-${Date.now()}`,
      eyebrow: "Раздел",
      icon: "?",
      image: "",
      description: "",
      isActive: true,
      sortOrder: (categories.at(-1)?.sortOrder ?? 0) + 10,
    });
    if (item?.id) setSelectedId(item.id);
  }

  async function createQuestion() {
    if (!selected) return;
    await save("POST", {
      entity: "question",
      categoryId: selected.id,
      question: "Новый вопрос",
      answer: "Введите ответ.",
      image: "",
      isActive: true,
      sortOrder: (selected.questions.at(-1)?.sortOrder ?? 0) + 10,
    });
  }

  async function createHighlight() {
    await save("POST", {
      entity: "highlight",
      eyebrow: "Преимущество",
      title: "Новая карточка",
      description: "",
      image: "",
      isActive: true,
      sortOrder: (highlights.at(-1)?.sortOrder ?? 0) + 10,
    });
  }

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-white/55">Загружаем FAQ…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
        <button type="button" onPointerDown={() => setTab("questions")} onClick={() => setTab("questions")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === "questions" ? "bg-blue-600 text-white" : "text-white/55"}`}>
          Разделы и вопросы
        </button>
        <button type="button" onPointerDown={() => setTab("highlights")} onClick={() => setTab("highlights")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === "highlights" ? "bg-blue-600 text-white" : "text-white/55"}`}>
          Нижние карточки
        </button>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">{message}</div> : null}

      {tab === "questions" ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.035] p-4 lg:sticky lg:top-6">
            <button type="button" onClick={() => void createCategory()} disabled={saving} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              Добавить раздел
            </button>
            <div className="mt-4 grid gap-2">
              {categories.map((category) => (
                <button key={category.id} type="button" onClick={() => setSelectedId(category.id)} className={`rounded-2xl border p-4 text-left ${selected?.id === category.id ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-500/10 font-bold text-blue-400">
                      {category.image ? <img src={category.image} alt="" className="h-full w-full object-contain p-1" /> : category.icon || "?"}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{category.title}</div>
                      <div className="mt-1 text-xs text-white/40">{category.questions.length} вопросов · порядок {category.sortOrder}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            {!selected ? (
              <div className="rounded-[28px] border border-dashed border-white/10 p-8 text-white/50">Создайте первый раздел FAQ.</div>
            ) : (
              <>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Настройка раздела</div><h3 className="mt-2 text-3xl font-bold">{selected.title}</h3></div>
                    <div className="flex gap-2">
                      <button type="button" disabled={saving} onClick={() => void save("PATCH", { entity: "category", ...selected })} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Сохранить раздел</button>
                      <button type="button" onClick={() => void remove("category", selected.id)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">Удалить</button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Название"><input value={selected.title} onChange={(e) => patchCategory(selected.id, { title: e.target.value })} className={inputClass} /></Field>
                    <Field label="Slug"><input value={selected.slug} onChange={(e) => patchCategory(selected.id, { slug: e.target.value })} className={inputClass} /></Field>
                    <Field label="Надпись над заголовком"><input value={selected.eyebrow} onChange={(e) => patchCategory(selected.id, { eyebrow: e.target.value })} className={inputClass} /></Field>
                    <Field label="Иконка / символ"><input value={selected.icon} onChange={(e) => patchCategory(selected.id, { icon: e.target.value.slice(0, 10) })} className={inputClass} /></Field>
                    <Field label="Порядок"><input type="number" value={selected.sortOrder} onChange={(e) => patchCategory(selected.id, { sortOrder: Number(e.target.value) })} className={inputClass} /></Field>
                    <Field label="Статус"><select value={selected.isActive ? "active" : "hidden"} onChange={(e) => patchCategory(selected.id, { isActive: e.target.value === "active" })} className={inputClass}><option value="active">Показывать</option><option value="hidden">Скрыть</option></select></Field>
                    <div className="md:col-span-2"><Field label="Описание"><textarea value={selected.description} onChange={(e) => patchCategory(selected.id, { description: e.target.value })} className={`${inputClass} min-h-[100px]`} /></Field></div>
                    <div className="md:col-span-2"><ImageDropZone label="Фото раздела" hint="Показывается вместо символа в карточке раздела." recommendedSize="800×800 px" recommendedFormat="PNG / WEBP, прозрачный фон" value={selected.image} onChange={(value) => patchCategory(selected.id, { image: value })} /></div>
                  </div>
                </div>

                <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Вопросы и ответы</div><h3 className="mt-2 text-2xl font-bold">{selected.questions.length} записей</h3></div><button type="button" onClick={() => void createQuestion()} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold">Добавить вопрос</button></div>
                  <div className="mt-5 grid gap-4">
                    {selected.questions.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_130px_150px]">
                          <Field label="Вопрос"><input value={item.question} onChange={(e) => patchQuestion(item.id, { question: e.target.value })} className={inputClass} /></Field>
                          <Field label="Порядок"><input type="number" value={item.sortOrder} onChange={(e) => patchQuestion(item.id, { sortOrder: Number(e.target.value) })} className={inputClass} /></Field>
                          <Field label="Статус"><select value={item.isActive ? "active" : "hidden"} onChange={(e) => patchQuestion(item.id, { isActive: e.target.value === "active" })} className={inputClass}><option value="active">Показывать</option><option value="hidden">Скрыть</option></select></Field>
                        </div>
                        <div className="mt-4"><Field label="Ответ"><textarea value={item.answer} onChange={(e) => patchQuestion(item.id, { answer: e.target.value })} className={`${inputClass} min-h-[120px]`} /></Field></div>
                        <div className="mt-4"><ImageDropZone label="Фото к ответу" hint="Необязательно. Показывается внутри раскрытого ответа." recommendedSize="1200×800 px" recommendedFormat="JPG / WEBP" value={item.image} onChange={(value) => patchQuestion(item.id, { image: value })} /></div>
                        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => void save("PATCH", { entity: "question", ...item })} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold">Сохранить</button><button type="button" onClick={() => void remove("question", item.id)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">Удалить</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      ) : (
        <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Нижние карточки FAQ</div><h3 className="mt-2 text-2xl font-bold">Преимущества под вопросами</h3></div><button type="button" onClick={() => void createHighlight()} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold">Добавить карточку</button></div>
          <div className="mt-5 grid gap-4">
            {highlights.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Метка"><input value={item.eyebrow} onChange={(e) => patchHighlight(item.id, { eyebrow: e.target.value })} className={inputClass} /></Field>
                  <Field label="Название"><input value={item.title} onChange={(e) => patchHighlight(item.id, { title: e.target.value })} className={inputClass} /></Field>
                  <Field label="Порядок"><input type="number" value={item.sortOrder} onChange={(e) => patchHighlight(item.id, { sortOrder: Number(e.target.value) })} className={inputClass} /></Field>
                  <Field label="Статус"><select value={item.isActive ? "active" : "hidden"} onChange={(e) => patchHighlight(item.id, { isActive: e.target.value === "active" })} className={inputClass}><option value="active">Показывать</option><option value="hidden">Скрыть</option></select></Field>
                  <div className="md:col-span-2"><Field label="Описание"><textarea value={item.description} onChange={(e) => patchHighlight(item.id, { description: e.target.value })} className={`${inputClass} min-h-[100px]`} /></Field></div>
                  <div className="md:col-span-2"><ImageDropZone label="Фото карточки" hint="Необязательно. Фото отображается над текстом." recommendedSize="1200×800 px" recommendedFormat="JPG / WEBP" value={item.image} onChange={(value) => patchHighlight(item.id, { image: value })} /></div>
                </div>
                <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => void save("PATCH", { entity: "highlight", ...item })} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold">Сохранить</button><button type="button" onClick={() => void remove("highlight", item.id)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">Удалить</button></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">{label}</div>{children}</label>;
}
