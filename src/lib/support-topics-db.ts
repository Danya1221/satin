import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { supportTopics, type SupportTopic } from "@/lib/support-topics";

const SUPPORT_CHAT_TOPICS_KEY = "support-chat-topics";

type StoredTopic = {
  id?: unknown;
  intro?: unknown;
  placeholder?: unknown;
  quickMessages?: unknown;
};

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeQuickMessages(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const messages = value
    .map((item) => clean(item, 180))
    .filter(Boolean)
    .slice(0, 6);

  return messages.length > 0 ? messages : fallback;
}

function mergeStoredTopics(value: unknown): SupportTopic[] {
  const stored =
    value && typeof value === "object" && Array.isArray((value as { topics?: unknown }).topics)
      ? ((value as { topics: StoredTopic[] }).topics ?? [])
      : [];

  return supportTopics.map((fallback) => {
    const item = stored.find((topic) => clean(topic.id, 100) === fallback.id);

    if (!item) return fallback;

    return {
      ...fallback,
      intro: clean(item.intro) || fallback.intro,
      placeholder: clean(item.placeholder, 240) || fallback.placeholder,
      quickMessages: normalizeQuickMessages(item.quickMessages, fallback.quickMessages),
    };
  });
}

export async function getEditableSupportTopics() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: SUPPORT_CHAT_TOPICS_KEY },
  });

  return mergeStoredTopics(setting?.value);
}

export async function updateEditableSupportTopic(input: {
  id?: unknown;
  intro?: unknown;
  placeholder?: unknown;
  quickMessages?: unknown;
}) {
  const id = clean(input.id, 100);
  const defaults = supportTopics.find((topic) => topic.id === id);

  if (!defaults) {
    throw new Error("Неизвестная тема поддержки.");
  }

  const current = await getEditableSupportTopics();
  const next = current.map((topic) =>
    topic.id === id
      ? {
          ...topic,
          intro: clean(input.intro) || defaults.intro,
          placeholder: clean(input.placeholder, 240) || defaults.placeholder,
          quickMessages: normalizeQuickMessages(input.quickMessages, defaults.quickMessages),
        }
      : topic,
  );

  await prisma.siteSetting.upsert({
    where: { key: SUPPORT_CHAT_TOPICS_KEY },
    create: {
      key: SUPPORT_CHAT_TOPICS_KEY,
      value: { topics: next } as Prisma.InputJsonValue,
    },
    update: {
      value: { topics: next } as Prisma.InputJsonValue,
    },
  });

  return next.find((topic) => topic.id === id) ?? defaults;
}
