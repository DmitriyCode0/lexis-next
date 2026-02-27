"use client";

import { useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";
import { useAnalyzer } from "@/hooks/useAnalyzer";
import { POS_CONFIG } from "@/lib/pos-colors";
import type { PartOfSpeech } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export function POSLegend() {
  const {
    currentResult,
    colorCodingEnabled,
    toggleColorCoding,
    enabledPOS,
    togglePOS,
    allPOSEnabled,
    toggleAllPOS,
  } = useAnalyzer();

  const posCounts = useMemo(() => {
    if (!currentResult) return new Map<PartOfSpeech, number>();
    const counts = new Map<PartOfSpeech, number>();
    for (const word of currentResult.words) {
      if (!word.isPunctuation) {
        counts.set(word.partOfSpeech, (counts.get(word.partOfSpeech) || 0) + 1);
      }
    }
    return counts;
  }, [currentResult]);

  const posEntries = useMemo(() => {
    return ALL_POS.map((pos) => ({
      pos,
      count: posCounts.get(pos) || 0,
      inResult: posCounts.has(pos),
    })).sort((a, b) => {
      if (a.inResult && !b.inResult) return -1;
      if (!a.inResult && b.inResult) return 1;
      if (a.inResult && b.inResult) return b.count - a.count;
      return POS_CONFIG[a.pos].label.localeCompare(POS_CONFIG[b.pos].label);
    });
  }, [posCounts]);

  return (
    <Collapsible defaultOpen className="space-y-3">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=closed]:-rotate-90" />
          Parts of Speech
        </CollapsibleTrigger>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Color coding</span>
          <Switch
            checked={colorCodingEnabled}
            onCheckedChange={toggleColorCoding}
            className="scale-90"
          />
        </div>
      </div>

      <CollapsibleContent className="space-y-2">
        {colorCodingEnabled && (
          <button
            onClick={toggleAllPOS}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            {allPOSEnabled ? "Deselect all" : "Select all"}
          </button>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {posEntries.map(({ pos, count, inResult }) => {
            const config = POS_CONFIG[pos];
            const isEnabled = enabledPOS.has(pos);
            const isInteractive = colorCodingEnabled && inResult;

            return (
              <button
                key={pos}
                onClick={() => isInteractive && togglePOS(pos)}
                disabled={!isInteractive}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-all text-left",
                  isInteractive && isEnabled && "bg-accent/50",
                  isInteractive && !isEnabled && "opacity-40",
                  isInteractive && "hover:bg-accent cursor-pointer",
                  !inResult && "opacity-30 cursor-default",
                  !colorCodingEnabled && inResult && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    !inResult && "bg-muted-foreground/30",
                  )}
                  style={
                    inResult ? { backgroundColor: config.color } : undefined
                  }
                />
                <span
                  className={cn(
                    "truncate",
                    inResult
                      ? "text-foreground/80"
                      : "text-muted-foreground/50",
                  )}
                >
                  {config.label}
                </span>
                <span
                  className={cn(
                    "text-xs ml-auto",
                    inResult
                      ? "text-muted-foreground"
                      : "text-muted-foreground/30",
                  )}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
