export function normalizeRuPhone(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  let normalized = digits;

  if (normalized.length === 11 && normalized.startsWith("8")) {
    normalized = `7${normalized.slice(1)}`;
  }

  if (normalized.length === 10 && normalized.startsWith("9")) {
    normalized = `7${normalized}`;
  }

  if (normalized.length === 11 && normalized.startsWith("7")) {
    return `+${normalized}`;
  }

  return "";
}

export function formatRuPhone(value: unknown) {
  const phone = normalizeRuPhone(value);

  if (!phone) {
    return typeof value === "string" ? value : "";
  }

  const digits = phone.replace(/\D/g, "");

  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function isValidRuPhone(value: unknown) {
  return Boolean(normalizeRuPhone(value));
}

export function normalizeEmailStrict(value: unknown) {
  const email =
    typeof value === "string"
      ? value
          .normalize("NFKC")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .trim()
          .toLowerCase()
          .replace(/\s*@\s*/g, "@")
          .replace(/\s*\.\s*/g, ".")
      : "";

  if (!email) {
    return "";
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email) ? email : "";
}

export function isValidEmail(value: unknown) {
  return Boolean(normalizeEmailStrict(value));
}

export function validateCourierAddress(cityValue: unknown, addressValue: unknown) {
  const city = typeof cityValue === "string" ? cityValue.trim() : "";
  const address = typeof addressValue === "string" ? addressValue.trim() : "";
  const combined = city && !address.toLowerCase().includes(city.toLowerCase())
    ? [city, address].filter(Boolean).join(", ")
    : address || city;

  if (city.length < 2) {
    return {
      ok: false as const,
      message: "Укажите город доставки.",
      normalized: combined,
    };
  }

  if (address.length < 8) {
    return {
      ok: false as const,
      message: "Укажите полный адрес: улицу и дом.",
      normalized: combined,
    };
  }

  const hasHouseNumber = /\d/.test(address);
  const hasStreetWord =
    /(ул\.?|улица|проспект|пр-т|пр-кт|шоссе|пер\.?|переулок|бульвар|бул\.?|наб\.?|набережная|проезд|площадь|пл\.?|дом|д\.)/i.test(address);

  if (!hasStreetWord || !hasHouseNumber) {
    return {
      ok: false as const,
      message: "Адрес должен содержать улицу и номер дома.",
      normalized: combined,
    };
  }

  return {
    ok: true as const,
    message: "",
    normalized: combined,
  };
}
