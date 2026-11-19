export const features = [
  { href: "/#tools", label: "Concrete & masonry", description: "Run a calculation and inspect its live 3D model.", art: "concrete" },
  { href: "/studio/scale", label: "Scale & title block", description: "Convert dimensions and set up your drawing sheet.", art: "scale", slug: "scale" },
  { href: "/studio/spaces", label: "Room & area schedule", description: "Measure spaces, openings and circulation.", art: "spaces", slug: "spaces" },
  { href: "/studio/cost", label: "Materials & cost", description: "Price your takeoff in pesos and add finishes.", art: "cost", slug: "cost" },
  { href: "/studio/site", label: "Site analysis", description: "Record constraints, orientation and sources.", art: "site", slug: "site" },
  { href: "/studio/pack", label: "Plate & thesis pack", description: "Review and print a complete A3 submission.", art: "pack", slug: "pack" },
  { href: "/quiz", label: "Quiz reviewer", description: "Import questions and review your module.", art: "quiz" },
  { href: "/summary", label: "My estimate", description: "Open your saved takeoffs and material totals.", art: "estimate" },
  { href: "/guide", label: "Material guide", description: "Look up workbook factors and mix proportions.", art: "guide" },
] as const;
