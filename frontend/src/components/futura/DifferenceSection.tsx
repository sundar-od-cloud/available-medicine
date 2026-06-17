import { SectionHeading } from './SectionHeading';

const ITEMS = [
  {
    title: 'PREDICTABLE DELIVERY, EVERY TIME',
    body: 'Clear timelines, structured planning, and disciplined execution ensure workspace transformations are completed efficiently, minimising operational disruption.',
    filled: true,
  },
  {
    title: 'DESIGNED AROUND BUSINESS PERFORMANCE',
    body: 'Every workspace is planned to support productivity, collaboration and workflow efficiency, aligning spatial design with real business outcomes.',
    filled: false,
  },
  {
    title: 'SCALABLE WORKPLACE SOLUTIONS',
    body: 'Workspaces are designed to evolve with organisations, supporting growth, changing team structures, and future workplace needs without constant reinvention.',
    filled: true,
  },
  {
    title: 'PRECISION MANUFACTURING ADVANTAGE',
    body: 'With in-house production and advanced machinery, Futura maintains strict quality control, delivering consistent finishes and reliable build standards.',
    filled: false,
  },
];

/** Section 3 — The Futura Difference. */
export function DifferenceSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f6f7] to-[#e8eef0]">
      {/* faint office backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="fx-photo h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-6 py-20 md:px-10 md:py-28">
        <div className="flex justify-center">
          <SectionHeading script="The Futura" bold="DIFFERENCE" />
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <article
              key={item.title}
              className={
                item.filled
                  ? 'bg-gradient-to-b from-[var(--teal-deep)] to-[var(--teal)] p-8 text-white shadow-lg'
                  : 'border border-black/10 bg-white p-8 shadow-sm'
              }
            >
              <h3
                className={`text-lg font-bold uppercase leading-snug ${
                  item.filled ? 'text-white' : 'text-[var(--teal)]'
                }`}
              >
                {item.title}
              </h3>
              <p
                className={`mt-5 text-sm leading-relaxed ${
                  item.filled ? 'text-white/85' : 'text-gray-600'
                }`}
              >
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
