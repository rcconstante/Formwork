export type Details = { project: string; student: string; school: string; course: string; sheet: string };
export type Room = { id: string; name: string; length: string; width: string; count: string; excluded: string; wallHeight: string; openings: string };
export type Finish = { id: string; name: string; unit: string; quantity: string; price: string };
export type Site = { address: string; area: string; north: string; front: string; side: string; rear: string; access: string; constraints: string; sources: string };
export type Studio = {
  details: Details;
  scale: { dimension: string; unit: string; ratio: string; direction: string };
  rooms: Room[];
  circulation: string;
  prices: Record<string, string>;
  finishes: Finish[];
  site: Site;
  assumptions: string;
};

export const studioDefaults: Studio = {
  details: { project: "", student: "", school: "", course: "", sheet: "" },
  scale: { dimension: "", unit: "m", ratio: "100", direction: "paper" },
  rooms: [], circulation: "0", prices: {}, finishes: [],
  site: { address: "", area: "", north: "", front: "", side: "", rear: "", access: "", constraints: "", sources: "" },
  assumptions: "",
};

export const number = (value: string | undefined) => {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1e9 ? n : null;
};
export const display = (value: number) => value.toLocaleString("en-PH", { maximumFractionDigits: 2 });
export const pesos = (value: number) => value.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

export function roomMetrics(room: Room) {
  const length = number(room.length), width = number(room.width), count = number(room.count);
  const excluded = number(room.excluded || "0"), height = number(room.wallHeight), openings = number(room.openings || "0");
  if (!length || !width || !count || !Number.isInteger(count) || excluded === null || openings === null) return null;
  if (excluded > length * width || (!height && openings > 0)) return null;
  const floor = (length * width - excluded) * count;
  const wall = height ? 2 * (length + width) * height : null;
  if (wall !== null && openings > wall) return null;
  return { floor, wall: wall === null ? null : (wall - openings) * count };
}

export function studioFrom(raw: string | null): Studio {
  if (!raw) return studioDefaults;
  try {
    const saved = JSON.parse(raw) as Partial<Studio>;
    return {
      ...studioDefaults, ...saved,
      details: { ...studioDefaults.details, ...saved.details },
      scale: { ...studioDefaults.scale, ...saved.scale },
      site: { ...studioDefaults.site, ...saved.site },
      rooms: Array.isArray(saved.rooms) ? saved.rooms : [],
      finishes: Array.isArray(saved.finishes) ? saved.finishes : [],
    };
  } catch {
    return studioDefaults;
  }
}

