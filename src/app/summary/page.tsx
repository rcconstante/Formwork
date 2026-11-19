"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { read, write, type Entry } from "@/lib/project";
import { takeoff } from "@/lib/takeoff";
import { workbookNumber } from "@/lib/workbook";

export default function Summary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = () => {
      try {
        setEntries(read());
        setError("");
      } catch {
        setError("Could not load the saved estimate.");
      }
    };
    const frame = requestAnimationFrame(refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const { saved, categories, concrete, masonry, blocks } = takeoff(entries);
  function remove(id: string) {
    try {
      const next = read().filter((entry) => entry.id !== id);
      write(next);
      setEntries(next);
      setError("");
    } catch {
      setError("Could not remove this entry.");
    }
  }

  return (
    <main className="wrap inner">
      <div className="eyebrow">Project workspace</div>
      <h1>My estimate</h1>
      <p>Matches the workbook’s Summary worksheet. Cement totals use 40 kg bags.</p>
      <div className="metrics">
        {["Cement · bags", "Sand · m³", "Gravel · m³"].map((label, index) => (
          <div key={label}><small>{label}</small><strong>{workbookNumber(concrete[index] + masonry[index], 0, true)}</strong></div>
        ))}
      </div>
      <section className="panel">
        <div className="sectitle"><h2>Materials summary</h2><Link href="/studio/cost">Price materials ↗</Link></div>
        <div className="scroll">
          <table>
            <thead><tr><th>Work item</th><th>Cement (bags)</th><th>Sand (m³)</th><th>Gravel (m³)</th></tr></thead>
            {([false, true] as const).map((isMasonry) => (
              <tbody key={String(isMasonry)}>
                <tr><th colSpan={4}>{isMasonry ? "Masonry works" : "Concrete works"}</th></tr>
                {categories.filter(({ masonry }) => masonry === isMasonry).map(({ name, amounts }) => (
                  <tr key={name}><td>{name}</td>{amounts.map((value, index) => (
                    <td key={index}>{isMasonry && index === 2 ? "—" : workbookNumber(value, 2, true)}</td>
                  ))}</tr>
                ))}
                <tr><th>{isMasonry ? "Masonry" : "Concrete"} subtotal</th>{(isMasonry ? masonry : concrete).map((value, index) => (
                  <td key={index}>{workbookNumber(value, 0, true)}</td>
                ))}</tr>
              </tbody>
            ))}
          </table>
        </div>
        <p>Excel adds the unrounded amounts, then rounds each material up within concrete and masonry before combining the subtotals.</p>
        <div className="scroll">
          <table>
            <thead><tr><th>Hollow block size</th><th>Pieces</th></tr></thead>
            <tbody>{blocks.map(({ size, inches, count }) => (
              <tr key={size}><td>{inches}″ CHB · {size} cm</td><td title={String(count)}>{workbookNumber(count, 0, true)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section className="panel guide">
        <div className="sectitle"><h2>Saved entries</h2><Link href="/#tools">Add an entry ↗</Link></div>
        <p>Standalone methods are saved for reference. The workbook’s Summary reads project estimators and the manual Others row.</p>
        {saved.length > 0 ? (
          <div className="scroll">
            <table>
              <thead><tr><th>Entry</th><th>Worksheet</th><th>Cement (bags)</th><th>Sand (m³)</th><th>Gravel (m³)</th><th>Action</th></tr></thead>
              <tbody>{saved.map(({ entry, tool, amounts }) => (
                <tr key={entry.id}>
                  <td><Link href={`/tools/${tool.id}?entry=${encodeURIComponent(entry.id)}`}>{entry.label} ↗</Link></td>
                  <td>{tool.group === "Methods" ? "Concrete · reference" : tool.id === "others" ? "Summary · Others" : "Concrete Estimate"}</td>
                  {amounts.map((value, index) => <td key={index}>{workbookNumber(value)}</td>)}
                  <td><button onClick={() => remove(entry.id)} aria-label={`Remove ${entry.label}`}>Remove</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p>Add a calculator result to start your estimate.</p>}
        <span role="status">{error}</span>
      </section>
    </main>
  );
}



