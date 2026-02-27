export type PartOfSpeech =
  | "noun"
  | "verb"
  | "auxiliary_verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "determiner"
  | "particle"
  | "numeral"
  | "phrasal_verb"
  | "idiom"
  | "modal_structure"
  | "unknown";

export type MorphemeType = "prefix" | "root" | "suffix" | "ending" | "infix";

export interface Morpheme {
  text: string;
  type: MorphemeType;
  meaning: string;
  translationUk?: string;
}

export interface AnalyzedWord {
  id: string;
  original: string;
  lemma: string;
  partOfSpeech: PartOfSpeech;
  morphemes: Morpheme[];
  isPunctuation: boolean;
  translation?: string;
  groupId?: string;
  groupMeaning?: string;
  groupTranslation?: string;
}

export interface WordTreeEntry {
  word: string;
  meaning: string;
  rootHighlight: [number, number];
}

export interface WordTreeResult {
  root: string;
  rootMeaning: string;
  derivatives: WordTreeEntry[];
}

export interface AnalysisResult {
  id: string;
  sentence: string;
  words: AnalyzedWord[];
  analyzedAt: string;
  sentenceTranslation?: string;
}

export interface HistoryEntry {
  id: string;
  sentence: string;
  preview: string;
  analyzedAt: string;
  result: AnalysisResult;
}
