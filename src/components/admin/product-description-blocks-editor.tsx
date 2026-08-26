"use client";

import { ImageLibraryField } from "@/components/admin/image-library-field";

export type ProductDescriptionBlock = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  imageSide: "left" | "right";
  tone: "light" | "dark";
};

type Props = {
  value: ProductDescriptionBlock[];
  onChange: (value: ProductDescriptionBlock[]) => void;
};

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

const textareaClass =
  "min-h-[110px] w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

function createBlock(): ProductDescriptionBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    eyebrow: "Преимущество",
    title: "Заголовок блока",
    text: "Короткое описание преимущества товара. Можно добавить изображение справа или слева.",
    image: "",
    imageAlt: "",
    imageSide: "right",
    tone: "light",
  };
}

export function normalizeDescriptionBlocks(value: unknown): ProductDescriptionBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const imageSide = record.imageSide === "left" ? "left" : "right";
      const tone = record.tone === "dark" ? "dark" : "light";

      return {
        id: typeof record.id === "string" && record.id ? record.id : `block-${index}`,
        eyebrow: typeof record.eyebrow === "string" ? record.eyebrow : "",
        title: typeof record.title === "string" ? record.title : "",
        text: typeof record.text === "string" ? record.text : "",
        image: typeof record.image === "string" ? record.image : "",
        imageAlt: typeof record.imageAlt === "string" ? record.imageAlt : "",
        imageSide,
        tone,
      } satisfies ProductDescriptionBlock;
    })
    .filter((item): item is ProductDescriptionBlock => Boolean(item))
    .filter((item) => item.title.trim() || item.text.trim() || item.image.trim());
}

export function ProductDescriptionBlocksEditor({ value, onChange }: Props) {
  const blocks = normalizeDescriptionBlocks(value);

  function updateBlock(id: string, patch: Partial<ProductDescriptionBlock>) {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((block) => block.id !== id));
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const index = blocks.findIndex((block) => block.id === id);

    if (index < 0) {
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;

    if (nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const nextBlocks = [...blocks];
    const [block] = nextBlocks.splice(index, 1);
    nextBlocks.splice(nextIndex, 0, block);
    onChange(nextBlocks);
  }

  return (
    <div className="rounded-[28px] border border-blue-500/20 bg-blue-500/[0.05] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Apple-style описание
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white">
            Лендинг-блоки товара
          </h3>
          <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-white/50">
            Добавляйте блоки с заголовком, текстом и картинкой. На странице товара они отрисуются крупными секциями в стиле Apple.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange([...blocks, createBlock()])}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Добавить блок
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-relaxed text-white/45">
          Блоков пока нет. Нажмите «Добавить блок», чтобы собрать красивое описание с картинками.
        </div>
      ) : null}

      <div className="mt-5 grid gap-5">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-blue-300/80">
                  Блок {index + 1}
                </div>
                <div className="mt-1 text-sm text-white/45">
                  {block.title || "Без заголовка"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={index === 0}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/65 transition-colors hover:border-blue-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Выше
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/65 transition-colors hover:border-blue-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Ниже
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                >
                  Удалить блок
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-white/65">
                  <span>Метка</span>
                  <input
                    value={block.eyebrow}
                    onChange={(event) => updateBlock(block.id, { eyebrow: event.target.value })}
                    placeholder="Например: Камера"
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-white/65">
                  <span>Заголовок</span>
                  <input
                    value={block.title}
                    onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                    placeholder="Снимайте как профессионал"
                    className={inputClass}
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-white/65">
                  <span>Текст</span>
                  <textarea
                    value={block.text}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    placeholder="Описание блока"
                    className={textareaClass}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-white/65">
                    <span>Сторона картинки</span>
                    <select
                      value={block.imageSide}
                      onChange={(event) => updateBlock(block.id, { imageSide: event.target.value === "left" ? "left" : "right" })}
                      className={inputClass}
                    >
                      <option value="right">Справа</option>
                      <option value="left">Слева</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-white/65">
                    <span>Тон блока</span>
                    <select
                      value={block.tone}
                      onChange={(event) => updateBlock(block.id, { tone: event.target.value === "dark" ? "dark" : "light" })}
                      className={inputClass}
                    >
                      <option value="light">Светлый</option>
                      <option value="dark">Тёмный</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="grid gap-4">
                <ImageLibraryField
                  value={block.image ? [block.image] : []}
                  onChange={(images) => updateBlock(block.id, { image: images[0] ?? "" })}
                  label="Картинка блока"
                  hint="Широкая или предметная картинка для секции описания."
                  recommendedSize="1600×900 px"
                  recommendedFormat="JPG / WEBP, 16:9"
                  maxImages={1}
                />

                <label className="grid gap-2 text-sm font-medium text-white/65">
                  <span>Alt-текст картинки</span>
                  <input
                    value={block.imageAlt}
                    onChange={(event) => updateBlock(block.id, { imageAlt: event.target.value })}
                    placeholder="Например: iPhone 17 Pro в оранжевом цвете"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
