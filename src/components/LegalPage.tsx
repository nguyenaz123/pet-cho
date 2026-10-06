import Link from "next/link";
import type { ReactNode } from "react";

/** Shared frame for the privacy, terms and data deletion pages. Server-rendered, no JS. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[680px] px-4 py-[max(1.5rem,env(safe-area-inset-top))]">
      <Link href="/" className="mb-4 inline-block text-[15px] font-semibold text-accent underline-offset-4 hover:underline">
        ← Pixel Pet
      </Link>
      <div className="bezel">
        <article className="bezel-core space-y-4 px-6 py-7 text-[16px] leading-relaxed [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_h2]:pt-3 [&_h2]:font-display [&_h2]:text-[12px] [&_h2]:leading-relaxed [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
          <header>
            <h1 className="font-display text-[14px] leading-relaxed">{title}</h1>
            <p className="mt-1 text-[14px] text-muted">Last updated {updated}</p>
          </header>
          {children}
        </article>
      </div>
      <nav aria-label="Legal" className="mt-4 flex justify-center gap-4 text-[14px] text-muted">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/data-deletion">Data deletion</Link>
      </nav>
    </main>
  );
}

/** How to reach the operator. Set CONTACT_EMAIL in the environment. */
export function Contact() {
  const email = process.env.CONTACT_EMAIL;
  if (!email) return <p>Contact the operator of this site through the page where you found the game.</p>;
  return (
    <p>
      Email <a href={`mailto:${email}`}>{email}</a>.
    </p>
  );
}
