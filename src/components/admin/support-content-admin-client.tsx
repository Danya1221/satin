"use client";

import { useEffect, useState } from "react";

type Feature = {
  id: string;
  title: string;
  text: string;
  icon: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
};

type Question = {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
};

type ChatTopic = {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  intro: string;
  placeholder: string;
  quickMessages: string[];
};

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/60";

export function SupportContentAdminClient({
  mode = "all",
}: {
  mode?: "all" | "features" | "questions";
}) {
  const [activeEditor, setActiveEditor] = useState<"features" | "questions" | "chat">(
    mode === "questions" ? "questions" : "features",
  );
  const [features, setFeatures] = useState<Feature[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/support-content", { cache: "no-store" });
    const payload = await response.json();
    setFeatures(Array.isArray(payload.features) ? payload.features : []);
    setQuestions(Array.isArray(payload.questions) ? payload.questions : []);
    setTopics(Array.isArray(payload.topics) ? payload.topics : []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(method: "POST" | "PATCH", body: Record<string, unknown>) {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/support-content", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || "Не удалось сохранить.");

      setMessage("Сохранено.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(entity: "feature" | "question", id: string) {
    if (!window.confirm("Удалить этот элемент?")) return;

    const response = await fetch(
      `/api/admin/support-content?entity=${entity}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );

    if (response.ok) {
      setMessage("Удалено.");
      await load();
    }
  }

  const showFeatures = mode === "features" || (mode === "all" && activeEditor === "features");
  const showQuestions = mode === "questions" || (mode === "all" && activeEditor === "questions");
  const showChat = mode === "all" && activeEditor === "chat";

  return (
    <div className="grid gap-6">
      {mode === "all" ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          <button
            type="button"
            onPointerDown={() => setActiveEditor("features")}
            onClick={() => setActiveEditor("features")}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
              activeEditor === "features"
                ? "bg-blue-600 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            Преимущества слева
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveEditor("questions")}
            onClick={() => setActiveEditor("questions")}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
              activeEditor === "questions"
                ? "bg-blue-600 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            Вопросы справа
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveEditor("chat")}
            onClick={() => setActiveEditor("chat")}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
              activeEditor === "chat"
                ? "bg-blue-600 text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            Чат поддержки
          </button>
        </div>
      ) : null}

      {showFeatures ? (
      <AdminSection
        title="Преимущества слева"
        buttonLabel="Добавить преимущество"
        onAdd={() =>
          void save("POST", {
            entity: "feature",
            title: "Новое преимущество",
            text: "",
            icon: "✓",
            image: "",
            isActive: true,
            sortOrder: (features.at(-1)?.sortOrder ?? 0) + 10,
          })
        }
      >
        {features.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/45">
            Преимуществ пока нет. Нажмите «Добавить преимущество».
          </div>
        ) : null}
        {features.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 md:grid-cols-[90px_1fr_130px_150px]">
              <input
                value={item.icon}
                onChange={(event) =>
                  setFeatures((current) =>
                    current.map((value) =>
                      value.id === item.id ? { ...value, icon: event.target.value } : value,
                    ),
                  )
                }
                className={fieldClass}
                placeholder="Иконка"
              />
              <input
                value={item.title}
                onChange={(event) =>
                  setFeatures((current) =>
                    current.map((value) =>
                      value.id === item.id ? { ...value, title: event.target.value } : value,
                    ),
                  )
                }
                className={fieldClass}
                placeholder="Название"
              />
              <input
                type="number"
                value={item.sortOrder}
                onChange={(event) =>
                  setFeatures((current) =>
                    current.map((value) =>
                      value.id === item.id
                        ? { ...value, sortOrder: Number(event.target.value) }
                        : value,
                    ),
                  )
                }
                className={fieldClass}
              />
              <select
                value={item.isActive ? "active" : "hidden"}
                onChange={(event) =>
                  setFeatures((current) =>
                    current.map((value) =>
                      value.id === item.id
                        ? { ...value, isActive: event.target.value === "active" }
                        : value,
                    ),
                  )
                }
                className={fieldClass}
              >
                <option value="active">Показывать</option>
                <option value="hidden">Скрыть</option>
              </select>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                Фото / иконка преимущества
              </div>
              <div className="mt-2 inline-flex rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                Рекомендуемый размер: 256×256 px · PNG / SVG / WEBP · прозрачный фон
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-xl text-blue-500">{item.icon || "✓"}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                    Загрузить фото
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
                          setMessage("Фото должно быть изображением до 2 МБ.");
                          event.currentTarget.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result !== "string") return;
                          setFeatures((current) =>
                            current.map((value) =>
                              value.id === item.id ? { ...value, image: reader.result as string } : value,
                            ),
                          );
                        };
                        reader.readAsDataURL(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  {item.image ? (
                    <button
                      type="button"
                      onClick={() =>
                        setFeatures((current) =>
                          current.map((value) =>
                            value.id === item.id ? { ...value, image: "" } : value,
                          ),
                        )
                      }
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm"
                    >
                      Удалить фото
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <textarea
              value={item.text}
              onChange={(event) =>
                setFeatures((current) =>
                  current.map((value) =>
                    value.id === item.id ? { ...value, text: event.target.value } : value,
                  ),
                )
              }
              rows={3}
              className={`${fieldClass} mt-3`}
              placeholder="Описание"
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save("PATCH", { entity: "feature", ...item })}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => void remove("feature", item.id)}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </AdminSection>
      ) : null}

      {showQuestions ? (
      <AdminSection
        title="Вопросы справа"
        buttonLabel="Добавить вопрос"
        onAdd={() =>
          void save("POST", {
            entity: "question",
            question: "Новый вопрос",
            answer: "Введите ответ.",
            isActive: true,
            sortOrder: (questions.at(-1)?.sortOrder ?? 0) + 10,
          })
        }
      >
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/45">
            Вопросов пока нет. Нажмите «Добавить вопрос».
          </div>
        ) : null}
        {questions.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_130px_150px]">
              <input
                value={item.question}
                onChange={(event) =>
                  setQuestions((current) =>
                    current.map((value) =>
                      value.id === item.id ? { ...value, question: event.target.value } : value,
                    ),
                  )
                }
                className={fieldClass}
                placeholder="Вопрос"
              />
              <input
                type="number"
                value={item.sortOrder}
                onChange={(event) =>
                  setQuestions((current) =>
                    current.map((value) =>
                      value.id === item.id
                        ? { ...value, sortOrder: Number(event.target.value) }
                        : value,
                    ),
                  )
                }
                className={fieldClass}
              />
              <select
                value={item.isActive ? "active" : "hidden"}
                onChange={(event) =>
                  setQuestions((current) =>
                    current.map((value) =>
                      value.id === item.id
                        ? { ...value, isActive: event.target.value === "active" }
                        : value,
                    ),
                  )
                }
                className={fieldClass}
              >
                <option value="active">Показывать</option>
                <option value="hidden">Скрыть</option>
              </select>
            </div>

            <textarea
              value={item.answer}
              onChange={(event) =>
                setQuestions((current) =>
                  current.map((value) =>
                    value.id === item.id ? { ...value, answer: event.target.value } : value,
                  ),
                )
              }
              rows={4}
              className={`${fieldClass} mt-3`}
              placeholder="Ответ"
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save("PATCH", { entity: "question", ...item })}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => void remove("question", item.id)}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </AdminSection>
      ) : null}


      {showChat ? (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div>
            <h2 className="text-2xl font-bold">Чат поддержки</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/50">
              Здесь меняются стартовое сообщение, подсказка поля ввода и быстрые кнопки для каждой темы.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {topics.map((topic) => (
              <details key={topic.id} className="rounded-2xl border border-white/10 bg-black/20" open={topic.id === topics[0]?.id}>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">{topic.icon}</span>
                  <div>
                    <div className="font-bold">{topic.title}</div>
                    <div className="mt-0.5 text-xs text-white/45">Настроить начало диалога</div>
                  </div>
                </summary>

                <div className="grid gap-4 border-t border-white/10 p-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Начальное сообщение</span>
                    <textarea
                      value={topic.intro}
                      onChange={(event) =>
                        setTopics((current) => current.map((item) => item.id === topic.id ? { ...item, intro: event.target.value } : item))
                      }
                      rows={4}
                      className={fieldClass}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Подсказка поля сообщения</span>
                    <input
                      value={topic.placeholder}
                      onChange={(event) =>
                        setTopics((current) => current.map((item) => item.id === topic.id ? { ...item, placeholder: event.target.value } : item))
                      }
                      className={fieldClass}
                    />
                  </label>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Быстрые кнопки</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTopics((current) => current.map((item) =>
                            item.id === topic.id && item.quickMessages.length < 6
                              ? { ...item, quickMessages: [...item.quickMessages, "Новый быстрый вопрос"] }
                              : item,
                          ))
                        }
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                      >
                        Добавить
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {topic.quickMessages.map((quickMessage, index) => (
                        <div key={`${topic.id}-${index}`} className="flex gap-2">
                          <input
                            value={quickMessage}
                            onChange={(event) =>
                              setTopics((current) => current.map((item) =>
                                item.id === topic.id
                                  ? { ...item, quickMessages: item.quickMessages.map((value, valueIndex) => valueIndex === index ? event.target.value : value) }
                                  : item,
                              ))
                            }
                            className={fieldClass}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setTopics((current) => current.map((item) =>
                                item.id === topic.id
                                  ? { ...item, quickMessages: item.quickMessages.filter((_, valueIndex) => valueIndex !== index) }
                                  : item,
                              ))
                            }
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-200"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void save("PATCH", {
                        entity: "topic",
                        id: topic.id,
                        intro: topic.intro,
                        placeholder: topic.placeholder,
                        quickMessages: topic.quickMessages,
                      })}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      Сохранить тему
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function AdminSection({
  title,
  buttonLabel,
  onAdd,
  children,
}: {
  title: string;
  buttonLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500"
        >
          {buttonLabel}
        </button>
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
