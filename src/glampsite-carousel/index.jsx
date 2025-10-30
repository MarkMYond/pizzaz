import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useWidgetProps } from "../use-widget-props";
import GlampsiteCard from "./GlampsiteCard";
import { GlampsiteCardSkeleton } from "./GlampsiteCardSkeleton";

function App() {
  const { data, isLoading } = useWidgetProps({ places: [], _loading: true });
  const [places, setPlaces] = React.useState([]);
  const [isFetching, setIsFetching] = React.useState(false);
  
  // ASYNC PATH (default): If data has _loading flag, call the data-fetching tool
  React.useEffect(() => {
    if (data?._loading && data?.region && !isFetching) {
      console.log('🔄 [ASYNC] Widget detected _loading flag, calling tool for region:', data.region);
      setIsFetching(true);
      
      // Call the MCP tool to fetch data - MCP will update window.openai automatically
      if (window.openai?.callTool) {
        window.openai.callTool("fetch-glampsite-data", { region: data.region })
          .then(result => {
            console.log('✅ [ASYNC] Widget callTool result:', result);
            setIsFetching(false);
          })
          .catch(error => {
            console.error('❌ [ASYNC] Widget callTool error:', error);
            setIsFetching(false);
          });
      } else {
        console.warn('⚠️ [ASYNC] window.openai.callTool not available');
        setIsFetching(false);
      }
    }
  }, [data?._loading, data?.region, isFetching]);
  
  // Update places when data arrives from async MCP call
  React.useEffect(() => {
    // Only render when MCP completes async fetch (_loading becomes false)
    if (data?.places && data.places.length > 0 && data._loading === false) {
      console.log('📦 Widget received places from async MCP fetch:', data.places);
      setPlaces(data.places);
    }
  }, [data?.places, data?._loading]);
  
  // Show skeletons while loading or fetching
  const showSkeletons = (places.length === 0 && isLoading) || isFetching || data?._loading;
  
  console.log('🏕️ Glampsite carousel - isLoading:', isLoading);
  console.log('🏕️ Glampsite carousel - isFetching:', isFetching);
  console.log('🏕️ Glampsite carousel - data._loading:', data?._loading);
  console.log('🏕️ Glampsite carousel - showSkeletons:', showSkeletons);
  console.log('🏕️ Glampsite carousel - data:', data);
  console.log('🏕️ Glampsite carousel - places:', places);
  console.log('🏕️ Glampsite carousel - places.length:', places.length);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) return;
    const updateButtons = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className="antialiased relative w-full text-black py-5 bg-white">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 max-sm:mx-5 items-stretch">
          {showSkeletons ? (
            // Show 7 skeleton cards while loading
            Array.from({ length: 7 }, (_, i) => (
              <GlampsiteCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : (
            places.map((place) => (
              <GlampsiteCard key={place.id} place={place} />
            ))
          )}
        </div>
      </div>
      {/* Edge gradients */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 left-0 w-3 z-[5] transition-opacity duration-200 " +
          (canPrev ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="h-full w-full border-l border-black/15 bg-gradient-to-r from-black/10 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          }}
        />
      </div>
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 right-0 w-3 z-[5] transition-opacity duration-200 " +
          (canNext ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="h-full w-full border-r border-black/15 bg-gradient-to-l from-black/10 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          }}
        />
      </div>
      {canPrev && (
        <button
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-black shadow-lg ring ring-black/5 hover:bg-white"
          onClick={() => emblaApi && emblaApi.scrollPrev()}
          type="button"
        >
          <ArrowLeft
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>
      )}
      {canNext && (
        <button
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-black shadow-lg ring ring-black/5 hover:bg-white"
          onClick={() => emblaApi && emblaApi.scrollNext()}
          type="button"
        >
          <ArrowRight
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

createRoot(document.getElementById("glampsite-carousel-root")).render(<App />);
