import { ArrowRight } from 'lucide-react';
import { ExploreBadge } from './ExploreBadge';

const TILES = [
  'Corporate Offices',
  'Financial Institutions',
  'Healthcare',
  'Co-working Spaces',
  'Industrial / Factory Offices',
  'Showrooms',
];

function CategoryTile({ label }: { label: string }) {
  return (
    <div className="group relative flex h-full min-h-[220px] flex-col justify-between bg-white p-7 shadow-sm transition-transform hover:-translate-y-1">
      <h3 className="text-2xl font-extrabold uppercase leading-tight text-[var(--ink)]">
        {label}
      </h3>
      <span className="grid h-12 w-12 place-items-center self-end rounded-full border border-dashed border-[var(--teal)] text-[var(--teal)] transition-colors group-hover:bg-[var(--teal)] group-hover:text-white">
        <ArrowRight className="h-5 w-5" />
      </span>
    </div>
  );
}

/** Section 4 — Industries We Serve. */
export function IndustriesSection() {
  return (
    <section className="relative bg-[#1a1f24]">
      {/* photographic backdrop behind the tile mosaic */}
      <div className="absolute inset-0">
        <div className="fx-photo h-full w-full" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
        {/* Title block */}
        <div className="flex min-h-[220px] items-center justify-center bg-[var(--teal)] p-8 text-white">
          <h2 className="leading-none">
            <span className="font-display block text-4xl font-medium italic md:text-5xl">
              Industries
            </span>
            <span className="mt-1 block text-4xl font-bold tracking-tight md:text-5xl">
              WE SERVE
            </span>
          </h2>
        </div>

        <CategoryTile label={TILES[0]} />
        <CategoryTile label={TILES[1]} />

        <CategoryTile label={TILES[2]} />
        <CategoryTile label={TILES[3]} />
        <CategoryTile label={TILES[4]} />

        <CategoryTile label={TILES[5]} />
        {/* spacer photo cell */}
        <div className="relative hidden min-h-[220px] sm:block">
          <div className="absolute inset-0 bg-black/20" />
        </div>
        {/* Explore badge cell */}
        <div className="relative flex min-h-[220px] items-center justify-center bg-[var(--teal)] p-8">
          <ExploreBadge size={140} className="!bg-transparent !shadow-none" />
        </div>
      </div>
    </section>
  );
}
