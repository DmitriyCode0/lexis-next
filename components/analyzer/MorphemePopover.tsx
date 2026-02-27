"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { Morpheme } from "@/lib/types";
import { MORPHEME_COLORS, MORPHEME_BG } from "@/lib/pos-colors";
import { cn } from "@/lib/utils";

interface MorphemePopoverProps {
  morpheme: Morpheme;
  children: React.ReactNode;
}

export function MorphemePopover({ morpheme, children }: MorphemePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 overflow-hidden"
        align="center"
        sideOffset={8}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-lg font-semibold px-2 py-0.5 rounded border-l-4",
                MORPHEME_COLORS[morpheme.type],
                MORPHEME_BG[morpheme.type],
              )}
            >
              {morpheme.text}
            </span>
            <Badge
              variant="secondary"
              className="text-xs uppercase tracking-wider"
            >
              {morpheme.type}
            </Badge>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            {morpheme.meaning}
          </p>

          {morpheme.translationUk && (
            <p className="text-sm text-muted-foreground italic">
              {morpheme.translationUk}
            </p>
          )}

          <p className="text-[11px] italic text-muted-foreground/60 pt-1 border-t border-border/50">
            Source: AI analysis &mdash; may vary by context
          </p>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
