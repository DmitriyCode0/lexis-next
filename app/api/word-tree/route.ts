import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import type { WordTreeResult } from "@/lib/types";

export const maxDuration = 60;

const WORD_TREE_PROMPT = `You are a precise computational linguist specializing in morphological derivation.
Given a root morpheme and the word it appeared in, generate a list of words derived from the same root.
Return raw JSON only, no markdown fences.

Schema:
{
  "root": "<the root morpheme>",
  "rootMeaning": "<brief meaning of the root>",
  "derivatives": [
    {
      "word": "<derived word>",
      "meaning": "<short definition>",
      "rootHighlight": [<startIndex>, <length>]
    }
  ]
}

Rules:
- Include 7 common English words sharing this root.
- Order from simplest (closest to root) to most complex (most affixes).
- "rootHighlight" must be the 0-based character index and length of the root within the word.
- Include the original source word in the list.
- Focus on real, commonly used English words.`;

function validateWordTreeResult(data: unknown): data is WordTreeResult {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.root !== "string") return false;
  if (typeof obj.rootMeaning !== "string") return false;
  if (!Array.isArray(obj.derivatives)) return false;

  for (const entry of obj.derivatives) {
    if (typeof entry !== "object" || entry === null) return false;
    const e = entry as Record<string, unknown>;
    if (typeof e.word !== "string") return false;
    if (typeof e.meaning !== "string") return false;
    if (!Array.isArray(e.rootHighlight) || e.rootHighlight.length !== 2)
      return false;
    if (
      typeof e.rootHighlight[0] !== "number" ||
      typeof e.rootHighlight[1] !== "number"
    )
      return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { root, word } = body;

    if (!root || typeof root !== "string" || root.trim().length === 0) {
      return NextResponse.json({ error: "Root is required" }, { status: 400 });
    }
    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Root morpheme: "${root.trim()}" (from the word "${word.trim()}"). Generate the word derivation tree.`,
            },
          ],
        },
      ],
      systemInstruction: {
        role: "model",
        parts: [{ text: WORD_TREE_PROMPT }],
      },
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (!validateWordTreeResult(parsed)) {
      throw new Error("Invalid word tree response");
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Word tree generation failed. Please try again." },
      { status: 500 },
    );
  }
}
