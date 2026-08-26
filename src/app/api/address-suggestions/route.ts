import { NextResponse } from "next/server";

import { getSiteEditorSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SuggestionMode = "city" | "address";

type AddressSuggestion = {
  value: string;
  unrestrictedValue: string;
  city: string;
  street: string;
  house: string;
  fiasId: string;
};

type ProviderResult = {
  suggestions: AddressSuggestion[];
  configured: boolean;
  status: number | null;
  message: string;
};

type DadataSuggestion = {
  value?: string;
  unrestricted_value?: string;
  data?: {
    region_with_type?: string;
    city?: string;
    city_with_type?: string;
    settlement?: string;
    settlement_with_type?: string;
    street?: string;
    street_with_type?: string;
    house?: string;
    house_type?: string;
    block?: string;
    block_type?: string;
    fias_id?: string;
  };
};

type YandexComponent = {
  name?: string;
  kind?: string;
};

type YandexSuggestion = {
  title?: { text?: string };
  subtitle?: { text?: string };
  address?: {
    formatted_address?: string;
    component?: YandexComponent[];
  };
  uri?: string;
};

type PhotonFeature = {
  properties?: {
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    countrycode?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
    osm_id?: number | string;
  };
};

function text(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeSecret(value: string | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Token\s+/i, "")
    .trim();
}

function providerErrorMessage(provider: string, status: number) {
  if (status === 401) {
    return `${provider}: ключ не принят. Скопируйте только значение API-ключа, без слова Token и без кавычек.`;
  }

  if (status === 403) {
    return `${provider}: доступ запрещён. Подтвердите почту и проверьте, что ключ активен для API подсказок.`;
  }

  if (status === 429) {
    return `${provider}: превышен лимит запросов.`;
  }

  return `${provider}: сервис ответил с ошибкой ${status}.`;
}

function cleanCity(value: string) {
  return value
    .replace(/^(г\.?|город|пос\.?|поселок|посёлок|пгт|с\.?|село|дер\.?|деревня)\s+/i, "")
    .trim();
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[ё]/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSuggestions(items: AddressSuggestion[], limit = 12) {
  const seen = new Set<string>();
  const result: AddressSuggestion[] = [];

  for (const item of items) {
    const key = normalizeKey(
      [item.city, item.street, item.house, item.value].filter(Boolean).join("|")
    );

    if (!item.value || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);

    if (result.length >= limit) break;
  }

  return result;
}

function componentValue(components: YandexComponent[] | undefined, kinds: string[]) {
  return (
    components?.find((component) =>
      kinds.includes(String(component.kind || "").toLowerCase())
    )?.name || ""
  );
}

async function getDadataSuggestions(input: {
  token: string;
  query: string;
  city: string;
  mode: SuggestionMode;
}): Promise<ProviderResult> {
  const combinedQuery =
    input.mode === "address" && input.city
      ? `${input.city}, ${input.query}`
      : input.query;

  const body: Record<string, unknown> = {
    query: combinedQuery,
    count: 20,
  };

  if (input.mode === "city") {
    // Do not start strictly from "city": federal cities and some settlements
    // can be represented at a higher administrative level in FIAS.
    body.from_bound = { value: "region" };
    body.to_bound = { value: "settlement" };
  } else {
    body.from_bound = { value: "street" };
    body.to_bound = { value: "house" };

    if (input.city) {
      body.locations_boost = [
        { city: input.city },
        { settlement: input.city },
      ];
    }
  }

  try {
    const response = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${input.token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      const message = providerErrorMessage("DaData", response.status);
      console.error("DaData address suggestions failed", {
        status: response.status,
        mode: input.mode,
      });

      return {
        suggestions: [],
        configured: true,
        status: response.status,
        message,
      };
    }

    const payload = (await response.json()) as {
      suggestions?: DadataSuggestion[];
    };

    const mapped = (payload.suggestions ?? []).map(
      (item): AddressSuggestion => {
        const data = item.data ?? {};
        const city = cleanCity(
          data.city ||
            data.settlement ||
            data.city_with_type ||
            data.settlement_with_type ||
            ""
        );
        const street = data.street_with_type || data.street || "";
        const houseParts = [
          data.house ? `${data.house_type || "д"}. ${data.house}` : "",
          data.block ? `${data.block_type || "стр"}. ${data.block}` : "",
        ].filter(Boolean);
        const house = data.house || "";
        const shortAddress = [street, ...houseParts]
          .filter(Boolean)
          .join(", ");
        const fullAddress =
          item.unrestricted_value ||
          item.value ||
          [data.region_with_type, city, shortAddress]
            .filter(Boolean)
            .join(", ");

        return {
          value:
            input.mode === "city"
              ? city
              : shortAddress || item.value || "",
          unrestrictedValue: fullAddress,
          city,
          street,
          house,
          fiasId: data.fias_id || "",
        };
      }
    );

    const suggestions = uniqueSuggestions(
      input.mode === "city"
        ? mapped.filter((item) => Boolean(item.city))
        : mapped.filter((item) => Boolean(item.street || item.house || item.value))
    );

    return {
      suggestions,
      configured: true,
      status: 200,
      message:
        suggestions.length > 0
          ? "DaData подключена."
          : "DaData подключена, но по этому запросу вариантов не найдено.",
    };
  } catch (error) {
    console.error("DaData address suggestions request failed", error);

    return {
      suggestions: [],
      configured: true,
      status: null,
      message:
        "DaData не ответила вовремя. Проверьте Railway Logs и повторите запрос.",
    };
  }
}

async function getYandexSuggestions(input: {
  apiKey: string;
  query: string;
  city: string;
  mode: SuggestionMode;
  sessionToken: string;
}) {
  const url = new URL("https://suggest-maps.yandex.ru/v1/suggest");
  const combinedQuery =
    input.mode === "address" && input.city
      ? `${input.city}, ${input.query}`
      : input.query;

  url.searchParams.set("apikey", input.apiKey);
  url.searchParams.set("text", combinedQuery);
  url.searchParams.set("lang", "ru");
  url.searchParams.set("results", "10");
  url.searchParams.set("highlight", "0");
  url.searchParams.set("countries", "ru");
  url.searchParams.set("print_address", "1");
  url.searchParams.set(
    "types",
    input.mode === "city" ? "locality" : "street,house"
  );

  if (input.sessionToken) {
    url.searchParams.set("sessiontoken", input.sessionToken);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { results?: YandexSuggestion[] };

  return uniqueSuggestions(
    (payload.results ?? []).map((item): AddressSuggestion => {
      const components = item.address?.component;
      const title = text(item.title?.text);
      const subtitle = text(item.subtitle?.text);
      const formattedAddress = text(item.address?.formatted_address);
      const city = cleanCity(
        componentValue(components, ["locality"]) ||
          (input.mode === "city" ? title : input.city)
      );
      const street = componentValue(components, ["street", "route"]);
      const house = componentValue(components, ["house"]);
      const shortAddress = [street, house ? `д. ${house}` : ""]
        .filter(Boolean)
        .join(", ");

      return {
        value:
          input.mode === "city"
            ? city || title
            : shortAddress || title || formattedAddress,
        unrestrictedValue:
          formattedAddress || [subtitle, title].filter(Boolean).join(", "),
        city,
        street,
        house,
        fiasId: item.uri || "",
      };
    })
  );
}

async function getPhotonSuggestions(input: {
  query: string;
  city: string;
  mode: SuggestionMode;
}) {
  const search = [
    input.mode === "address" ? input.city : "",
    input.query,
    "Россия",
  ]
    .filter(Boolean)
    .join(", ");
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", search);
  url.searchParams.set("lang", "ru");
  url.searchParams.set("limit", "15");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NeontechStore/1.0 address-autocomplete",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { features?: PhotonFeature[] };

  const mapped = (payload.features ?? [])
    .filter((feature) => {
      const country = feature.properties?.countrycode?.toUpperCase();
      return !country || country === "RU";
    })
    .map((feature): AddressSuggestion => {
      const properties = feature.properties ?? {};
      const city = cleanCity(
        properties.city ||
          properties.town ||
          properties.village ||
          properties.hamlet ||
          properties.locality ||
          (input.mode === "city" ? properties.name || "" : input.city)
      );
      const street =
        properties.street ||
        (input.mode === "address" ? properties.name || "" : "");
      const house = properties.housenumber || "";
      const addressValue = [street, house ? `д. ${house}` : ""]
        .filter(Boolean)
        .join(", ");
      const full = [
        properties.postcode,
        properties.state,
        city,
        addressValue,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        value: input.mode === "city" ? city : addressValue || full,
        unrestrictedValue: full,
        city,
        street,
        house,
        fiasId: properties.osm_id ? `osm-${properties.osm_id}` : "",
      };
    });

  const cityValues = new Set([
    "city",
    "town",
    "village",
    "hamlet",
    "locality",
    "municipality",
  ]);

  const modeFiltered =
    input.mode === "city"
      ? mapped.filter((item, index) => {
          const properties = payload.features?.[index]?.properties;
          const placeType = String(
            properties?.osm_value || properties?.type || ""
          ).toLowerCase();
          return Boolean(item.city) && (!placeType || cityValues.has(placeType));
        })
      : mapped.filter((item) => Boolean(item.street || item.house));

  return uniqueSuggestions(modeFiltered.length ? modeFiltered : mapped);
}

export async function GET() {
  const dadataToken = normalizeSecret(
    process.env.DADATA_API_KEY ||
      process.env.DADATA_TOKEN ||
      process.env.DADATA_KEY
  );
  const yandexKey = normalizeSecret(
    process.env.YANDEX_GEOSUGGEST_API_KEY ||
      process.env.YANDEX_MAPS_API_KEY
  );

  return NextResponse.json(
    {
      ok: true,
      dadataConfigured: Boolean(dadataToken),
      yandexConfigured: Boolean(yandexKey),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        query?: string;
        city?: string;
        mode?: SuggestionMode;
        sessionToken?: string;
      }
    | null;
  const query = text(body?.query);
  const city = text(body?.city, 120);
  const sessionToken = text(body?.sessionToken, 100);
  const mode: SuggestionMode = body?.mode === "city" ? "city" : "address";

  const dadataToken = normalizeSecret(
    process.env.DADATA_API_KEY ||
      process.env.DADATA_TOKEN ||
      process.env.DADATA_KEY
  );
  const yandexKey = normalizeSecret(
    process.env.YANDEX_GEOSUGGEST_API_KEY ||
      process.env.YANDEX_MAPS_API_KEY
  );

  if (query.length < 2) {
    return NextResponse.json({
      suggestions: [],
      configured: Boolean(dadataToken || yandexKey),
      providerMessage: "",
    });
  }

  let providerMessage = "";

  // Use DaData first and return immediately when it has matches. This avoids
  // waiting for slow fallback providers after the paid/full provider succeeded.
  if (dadataToken) {
    const dadataResult = await getDadataSuggestions({
      token: dadataToken,
      query,
      city,
      mode,
    });

    providerMessage = dadataResult.message;

    if (dadataResult.suggestions.length > 0) {
      return NextResponse.json(
        {
          suggestions: dadataResult.suggestions,
          configured: true,
          source: "dadata",
          providerMessage,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  } else {
    providerMessage =
      "Приложение не видит DADATA_API_KEY. Добавьте переменную именно в веб-сервис Railway и примените новый Deploy.";
  }

  if (yandexKey) {
    try {
      const yandexSuggestions = await getYandexSuggestions({
        apiKey: yandexKey,
        query,
        city,
        mode,
        sessionToken,
      });

      if (yandexSuggestions.length > 0) {
        return NextResponse.json(
          {
            suggestions: yandexSuggestions,
            configured: true,
            source: "yandex",
            providerMessage: "Яндекс Геосаджест подключён.",
          },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch (error) {
      console.error("Yandex address suggestions request failed", error);
    }
  }

  // Open fallback remains available, but it no longer delays a successful
  // DaData response.
  try {
    const photonSuggestions = await getPhotonSuggestions({
      query,
      city,
      mode,
    });

    if (photonSuggestions.length > 0) {
      return NextResponse.json(
        {
          suggestions: photonSuggestions,
          configured: Boolean(dadataToken || yandexKey),
          source: "photon",
          providerMessage:
            providerMessage ||
            "Используется базовый резервный поиск. Для полного справочника подключите DaData.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  } catch (error) {
    console.error("Photon address suggestions request failed", error);
  }

  const settings = await getSiteEditorSettings();
  const needle = normalizeKey(query);
  const localSuggestions = uniqueSuggestions(
    settings.contacts.addresses
      .filter((address) => address.active)
      .map((address): AddressSuggestion => ({
        value: mode === "city" ? address.city : address.address,
        unrestrictedValue: [address.city, address.address]
          .filter(Boolean)
          .join(", "),
        city: address.city,
        street: address.address,
        house: "",
        fiasId: address.id,
      }))
      .filter((item) =>
        normalizeKey(
          mode === "city" ? item.city : item.unrestrictedValue
        ).includes(needle)
      )
  );

  return NextResponse.json(
    {
      suggestions: localSuggestions,
      configured: Boolean(dadataToken || yandexKey),
      source: "settings",
      providerMessage,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
