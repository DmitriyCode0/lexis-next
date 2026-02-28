import { NextRequest, NextResponse } from "next/server";
import { SchemaType, type ResponseSchema } from "@google/generative-ai";
import {
  FALLBACK_GEMINI_MODEL,
  DEFAULT_GEMINI_MODEL,
  getGeminiModel,
} from "@/lib/gemini";
import type {
  AnalysisResult,
  AnalyzedWord,
  PartOfSpeech,
  MorphemeType,
} from "@/lib/types";

export const maxDuration = 60;

const VALID_POS: PartOfSpeech[] = [
  "noun",
  "verb",
  "auxiliary_verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "determiner",
  "particle",
  "numeral",
  "phrasal_verb",
  "idiom",
  "modal_structure",
  "unknown",
];

const VALID_MORPHEME_TYPES: MorphemeType[] = [
  "prefix",
  "root",
  "suffix",
  "ending",
  "infix",
];

const GEMINI_PRIMARY_TIMEOUT_MS = 25000;
const GEMINI_FALLBACK_TIMEOUT_MS = 22000;
const GEMINI_PRIMARY_MAX_OUTPUT_TOKENS = 4096;
const GEMINI_RETRY_MAX_OUTPUT_TOKENS = 8192;
const GEMINI_FALLBACK_MAX_OUTPUT_TOKENS = 6144;

const SYSTEM_PROMPT = `You are a precise computational linguist. Output strict RFC 8259 JSON only — all keys and string values must use double quotes, no trailing commas, no comments, no markdown.

Schema:
{"sentence":"<original>","sentenceTranslation":"<Ukrainian translation of entire sentence>","words":[{"id":"<index string>","original":"<surface form>","lemma":"<base form>","partOfSpeech":"<noun|verb|auxiliary_verb|adjective|adverb|pronoun|preposition|conjunction|interjection|determiner|particle|numeral|phrasal_verb|idiom|modal_structure|unknown>","translation":"<Ukrainian>","morphemes":[{"text":"<text>","type":"<prefix|root|suffix|ending|infix>","meaning":"<2-5 word description>","translationUk":"<Ukrainian, for prefix/suffix only>"}],"isPunctuation":false,"groupId":"<optional, e.g. group-0>","groupMeaning":"<optional>","groupTranslation":"<optional Ukrainian>"}]}

Rules:
- Include every token. Punctuation: isPunctuation=true, morphemes=[].
- Every non-punctuation word needs at least one "root" morpheme. Order morphemes left→right.
- Always provide sentenceTranslation (natural Ukrainian).
- Provide translation (Ukrainian) for each word. Omit for function words with no standalone Ukrainian equivalent.
- Morpheme meaning: very short (2-5 words). Prefixes: what they add. Suffixes: what they form. Endings: grammatical function. Roots: core meaning.
- translationUk: only for prefix and suffix morphemes. Omit for root and ending.
- Detect phrasal verbs ("give up"), idioms ("piece of cake"), modal structures ("should have been"). For multi-word expressions: assign same groupId to all words, set partOfSpeech to phrasal_verb/idiom/modal_structure for each, include groupMeaning and groupTranslation on each word. Non-grouped words must not have group fields.`;

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sentence: { type: SchemaType.STRING },
    sentenceTranslation: { type: SchemaType.STRING },
    words: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          original: { type: SchemaType.STRING },
          lemma: { type: SchemaType.STRING },
          partOfSpeech: {
            type: SchemaType.STRING,
            format: "enum" as const,
            enum: VALID_POS as string[],
          },
          translation: { type: SchemaType.STRING },
          morphemes: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING },
                type: {
                  type: SchemaType.STRING,
                  format: "enum" as const,
                  enum: VALID_MORPHEME_TYPES as string[],
                },
                meaning: { type: SchemaType.STRING },
                translationUk: { type: SchemaType.STRING },
              },
              required: ["text", "type", "meaning"],
            },
          },
          isPunctuation: { type: SchemaType.BOOLEAN },
          groupId: { type: SchemaType.STRING },
          groupMeaning: { type: SchemaType.STRING },
          groupTranslation: { type: SchemaType.STRING },
        },
        required: [
          "id",
          "original",
          "lemma",
          "partOfSpeech",
          "morphemes",
          "isPunctuation",
        ],
      },
    },
  },
  required: ["sentence", "sentenceTranslation", "words"],
};

/**
 * Normalize Gemini response to fix common type drift before validation.
 */
function normalizeResponse(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.words)) {
    obj.words = (obj.words as Array<Record<string, unknown>>).map((w, idx) => {
      // id: number → string
      if (typeof w.id === "number") w.id = String(w.id);
      if (w.id === undefined) w.id = String(idx);

      // isPunctuation: missing → false
      if (w.isPunctuation === undefined) w.isPunctuation = false;

      // lemma: missing → copy from original
      if (!w.lemma && typeof w.original === "string") w.lemma = w.original;

      // morphemes: missing → empty array
      if (!Array.isArray(w.morphemes)) w.morphemes = [];

      // Ensure every non-punctuation token has at least one root morpheme.
      // This avoids hard-failing on partially valid model output.
      const hasRoot = (w.morphemes as Array<Record<string, unknown>>).some(
        (m) => m?.type === "root",
      );
      if (!w.isPunctuation && !hasRoot) {
        const rootText =
          typeof w.lemma === "string" && w.lemma.trim().length > 0
            ? w.lemma
            : typeof w.original === "string"
              ? w.original
              : "";
        (w.morphemes as Array<Record<string, unknown>>).push({
          text: rootText,
          type: "root",
          meaning: "core lexical meaning",
        });
      }

      // Strip empty group fields
      if (w.groupId === "") delete w.groupId;
      if (w.groupMeaning === "") delete w.groupMeaning;
      if (w.groupTranslation === "") delete w.groupTranslation;

      return w;
    });
  }

  return obj;
}

function validateResult(data: unknown): data is {
  sentence: string;
  sentenceTranslation?: string;
  words: AnalyzedWord[];
} {
  if (!data || typeof data !== "object") {
    console.error("[validate] Not an object");
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.sentence !== "string") {
    console.error("[validate] sentence is not a string:", typeof obj.sentence);
    return false;
  }
  if (
    obj.sentenceTranslation !== undefined &&
    typeof obj.sentenceTranslation !== "string"
  ) {
    console.error("[validate] sentenceTranslation is not a string");
    return false;
  }
  if (!Array.isArray(obj.words)) {
    console.error("[validate] words is not an array");
    return false;
  }

  for (let i = 0; i < obj.words.length; i++) {
    const word = obj.words[i];
    if (typeof word !== "object" || word === null) {
      console.error(`[validate] word[${i}] is not an object`);
      return false;
    }
    const w = word as Record<string, unknown>;
    if (typeof w.id !== "string") {
      console.error(`[validate] word[${i}].id is not a string:`, w.id);
      return false;
    }
    if (typeof w.original !== "string") {
      console.error(`[validate] word[${i}].original is not a string`);
      return false;
    }
    if (typeof w.lemma !== "string") {
      console.error(`[validate] word[${i}].lemma is not a string`);
      return false;
    }
    if (typeof w.isPunctuation !== "boolean") {
      console.error(
        `[validate] word[${i}].isPunctuation is not a boolean:`,
        w.isPunctuation,
      );
      return false;
    }
    if (w.translation !== undefined && typeof w.translation !== "string") {
      console.error(`[validate] word[${i}].translation is not a string`);
      return false;
    }
    if (!VALID_POS.includes(w.partOfSpeech as PartOfSpeech)) {
      console.error(
        `[validate] word[${i}].partOfSpeech invalid:`,
        w.partOfSpeech,
      );
      return false;
    }
    if (!Array.isArray(w.morphemes)) {
      console.error(`[validate] word[${i}].morphemes is not an array`);
      return false;
    }

    // Validate optional group fields
    if (w.groupId !== undefined && typeof w.groupId !== "string") return false;
    if (w.groupMeaning !== undefined && typeof w.groupMeaning !== "string")
      return false;
    if (
      w.groupTranslation !== undefined &&
      typeof w.groupTranslation !== "string"
    )
      return false;

    if (!w.isPunctuation) {
      const hasRoot = (w.morphemes as Array<Record<string, unknown>>).some(
        (m) => m.type === "root",
      );
      if (!hasRoot) {
        console.error(
          `[validate] word[${i}] "${w.original}" has no root morpheme`,
        );
        return false;
      }
    }

    for (const morpheme of w.morphemes as Array<Record<string, unknown>>) {
      if (typeof morpheme.text !== "string") {
        console.error(`[validate] word[${i}] morpheme.text is not a string`);
        return false;
      }
      if (!VALID_MORPHEME_TYPES.includes(morpheme.type as MorphemeType)) {
        console.error(
          `[validate] word[${i}] morpheme.type invalid:`,
          morpheme.type,
        );
        return false;
      }
      if (typeof morpheme.meaning !== "string") {
        console.error(`[validate] word[${i}] morpheme.meaning is not a string`);
        return false;
      }
      if (
        morpheme.translationUk !== undefined &&
        typeof morpheme.translationUk !== "string"
      )
        return false;
    }
  }

  return true;
}

/**
 * Attempt to repair truncated JSON by finding the last complete word object
 * and closing the structure. Returns null if repair is not possible.
 */
function repairTruncatedJson(text: string): unknown | null {
  // Find the last complete word object boundary: },{
  const lastBoundary = text.lastIndexOf("},{");
  if (lastBoundary === -1) return null;

  // Keep everything up to and including the } at that boundary, then close
  const repaired = text.substring(0, lastBoundary + 1) + "]}";
  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

async function callGemini(sentence: string): Promise<{
  sentence: string;
  sentenceTranslation?: string;
  words: AnalyzedWord[];
}> {
  const callGeminiWithModel = async (
    modelName: string,
    timeoutMs: number,
    maxOutputTokens: number,
  ): Promise<{
    sentence: string;
    sentenceTranslation?: string;
    words: AnalyzedWord[];
  }> => {
    const model = getGeminiModel(modelName);

    const generatePromise = model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze this sentence: "${sentence}"` }],
        },
      ],
      systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini request timed out (${modelName})`)),
        timeoutMs,
      ),
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);

    const finishReason = result.response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.warn(
        `[analyze] Gemini finishReason (${modelName}): ${finishReason}`,
      );
      if (finishReason === "MAX_TOKENS") {
        throw new Error(`Gemini response hit MAX_TOKENS (${modelName})`);
      }
    }

    let text = result.response.text();

    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const repaired = repairTruncatedJson(text);
      if (repaired) {
        console.warn(
          "[analyze] Repaired truncated JSON response (some words may be missing)",
        );
        parsed = repaired;
      } else {
        console.error("[analyze] JSON parse failed and repair unsuccessful");
        console.error("[analyze] Full raw response:", text.slice(0, 500));
        throw new Error("Incomplete response from Gemini — please try again");
      }
    }

    parsed = normalizeResponse(parsed);

    if (!validateResult(parsed)) {
      throw new Error("Invalid response shape from Gemini");
    }

    return parsed;
  };

  try {
    return await callGeminiWithModel(
      DEFAULT_GEMINI_MODEL,
      GEMINI_PRIMARY_TIMEOUT_MS,
      GEMINI_PRIMARY_MAX_OUTPUT_TOKENS,
    );
  } catch (error) {
    let lastError = error;
    let message =
      lastError instanceof Error ? lastError.message : "Unknown Gemini error";

    const hitMaxTokens = message.includes("MAX_TOKENS");
    if (hitMaxTokens) {
      console.warn(
        `[analyze] Primary model hit MAX_TOKENS, retrying with larger output budget (${GEMINI_RETRY_MAX_OUTPUT_TOKENS})`,
      );
      try {
        return await callGeminiWithModel(
          DEFAULT_GEMINI_MODEL,
          GEMINI_PRIMARY_TIMEOUT_MS,
          GEMINI_RETRY_MAX_OUTPUT_TOKENS,
        );
      } catch (retryError) {
        lastError = retryError;
        message =
          retryError instanceof Error
            ? retryError.message
            : "Unknown Gemini error";
      }
    }

    const isTimeout = message.includes("timed out");
    const isMaxTokens = message.includes("MAX_TOKENS");
    if (
      (!isTimeout && !isMaxTokens) ||
      FALLBACK_GEMINI_MODEL === DEFAULT_GEMINI_MODEL
    ) {
      throw lastError;
    }

    console.warn(
      `[analyze] Retrying with fallback model ${FALLBACK_GEMINI_MODEL}`,
    );
    return callGeminiWithModel(
      FALLBACK_GEMINI_MODEL,
      GEMINI_FALLBACK_TIMEOUT_MS,
      isMaxTokens
        ? GEMINI_RETRY_MAX_OUTPUT_TOKENS
        : GEMINI_FALLBACK_MAX_OUTPUT_TOKENS,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sentence = body?.sentence;

    if (
      !sentence ||
      typeof sentence !== "string" ||
      sentence.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Sentence is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    if (sentence.length > 200) {
      return NextResponse.json(
        { error: "Sentence must be 200 characters or fewer" },
        { status: 400 },
      );
    }

    let data: {
      sentence: string;
      sentenceTranslation?: string;
      words: AnalyzedWord[];
    };

    try {
      data = await callGemini(sentence.trim());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown Gemini error";
      console.error("[analyze] Gemini call failed:", message);
      return NextResponse.json(
        { error: `Analysis failed: ${message}` },
        { status: 500 },
      );
    }

    const analysisResult: AnalysisResult = {
      id: crypto.randomUUID(),
      sentence: data.sentence,
      sentenceTranslation: data.sentenceTranslation,
      words: data.words,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysisResult);
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
