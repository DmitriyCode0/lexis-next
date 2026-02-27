import { useAnalyzerStore } from '@/store/analyzer.store';

export function useAnalyzer() {
  const store = useAnalyzerStore();

  const canAnalyze =
    !store.isLoading &&
    store.inputSentence.trim().length > 0 &&
    store.inputSentence.trim() !== store.lastAnalyzedSentence;

  return {
    ...store,
    canAnalyze,
  };
}
