'use client';

import { useState } from 'react';
import { SectionHeading } from './SectionHeading';

const SERVICES = [
  'Design & Space Planning',
  'Turnkey Interior Contracting',
  'Modular Furniture Solutions',
  'Electrical & Networking Systems',
  'HVAC, Fire, and Safety Systems',
  'Acoustic & Soundproofing Solutions',
  'Branding & Environmental Graphics',
  'Renovation & Refurbishment',
];

/** Section 5 — Our Core Services. */
export function ServicesSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-[1500px] px-6 py-20 md:px-10 md:py-28">
        <div className="flex justify-center">
          <SectionHeading script="Our Core" bold="SERVICES" />
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-gray-600">
          Delivering end-to-end workspace transformation through strategic design,
          turnkey execution, technology integration, and customised corporate interior
          solutions tailored for evolving businesses.
        </p>

        <div className="relative mt-12">
          <ul className="space-y-1 text-center">
            {SERVICES.map((service, i) => {
              const isActive = i === active;
              return (
                <li key={service}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="w-full"
                  >
                    {isActive ? (
                      <span className="mx-auto block w-full max-w-4xl bg-gradient-to-r from-[var(--teal-deep)] to-[var(--teal)] py-3 text-2xl font-extrabold uppercase tracking-tight text-white shadow-md md:text-4xl">
                        {service}
                      </span>
                    ) : (
                      <span className="fx-outline-text block py-1 text-2xl font-extrabold uppercase tracking-tight transition-colors hover:text-[var(--teal)] md:text-4xl">
                        {service}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* floating image, like the consultation photo in the mock */}
          <div className="fx-photo absolute right-0 top-6 hidden aspect-[4/3] w-64 rounded-sm border-4 border-white shadow-xl lg:block" />
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            className="flex items-center gap-3 border border-black/15 px-7 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--ink)] transition-colors hover:bg-[var(--teal)] hover:text-white"
          >
            Explore More <span className="h-2 w-2 bg-[var(--teal)]" />
          </button>
        </div>
      </div>
    </section>
  );
}
