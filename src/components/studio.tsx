"use client";

import Link from "next/link";
import { features } from "@/lib/features";
import { takeoff } from "@/lib/takeoff";
import { useEntries, useStudio } from "./use-studio";
import { CostForm, ScaleForm, SiteForm, SpacesForm } from "./studio-forms";
import PlatePack from "./plate-pack";

const pages = features.filter((feature) => "slug" in feature);
type Section = (typeof pages)[number]["slug"];

export default function Studio({ section }: { section: Section }) {
  const { data, patch, unsaved } = useStudio();
  const entries = useEntries();
  const page = pages.find((feature) => feature.slug === section)!;
  const summary = takeoff(entries);
  return (
    <main className={`wrap inner studio ${section === "pack" ? "pack-page" : ""}`}>
      <div className="studio-chrome">
        <Link className="back" href="/#features">← All tools</Link>
        <h1>{page.label}</h1>
        <p>{page.description}</p>
        <nav className="studio-nav" aria-label="Studio workspace">
          {pages.map(item => <Link key={item.slug} href={item.href} aria-current={item.slug === section ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <p className="studio-storage" role="status">{unsaved ? "Browser storage is unavailable. Changes may be lost on reload." : "Changes are saved in this browser."}</p>
      </div>
      {section === "scale" && <ScaleForm data={data} patch={patch} />}
      {section === "spaces" && <SpacesForm data={data} patch={patch} />}
      {section === "cost" && <CostForm data={data} patch={patch} materials={summary.materials} />}
      {section === "site" && <SiteForm data={data} patch={patch} />}
      {section === "pack" && <PlatePack data={data} patch={patch} summary={summary} />}
    </main>
  );
}

