"use client";

import {useRef,useState} from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight01Icon, ArrowLeft01Icon, ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { tools } from "@/lib/estimates";
import { features } from "@/lib/features";

export default function Catalog() {
  const rail = useRef<HTMLDivElement>(null);
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const visible = tools.filter((tool) => (group === "All" || tool.group === group)
    && tool.name.toLowerCase().includes(query.toLowerCase().trim()));

  return (
    <>
      <section className="featured wrap" id="features" aria-labelledby="carousel-title">
        <div className="sectitle">
          <h2 id="carousel-title">Tool carousel</h2>
          <div className="arrows">
            {[-1, 1].map((direction) => (
              <button key={direction} aria-label={direction < 0 ? "Previous features" : "Next features"} onClick={() => {
                const track = rail.current;
                if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
              }}><HugeiconsIcon icon={direction < 0 ? ArrowLeft01Icon : ArrowRight01Icon} size={16} aria-hidden="true" /></button>
            ))}
          </div>
        </div>
        <div className="rail" ref={rail}>
          {features.map(({ href, label, description, art }) => (
            <Link href={href} className="feature feature-launch" data-art={art} key={href}>
              <div className="feature-heading">
                <strong>{label}</strong>
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
              </div>
              <div className="feature-visual">
                <Image src={`/features/${art}.webp`} width={480} height={320} alt="" unoptimized />
              </div>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="library wrap" id="tools">
        <div className="sectitle">
          <h2>All calculators</h2>
          <label className="search"><HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
            <input type="search" aria-label="Find a calculator" placeholder="Find a calculator" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
        </div>
        <div className="tabs">{["All","Concrete","Masonry","Methods"].map(name => (
          <button key={name} aria-pressed={group === name} onClick={() => setGroup(name)}>{name}</button>
        ))}</div>
        <div className="directory">{visible.map(tool => (
          <Link key={tool.id} href={`/tools/${tool.id}`}>
            <Image className={`tone${tools.indexOf(tool) % 6}`} src={`/models/${tool.id}.svg`} width={72} height={54} alt="" />
            <div><small>{tool.group}</small><strong>{tool.name}</strong></div>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Link>
        ))}</div>
        {!visible.length && <p>No calculators match your search.</p>}
      </section>
    </>
  );
}
