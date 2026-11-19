"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, CubeIcon, MinusSignIcon, PlusSignIcon, Rotate01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Inputs, Result, Tool } from "@/lib/estimates";
import { previewModel, type Point } from "@/lib/preview";
import { workbookNumber } from "@/lib/workbook";

const initialView = { azimuth: -0.66, elevation: 0.53, zoom: 1 };
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ModelPreview({ tool, inputs, result }: { tool: Tool; inputs: Inputs; result: Result | null }) {
  const [view, setView] = useState(initialView);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const { faces, notes } = previewModel(tool, inputs);

  const sin = Math.sin(view.azimuth), cos = Math.cos(view.azimuth);
  const tilt = Math.sin(view.elevation), level = Math.cos(view.elevation);
  const right: Point = [cos, 0, -sin];
  const up: Point = [-sin * tilt, level, -cos * tilt];
  const camera: Point = [sin * level, tilt, cos * level];
  const light: Point = [-0.35, 0.84, 0.4];

  const points = faces.flatMap((face) => face.vertices);
  const extents = ([0, 1, 2] as const).map((axis) => {
    const values = points.map((point) => point[axis]);
    return [Math.min(...values), Math.max(...values)] as const;
  });
  const center = extents.map(([min, max]) => min / 2 + max / 2) as Point;
  const span = Math.hypot(...extents.map(([min, max]) => max - min)) || 1;
  const scale = 235 / span * view.zoom;
  const polygons = faces
    .filter(({ normal }) => dot(normal, camera) > 0)
    .map(({ vertices, normal }, index) => {
      const depth = vertices.reduce((sum, vertex) => sum + dot(vertex, camera), 0) / vertices.length;
      const shade = 43 + Math.max(0, dot(normal, light) / Math.hypot(...normal)) * 32;
      return { index, depth, shade, points: vertices.map((point) => {
        const relative = point.map((value, axis) => value - center[axis]) as Point;
        return `${(200 + dot(relative, right) * scale).toFixed(2)},${(131 - dot(relative, up) * scale).toFixed(2)}`;
      }).join(" ") };
    })
    .sort((a, b) => a.depth - b.depth);

  function rotate(azimuth: number, elevation = 0) {
    setView((current) => ({
      ...current,
      azimuth: current.azimuth + azimuth,
      elevation: clamp(current.elevation + elevation, -1.45, 1.52),
    }));
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.id !== event.pointerId) return;
    rotate((event.clientX - drag.current.x) * 0.013, (drag.current.y - event.clientY) * 0.013);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function zoom(multiplier: number) {
    setView((current) => ({ ...current, zoom: clamp(current.zoom * multiplier, 0.55, 2.25) }));
  }

  const dimensions = tool.fields.filter(({ key, unit }) => unit !== "pcs" && key !== "sides" && inputs[key]?.trim());
  const quantity = Number(inputs.qty);
  return (
    <section className="panel model-panel" aria-label="Interactive 3D preview">
      <div className="model-title">
        <HugeiconsIcon icon={CubeIcon} size={20} aria-hidden="true" />
        <h2>3D preview</h2>
      </div>
      <div className="model-stage">
        <svg viewBox="0 0 400 262" aria-label={`Rotatable model of ${tool.name}. Arrow keys rotate. Plus and minus zoom.`}
          role="img" tabIndex={0}
          onPointerDown={(event) => {
            if (event.button !== 0 || drag.current) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          }}
          onPointerMove={move}
          onLostPointerCapture={() => { drag.current = null; }}
          onKeyDown={(event) => {
            switch (event.key) {
              case "ArrowLeft": rotate(-0.2); break;
              case "ArrowRight": rotate(0.2); break;
              case "ArrowUp": rotate(0, 0.15); break;
              case "ArrowDown": rotate(0, -0.15); break;
              case "+": case "=": zoom(1.2); break;
              case "-": zoom(1 / 1.2); break;
              case "Home": setView(initialView); break;
              default: return;
            }
            event.preventDefault();
          }}>
          {polygons.map(({ index, points, shade }) => (
            <polygon key={index} points={points} fill={`hsl(251 53% ${shade}%)`} stroke="#3c2d65" strokeWidth="0.7" strokeLinejoin="round" />
          ))}
        </svg>
        <div className="model-actions" aria-label="Model controls">
          <button type="button" aria-label="Rotate left" onClick={() => rotate(-0.32)}><HugeiconsIcon icon={ArrowLeft01Icon} size={15} /></button>
          <button type="button" aria-label="Rotate right" onClick={() => rotate(0.32)}><HugeiconsIcon icon={ArrowRight01Icon} size={15} /></button>
          <button type="button" aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}><HugeiconsIcon icon={MinusSignIcon} size={15} /></button>
          <button type="button" aria-label="Zoom in" onClick={() => zoom(1.2)}><HugeiconsIcon icon={PlusSignIcon} size={15} /></button>
          <button type="button" aria-label="Reset view" onClick={() => setView(initialView)}><HugeiconsIcon icon={Rotate01Icon} size={15} /></button>
        </div>
      </div>
      <div className="model-meta">
        <p>Drag to rotate.{quantity > 1 && " One unit shown."}</p>
        {dimensions.length > 0 && (
          <dl>{dimensions.map(({ key, label, unit }) => (
            <div key={key}><dt>{label}</dt><dd>{inputs[key]} {unit}</dd></div>
          ))}</dl>
        )}
        {result?.volume !== undefined && <p className="model-total">Calculated volume <strong>{workbookNumber(result.volume)} m³</strong></p>}
        {result?.area !== undefined && <p className="model-total">Calculated net area <strong>{workbookNumber(result.area)} m²</strong></p>}{notes.map((note) => <p key={note}>{note}</p>)}
      </div>
    </section>
  );
}


