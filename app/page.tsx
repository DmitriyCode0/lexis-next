"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Info, Languages } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SentenceInput } from "@/components/analyzer/SentenceInput";
import { WordToken } from "@/components/analyzer/WordToken";
import { WordDetailModal } from "@/components/analyzer/WordDetailModal";
import { WordTreeModal } from "@/components/analyzer/WordTreeModal";
import { POSLegend } from "@/components/analyzer/POSLegend";
import { HistoryPanel } from "@/components/analyzer/HistoryPanel";
import { useAnalyzer } from "@/hooks/useAnalyzer";
import { POS_CONFIG } from "@/lib/pos-colors";
import { EXAMPLE_RESULTS } from "@/lib/examples";
import type { AnalyzedWord } from "@/lib/types";

type Segment =
  | { type: "single"; word: AnalyzedWord; index: number }
  | {
      type: "group";
      groupId: string;
      words: { word: AnalyzedWord; index: number }[];
      groupMeaning?: string;
      groupTranslation?: string;
    };

function buildSegments(words: AnalyzedWord[]): Segment[] {
  const segments: Segment[] = [];
  let i = 0;

  while (i < words.length) {
    const word = words[i];
    if (word.groupId) {
      const groupId = word.groupId;
      const groupWords: { word: AnalyzedWord; index: number }[] = [];

      while (i < words.length && words[i].groupId === groupId) {
        groupWords.push({ word: words[i], index: i });
        i++;
      }

      segments.push({
        type: "group",
        groupId,
        words: groupWords,
        groupMeaning: groupWords[0].word.groupMeaning,
        groupTranslation: groupWords[0].word.groupTranslation,
      });
    } else {
      segments.push({ type: "single", word, index: i });
      i++;
    }
  }

  return segments;
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("lexis-theme", next ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-3 py-6">
      <div className="flex flex-wrap gap-2">
        {[120, 80, 60, 100, 70, 90, 110, 50].map((w, i) => (
          <Skeleton
            key={i}
            className="h-14 rounded-lg"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[90, 70, 130, 80, 100].map((w, i) => (
          <Skeleton
            key={i}
            className="h-14 rounded-lg"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[60, 110, 80].map((w, i) => (
          <Skeleton
            key={i}
            className="h-14 rounded-lg"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const {
    currentResult,
    isLoading,
    setActiveWordId,
    colorCodingEnabled,
    enabledPOS,
    loadExample,
  } = useAnalyzer();

  useEffect(() => {
    const saved = localStorage.getItem("lexis-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => toast.error("You appear to be offline");
    const handleOnline = () => toast.success("Back online");

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const segments = useMemo(() => {
    if (!currentResult) return [];
    return buildSegments(currentResult.words);
  }, [currentResult]);

  const hasWords = currentResult && currentResult.words.length > 0;
  const noWords = currentResult && currentResult.words.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Paper texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Header */}
      <header className="relative border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display tracking-tight text-foreground">
              Lexis
            </h1>
            <p className="text-xs text-muted-foreground tracking-wide">
              See language, structurally.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <HistoryPanel />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <SentenceInput />

        {/* Loading state */}
        {isLoading && <SkeletonLoader />}

        {/* No words state */}
        {noWords && !isLoading && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No words could be analyzed. Try a different sentence.
            </AlertDescription>
          </Alert>
        )}

        {/* Analyzed words display */}
        <AnimatePresence mode="wait">
          {hasWords && !isLoading && (
            <motion.div
              key={currentResult.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Word tokens with group segments */}
              <div className="flex flex-wrap items-end gap-2">
                {segments.map((seg) => {
                  if (seg.type === "single") {
                    return (
                      <WordToken
                        key={seg.word.id}
                        word={seg.word}
                        index={seg.index}
                        colorCodingEnabled={colorCodingEnabled}
                        enabledPOS={enabledPOS}
                        onClick={setActiveWordId}
                      />
                    );
                  }

                  const posConfig = POS_CONFIG[seg.words[0].word.partOfSpeech];
                  const isHighlighted =
                    colorCodingEnabled &&
                    enabledPOS.has(seg.words[0].word.partOfSpeech);

                  return (
                    <div key={seg.groupId} className="flex flex-col items-center">
                      <div
                        className="flex items-end rounded-lg border-2 border-dashed px-0.5 py-0.5"
                        style={{
                          borderColor: isHighlighted
                            ? `${posConfig.color}50`
                            : undefined,
                          backgroundColor: isHighlighted
                            ? `${posConfig.bg}`
                            : undefined,
                        }}
                      >
                        {seg.words.map(({ word, index }, wi) => (
                          <WordToken
                            key={word.id}
                            word={word}
                            index={index}
                            colorCodingEnabled={colorCodingEnabled}
                            enabledPOS={enabledPOS}
                            onClick={setActiveWordId}
                            isGrouped
                            isFirstInGroup={wi === 0}
                            isLastInGroup={wi === seg.words.length - 1}
                          />
                        ))}
                      </div>
                      {(seg.groupTranslation || seg.groupMeaning) && (
                        <span className="text-[10px] text-muted-foreground mt-1 italic text-center max-w-[200px] truncate">
                          {seg.groupTranslation || seg.groupMeaning}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sentence translation */}
              {currentResult.sentenceTranslation && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <Languages className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ukrainian Translation
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {currentResult.sentenceTranslation}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* POS Legend — always visible */}
        {!isLoading && (
          <div className="pt-4 border-t border-border/40">
            <POSLegend />
          </div>
        )}

        {/* Empty state — before first analysis */}
        {!currentResult && !isLoading && (
          <div className="text-center py-12 space-y-6">
            <div className="space-y-2">
              <p className="text-lg font-display text-muted-foreground/60">
                Enter a sentence above to begin
              </p>
              <p className="text-sm text-muted-foreground/40">
                Each word will be broken down into its morphological components
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Or try an example
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                {EXAMPLE_RESULTS.map((ex) => (
                  <button
                    key={ex.result.id}
                    onClick={() => loadExample(ex.result)}
                    className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-all max-w-[280px] truncate"
                  >
                    &ldquo;{ex.label}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Word detail modal */}
      <WordDetailModal />
      <WordTreeModal />
    </div>
  );
}
