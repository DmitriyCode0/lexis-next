"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TreePine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalyzer } from "@/hooks/useAnalyzer";

export function WordTreeModal() {
  const {
    wordTreeData,
    wordTreeLoading,
    wordTreeError,
    wordTreeRoot,
    wordTreeSourceWord,
    closeWordTree,
    openWordTree,
  } = useAnalyzer();

  const isOpen = wordTreeRoot !== null;

  const handleClose = useCallback(() => {
    closeWordTree();
  }, [closeWordTree]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            key="wt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="wt-modal"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden max-h-[80vh] flex flex-col"
          >
            <div className="p-6 pb-4 space-y-1 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Word Tree
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Words derived from the root{" "}
                <span className="font-semibold text-foreground">
                  {wordTreeRoot}
                </span>
                {wordTreeSourceWord && (
                  <span>
                    {" "}
                    (found in <em>{wordTreeSourceWord}</em>)
                  </span>
                )}
              </p>
            </div>

            <div className="flex-1 overflow-hidden">
              {wordTreeLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Generating word tree...
                  </p>
                </div>
              )}

              {wordTreeError && !wordTreeLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
                  <p className="text-sm text-destructive text-center">
                    {wordTreeError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openWordTree(wordTreeRoot!, wordTreeSourceWord!)
                    }
                    className="gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try again
                  </Button>
                </div>
              )}

              {wordTreeData && !wordTreeLoading && (
                <ScrollArea className="h-full max-h-[60vh]">
                  <div className="p-6 space-y-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        Root meaning
                      </p>
                      <p className="text-sm text-foreground">
                        {wordTreeData.rootMeaning}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {wordTreeData.derivatives.map((entry, i) => {
                        const [start, length] = entry.rootHighlight;
                        const safeEnd = Math.min(
                          start + length,
                          entry.word.length,
                        );
                        const before =
                          start > 0 ? entry.word.slice(0, start) : "";
                        const root = entry.word.slice(start, safeEnd);
                        const after = entry.word.slice(safeEnd);

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="flex items-baseline gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <span className="text-base font-medium text-foreground shrink-0">
                              {before}
                              <span className="bg-amber-200/60 dark:bg-amber-500/30 px-0.5 rounded font-bold">
                                {root}
                              </span>
                              {after}
                            </span>
                            <span className="text-sm text-muted-foreground leading-snug">
                              {entry.meaning}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] italic text-muted-foreground/60 pt-2 border-t border-border/50">
                      Source: AI analysis &mdash; derivations may vary by
                      linguistic tradition
                    </p>
                  </div>
                </ScrollArea>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
