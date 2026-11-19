import {notFound} from "next/navigation";
import {tools} from "@/lib/estimates";
import Calculator from "@/components/calculator";
export function generateStaticParams(){return tools.map(t=>({slug:t.id}))}
export default async function ToolPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const tool=tools.find(t=>t.id===slug);if(!tool)notFound();return <Calculator key={slug} tool={tool}/>}
