"use client";

import { motion } from "framer-motion";
import type { AnalyzedWord, PartOfSpeech } from "@/lib/types";
import { POS_CONFIG } from "@/lib/pos-colors";
import { cn } from "@/lib/utils";

interface WordTokenProps {
  word: AnalyzedWord;
  index: number;
  colorCodingEnabled: boolean;
  enabledPOS: Set<PartOfSpeech>;
  onClick: (id: string) => void;
  isGrouped?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export function WordToken({
  word,
  index,
  colorCodingEnabled,
  enabledPOS,
  onClick,
  isGrouped,
  isFirstInGroup,
  isLastInGroup,
}: WordTokenProps) {
  const config = POS_CONFIG[word.partOfSpeech];
  const isHighlighted = colorCodingEnabled && enabledPOS.has(word.partOfSpeech);
  const isDimmed = colorCodingEnabled && !enabledPOS.has(word.partOfSpeech);

  if (word.isPunctuation) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="text-foreground/70 text-lg self-end pb-1"
      >
        {word.original}
      </motion.span>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      onClick={() => onClick(word.id)}
      className={cn(
        "group relative flex flex-col items-center gap-0.5 px-3 py-2 border transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isGrouped
          ? cn(
              "border-y border-transparent",
              isFirstInGroup && "rounded-l-lg border-l",
              isLastInGroup && "rounded-r-lg border-r",
              !isFirstInGroup && "border-l-0",
              !isLastInGroup && "border-r-0",
            )
          : "rounded-lg",
        isHighlighted && !isGrouped && "border-current/20 shadow-sm",
        isDimmed && "opacity-40",
        !colorCodingEnabled && !isGrouped && "border-border/60 bg-card hover:bg-accent/50",
        !colorCodingEnabled && isGrouped && "border-transparent hover:bg-accent/30",
      )}
      style={
        isHighlighted && !isGrouped
          ? {
              color: config.color,
              backgroundColor: config.bg,
              borderColor: `${config.color}30`,
            }
          : isHighlighted && isGrouped
            ? { color: config.color }
            : undefined
      }
    >
      <span className="text-[10px] uppercase tracking-wider font-medium opacity-60 italic">
        {config.label}
      </span>
      <span
        className={cn(
          "text-base font-medium",
          !isHighlighted && !isDimmed && "text-foreground",
        )}
      >
        {word.original}
      </span>
      {word.translation && !isGrouped && (
        <span className="text-[10px] text-muted-foreground/70 font-normal truncate max-w-[100px]">
          {word.translation}
        </span>
      )}
    </motion.button>
  );
}
