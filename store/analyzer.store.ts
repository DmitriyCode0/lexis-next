import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AnalysisResult,
  HistoryEntry,
  PartOfSpeech,
  WordTreeResult,
} from "@/lib/types";

const ALL_POS: PartOfSpeech[] = [
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

const MAX_HISTORY = 50;

interface AnalyzerState {
  inputSentence: string;
  setInputSentence: (s: string) => void;

  currentResult: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;

  activeWordId: string | null;
  setActiveWordId: (id: string | null) => void;

  enabledPOS: Set<PartOfSpeech>;
  togglePOS: (pos: PartOfSpeech) => void;
  allPOSEnabled: boolean;
  toggleAllPOS: () => void;

  colorCodingEnabled: boolean;
  toggleColorCoding: () => void;

  history: HistoryEntry[];
  addToHistory: (result: AnalysisResult) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (entry: HistoryEntry) => void;
  loadExample: (result: AnalysisResult) => void;

  analyze: () => Promise<void>;

  lastAnalyzedSentence: string;

  wordTreeData: WordTreeResult | null;
  wordTreeLoading: boolean;
  wordTreeError: string | null;
  wordTreeRoot: string | null;
  wordTreeSourceWord: string | null;
  openWordTree: (root: string, sourceWord: string) => Promise<void>;
  closeWordTree: () => void;
}

export const useAnalyzerStore = create<AnalyzerState>()(
  persist(
    (set, get) => ({
      inputSentence: "",
      setInputSentence: (s: string) => set({ inputSentence: s }),

      currentResult: null,
      isLoading: false,
      error: null,

      activeWordId: null,
      setActiveWordId: (id: string | null) => set({ activeWordId: id }),

      enabledPOS: new Set<PartOfSpeech>(ALL_POS),
      togglePOS: (pos: PartOfSpeech) => {
        const current = new Set(get().enabledPOS);
        if (current.has(pos)) {
          current.delete(pos);
        } else {
          current.add(pos);
        }
        set({
          enabledPOS: current,
          allPOSEnabled: current.size === ALL_POS.length,
        });
      },
      allPOSEnabled: true,
      toggleAllPOS: () => {
        const { allPOSEnabled } = get();
        if (allPOSEnabled) {
          set({ enabledPOS: new Set<PartOfSpeech>(), allPOSEnabled: false });
        } else {
          set({
            enabledPOS: new Set<PartOfSpeech>(ALL_POS),
            allPOSEnabled: true,
          });
        }
      },

      colorCodingEnabled: true,
      toggleColorCoding: () =>
        set((s) => ({ colorCodingEnabled: !s.colorCodingEnabled })),

      history: [],
      addToHistory: (result: AnalysisResult) => {
        const entry: HistoryEntry = {
          id: result.id,
          sentence: result.sentence,
          preview: result.sentence.slice(0, 60),
          analyzedAt: result.analyzedAt,
          result,
        };
        set((s) => {
          const updated = [entry, ...s.history].slice(0, MAX_HISTORY);
          return { history: updated };
        });
      },
      removeFromHistory: (id: string) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      clearHistory: () => set({ history: [] }),
      loadFromHistory: (entry: HistoryEntry) =>
        set({
          currentResult: entry.result,
          inputSentence: entry.sentence,
          lastAnalyzedSentence: entry.sentence,
          error: null,
        }),
      loadExample: (result: AnalysisResult) =>
        set({
          currentResult: result,
          inputSentence: result.sentence,
          lastAnalyzedSentence: result.sentence,
          error: null,
        }),

      lastAnalyzedSentence: "",

      analyze: async () => {
        const { inputSentence } = get();
        const trimmed = inputSentence.trim();
        if (!trimmed) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentence: trimmed }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Analysis failed");
          }

          const result: AnalysisResult = await response.json();
          set({
            currentResult: result,
            isLoading: false,
            lastAnalyzedSentence: trimmed,
          });
          get().addToHistory(result);
        } catch (err) {
          set({
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : "An unexpected error occurred",
          });
        }
      },

      wordTreeData: null,
      wordTreeLoading: false,
      wordTreeError: null,
      wordTreeRoot: null,
      wordTreeSourceWord: null,

      openWordTree: async (root: string, sourceWord: string) => {
        set({
          wordTreeLoading: true,
          wordTreeError: null,
          wordTreeRoot: root,
          wordTreeSourceWord: sourceWord,
          wordTreeData: null,
        });
        try {
          const response = await fetch("/api/word-tree", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ root, word: sourceWord }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Word tree generation failed");
          }
          const data: WordTreeResult = await response.json();
          set({ wordTreeData: data, wordTreeLoading: false });
        } catch (err) {
          set({
            wordTreeLoading: false,
            wordTreeError:
              err instanceof Error
                ? err.message
                : "Failed to generate word tree",
          });
        }
      },

      closeWordTree: () =>
        set({
          wordTreeData: null,
          wordTreeLoading: false,
          wordTreeError: null,
          wordTreeRoot: null,
          wordTreeSourceWord: null,
        }),
    }),
    {
      name: "lexis-analyzer-storage",
      partialize: (state) => ({
        history: state.history,
      }),
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
