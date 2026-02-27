"use client";

import { useAnalyzer } from "@/hooks/useAnalyzer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, AlertCircle } from "lucide-react";

export function SentenceInput() {
  const {
    inputSentence,
    setInputSentence,
    isLoading,
    error,
    analyze,
    canAnalyze,
  } = useAnalyzer();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canAnalyze) {
      e.preventDefault();
      analyze();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder="Type or paste a sentence to analyze its linguistic structure\u2026"
          value={inputSentence}
          onChange={(e) => setInputSentence(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          rows={3}
          className="resize-none pr-4 text-base font-sans bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-foreground/20"
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground tabular-nums">
          {inputSentence.length} / 200
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => analyze()}
          disabled={!canAnalyze}
          className="gap-2"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.span>
            ) : (
              <motion.span
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Search className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
          {isLoading ? "Analyzing\u2026" : "Analyze"}
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => analyze()}
                  className="ml-3 shrink-0"
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
