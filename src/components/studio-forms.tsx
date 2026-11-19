"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { display, number, pesos, roomMetrics, type Details, type Finish, type Room, type Site, type Studio } from "@/lib/studio";
import type { takeoff } from "@/lib/takeoff";

type Props = { data: Studio; patch: (update: Partial<Studio> | ((current: Studio) => Partial<Studio>)) => void };
type TextFieldProps = { label: string; value: string; change: (value: string) => void; numeric?: boolean; multiline?: boolean; min?: number; step?: string; placeholder?: string };

export const detailLabels: Record<keyof Details, string> = { project: "Project title", student: "Student", school: "School / campus", course: "Course / section", sheet: "Sheet number" };
export const siteLabels: Record<keyof Site, string> = {
  address: "Project location", area: "Lot area (m²)", north: "North bearing (°)", front: "Front setback (m)",
  side: "Side setback (m)", rear: "Rear setback (m)", access: "Access and frontage",
  constraints: "Site constraints and observations", sources: "Sources and references",
};

export function Field({ label, value, change, numeric, multiline, min = 0, step = "any", placeholder }: TextFieldProps) {
  return (
    <label className="studio-field">{label}
      {multiline
        ? <textarea value={value} onChange={(event) => change(event.target.value)} rows={3} maxLength={2500} placeholder={placeholder} />
        : <input type={numeric ? "number" : "text"} value={value} min={numeric ? min : undefined} step={numeric ? step : undefined} maxLength={120} onChange={(event) => change(event.target.value)} placeholder={placeholder} />}
    </label>
  );
}

function Select({ label, value, change, children }: { label: string; value: string; change: (value: string) => void; children: ReactNode }) {
  return <label className="studio-field">{label}<select value={value} onChange={(event) => change(event.target.value)}>{children}</select></label>;
}

function newRoom(name = ""): Room {
  return { id: crypto.randomUUID(), name, length: "", width: "", count: "1", excluded: "", wallHeight: "", openings: "" };
}

export function ScaleForm({ data, patch }: Props) {
  const { scale, details } = data;
  const dimension = number(scale.dimension), ratio = number(scale.ratio);
  const units: Record<string, number> = { mm: 1, cm: 10, m: 1000 };
  const multiplier = scale.direction === "paper" ? units[scale.unit] : 1;
  const converted = dimension !== null && ratio ? (scale.direction === "paper" ? dimension * multiplier / ratio : dimension * ratio / 1000) : null;
  function setScale(key: keyof Studio["scale"], value: string) {
    patch(current => ({ scale: { ...current.scale, [key]: value } }));
  }
  function example() {
    patch(current => ({
      details: {
        ...current.details, project: current.details.project || "Sample one-storey residence",
        sheet: current.details.sheet || "A-01",
      },
      rooms: current.rooms.length ? current.rooms : [
        { ...newRoom("Living room"), length: "4.5", width: "3.6", wallHeight: "2.7", openings: "3.2" },
        { ...newRoom("Bedroom"), length: "3.3", width: "3", wallHeight: "2.7", openings: "2.6" },
      ],
    }));
  }
  return (
    <div className="studio-columns">
      <section className="panel studio-panel">
        <h2>Scale converter</h2>
        <div className="studio-fields">
          <Select label="Convert" value={scale.direction} change={(value) => setScale("direction", value)}>
            <option value="paper">Actual size → drawing</option><option value="actual">Drawing → actual size</option>
          </Select>
          <Field numeric label={scale.direction === "paper" ? "Actual dimension" : "Drawing dimension (mm)"} value={scale.dimension} change={(value) => setScale("dimension", value)} />
          {scale.direction === "paper" && <Select label="Actual unit" value={scale.unit} change={(value) => setScale("unit", value)}>{Object.keys(units).map(unit => <option key={unit}>{unit}</option>)}</Select>}
          <Field numeric min={1} label="Scale denominator (1:n)" value={scale.ratio} change={(value) => setScale("ratio", value)} />
        </div>
        <div className="studio-total" aria-live="polite">
          <span>{scale.direction === "paper" ? "On the drawing" : "Actual size"}</span>
          <strong>{converted === null ? "—" : `${display(converted)} ${scale.direction === "paper" ? "mm" : "m"}`}</strong>
        </div>
      </section>
      <section className="panel studio-panel">
        <div className="sectitle"><h2>Title block</h2><button type="button" className="sample" onClick={example}>Fill residential example</button></div>
        <div className="studio-fields">
          {(Object.keys(detailLabels) as (keyof Details)[]).map(key => (
            <Field key={key} label={detailLabels[key]} value={details[key]} change={(value) => patch(current => ({ details: { ...current.details, [key]: value } }))} />
          ))}
        </div>
        <Link className="back" href="/studio/pack">Preview title block in your pack ↗</Link>
      </section>
    </div>
  );
}

const roomFields: { key: Exclude<keyof Room, "id">; label: string }[] = [
  { key: "name", label: "Room name" }, { key: "length", label: "Length (m)" }, { key: "width", label: "Width (m)" },
  { key: "count", label: "Quantity" }, { key: "excluded", label: "Floor deduction per room (m²)" },
  { key: "wallHeight", label: "Wall height (m), optional" }, { key: "openings", label: "Door and window openings per room (m²)" },
];

export function SpacesForm({ data, patch }: Props) {
  const totals = spaceTotals(data);
  function update(id: string, key: keyof Room, value: string) {
    patch(current => ({ rooms: current.rooms.map(room => room.id === id ? { ...room, [key]: value } : room) }));
  }
  return (
    <section className="panel studio-panel">
      <div className="sectitle">
        <h2>Space program</h2>
        <button className="primary" type="button" onClick={() => patch(current => ({ rooms: [...current.rooms, newRoom()] }))}>Add room</button>
      </div>
      {!data.rooms.length && <p>Add a room to measure floor and wall areas.</p>}
      <div className="studio-stack">
        {data.rooms.map((room, index) => {
          const result = roomMetrics(room);
          return (
            <fieldset key={room.id} className="studio-row">
              <legend>{room.name || `Room ${index + 1}`}</legend>
              <div className="studio-fields room-fields">
                {roomFields.map(({ key, label }) => <Field key={key} label={label} value={room[key]} numeric={key !== "name"} min={key === "count" ? 1 : 0} step={key === "count" ? "1" : "any"} change={(value) => update(room.id, key, value)} />)}
              </div>
              <div className="studio-row-end">
                <p>{!result ? "Enter valid dimensions and deductions." : `${display(result.floor)} m² net floor${result.wall !== null ? ` · ${display(result.wall)} m² net wall` : ""}`}</p>
                <button className="textbtn" type="button" onClick={() => patch(current => ({ rooms: current.rooms.filter(item => item.id !== room.id) }))}>Remove room {index + 1}</button>
              </div>
            </fieldset>
          );
        })}
      </div>
      <Field numeric label="Circulation allowance (%)" value={data.circulation} change={(value) => patch({ circulation: value })} />
      <div className="studio-total"><span>{display(totals.floor)} m² rooms + {display(totals.allowance)} m² circulation</span><strong>{display(totals.floor + totals.allowance)} m²</strong></div>
    </section>
  );
}

export function spaceTotals(data: Studio) {
  const floor = data.rooms.reduce((sum, room) => sum + (roomMetrics(room)?.floor ?? 0), 0);
  return { floor, allowance: floor * (number(data.circulation) ?? 0) / 100 };
}

export function costRows(data: Studio, materials: ReturnType<typeof takeoff>["materials"]) {
  return [
    ...materials.filter(row => row.quantity > 0).map(row => ({ ...row, price: number(data.prices[row.id]) })),
    ...data.finishes.map(row => ({ id: row.id, label: row.name || "Finish", unit: row.unit, quantity: number(row.quantity), price: number(row.price) })),
  ];
}

export function CostForm({ data, patch, materials }: Props & { materials: ReturnType<typeof takeoff>["materials"] }) {
  const active = materials.filter(row => row.quantity > 0);
  const lines = costRows(data, materials);
  const total = lines.reduce((sum, row) => sum + (row.quantity ?? 0) * (row.price ?? 0), 0);
  const addFinish = () => patch(current => ({ finishes: [...current.finishes, { id: crypto.randomUUID(), name: "", unit: "m²", quantity: "", price: "" }] }));
  function editFinish(id: string, key: keyof Finish, value: string) {
    patch(current => ({ finishes: current.finishes.map(row => row.id === id ? { ...row, [key]: value } : row) }));
  }
  return (
    <section className="panel studio-panel">
      <div className="sectitle"><h2>Bill of materials</h2><Link href="/summary">My estimate ↗</Link></div>
      <p>Enter supplier quotes in PHP. Quantities come from your workbook takeoff, with hollow blocks rounded up to whole pieces for pricing.</p>
      {!active.length && <p>Save a project calculation to bring its materials into this table.</p>}
      {active.length > 0 && <div className="scroll">
        <table className="studio-table">
          <thead><tr><th>Material</th><th>Quantity</th><th>Price per unit (PHP)</th><th>Amount</th></tr></thead>
          <tbody>{active.map(row => {
            const price = number(data.prices[row.id]);
            return <tr key={row.id}><td>{row.label}</td><td>{display(row.quantity)} {row.unit}</td>
              <td><input type="number" min="0" step="any" aria-label={`${row.label} unit price`} value={data.prices[row.id] ?? ""} onChange={event => {
                const value = event.target.value;
                patch(current => ({ prices: { ...current.prices, [row.id]: value } }));
              }} /></td>
              <td>{price === null ? "—" : pesos(row.quantity * price)}</td></tr>;
          })}</tbody>
        </table>
      </div>}
      <div className="sectitle"><h2>Finishes and other items</h2><button className="sample" type="button" onClick={addFinish}>Add cost item</button></div>
      {data.finishes.map((row, index) => (
        <fieldset key={row.id} className="studio-row">
          <legend>{row.name || `Cost item ${index + 1}`}</legend>
          <div className="studio-fields">
            <Field label="Item description" value={row.name} change={(value) => editFinish(row.id, "name", value)} />
            <Field label="Unit (e.g. m² or pc)" value={row.unit} change={(value) => editFinish(row.id, "unit", value)} />
            <Field numeric label="Quantity" value={row.quantity} change={(value) => editFinish(row.id, "quantity", value)} />
            <Field numeric label="Unit price (PHP)" value={row.price} change={(value) => editFinish(row.id, "price", value)} />
          </div>
          <button className="textbtn" type="button" onClick={() => patch(current => ({ finishes: current.finishes.filter(item => item.id !== row.id) }))}>Remove item {index + 1}</button>
        </fieldset>
      ))}
      <div className="studio-total" aria-live="polite"><span>Priced items subtotal</span><strong>{pesos(total)}</strong></div>
      {lines.some(row => row.quantity === null || row.price === null) && <p>Complete empty quantity and price fields for a full cost estimate.</p>}
    </section>
  );
}

export function Compass({ bearing }: { bearing: string }) {
  const north = number(bearing) ?? 0;
  return <figure className="studio-compass">
    <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label={`North arrow at ${north % 360} degrees clockwise from the top of the sheet`}>
      <circle cx="90" cy="90" r="65" fill="none" stroke="currentColor" strokeOpacity=".22" />
      <path d="M90 18v144M18 90h144" stroke="currentColor" strokeOpacity=".22" strokeDasharray="3 4" />
      <g transform={`rotate(${north % 360} 90 90)`}><path d="m90 47 19 65-19-12-19 12z" fill="currentColor" /><text x="90" y="39" textAnchor="middle" fontSize="13" fill="currentColor">N</text></g>
    </svg>
    <figcaption>{bearing.trim() ? `${display(north % 360)}° clockwise from sheet top` : "Set the north direction on your sheet"}</figcaption>
  </figure>;
}

export function SiteForm({ data, patch }: Props) {
  return (
    <div className="studio-columns">
      <section className="panel studio-panel">
        <h2>Site analysis sheet</h2>
        <p>Record dimensions and applicable setbacks from your survey, class brief, or project references.</p>
        <div className="studio-fields">
          {(Object.keys(siteLabels) as (keyof Site)[]).map(key => <Field key={key} label={siteLabels[key]} value={data.site[key]} numeric={["area", "north", "front", "side", "rear"].includes(key)} multiline={["access", "constraints", "sources"].includes(key)} change={value => patch(current => ({ site: { ...current.site, [key]: value } }))} />)}
        </div>
      </section>
      <section className="panel studio-panel"><h2>Orientation</h2><Compass bearing={data.site.north} /></section>
    </div>
  );
}

