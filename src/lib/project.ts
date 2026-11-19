import {estimate, tools,type Inputs} from "./estimates";
export type Entry={id:string;tool:string;label:string;inputs:Inputs};
const key="formwork.project.v1";
export function read():Entry[]{const raw=localStorage.getItem(key);if(!raw)return [];const rows:unknown=JSON.parse(raw);if(!Array.isArray(rows))throw Error("Invalid saved estimate");return rows.filter(e=>{const t=tools.find(t=>t.id===e?.tool);return t && typeof e.id==="string" && typeof e.label==="string" && e.inputs && estimate(t,e.inputs)});}
export function write(rows:Entry[]){localStorage.setItem(key,JSON.stringify(rows));}

