"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ModelPreview from "./model-preview";
import { defaults, estimate, guide, mixes, tools, type Result, type Tool } from "@/lib/estimates";
import { read, write } from "@/lib/project";
import { examples, workbookNumber, workbookReference } from "@/lib/workbook";

const resultFields = [
  ["volume", "Concrete volume · m³"], ["area", "Net area · m²"],
  ["cement", "Cement · 40 kg bags"], ["bag50", "Cement · 50 kg bags"],
  ["sand", "Sand · m³"], ["gravel", "Gravel · m³"], ["blocks", "Hollow blocks · pcs"],
] as const satisfies ReadonlyArray<readonly [keyof Result, string]>;

export default function Calculator({ tool }: { tool: Tool }) {
  const example = examples[tool.id];
  const [inputs, setInputs] = useState(() => ({ ...defaults(tool), ...example?.inputs }));
  const [label, setLabel] = useState("");
  const [entryId, setEntryId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const id = new URLSearchParams(location.search).get("entry");
      if (!id) return;
      try {
        const entry = read().find((item) => item.id === id && item.tool === tool.id);
        if (entry) {
          setEntryId(entry.id);
          setInputs(entry.inputs);
          setLabel(entry.label);
        }
      } catch {
        setStatus("Could not read the saved entry.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tool.id]);

  const result = estimate(tool, inputs);
  const ratios = tool.group === "Masonry" ? guide.mortar : guide.mix;
  const ratio = ratios.find((row) => row[0] === inputs.mix)?.[1];
  const mixOptions = mixes(tool);
  // Keep any previously saved pipe mix editable.
  const displayedMixes = mixOptions.includes(inputs.mix) ? mixOptions : [...mixOptions, inputs.mix];
  const tone = tools.findIndex((item) => item.id === tool.id) % 6;

  function update(key: string, value: string) {
    setInputs((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  function save() {
    if (!result) return;
    try {
      const rows = read();
      const id = entryId || crypto.randomUUID();
      const item = { id, tool: tool.id, label: label.trim() || tool.name, inputs };
      write([...rows.filter((entry) => entry.id !== id), item]);
      setEntryId(id);
      setStatus(tool.group === "Methods" ? "Saved as a reference in My estimate." : "Saved to My estimate.");
    } catch {
      setStatus("Unable to save in this browser.");
    }
  }

  return (
    <main className="wrap inner">
      <Link className="back" href="/#tools">← All calculators</Link>
      <div className="toolhead">
        <div><div className="eyebrow">{tool.group} / Calculator</div><h1>{tool.name}</h1></div>
        <Image className={`diagram tone${tone}`} src={`/models/${tool.id}.svg`} alt={`${tool.name} diagram`} width={190} height={115} />
      </div>
      <div className="workgrid calculator-grid" data-has-model={tool.id !== "others"}>
        <section className="panel calculator-inputs">
          <div className="sectitle">
            <h2>Inputs</h2>
            {example && (
              <button className="sample" onClick={() => {
                setInputs({ ...defaults(tool), ...example.inputs });
                setStatus("");
              }}>Load workbook example</button>
            )}
          </div>
          <div className="fields">
          {tool.id !== "others" && (
              <label>Mixture class
                <select value={inputs.mix} onChange={(event) => update("mix", event.target.value)}>
                  {displayedMixes.map((mix) => <option key={mix}>{mix}</option>)}
                </select>
                <small>Mix proportion {ratio}</small>
              </label>
            )}
            {tool.fields.map((field) => (
              <label key={field.key}>{field.label}
                <span className="field">
                  {field.options ? (
                    <select value={inputs[field.key]} onChange={(event) => update(field.key, event.target.value)}>
                      {field.options.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input type="number" step={field.integer ? "1" : "any"} min="0" placeholder="0" value={inputs[field.key]} onChange={(event) => update(field.key, event.target.value)} />
                  )}
                  <small>{field.unit}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="method">
            <strong>Calculation method</strong>
            <p>{tool.formula}</p>
            <p>Excel reference: {workbookReference(tool)}</p>
            {tool.id === "stairs" && <Link href="/tools/stair-flight">Compare with the standalone geometric stair method ↗</Link>}
            {tool.id === "stair-flight" && <Link href="/tools/stairs">Compare with the project stair method ↗</Link>}
            {tool.id === "slab" && <Link href="/tools/area-method">Compare with the standalone slab and wall area method ↗</Link>}
          </div>
        </section>
        {tool.id !== "others" && <ModelPreview tool={tool} inputs={inputs} result={result} />}
        <section className="panel output">
          <div className="eyebrow">Material takeoff</div>
          <h2>Estimate</h2>
          <div aria-live="polite">
            {result ? resultFields.map(([key, name]) => {
              const value = result[key];
              if (value === undefined || (key === "gravel" && tool.group === "Masonry")) return null;
              return <div className="result" key={key}><span>{name}</span><b title={String(value)}>{workbookNumber(value)}</b></div>;
            }) : (
              <p>Enter valid dimensions to calculate materials.
                {tool.id === "pipe" && " Inner diameter must be smaller than outer diameter."}
                {tool.group === "Masonry" && " Openings must fit within the measured area."}
              </p>
            )}
          </div>
          {result && <p>Displayed to two decimal places, as in Excel.</p>}
          <label>Entry name
            <input value={label} placeholder={tool.name} onChange={(event) => {
              setLabel(event.target.value);
              setStatus("");
            }} />
          </label>
          <button className="primary" disabled={!result} onClick={save}>
            {entryId ? "Update entry" : tool.group === "Methods" ? "Save as reference" : "Add to my estimate"}
          </button>
          {entryId && <button className="textbtn" onClick={() => {
            setEntryId("");
            setLabel("");
            setStatus("Ready to add a separate entry.");
          }}>Start another entry</button>}
          <p role="status">{status}</p>
          <Link className="back" href="/summary">View project summary →</Link>
        </section>
      </div>
    </main>
  );
}




