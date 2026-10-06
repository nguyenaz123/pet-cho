import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Contact } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · Pixel Pet" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 6, 2026">
      <p>
        Pixel Pet is a small virtual pet game. This page explains what we store when you play, why, and how to remove it.
      </p>

      <h2>What we collect</h2>
      <p>When you sign in with Facebook, we receive only your public profile:</p>
      <ul>
        <li>your Facebook user ID for this app,</li>
        <li>your name,</li>
        <li>your profile picture URL,</li>
        <li>an access token Facebook issues at sign-in. We store it but do not use it to read anything else.</li>
      </ul>
      <p>We do not ask for your email, friends list, posts, photos or any other Facebook data.</p>
      <p>While you play, we store your pet: its name, breed, level, stats, outfit and timestamps of your actions.</p>
      <p>
        We set one cookie that keeps you signed in. We do not use advertising, analytics or tracking cookies, and we do not
        sell or share your data with anyone.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>Your Facebook ID links your account to your pet, so you get the same pet on any device.</li>
        <li>Your name and picture are shown only to you, in your profile.</li>
        <li>
          Other signed-in players can see your pet&apos;s name, breed, level, outfit and stats in the friends list and when
          visiting your pet. They do not see your Facebook name or picture.
        </li>
      </ul>

      <h2>Where it is stored</h2>
      <p>
        Your data is stored in our database with our hosting provider. It is kept until you delete your account.
        Sign-in sessions expire on their own after 30 days without use.
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can delete your account and pet at any time. See <Link href="/data-deletion">Data deletion</Link>.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, we will update this page and the date at the top.</p>

      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  );
}
