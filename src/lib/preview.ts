import type { Inputs, Tool } from "./estimates";

export type Point = [number, number, number];
export type Face = { vertices: Point[]; normal: Point };
type SectionPoint = [number, number];

function face(vertices: Point[]): Face {
  // Newell's method also works for concave section outlines.
  const normal: Point = [0, 0, 0];
  vertices.forEach(([x, y, z], index) => {
    const [a, b, c] = vertices[(index + 1) % vertices.length];
    normal[0] += (y - b) * (z + c);
    normal[1] += (z - c) * (x + a);
    normal[2] += (x - a) * (y + b);
  });
  return { vertices, normal };
}

function extrusion(profile: SectionPoint[], depth: number, offset = 0): Face[] {
  const near = profile.map(([x, y]): Point => [x, y, offset - depth / 2]);
  const far = profile.map(([x, y]): Point => [x, y, offset + depth / 2]);
  return [
    face([...near].reverse()),
    face(far),
    ...profile.map((_, i) => {
      const next = (i + 1) % profile.length;
      return face([near[i], near[next], far[next], far[i]]);
    }),
  ];
}

function box(width: number, height: number, depth: number, x = 0, y = 0, z = 0) {
  if (Math.min(width, height, depth) <= 0) return [];
  return extrusion([
    [x - width / 2, y], [x + width / 2, y],
    [x + width / 2, y + height], [x - width / 2, y + height],
  ], depth, z);
}

function cylinder(outer: number, inner: number, height: number): Face[] {
  const ring = (radius: number, y: number) => Array.from({ length: 40 }, (_, i): Point => {
    const angle = (i / 40) * Math.PI * 2;
    return [radius * Math.cos(angle), y, -radius * Math.sin(angle)];
  });
  const top = ring(outer, height), bottom = ring(outer, 0);
  const insideTop = ring(inner, height), insideBottom = ring(inner, 0);
  const walls = top.map((_, i) => {
    const next = (i + 1) % top.length;
    return face([bottom[i], bottom[next], top[next], top[i]]);
  });
  if (inner === 0) return [...walls, face(top), face([...bottom].reverse())];
  return [...walls, ...top.flatMap((_, i) => {
    const next = (i + 1) % top.length;
    return [
      face([top[i], top[next], insideTop[next], insideTop[i]]),
      face([bottom[next], bottom[i], insideBottom[i], insideBottom[next]]),
      face([insideBottom[next], insideBottom[i], insideTop[i], insideTop[next]]),
    ];
  })];
}

const gutter: SectionPoint[] = [
  [-1, 0], [1, 0], [1, 0.95], [0.74, 0.95], [0.74, 0.25],
  [-0.74, 0.25], [-0.74, 1.3], [-1, 1.3],
];
const saddle: SectionPoint[] = [
  [-1, 0], [1, 0], [1, 0.92], [0.75, 0.92],
  ...Array.from({ length: 19 }, (_, index): SectionPoint => {
    const angle = index * Math.PI / 18;
    return [Math.cos(angle) * 0.75, 0.92 - Math.sin(angle) * 0.64];
  }).slice(1),
  [-1, 0.92],
];

function scaleSection(profile: SectionPoint[], area: number): SectionPoint[] {
  const doubleArea = profile.reduce((sum, [x, y], index) => {
    const [a, b] = profile[(index + 1) % profile.length];
    return sum + x * b - y * a;
  }, 0);
  const scale = Math.sqrt(2 * area / Math.abs(doubleArea));
  return profile.map(([x, y]) => [x * scale, y * scale]);
}

export function previewModel(tool: Tool, inputs: Inputs) {
  const illustrative: string[] = [];
  const pending: string[] = [];
  const dimension = (key: string, fallback: number) => {
    const value = Number(inputs[key]);
    if (Number.isFinite(value) && value >= 1e-9 && value <= 1e9) return value;
    pending.push(tool.fields.find((field) => field.key === key)?.label ?? key);
    return fallback;
  };
  let faces: Face[];
  switch (tool.id) {
    case "footing":
    case "wall-footing":
      faces = box(dimension("length", 2.4), dimension("height", 0.4), dimension("width", 1.6));
      illustrative.push("The model shows the footing volume measured by this calculator.");
      break;
    case "slab":
    case "rc-wall":
    case "landing":
    case "area-method": {
      const edge = Math.sqrt(dimension("area", 9));
      const thickness = dimension("thickness", 12.5) / 100;
      faces = tool.id === "rc-wall" ? box(edge, edge, thickness) : box(edge, thickness, edge);
      illustrative.push("Square face inferred from the entered area.");
      break;
    }
    case "round-column":
      faces = cylinder(dimension("dia", 60) / 200, 0, dimension("height", 2));
      break;
    case "pipe": {
      const outer = dimension("outer", 110) / 200;
      const enteredInner = dimension("inner", 90) / 200;
      const inner = enteredInner < outer ? enteredInner : outer * 0.7;
      faces = cylinder(outer, inner, 1);
      illustrative.push(enteredInner >= outer ? "Sample bore shown. Enter an inner diameter smaller than the outer diameter." : "One metre of pipe, as used by the workbook formula.");
      break;
    }
    case "gutter":
    case "saddle": {
      const area = dimension("area", 0.5);
      const length = dimension(tool.id === "gutter" ? "length" : "depth", 2);
      faces = extrusion(scaleSection(tool.id === "gutter" ? gutter : saddle, area), length);
      illustrative.push("Illustrative cross section scaled to the entered area.");
      break;
    }
    case "stairs":
    case "stair-flight": {
      const steps = Math.max(1, Math.floor(dimension("steps", 7)));
      const drawn = Math.min(steps, 60);
      const riser = dimension("rise", 0.2) * steps / drawn;
      const tread = dimension("run", 0.3) * steps / drawn;
      const width = dimension("width", 1.2);
      const thickness = dimension("stringer", 0.15);
      const profile: SectionPoint[] = [[0, -thickness], [drawn * tread, drawn * riser - thickness],
        [drawn * tread, drawn * riser]];
      for (let i = drawn; i > 0; i--) {
        profile.push([(i - 1) * tread, i * riser], [(i - 1) * tread, (i - 1) * riser]);
      }
      faces = extrusion(profile, width);
      if (tool.id === "stairs") illustrative.push("The project worksheet uses its own volume formula. The stair shape is illustrative.");
      else illustrative.push("Stringer thickness is shown schematically.");
      if (drawn !== steps) illustrative.push("Treads grouped for large step counts.");
      break;
    }
    case "chb":
    case "plaster": {
      const width = dimension("length", 3), height = dimension("height", 2.4);
      const plaster = tool.id === "plaster";
      const thickness = plaster ? dimension("mm", 12) / 1000 : Number(inputs.block?.split(" x ")[0] ?? 10) / 100;
      const cut = Number(inputs.cut) / (plaster ? Number(inputs.sides) : 1);
      if (cut > 0 && cut < width * height) {
        const ratio = Math.sqrt(cut / (width * height));
        const openingWidth = width * ratio, openingHeight = height * ratio;
        const pier = (width - openingWidth) / 2, rail = (height - openingHeight) / 2;
        faces = [
          ...box(pier, height, thickness, -(width + openingWidth) / 4),
          ...box(pier, height, thickness, (width + openingWidth) / 4),
          ...box(openingWidth, rail, thickness), ...box(openingWidth, rail, thickness, 0, height - rail),
        ];
        illustrative.push("Opening shape inferred from the area deducted.");
      } else {
        faces = box(width, height, thickness);
      }
      if (plaster) illustrative.push("One face shown. The estimate uses the selected number of coated faces.");
      break;
    }
    case "tank": {
      const base = Math.cbrt(Math.max(0, Number(inputs.base)) || 1);
      const wall = Math.cbrt(Math.max(0, Number(inputs.walls)) || 1);
      const top = Math.cbrt(Math.max(0, Number(inputs.top)) || 1);
      faces = [
        ...box(2, base * 0.2, 1.5), ...box(2, wall, 0.15, 0, base * 0.2, -0.67),
        ...box(0.15, wall, 1.35, -0.925, base * 0.2), ...box(2, top * 0.2, 1.5, 0, base * 0.2 + wall + 0.25),
      ];
      illustrative.push("Exploded tank schematic. Entered volumes do not specify wall or slab dimensions.");
      break;
    }
    case "volume": {
      const edge = Math.cbrt(dimension("volume", 3.768));
      faces = box(edge, edge, edge);
      illustrative.push("Equivalent cube sized to the entered volume.");
      break;
    }
    default:
      faces = box(dimension("length", 1.8), dimension("height", 1.2), dimension("width", 0.6));
  }
  return { faces, notes: [...(pending.length ? ["Sample proportions are shown where dimensions are blank, zero, or outside the preview range."] : []), ...illustrative] };
}



