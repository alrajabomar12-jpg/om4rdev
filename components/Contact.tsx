import { CopyUsername } from "./CopyUsername";
import { DiscordIcon } from "./icons";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";

export function Contact({ discordUsername }: { discordUsername: string }) {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="py-24 md:py-32">
      <Reveal className="container-site">
        <div className="relative isolate overflow-hidden rounded-[28px] border border-border bg-surface px-5 py-14 text-center sm:px-10 md:py-20">
          {/* Soft blue bottom glow (DuoCore 18) */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgb(30_140_255/0.22),transparent_70%)]"
          />
          <Eyebrow label="Contact" className="justify-center" />
          <h2 id="contact-heading" className="font-display text-h2 mx-auto mt-4 max-w-[16ch] text-balance">
            Let&apos;s build something.
          </h2>
          <p className="mt-4 text-muted">The fastest way to reach me is Discord.</p>

          <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-border bg-[rgb(5_7_13/0.6)] px-5 py-8 sm:px-8">
            <span className="icon-tile mb-5 size-14">
              <DiscordIcon size={28} />
            </span>
            <p className="eyebrow mb-2 text-muted">Discord</p>
            <CopyUsername username={discordUsername} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
