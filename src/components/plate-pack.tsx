"use client";

import { useState } from "react";
import Link from "next/link";
import { PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { display, number, pesos, roomMetrics, type Studio } from "@/lib/studio";
import type { takeoff } from "@/lib/takeoff";
import { workbookNumber, workbookReference } from "@/lib/workbook";
import { Compass, costRows, detailLabels, Field, siteLabels, spaceTotals } from "./studio-forms";
import ModelPreview from "./model-preview";

export default function PlatePack({ data, patch, summary }: {
  data: Studio; patch: (update: Partial<Studio>) => void; summary: ReturnType<typeof takeoff>;
}) {
  const [modelEntry, setModelEntry] = useState("");
  const available = summary.saved.filter(({tool}) => tool.id !== "others");
  const model = available.find(({entry}) => entry.id === modelEntry) ?? available[0];
  const rooms = data.rooms.flatMap(room => {
    const result = roomMetrics(room);
    return result ? [{ ...room, ...result }] : [];
  });
  const totals = spaceTotals(data);
  const costs = costRows(data, summary.materials);
  const priced = costs.filter(row => row.quantity !== null && row.price !== null);
  const total = priced.reduce((sum, row) => sum + row.quantity! * row.price!, 0);
  const title = data.details.project.trim() || "Project submission";
  return (
    <>
      <section className="panel studio-panel pack-controls">
        <div className="sectitle">
          <h2>Print settings</h2>
          <button type="button" className="primary" onClick={() => window.print()}><HugeiconsIcon icon={PrinterIcon} size={18} />Print / Save as PDF</button>
        </div>
        <p>Save as PDF using your browser’s print dialog. The pack is formatted for A3 landscape.</p>
        {available.length > 0 && <label className="studio-field">3D view on the plate
          <select value={model?.entry.id ?? ""} onChange={event => setModelEntry(event.target.value)}>
            {available.map(({entry}) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
          </select>
        </label>}
        <Field label="Project assumptions and notes" multiline value={data.assumptions} change={assumptions => patch({ assumptions })} />
      </section>
      <article className="plate-sheet" aria-label="A3 submission pack preview">
        <div className="plate-title">
          <div><small>FORMWORK · PROJECT SUBMISSION</small><h2>{title}</h2></div>
          <span>{data.details.sheet || "A-01"}</span>
        </div>
        <dl className="plate-details">
          {(["student","school","course","sheet"] as const).map(key => <div key={key}><dt>{detailLabels[key]}</dt><dd>{data.details[key] || "—"}</dd></div>)}
        </dl>

        <section className="plate-section">
          <h3>Space program</h3>
          {rooms.length ? <div className="scroll"><table>
            <thead><tr><th>Room</th><th>Dimensions</th><th>Qty</th><th>Net floor</th><th>Net wall</th></tr></thead>
            <tbody>{rooms.map(room => <tr key={room.id}><td>{room.name || "Room"}</td><td>{room.length} × {room.width} m</td><td>{room.count}</td><td>{display(room.floor)} m²</td><td>{room.wall === null ? "—" : `${display(room.wall)} m²`}</td></tr>)}</tbody>
          </table></div> : <p>No measured rooms. <Link className="screen-only" href="/studio/spaces">Open room schedule ↗</Link></p>}
          {rooms.length > 0 && <p>Net floor {display(totals.floor)} m² + circulation {display(totals.allowance)} m² = <strong>{display(totals.floor + totals.allowance)} m²</strong></p>}
        </section>

        <section className="plate-section">
          <h3>Site analysis</h3>
          {Object.values(data.site).some(value => value.trim()) ? (
            <div className="plate-site">
              <dl className="plate-details">{(Object.keys(siteLabels) as (keyof Studio["site"])[]).filter(key => data.site[key].trim()).map(key => <div key={key}><dt>{siteLabels[key]}</dt><dd>{data.site[key]}</dd></div>)}</dl>
              {number(data.site.north) !== null && <Compass bearing={data.site.north} />}
            </div>
          ) : <p>No site information. <Link className="screen-only" href="/studio/site">Open site analysis ↗</Link></p>}
        </section>

        <section className="plate-section">
          <h3>Material quantities and costs</h3>
          {costs.length ? <><div className="scroll"><table>
            <thead><tr><th>Material</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead>
            <tbody>{costs.map(row => <tr key={row.id}><td>{row.label}</td><td>{row.quantity === null ? "—" : `${display(row.quantity)} ${row.unit}`}</td><td>{row.price === null ? "—" : pesos(row.price)}</td><td>{row.quantity === null || row.price === null ? "—" : pesos(row.quantity * row.price)}</td></tr>)}</tbody>
          </table></div><p>Priced items subtotal <strong>{pesos(total)}</strong>{priced.length < costs.length && ` · ${costs.length - priced.length} incomplete line(s)`}</p></> : <p>No material quantities yet. <Link className="screen-only" href="/#tools">Open calculators ↗</Link></p>}
        </section>

        {model && <section className="plate-section plate-model"><h3>{model.entry.label} · schematic view</h3><ModelPreview tool={model.tool} inputs={model.entry.inputs} result={model.result} /></section>}
        {summary.saved.length > 0 && <section className="plate-section">
          <h3>Worked calculations</h3>
          {summary.saved.map(({ entry, tool, result }) => (
            <div className="plate-work" key={entry.id}>
              <h4>{entry.label}{tool.group === "Methods" && " · reference"}</h4>
              <p>{tool.id !== "others" && `Mix ${entry.inputs.mix} · `}{tool.fields.map(field => `${field.label}: ${entry.inputs[field.key] || "0"} ${field.unit}`).join(" · ")}</p>
              <p>{tool.formula}. {workbookReference(tool)}</p>
              <p>{result.volume !== undefined && `${workbookNumber(result.volume)} m³ concrete · `}
                {result.area !== undefined && `${workbookNumber(result.area)} m² net area · `}
                {workbookNumber(result.cement)} bags cement (40 kg) · {workbookNumber(result.sand)} m³ sand
                {tool.group !== "Masonry" && ` · ${workbookNumber(result.gravel)} m³ gravel`}
                {result.blocks !== undefined && ` · ${workbookNumber(result.blocks)} CHB pieces`}
                {result.bag50 !== undefined && ` · ${workbookNumber(result.bag50)} bags (50 kg alternative)`}
              </p>
            </div>
          ))}
        </section>}
        {data.assumptions.trim() && <section className="plate-section"><h3>Assumptions</h3><p className="plate-note">{data.assumptions}</p></section>}
      </article>
    </>
  );
}

