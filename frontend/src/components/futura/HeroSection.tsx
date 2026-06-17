import { FuturaNav } from './FuturaNav';

/** Section 1 — full-bleed hero. */
export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#1a1f24]">
      {/* Background — stands in for the office-hallway hero video */}
      <div className="absolute inset-0">
        <div className="fx-photo h-full w-full" />
        {/* Large translucent "X" branding lines, like the frosted-glass wall */}
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <defs>
            <linearGradient id="fx-x" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#cdd6db" />
              <stop offset="1" stopColor="#1c9aad" />
            </linearGradient>
          </defs>
          <polygon points="40,0 60,0 30,100 10,100" fill="url(#fx-x)" />
          <polygon points="60,0 80,0 50,100 30,100" fill="url(#fx-x)" opacity="0.7" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      </div>

      <FuturaNav />

      {/* Bottom content */}
      <div className="relative z-10 flex min-h-screen flex-col justify-end">
        <div className="mx-auto flex w-full max-w-[1500px] items-end justify-between px-6 pb-16 md:px-10 md:pb-24">
          <div className="text-white">
            <p className="text-2xl font-light tracking-wide md:text-4xl">
              Bringing Excellence To Every
            </p>
            <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-tight md:text-8xl lg:text-9xl">
              WORKSPACE
            </h1>
          </div>

          <div className="hidden shrink-0 text-right text-white md:block">
            <div className="font-display text-7xl font-semibold leading-none lg:text-8xl">
              500
              <span className="align-super text-3xl">+</span>
            </div>
            <div className="mt-1 text-sm font-medium uppercase leading-tight tracking-[0.2em]">
              Businesses
              <br />
              Served
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
