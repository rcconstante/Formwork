import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <main className="wrap inner legal">
      <Link className="back" href="/">← Home</Link>
      <h1>Terms of use</h1>
      <p>Use Formwork for coursework, practice, and preliminary material estimates.</p>
      <h2>Check your inputs and results</h2>
      <p>Results depend on the dimensions, quantities, and mixture classes you enter. Review them against your drawings and class requirements before submitting your work.</p>
      <h2>Using a result on a project</h2>
      <p>The 3D models illustrate what the inputs represent. For construction or purchasing, confirm the quantities and specifications with the project’s qualified professional.</p>
    </main>
  );
}

