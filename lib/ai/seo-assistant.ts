import "server-only";
import type { SeoSuggestion, SeoSuggestionInput } from "@/types/seo";

export interface SeoAssistantAdapter {
  enabled: boolean;
  model: string | null;
  suggest(input: SeoSuggestionInput): Promise<SeoSuggestion>;
}

export class SeoAssistantUnavailableError extends Error {}

const suggestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
    imageAlt: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
  },
  required: [
    "title",
    "description",
    "slug",
    "imageAlt",
    "ogTitle",
    "ogDescription",
  ],
} as const;

function validateSuggestion(value: unknown): SeoSuggestion {
  if (!value || typeof value !== "object") throw new Error("INVALID_AI_OUTPUT");
  const record = value as Record<string, unknown>;
  const fields = [
    "title",
    "description",
    "slug",
    "imageAlt",
    "ogTitle",
    "ogDescription",
  ] as const;
  if (fields.some((field) => typeof record[field] !== "string")) {
    throw new Error("INVALID_AI_OUTPUT");
  }
  return Object.fromEntries(
    fields.map((field) => [field, String(record[field]).trim()]),
  ) as unknown as SeoSuggestion;
}

function responseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

class OpenAiSeoAssistant implements SeoAssistantAdapter {
  enabled = true;

  constructor(
    private readonly apiKey: string,
    public readonly model: string,
  ) {}

  async suggest(input: SeoSuggestionInput): Promise<SeoSuggestion> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 700,
        input: [
          {
            role: "system",
            content:
              "أنت مساعد SEO عربي لمتجر معدات صناعية. اقترح نصوصاً دقيقة غير مضللة. اجعل العنوان قرابة 50-60 حرفاً والوصف قرابة 140-160 حرفاً، وSlug إنجليزياً صغيراً بشرطات فقط. لا تخترع مواصفات أو أسعاراً.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "seo_suggestion",
            strict: true,
            schema: suggestionSchema,
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`OPENAI_${response.status}`);
    const text = responseText(await response.json());
    if (!text) throw new Error("INVALID_AI_OUTPUT");
    return validateSuggestion(JSON.parse(text));
  }
}

const disabledAdapter: SeoAssistantAdapter = {
  enabled: false,
  model: null,
  async suggest() {
    throw new SeoAssistantUnavailableError("AI_DISABLED");
  },
};

export function getSeoAssistant(): SeoAssistantAdapter {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return disabledAdapter;
  return new OpenAiSeoAssistant(
    apiKey,
    process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
  );
}

export function isSeoAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
