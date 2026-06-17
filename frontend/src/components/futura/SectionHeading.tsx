/** Centered heading framed with the thin corner-bracket motif. */
export function SectionHeading({
  script,
  bold,
}: {
  script: string;
  bold: string;
}) {
  return (
    <div className="relative mx-auto w-fit px-12 py-6">
      {/* corner brackets */}
      <span className="absolute left-0 top-0 h-10 w-10 border-l border-t border-black/25" />
      <span className="absolute right-0 top-0 h-10 w-10 border-r border-t border-black/25" />
      <span className="absolute bottom-0 left-0 h-10 w-10 border-b border-l border-black/25" />
      <span className="absolute bottom-0 right-0 h-10 w-10 border-b border-r border-black/25" />

      <h2 className="text-center leading-none">
        <span className="font-display block text-5xl font-medium italic text-[var(--teal)] md:text-6xl">
          {script}
        </span>
        <span className="mt-1 block text-5xl font-extrabold tracking-tight text-[var(--ink)] md:text-7xl">
          {bold}
        </span>
      </h2>
    </div>
  );
}
