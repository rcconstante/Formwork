import Catalog from "@/components/catalog";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow"><span className="dot" /> ARCHITECTURE TOOLKIT</div>
        <h1>What will you <em>estimate</em> today?</h1>
        <p>Calculate materials, prepare your plates, and review for class.</p>
        <a className="primary" href="#features">Explore tools <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" /></a>
      </section>
      <Catalog />
    </main>
  );
}


