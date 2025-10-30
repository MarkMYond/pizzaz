import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useWidgetProps } from "../use-widget-props";
import PlaceCard from "./PlaceCard";
import PlaceCardSkeleton from "./PlaceCardSkeleton";

function App() {
  const [directData, setDirectData] = React.useState(null);
  
  // Poll for data on mount (like pizza-carousel)
  React.useEffect(() => {
    // Check immediately
    if (window.openai?.toolOutput) {
      setDirectData(window.openai.toolOutput);
    }
    
    // Poll for data if not immediately available
    let checks = 0;
    const interval = setInterval(() => {
      checks++;
      
      if (window.openai?.toolOutput) {
        setDirectData(window.openai.toolOutput);
        clearInterval(interval);
      }
      
      if (checks > 50) { // Stop after 5 seconds
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get props with fallback
  const { data: hookData } = useWidgetProps({ places: [] });
  const data = directData || hookData;
  const places = data?.places || [];
  
  // Show skeletons if no data yet
  const hasData = places.length > 0;
  const showSkeletons = !hasData;
  
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
            // Show 5 skeleton cards while loading
            Array.from({ length: 5 }, (_, i) => (
              <PlaceCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : (
            places.map((place) => (
              <PlaceCard key={place.id} place={place} />
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
      {/* Navigation buttons */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        aria-label="Previous slide"
        className={
          "absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 shadow-md transition-opacity disabled:opacity-0"
        }
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        aria-label="Next slide"
        className={
          "absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 shadow-md transition-opacity disabled:opacity-0"
        }
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
