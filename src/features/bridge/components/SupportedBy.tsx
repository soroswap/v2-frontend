export function SupportedBy() {
  return (
    <div className="mt-4 flex flex-col items-center">
      <span className="text-muted-foreground mb-3 text-sm">Supported by</span>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="flex">
          <a
            href="https://x.com/i/broadcasts/1djGXWBqdVdKZ"
            target="_blank"
            rel="noopener noreferrer"
            title="Stellar Community Fund"
            className="group relative"
          >
            <img
              src="/bridge/scf.svg"
              alt="Stellar"
              className="h-6 w-auto transition-opacity group-hover:opacity-80"
            />
            <div className="bg-brand pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Stellar Community Fund
            </div>
          </a>
        </div>
        <div className="flex">
          <a
            href="https://www.coinbase.com/developer-platform/discover/launches/summer-builder-grants"
            target="_blank"
            rel="noopener noreferrer"
            title="Base - Coinbase's L2 Network"
            className="group relative"
          >
            <img
              src="/bridge/base.svg"
              alt="Base"
              className="h-6 w-auto transition-opacity group-hover:opacity-80"
            />
            <div className="bg-brand pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Base - Coinbase&apos;s L2 Network
            </div>
          </a>
        </div>
        <div className="flex">
          <a
            href="https://x.com/draper_u/status/1940908242412183926"
            target="_blank"
            rel="noopener noreferrer"
            title="Draper University - Entrepreneurship Program"
            className="group relative"
          >
            <img
              src="/bridge/draper.webp"
              alt="Draper University"
              className="h-6 w-auto transition-opacity group-hover:opacity-80"
            />
            <div className="bg-brand pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Draper University - Entrepreneurship Program
            </div>
          </a>
        </div>
        <div className="flex">
          <a
            href="https://partners.circle.com/partner/rozo"
            target="_blank"
            rel="noopener noreferrer"
            title="Circle - USDC Issuer & Partner"
            className="group relative"
          >
            <img
              src="/bridge/circle.svg"
              alt="Circle"
              className="h-6 w-auto transition-opacity group-hover:opacity-80"
            />
            <div className="bg-brand pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Circle - USDC Issuer & Partner
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
