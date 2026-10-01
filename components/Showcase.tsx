"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ShowcaseItem } from "@/lib/home";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";

export function Showcase({ items }: { items: ShowcaseItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);
  const opener = useRef(0);
  const [index, setIndex] = useState(0);
  const total = items.length;

  const open = (i: number) => {
    opener.current = i;
    setIndex(i);
    dialog.current?.showModal();
  };
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + total) % total), [total]);

  if (total === 0) return null;
  const current = items[index];

  return (
    <section id="showcase" aria-labelledby="showcase-heading" className="py-24 md:py-32">
      <Reveal className="container-site">
        <Eyebrow index="02" label="Showcase" />
        <h2 id="showcase-heading" className="font-display text-h2 mt-4">
          Models &amp; builds.
        </h2>

        <ul className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <li key={item.id} className="mb-6 break-inside-avoid">
              <figure>
                <button
                  ref={(el) => {
                    triggers.current[i] = el;
                  }}
                  type="button"
                  onClick={() => open(i)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface-2 text-left transition duration-200 hover:border-border-strong focus-visible:border-border-strong"
                  aria-label={`View larger: ${item.alt}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full transition-transform duration-200 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                  />
                  {item.caption && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-[rgb(5_7_13/0.92)] to-transparent px-4 pb-3 pt-10 text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
                    >
                      {item.caption}
                    </span>
                  )}
                </button>
                {item.caption && (
                  // Under the image on mobile; visually hidden (but still read) on desktop, where the overlay shows it.
                  <figcaption className="mt-2 px-1 text-sm text-muted md:sr-only">{item.caption}</figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </Reveal>

      <dialog
        ref={dialog}
        aria-label="Image viewer"
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-text"
        onClose={() => triggers.current[opener.current]?.focus()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div
          className="flex h-full flex-col items-center justify-center gap-4 p-4 sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) dialog.current?.close();
          }}
        >
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-2"
            aria-label="Close"
            autoFocus
          >
            <X size={22} aria-hidden="true" />
          </button>

          <figure className="flex max-h-full min-h-0 w-fit max-w-5xl flex-col items-stretch gap-3">
            <Image
              key={current.id}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="mx-auto max-h-[calc(100dvh-10rem)] w-auto rounded-xl object-contain"
            />
            <figcaption className="flex w-full items-center justify-between gap-4 text-sm">
              <span className="text-text/90">{current.caption}</span>
              <span className="tabular shrink-0 text-muted" aria-live="polite">
                {index + 1} / {total}
              </span>
            </figcaption>
          </figure>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 hover:bg-surface-2 sm:left-6"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 hover:bg-surface-2 sm:right-6"
                aria-label="Next image"
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}
