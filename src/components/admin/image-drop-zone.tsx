"use client";

import type { DragEvent } from "react";
import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  recommendedSize?: string;
  recommendedFormat?: string;
};

const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Сжать картинку через canvas (встроено в браузер)
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Создать canvas и нарисовать картинку меньшего размера
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Уменьшить если большая
        if (width > 2000) {
          const ratio = height / width;
          width = 1920;
          height = Math.round(width * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Экспортировать как WebP с качеством 75%
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas blob not created"));
              return;
            }

            const reader2 = new FileReader();
            reader2.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader2.readAsDataURL(blob);
          },
          "image/webp",
          0.75
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function ImageDropZone({
  value,
  onChange,
  label = "Фото товара",
  hint = "Перетащите фото сюда или нажмите, чтобы выбрать файл.",
  recommendedSize,
  recommendedFormat,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  async function readFile(file: File) {
    setError("");
    setIsCompressing(true);

    try {
      if (!file.type.startsWith("image/")) {
        setError("Можно загрузить только изображение.");
        setIsCompressing(false);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        // Сжать если больше лимита
        const compressed = await compressImage(file);
        onChange(compressed);
      } else {
        // Всё равно сжать для оптимизации
        const compressed = await compressImage(file);
        onChange(compressed);
      }
    } catch (err) {
      setError("Ошибка при сжатии картинки.");
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      readFile(file);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium text-white/70">{label}</div>

      <button
        type="button"
        disabled={isCompressing}
        onClick={() => !isCompressing && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isCompressing) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group min-h-[168px] rounded-2xl border border-dashed px-4 py-4 text-left transition-colors ${
          isCompressing ? "border-white/20 bg-black/30 opacity-60" : isDragging
            ? "border-blue-400 bg-blue-500/15"
            : "border-white/15 bg-black/20 hover:border-blue-500/50 hover:bg-blue-500/10"
        }`}
      >
        {isCompressing ? (
          <div className="flex min-h-[136px] flex-col items-center justify-center">
            <div className="text-sm font-semibold text-white">Сжимаю картинку...</div>
            <div className="mt-3 h-2 w-24 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-1/2 animate-pulse bg-blue-400" />
            </div>
          </div>
        ) : value ? (
          <div className="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
            <div
              className="h-32 rounded-2xl border border-white/10 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${value})` }}
              aria-label="Превью фото товара"
            />

            <div>
              <div className="text-sm font-semibold text-white">Фото загружено (сжато)</div>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Можно перетащить другое фото поверх этого блока или нажать сюда, чтобы выбрать новый файл.
              </p>

              <span className="mt-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                ✓ WebP оптимизировано
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[136px] flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <div className="text-sm font-semibold text-white">Перетащите фото товара</div>
            <p className="mt-2 max-w-[420px] text-sm leading-relaxed text-white/45">{hint}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/45">
                до {MAX_IMAGE_SIZE_MB} МБ (автосжатие)
              </span>
              {recommendedSize && (
                <span className="text-xs text-white/40">• {recommendedSize}</span>
              )}
              {recommendedFormat && (
                <span className="text-xs text-white/40">• {recommendedFormat}</span>
              )}
            </div>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isCompressing}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            readFile(file);
          }

          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <button
            type="button"
            disabled={isCompressing}
            onClick={() => onChange("")}
            className="text-sm text-white/45 transition-colors hover:text-red-300 disabled:opacity-50"
          >
            Удалить фото
          </button>
        ) : null}

        {error ? <span className="text-sm text-red-300">{error}</span> : null}
      </div>
    </div>
  );
}
