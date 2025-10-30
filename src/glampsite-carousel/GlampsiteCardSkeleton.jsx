export function GlampsiteCardSkeleton() {
  return (
    <div className="min-w-[220px] select-none max-w-[220px] w-[65vw] sm:w-[220px] self-stretch flex flex-col">
      <div className="w-full">
        <div className="w-full aspect-square rounded-2xl skeleton-shimmer ring ring-black/5 shadow-[0px_2px_6px_rgba(0,0,0,0.06)]"></div>
      </div>
      <div className="mt-3 flex flex-col flex-1 flex-auto">
        <div className="skeleton-line skeleton-shimmer" style={{ width: '80%', height: '16px', marginBottom: '8px' }}></div>
        <div className="skeleton-line skeleton-shimmer" style={{ width: '60%', height: '12px', marginBottom: '12px' }}></div>
        <div className="flex-auto">
          <div className="skeleton-line skeleton-shimmer" style={{ width: '100%', height: '14px', marginBottom: '6px' }}></div>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '90%', height: '14px', marginBottom: '6px' }}></div>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '70%', height: '14px' }}></div>
        </div>
        <div className="mt-5">
          <div className="skeleton-line skeleton-shimmer rounded-full" style={{ width: '90px', height: '30px' }}></div>
        </div>
      </div>
    </div>
  );
}
