'use client';

import { useState } from 'react';

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? 'text-[var(--ink)]' : 'text-white'}>
      <div className="font-display text-3xl font-semibold italic leading-none">
        Futura
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] opacity-80">
        Corporate Interiors Pvt Ltd.
      </div>
    </div>
  );
}

export function FuturaNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1500px] items-start justify-between px-6 py-6 md:px-10">
        <Logo />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 bg-white/95 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink)] shadow-sm transition-colors hover:bg-white"
          >
            Menu <span className="h-2 w-2 bg-[var(--teal)]" />
          </button>
          <button
            type="button"
            className="hidden items-center gap-3 bg-white/95 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal)] hover:text-white sm:flex"
          >
            Get A Free Consulting <span className="h-2 w-2 bg-[var(--teal)]" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="mx-auto max-w-[1500px] px-6 md:px-10">
          <ul className="ml-auto w-full max-w-xs bg-white/95 p-4 text-sm font-medium uppercase tracking-wide text-[var(--ink)] shadow-lg">
            {['About', 'Services', 'Industries', 'Projects', 'Contact'].map((i) => (
              <li
                key={i}
                className="cursor-pointer border-b border-black/5 px-3 py-2 last:border-0 hover:text-[var(--teal)]"
              >
                {i}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
