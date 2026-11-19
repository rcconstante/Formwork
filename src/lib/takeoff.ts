import { estimate, guide, tools } from "./estimates";
import type { Entry } from "./project";
import { projectRows } from "./workbook";

const sumMaterials = (rows: number[][]) => rows.reduce(
  (sum, row) => sum.map((value, index) => value + row[index]), [0, 0, 0],
);
const roundUp = (value: number) => Math.ceil(Number(value.toPrecision(15)));

export function takeoff(entries: Entry[]) {
  const saved = entries.flatMap((entry) => {
    const tool = tools.find((tool) => tool.id === entry.tool);
    const result = tool && estimate(tool, entry.inputs);
    return tool && result ? [{ entry, tool, result, amounts: [result.cement, result.sand, result.gravel] }] : [];
  });
  const categories = projectRows.map(([id, name]) => ({
    name,
    masonry: id === "chb" || id === "plaster",
    amounts: sumMaterials(saved.filter(({ tool }) => tool.id === id).map(({ amounts }) => amounts)),
  }));
  const concrete = sumMaterials(categories.filter(({ masonry }) => !masonry).map(({ amounts }) => amounts)).map(roundUp);
  const masonry = sumMaterials(categories.filter(({ masonry }) => masonry).map(({ amounts }) => amounts)).map(roundUp);
  const blocks = guide.block.map(([size], index) => ({
    size,
    inches: [4, 5, 6, 8][index],
    count: saved.reduce((sum, { entry, result }) => sum + (entry.inputs.block === size ? result.blocks ?? 0 : 0), 0),
  }));
  const materials = [
    ...["Cement (40 kg)", "Sand", "Gravel"].map((label, index) => ({
      id: ["cement", "sand", "gravel"][index], label, unit: index === 0 ? "bag" : "m³", quantity: concrete[index] + masonry[index],
    })),
    ...blocks.map(({ inches, count }) => ({ id: `chb-${inches}`, label: `${inches}″ CHB`, unit: "pc", quantity: roundUp(count) })),
  ];
  return { saved, categories, concrete, masonry, blocks, materials };
}

