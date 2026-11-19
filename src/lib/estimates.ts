import guide from "./guide.json";

export { guide };
export type Group = "Concrete" | "Masonry" | "Methods";
type Field = { key: string; label: string; unit: string; options?: string[]; initial?: string; integer?: boolean };
const field = (key: string, label: string, unit = "m", initial?: string): Field => ({ key, label, unit, initial });
const choice = (key: string, label: string, unit: string, options: (string|number)[], initial?: string): Field => ({ key, label, unit, options: options.map(String), initial });
const length = field("length","Length"), width = field("width","Width"), height = field("height","Height"), area = field("area","Area","m²");
const qty: Field = {...field("qty","Quantity","pcs","1"),integer:true};
const thick = (v: string) => choice("thickness","Thickness","cm",guide.area.map(r=>r[0]),v);
const cut = field("cut","Area of openings","m²","0");
const dims = [length,width,height,qty];
const stair = [{...field("steps","Number of steps","steps"),integer:true},field("rise","Riser height"),field("run","Tread run"),width,field("stringer","Stringer thickness")];
export type Tool = { id:string; name:string; group:Group; fields:Field[]; mix:string; formula:string };
const tool = (id:string,name:string,fields:Field[],formula:string,mix="A",group:Group="Concrete"):Tool => ({id,name,fields,formula,mix,group});
const product = "Length × width × height × quantity";
const slabFormula = "Thickness in metres × area × quantity";
const foot = [length,width,field("height","Thickness"),qty];
export const tools = [
 tool("footing","Pad footing",foot,"Length × width × thickness × quantity","AA"),
 tool("slab","Floor slab",[thick("12.5"),area,qty],slabFormula,"AA"),
 tool("column","Rectangular column",dims,product),
 tool("beam","Girder & beam",dims,product,"AA"),
 tool("stairs","Concrete stairs",[...stair,qty],"Workbook project method: steps × rise × run × width × stringer thickness × quantity"),
 tool("chb","CHB wall & mortar",[choice("block","Block size","cm",guide.block.map(r=>r[0])),length,height,cut],"(Length × height − openings) × block or mortar factor","C","Masonry"),
 tool("wall-footing","Wall footing",[{...length,label:"Length / perimeter"},...foot.slice(1)],"Length × width × thickness × quantity","AA"),
 tool("tie-beam","Footing tie beam",dims,product),
 tool("lintel","Lintel beam",dims,product,"AA"),
 tool("rc-wall","RC wall",[thick("30"),area,qty],slabFormula),
 tool("stiffener","Stiffener column",dims,product),
 tool("landing","Stair landing",[thick("10"),area,qty],slabFormula,"B"),
 tool("plaster","Wall plaster",[choice("mm","Plaster thickness","mm",[8,12,16,20,25],"12"),choice("sides","Coated faces","sides",[1,2]),length,height,cut],"(Faces × length × height − total openings) × plaster factor","C","Masonry"),
 tool("tank","Septic tank",[field("walls","Wall volume","m³"),field("top","Top slab volume","m³"),field("base","Bottom slab volume","m³")],"Walls + top slab + bottom slab","AA"),
 tool("gutter","Concrete gutter",[{...area,label:"Cross-sectional area"},length],"Cross-sectional area × length","C"),
 tool("saddle","Concrete saddle",[{...area,label:"Cross-sectional area"},field("depth","Saddle thickness"),qty],"Cross-sectional area × thickness × quantity","AA"),
 tool("volume","Known volume",[field("volume","Concrete volume","m³")],"Entered volume × mix factors","A","Methods"),
 tool("dimensions","Detailed volume",dims,product,"A","Methods"),
 tool("area-method","Slab & wall by area",[thick("7.5"),area,qty],"Area × quantity × tabulated factor for thickness and class","B","Methods"),
 tool("stair-flight","Stair flight by geometry",stair,"Steps × width × (stringer thickness × sloping tread length + rise × run ÷ 2)","A","Methods"),
 tool("round-column","Circular column",[choice("dia","Column diameter","cm",guide.column.map(r=>r[0]),"60"),height,qty],"Height × quantity × tabulated factor for diameter and class","A","Methods"),
 tool("pipe","Concrete pipe",[choice("outer","Outer diameter","cm",guide.pipe.map(r=>r[0]),"110"),choice("inner","Inner diameter","cm",guide.pipe.map(r=>r[1]),"90"),qty],"0.7854 × (outer diameter² − inner diameter²) × quantity, using metres and unit length","A","Methods"),
 tool("others","Other materials",[field("cement","Cement","40 kg bags","0"),field("sand","Sand","m³","0"),field("gravel","Gravel","m³","0")],"Manual additions to the concrete subtotal","AA"),
];
export const mixes = (t:Tool) => t.group==="Masonry"?["A","B","C","D"]:["round-column","pipe"].includes(t.id)?["A","B"]:t.id==="area-method"?["A","B","C"]:["AA","A","B","C"];
export type Inputs = Record<string,string>;
export function defaults(t:Tool):Inputs { return Object.fromEntries([["mix",t.mix],...t.fields.map(f=>[f.key,f.initial??f.options?.[0]??""])]); }
export type Result = {cement:number;sand:number;gravel:number; volume?:number;area?:number;blocks?:number;bag50?:number};
export function estimate(t:Tool,v:Inputs):Result|null {
 const validMix = mixes(t).includes(v.mix) || (t.id === "pipe" && ["AA", "C"].includes(v.mix));
 if (!validMix) return null;
 for (const field of t.fields) {
  const value = v[field.key];
  if (typeof value !== "string") return null;
  if (field.options) {
   if (!field.options.includes(value)) return null;
   continue;
  }
  if (field.key === "cut" && !value.trim()) continue;
  const number = Number(value);
  if (!value.trim() || !Number.isFinite(number) || number < 0 || (field.integer && !Number.isInteger(number))) return null;
 }
 const n=(k:string)=>Number(v[k]);
 const q=n("qty"), h=n("height"), a=n("area"), l=n("length"), w=n("width");
 const concrete=guide.mix.find(r=>r[0]===v.mix);
 const idx=mixes(t).indexOf(v.mix);
 if(t.id==="others") return {cement:n("cement"),sand:n("sand"),gravel:n("gravel")};
 if(t.group==="Masonry"){
  const net=l*h*(t.id==="plaster"?n("sides"):1)-n("cut");
  if(net<0) return null;
  if(t.id==="chb"){const row=guide.block.find(r=>r[0]===v.block)!;return {area:net,blocks:net*12.5,cement:net*Number(row[2+idx]),sand:net*Number(row[6]),gravel:0};}
  const col=[8,12,16,20,25].indexOf(n("mm"))+1;
  return {area:net,cement:net*Number(guide.plaster[idx][col]),sand:net*Number(guide.plaster[4][col]),gravel:0};
 }
 let volume:number;
 switch(t.id){
 case "area-method":{const r=guide.area.find(r=>r[0]===n("thickness"))!, scale=a*q;return {volume:scale*r[0]/100,cement:scale*r[1+idx],bag50:scale*r[4+idx],sand:scale*r[7],gravel:scale*r[8]};}
 case "round-column":{const r=guide.column.find(r=>r[0]===n("dia"))!, scale=h*q;return {volume:0.7854*(r[0]/100)**2*scale,cement:scale*r[1+idx],bag50:scale*r[3+idx],sand:scale*r[5],gravel:scale*r[6]};}
 case "pipe": if(n("inner")>=n("outer")) return null; volume=0.7854*((n("outer")/100)**2-(n("inner")/100)**2)*q;break;
 case "slab":case "rc-wall":case "landing":volume=n("thickness")/100*a*q;break;
 case "volume":volume=n("volume");break;
 case "tank":volume=n("top")+n("walls")+n("base");break;
 case "gutter":volume=a*l;break;
 case "saddle":volume=a*n("depth")*q;break;
 case "stairs":volume=n("steps")*n("rise")*n("run")*w*n("stringer")*q;break;
 case "stair-flight":volume=n("steps")*w*(Math.hypot(n("rise"),n("run"))*n("stringer")+0.5*n("rise")*n("run"));break;
 default:volume=l*w*h*q;
 }
 return {volume,cement:volume*Number(concrete![2]),sand:volume*0.5,gravel:volume,...(t.group==="Methods"?{bag50:volume*Number(concrete![3])}:{})};
}
export const format=(n:number)=>n.toLocaleString("en-US",{maximumFractionDigits:6});


