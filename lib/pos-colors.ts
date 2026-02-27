import { PartOfSpeech } from "./types";

export interface POSStyle {
  color: string;
  bg: string;
  label: string;
  tailwind: string;
}

export const POS_CONFIG: Record<PartOfSpeech, POSStyle> = {
  noun: {
    color: "#3B82F6",
    bg: "#EFF6FF",
    label: "Noun",
    tailwind: "text-blue-500 bg-blue-50 border-blue-200",
  },
  verb: {
    color: "#EF4444",
    bg: "#FEF2F2",
    label: "Verb",
    tailwind: "text-red-500 bg-red-50 border-red-200",
  },
  auxiliary_verb: {
    color: "#10B981",
    bg: "#ECFDF5",
    label: "Aux. Verb",
    tailwind: "text-emerald-500 bg-emerald-50 border-emerald-200",
  },
  adjective: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    label: "Adjective",
    tailwind: "text-amber-500 bg-amber-50 border-amber-200",
  },
  adverb: {
    color: "#EC4899",
    bg: "#FDF2F8",
    label: "Adverb",
    tailwind: "text-pink-500 bg-pink-50 border-pink-200",
  },
  pronoun: {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    label: "Pronoun",
    tailwind: "text-violet-500 bg-violet-50 border-violet-200",
  },
  preposition: {
    color: "#F97316",
    bg: "#FFF7ED",
    label: "Preposition",
    tailwind: "text-orange-500 bg-orange-50 border-orange-200",
  },
  conjunction: {
    color: "#06B6D4",
    bg: "#ECFEFF",
    label: "Conjunction",
    tailwind: "text-cyan-500 bg-cyan-50 border-cyan-200",
  },
  interjection: {
    color: "#EF4444",
    bg: "#FFF1F2",
    label: "Interjection",
    tailwind: "text-rose-500 bg-rose-50 border-rose-200",
  },
  determiner: {
    color: "#64748B",
    bg: "#F8FAFC",
    label: "Determiner",
    tailwind: "text-slate-500 bg-slate-50 border-slate-200",
  },
  particle: {
    color: "#0EA5E9",
    bg: "#F0F9FF",
    label: "Particle",
    tailwind: "text-sky-500 bg-sky-50 border-sky-200",
  },
  numeral: {
    color: "#84CC16",
    bg: "#F7FEE7",
    label: "Numeral",
    tailwind: "text-lime-500 bg-lime-50 border-lime-200",
  },
  phrasal_verb: {
    color: "#D946EF",
    bg: "#FDF4FF",
    label: "Phrasal Verb",
    tailwind: "text-fuchsia-500 bg-fuchsia-50 border-fuchsia-200",
  },
  idiom: {
    color: "#EAB308",
    bg: "#FEFCE8",
    label: "Idiom",
    tailwind: "text-yellow-500 bg-yellow-50 border-yellow-200",
  },
  modal_structure: {
    color: "#14B8A6",
    bg: "#F0FDFA",
    label: "Modal Struct.",
    tailwind: "text-teal-500 bg-teal-50 border-teal-200",
  },
  unknown: {
    color: "#9CA3AF",
    bg: "#F9FAFB",
    label: "Unknown",
    tailwind: "text-gray-400 bg-gray-50 border-gray-200",
  },
};

export const MORPHEME_COLORS: Record<string, string> = {
  prefix: "border-l-indigo-500",
  root: "border-l-slate-600",
  suffix: "border-l-teal-500",
  ending: "border-l-rose-500",
  infix: "border-l-amber-500",
};

export const MORPHEME_BG: Record<string, string> = {
  prefix: "bg-indigo-50 dark:bg-indigo-950/30",
  root: "bg-slate-50 dark:bg-slate-800/30",
  suffix: "bg-teal-50 dark:bg-teal-950/30",
  ending: "bg-rose-50 dark:bg-rose-950/30",
  infix: "bg-amber-50 dark:bg-amber-950/30",
};

export const MORPHEME_BORDER: Record<string, string> = {
  prefix: "border-indigo-300 dark:border-indigo-600",
  root: "border-slate-400 dark:border-slate-500",
  suffix: "border-teal-300 dark:border-teal-600",
  ending: "border-rose-300 dark:border-rose-600",
  infix: "border-amber-300 dark:border-amber-600",
};

export const MORPHEME_BG_STRONG: Record<string, string> = {
  prefix: "bg-indigo-100 dark:bg-indigo-950/50",
  root: "bg-slate-100 dark:bg-slate-800/50",
  suffix: "bg-teal-100 dark:bg-teal-950/50",
  ending: "bg-rose-100 dark:bg-rose-950/50",
  infix: "bg-amber-100 dark:bg-amber-950/50",
};

export const MORPHEME_TEXT: Record<string, string> = {
  prefix: "text-indigo-600 dark:text-indigo-400",
  root: "text-slate-700 dark:text-slate-300",
  suffix: "text-teal-600 dark:text-teal-400",
  ending: "text-rose-600 dark:text-rose-400",
  infix: "text-amber-600 dark:text-amber-400",
};
