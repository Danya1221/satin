export type CatalogSearchIntent = {
  raw: string;
  normalized: string;
  tokens: string[];
  hasQuery: boolean;
  isAccessoryQuery: boolean;
  iphoneGeneration: string | null;
  iphoneVariant: "base" | "pro" | "pro-max" | null;
  memoryTokens: string[];
  colorTokens: string[];
};

export type CatalogSearchTarget = {
  values: Array<string | number | undefined | null>;
  category?: string | null;
  sortOrder?: number | null;
};

const ruToEnMap: Record<string, string> = {
  й: "q",
  ц: "w",
  у: "e",
  к: "r",
  е: "t",
  н: "y",
  г: "u",
  ш: "i",
  щ: "o",
  з: "p",
  х: "[",
  ъ: "]",
  ф: "a",
  ы: "s",
  в: "d",
  а: "f",
  п: "g",
  р: "h",
  о: "j",
  л: "k",
  д: "l",
  ж: ";",
  э: "'",
  я: "z",
  ч: "x",
  с: "c",
  м: "v",
  и: "b",
  т: "n",
  ь: "m",
  б: ",",
  ю: ".",
};

const enToRuMap = Object.fromEntries(
  Object.entries(ruToEnMap).map(([ru, en]) => [en, ru]),
) as Record<string, string>;

enToRuMap["/"] = ".";
ruToEnMap["."] = "/";

const colorAliases: Record<string, string> = {
  blue: "blue",
  синий: "blue",
  синяя: "blue",
  синее: "blue",
  голубой: "blue",
  голубая: "blue",
  black: "black",
  черный: "black",
  черная: "black",
  черное: "black",
  white: "white",
  белый: "white",
  белая: "white",
  green: "green",
  зеленый: "green",
  зеленая: "green",
  pink: "pink",
  розовый: "pink",
  purple: "purple",
  violet: "purple",
  фиолетовый: "purple",
  silver: "silver",
  серебро: "silver",
  серебристый: "silver",
  gold: "gold",
  золотой: "gold",
  red: "red",
  красный: "red",
  orange: "orange",
  оранжевый: "orange",
  titanium: "titanium",
  титан: "titanium",
};

const wordAliases: Record<string, string> = {
  айфон: "iphone",
  айфоны: "iphone",
  айф: "iphone",
  айфона: "iphone",
  айфону: "iphone",
  ипхон: "iphone",
  iphone: "iphone",
  iphones: "iphone",

  самсунг: "samsung",
  samsung: "samsung",
  сяоми: "xiaomi",
  ксяоми: "xiaomi",
  xiaomi: "xiaomi",
  макбук: "macbook",
  macbook: "macbook",
  аирподс: "airpods",
  эйрподс: "airpods",
  airpods: "airpods",

  про: "pro",
  pro: "pro",
  макс: "max",
  max: "max",
  максимум: "max",
  promax: "pro max",
  промакс: "pro max",

  гб: "gb",
  gb: "gb",
  гбайт: "gb",
  гигабайт: "gb",

  есим: "esim",
  есім: "esim",
  esim: "esim",
  сим: "sim",
  sim: "sim",

  чехол: "чехол",
  чехлы: "чехол",
  стекло: "стекло",
  пленка: "стекло",
  плёнка: "стекло",
  кабель: "кабель",
  провод: "кабель",
  зарядка: "зарядка",
  зарядное: "зарядка",
  адаптер: "адаптер",
  блок: "адаптер",
  аксессуар: "аксессуар",
  аксессуары: "аксессуар",
  защита: "аксессуар",
  case: "case",
  glass: "glass",
  cable: "cable",
  charger: "charger",
  adapter: "adapter",
  magsafe: "magsafe",
  accessory: "accessory",
  accessories: "accessory",
  cover: "case",
};

const accessoryTokens = new Set([
  "case",
  "glass",
  "cable",
  "charger",
  "charge",
  "adapter",
  "magsafe",
  "accessory",
  "accessories",
  "cover",
  "чехол",
  "стекло",
  "кабель",
  "зарядка",
  "адаптер",
  "аксессуар",
]);

function convertLayout(value: string, map: Record<string, string>) {
  return value
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
}

function normalizeBase(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[+]/g, " plus ")
    .replace(/[‐‑‒–—_]/g, " ")
    .replace(/([a-zа-я])([0-9])/gi, "$1 $2")
    .replace(/([0-9])([a-zа-я])/gi, "$1 $2")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeWords(value: string) {
  const text = normalizeBase(value);

  const rawTokens = text.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];

  rawTokens.forEach((token) => {
    const aliased = wordAliases[token] ?? colorAliases[token] ?? token;
    const normalizedColor = colorAliases[aliased] ?? aliased;

    normalizedColor
      .split(/\s+/)
      .filter(Boolean)
      .forEach((part) => tokens.push(part));
  });

  const compacted: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index];
    const next = tokens[index + 1];

    if (/^[0-9]{2,4}$/.test(current) && next === "gb") {
      compacted.push(`${current}gb`);
      index += 1;
      continue;
    }

    if (current === "e" && next === "sim") {
      compacted.push("esim");
      index += 1;
      continue;
    }

    compacted.push(current);
  }

  return normalizeBase(compacted.join(" ")).replace(/\b([0-9]{2,4})\s+gb\b/g, "$1gb");
}

function scoreQueryCandidate(value: string) {
  const tokens = value.split(/\s+/).filter(Boolean);
  let score = 0;

  if (tokens.includes("iphone")) score += 10;
  if (tokens.includes("pro")) score += 4;
  if (tokens.includes("max")) score += 4;
  if (tokens.some((token) => /^\d{2}$/.test(token))) score += 2;
  if (tokens.some((token) => /^\d{2,4}gb$/.test(token))) score += 3;
  if (tokens.some((token) => Boolean(colorAliases[token]))) score += 2;
  if (tokens.some((token) => accessoryTokens.has(token))) score += 5;

  return score;
}

export function normalizeCatalogSearchQuery(value: string) {
  const raw = normalizeBase(value);
  const candidates = [
    canonicalizeWords(raw),
    canonicalizeWords(convertLayout(raw, ruToEnMap)),
    canonicalizeWords(convertLayout(raw, enToRuMap)),
  ].filter(Boolean);

  const uniqueCandidates = Array.from(new Set(candidates));

  return uniqueCandidates.sort((a, b) => {
    const scoreDiff = scoreQueryCandidate(b) - scoreQueryCandidate(a);
    if (scoreDiff !== 0) return scoreDiff;
    return b.length - a.length;
  })[0] ?? raw;
}

export function buildCatalogSearch(value: string): CatalogSearchIntent {
  const normalized = normalizeCatalogSearchQuery(value);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const compact = tokens.join("");
  const hasQuery = tokens.length > 0;
  const isAccessoryQuery = tokens.some((token) => accessoryTokens.has(token));
  const iphoneIndex = tokens.indexOf("iphone");
  const iphoneGeneration =
    iphoneIndex >= 0
      ? tokens.find((token, index) => index > iphoneIndex && /^\d{2}$/.test(token)) ?? null
      : null;
  const hasPro = tokens.includes("pro") || compact.includes("promax");
  const hasMax = tokens.includes("max") || compact.includes("promax");
  const iphoneVariant = iphoneGeneration
    ? hasPro && hasMax
      ? "pro-max"
      : hasPro
        ? "pro"
        : "base"
    : null;

  return {
    raw: value,
    normalized,
    tokens,
    hasQuery,
    isAccessoryQuery,
    iphoneGeneration,
    iphoneVariant,
    memoryTokens: tokens.filter((token) => /^\d{2,4}gb$/.test(token)),
    colorTokens: tokens.filter((token) => Boolean(colorAliases[token])),
  };
}

export function normalizeCatalogSearchTarget(values: CatalogSearchTarget["values"]) {
  const joined = values
    .map((value) => (value == null ? "" : String(value)))
    .join(" ");

  return canonicalizeWords(joined);
}

function isAccessoryTarget(text: string, category?: string | null) {
  const normalizedCategory = canonicalizeWords(category ?? "");
  const targetTokens = text.split(/\s+/).filter(Boolean);

  return (
    normalizedCategory.includes("access") ||
    normalizedCategory.includes("аксесс") ||
    targetTokens.some((token) => accessoryTokens.has(token))
  );
}

function getIphoneTargetVariant(text: string) {
  const tokens = text.split(/\s+/).filter(Boolean);

  if (!tokens.includes("iphone")) return null;

  const compact = tokens.join("");
  if (tokens.includes("pro") && tokens.includes("max")) return "pro-max";
  if (compact.includes("promax")) return "pro-max";
  if (tokens.includes("pro")) return "pro";

  return "base";
}

function getIphoneTargetGeneration(text: string) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const iphoneIndex = tokens.indexOf("iphone");

  if (iphoneIndex < 0) return null;

  return tokens.find((token, index) => index > iphoneIndex && /^\d{2}$/.test(token)) ?? null;
}

export function scoreCatalogSearchTarget(search: CatalogSearchIntent, target: CatalogSearchTarget) {
  if (!search.hasQuery) {
    return 0;
  }

  const text = normalizeCatalogSearchTarget(target.values);

  if (!text) {
    return Number.NEGATIVE_INFINITY;
  }

  if (!search.tokens.every((token) => text.includes(token))) {
    return Number.NEGATIVE_INFINITY;
  }

  const isAccessory = isAccessoryTarget(text, target.category);
  const targetVariant = getIphoneTargetVariant(text);
  const targetGeneration = getIphoneTargetGeneration(text);
  let score = 0;

  score += search.tokens.length * 20;

  if (text.includes(search.normalized)) {
    score += 80;
  }

  for (const token of search.tokens) {
    const tokenIndex = text.indexOf(token);
    if (tokenIndex >= 0) {
      score += Math.max(0, 20 - tokenIndex);
    }
  }

  if (search.iphoneGeneration && targetGeneration === search.iphoneGeneration) {
    score += 120;
  }

  if (search.iphoneVariant) {
    if (search.iphoneVariant === "base") {
      if (targetVariant === "base") score += 120;
      if (targetVariant === "pro") score += 60;
      if (targetVariant === "pro-max") score += 40;
    }

    if (search.iphoneVariant === "pro") {
      if (targetVariant === "base" && !isAccessory) return Number.NEGATIVE_INFINITY;
      if (targetVariant === "pro") score += 130;
      if (targetVariant === "pro-max") score += 70;
    }

    if (search.iphoneVariant === "pro-max") {
      if (targetVariant !== "pro-max" && !isAccessory) return Number.NEGATIVE_INFINITY;
      if (targetVariant === "pro-max") score += 150;
    }
  }

  if (search.memoryTokens.length > 0) {
    score += search.memoryTokens.every((token) => text.includes(token)) ? 50 : -100;
  }

  if (search.colorTokens.length > 0) {
    score += search.colorTokens.every((token) => text.includes(token)) ? 40 : -100;
  }

  if (isAccessory) {
    score += search.isAccessoryQuery ? 160 : -220;
  } else if (search.isAccessoryQuery) {
    score -= 120;
  }

  const sortOrder = Number(target.sortOrder ?? 100);
  if (Number.isFinite(sortOrder)) {
    score -= Math.min(sortOrder, 1000) / 100;
  }

  return score;
}

export function matchesCatalogSearch(search: CatalogSearchIntent, target: CatalogSearchTarget) {
  if (!search.hasQuery) {
    return true;
  }

  return scoreCatalogSearchTarget(search, target) > Number.NEGATIVE_INFINITY;
}
