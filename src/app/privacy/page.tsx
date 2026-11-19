import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <main className="wrap inner legal">
      <Link className="back" href="/">← Home</Link>
      <h1>Privacy</h1>
      <p>Formwork calculates estimates in your browser. You can use it without creating an account.</p>
      <h2>What your browser saves</h2>
      <p>Saved estimates, studio notes, imported quizzes, and quiz progress stay in this browser. Formwork does not upload them or sync them across devices.</p>
      <h2>Using an AI prompt</h2><p>Copying a prompt puts it on your clipboard. If you paste your module into ChatGPT or Claude, that service handles it under its own privacy terms.</p>
      <h2>How to remove your data</h2>
      <p>Remove individual entries from <Link href="/summary">My estimate</Link>. To remove all entries, clear this site’s data in your browser settings. This removes estimates, studio drafts, and the current quiz from this browser.</p>
    </main>
  );
}


