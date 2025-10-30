import { useOpenAiGlobal } from "./use-openai-global";

export function useWidgetProps<T extends Record<string, unknown>>(
  defaultState?: T | (() => T)
): { data: T; isLoading: boolean } {
  // Try to get data from toolResponseMetadata (which contains _meta fields)
  const metadata = useOpenAiGlobal("toolResponseMetadata") as any;
  
  // Check if widgetData exists directly on metadata, or if metadata IS the widgetData
  const metaData = metadata?.widgetData || metadata;
  
  // Fallback to toolOutput (which contains structuredContent)
  const toolOutput = useOpenAiGlobal("toolOutput") as T;
  
  // Use metaData if it has actual data (not just our simple message), otherwise use toolOutput
  const hasRealData = metaData && (metaData.places || metaData.items || metaData.albums);
  const props = hasRealData ? metaData : toolOutput;

  const fallback =
    typeof defaultState === "function"
      ? (defaultState as () => T | null)()
      : defaultState ?? null;

  // Determine loading state: we're loading if toolOutput is null/undefined
  const isLoading = toolOutput === null || toolOutput === undefined;

  return {
    data: props ?? fallback,
    isLoading
  };
}
