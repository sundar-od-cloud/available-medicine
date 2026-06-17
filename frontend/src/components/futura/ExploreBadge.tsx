import { ArrowUpRight } from 'lucide-react';

/** Rotating circular "EXPLORE MORE" stamp used in several sections. */
export function ExploreBadge({
  size = 150,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative grid place-items-center rounded-full bg-[var(--teal)] text-white shadow-xl ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="fx-spin absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <path
            id="fx-badge-circle"
            d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
          />
        </defs>
        <text
          fill="rgba(255,255,255,0.85)"
          fontSize="9"
          letterSpacing="2"
          fontWeight="600"
        >
          <textPath href="#fx-badge-circle" startOffset="0">
            EXPLORE MORE • EXPLORE MORE •
          </textPath>
        </text>
      </svg>
      <span className="grid h-[44%] w-[44%] place-items-center rounded-full border border-dashed border-white/60">
        <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
      </span>
    </div>
  );
}
