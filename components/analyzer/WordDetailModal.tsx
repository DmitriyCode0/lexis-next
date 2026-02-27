"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MorphemePopover } from "./MorphemePopover";
import { useAnalyzer } from "@/hooks/useAnalyzer";
import {
  POS_CONFIG,
  MORPHEME_BORDER,
  MORPHEME_BG_STRONG,
  MORPHEME_TEXT,
} from "@/lib/pos-colors";
import { cn } from "@/lib/utils";

export function WordDetailModal() {
  const { currentResult, activeWordId, setActiveWordId, openWordTree } =
    useAnalyzer();

  const activeWord =
    currentResult?.words.find((w) => w.id === activeWordId) ?? null;

  const handleClose = useCallback(() => {
    setActiveWordId(null);
  }, [setActiveWordId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (activeWord) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [activeWord, handleClose]);

  return (
    <AnimatePresence>
      {activeWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-[560px] bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
          >
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    {activeWord.original}
                    {activeWord.lemma !== activeWord.original && (
                      <span className="text-base font-normal text-muted-foreground ml-2">
                        ({activeWord.lemma})
                      </span>
                    )}
                  </h2>
                  <Badge
                    className="text-xs"
                    style={{
                      color: POS_CONFIG[activeWord.partOfSpeech].color,
                      backgroundColor: POS_CONFIG[activeWord.partOfSpeech].bg,
                      borderColor: `${POS_CONFIG[activeWord.partOfSpeech].color}30`,
                    }}
                  >
                    {POS_CONFIG[activeWord.partOfSpeech].label}
                  </Badge>
                  {activeWord.translation && (
                    <p className="text-sm text-muted-foreground italic">
                      {activeWord.translation}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Group context */}
              {activeWord.groupId && (activeWord.groupTranslation || activeWord.groupMeaning) && (
                <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3.5 py-2.5">
                  <Link2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Part of expression
                    </p>
                    <p className="text-sm text-foreground/80">
                      {activeWord.groupTranslation || activeWord.groupMeaning}
                    </p>
                    {activeWord.groupTranslation && activeWord.groupMeaning && (
                      <p className="text-xs text-muted-foreground italic">
                        {activeWord.groupMeaning}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Morpheme breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Morpheme Breakdown
                </h3>

                <div className="flex flex-wrap gap-2">
                  {activeWord.morphemes.map((morpheme, i) => {
                    const isRoot = morpheme.type === "root";

                    const morphemeButton = (
                      <button
                        key={i}
                        className={cn(
                          "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all",
                          "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          MORPHEME_BORDER[morpheme.type],
                          MORPHEME_BG_STRONG[morpheme.type],
                        )}
                        onClick={
                          isRoot
                            ? () =>
                                openWordTree(morpheme.text, activeWord.original)
                            : undefined
                        }
                      >
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-widest font-semibold",
                            MORPHEME_TEXT[morpheme.type],
                          )}
                        >
                          {morpheme.type}
                          {isRoot && " →"}
                        </span>
                        <span className="text-base font-semibold text-foreground">
                          {morpheme.text}
                        </span>
                      </button>
                    );

                    if (isRoot) {
                      return <div key={i}>{morphemeButton}</div>;
                    }

                    return (
                      <MorphemePopover key={i} morpheme={morpheme}>
                        {morphemeButton}
                      </MorphemePopover>
                    );
                  })}
                </div>

                {activeWord.morphemes.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No morphemes identified for this token.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
