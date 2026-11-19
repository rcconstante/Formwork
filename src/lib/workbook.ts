import type { Inputs, Tool } from "./estimates";

export const projectRows = [
  ["footing", "Footing", 21], ["wall-footing", "Wall Footing", 41],
  ["tie-beam", "Footing Tie Beam", 61], ["beam", "Girder/Beam", 81],
  ["lintel", "Lintel Beam", 101], ["slab", "Slab", 120],
  ["rc-wall", "RC Walls", 139], ["column", "Column", 159],
  ["stiffener", "Stiffener Column", 179], ["stairs", "Stairs", 201],
  ["landing", "Stair Landing", 220], ["tank", "Septic Tank", 281],
  ["gutter", "Concrete Gutter", 299], ["saddle", "Concrete Saddle", 318],
  ["others", "Others", 0], ["chb", "CHB Wall Mortar", 243],
  ["plaster", "Wall Plaster", 263],
] as const;

export const examples: Record<string, { row: number; inputs: Inputs }> = {
  volume: { row: 13, inputs: { volume: "3.768" } },
  dimensions: { row: 33, inputs: { length: "1.5", width: "1.2", height: "0.4", qty: "12" } },
  "area-method": { row: 52, inputs: { thickness: "7.5", area: "23", qty: "1" } },
  "stair-flight": { row: 73, inputs: { steps: "7", rise: "0.2", run: "0.3", width: "1.2", stringer: "0.15" } },
  "round-column": { row: 92, inputs: { dia: "60", height: "2", qty: "3" } },
  pipe: { row: 111, inputs: { outer: "110", inner: "90", qty: "1" } },
};

export function workbookReference(tool: Tool): string {
  const example = examples[tool.id];
  if (example) return `Concrete · D${example.row}:I${example.row + 2}`;
  if (tool.id === "others") return "Summary · C20:E20";
  const row = projectRows.find(([id]) => id === tool.id)?.[2];
  if (row === undefined) return "";
  return `Concrete Estimate · I${row}:I${row + (tool.id === "plaster" ? 1 : 2)}`;
}

// This changes only the displayed number; Excel totals use the underlying values.
export function workbookNumber(value: number, digits = 2, grouping = false): string {
  return Number(value.toPrecision(15)).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: grouping,
  });
}


