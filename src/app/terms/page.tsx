import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Contact } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · Pixel Pet" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 6, 2026">
      <p>By signing in to Pixel Pet you agree to these terms.</p>

      <h2>The game</h2>
      <p>
        Pixel Pet is a free game provided as is, without warranties. We may change, pause or end the game, and we may reset
        game data, for example to fix bugs or balance gameplay.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You sign in with your own Facebook account and are responsible for what happens under it.</li>
        <li>One pet per account.</li>
        <li>You can delete your account at any time from your profile.</li>
      </ul>

      <h2>Fair play</h2>
      <p>Don&apos;t:</p>
      <ul>
        <li>give your pet an offensive name (other players can see it),</li>
        <li>tamper with the game, its servers or other players&apos; data,</li>
        <li>use bots or scripts to play or to overload the service.</li>
      </ul>
      <p>We may rename pets or remove accounts that break these rules.</p>

      <h2>Privacy</h2>
      <p>
        How we handle your data is described in the <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  );
}
