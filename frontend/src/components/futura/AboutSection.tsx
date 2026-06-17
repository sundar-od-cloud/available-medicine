'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExploreBadge } from './ExploreBadge';

const CLIENTS = [
  'CooperStandard',
  'airtel',
  'TOSHIBA',
  'SpiceJet',
  'AXIS BANK',
  'HAVELLS',
  'Justdial',
];

/** Section 2 — About Futura, with the client logo marquee. */
export function AboutSection() {
  const [page, setPage] = useState(1);

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-[1500px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Left — headline + supporting images */}
          <div className="relative">
            <h2 className="leading-none">
              <span className="font-display block text-5xl font-medium italic text-[var(--teal)] md:text-6xl">
                About Futura
              </span>
              <span className="mt-2 block text-5xl font-extrabold tracking-tight text-[var(--ink)] md:text-7xl">
                CORPORATE
                <br />
                INTERIORS
              </span>
            </h2>

            <div className="mt-8 max-w-md">
              <div className="fx-photo aspect-[16/10] w-full rounded-sm shadow-md" />
            </div>
          </div>

          {/* Right — hero image, badge + paragraph */}
          <div className="relative">
            <div className="relative">
              <div className="fx-photo aspect-[4/3] w-full rounded-sm shadow-lg" />
              <div className="fx-photo absolute -top-10 right-0 hidden aspect-[16/9] w-2/5 rounded-sm border-4 border-white shadow-xl md:block" />
              <ExploreBadge
                size={150}
                className="absolute -bottom-10 left-1/2 -translate-x-1/3"
              />
            </div>

            <p className="mt-16 max-w-md text-lg leading-relaxed text-gray-700">
              Since its establishment in{' '}
              <span className="font-semibold text-[var(--teal)]">1996</span>,{' '}
              <span className="font-semibold text-[var(--teal)]">Futura Interiors</span>{' '}
              has specialized in transforming workspaces through{' '}
              <span className="font-semibold text-[var(--teal)]">thoughtful design</span>{' '}
              and <span className="font-semibold text-[var(--teal)]">execution</span>,
              building lasting client relationships while delivering future-ready
              commercial environments that position us among leading workspace{' '}
              <span className="font-semibold text-[var(--teal)]">
                transformation experts
              </span>{' '}
              across <span className="font-semibold text-[var(--teal)]">India</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Client logo marquee */}
      <div className="border-y border-black/5 bg-white py-6">
        <div className="fx-marquee-track">
          {[...CLIENTS, ...CLIENTS].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex w-56 shrink-0 items-center justify-center px-8 text-2xl font-extrabold tracking-tight text-gray-400"
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Carousel control */}
      <div className="flex items-center justify-center gap-4 py-6">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="grid h-9 w-9 place-items-center rounded-full border border-black/15 text-gray-600 transition-colors hover:bg-black/5"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-semibold tracking-widest text-white">
          {page} / 2
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(2, p + 1))}
          className="grid h-9 w-9 place-items-center rounded-full border border-black/15 text-gray-600 transition-colors hover:bg-black/5"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
