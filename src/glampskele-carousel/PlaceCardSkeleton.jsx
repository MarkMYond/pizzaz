import React from "react";

export default function PlaceCardSkeleton() {
  return (
    <div className="min-w-[220px] select-none max-w-[220px] w-[65vw] sm:w-[220px] self-stretch flex flex-col">
      <div className="w-full">
        <div className="w-full aspect-square rounded-2xl bg-gray-200 ring ring-black/5 shadow-[0px_2px_6px_rgba(0,0,0,0.06)]"></div>
      </div>
      <div className="mt-3 flex flex-col flex-1 flex-auto">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="flex-auto space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="mt-5">
          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
        </div>
      </div>
    </div>
  );
}
