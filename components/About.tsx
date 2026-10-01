import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";

/** Plain text only: split on blank lines into paragraphs, rendered as text (never HTML/markdown). */
export function About({ text, index }: { text: string; index: string }) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="about" aria-labelledby="about-heading" className="py-24 md:py-32">
      <Reveal className="container-site grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <Eyebrow index={index} label="About" />
          <h2 id="about-heading" className="font-display text-h2 mt-4">
            About me
          </h2>
        </div>
        <div className="max-w-[65ch] space-y-5 text-muted lg:pt-10">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
