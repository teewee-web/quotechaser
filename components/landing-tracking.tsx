"use client";
import{useEffect}from"react";
declare global{interface Window{quoteChaserAnalytics?:(event:string,properties?:Record<string,string>)=>void}}
export function TrackedLink({event,href,className,children}:{event:string;href:string;className?:string;children:React.ReactNode}){return <a href={href} className={className} onClick={()=>{window.quoteChaserAnalytics?.(event,{href});window.dispatchEvent(new CustomEvent("quotechaser:analytics",{detail:{event,href}}))}}>{children}</a>}
export function PricingTracker(){useEffect(()=>{const node=document.getElementById("pricing");if(!node)return;let fired=false;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!fired){fired=true;window.quoteChaserAnalytics?.("pricing_view");window.dispatchEvent(new CustomEvent("quotechaser:analytics",{detail:{event:"pricing_view"}}));observer.disconnect()}},{threshold:.35});observer.observe(node);return()=>observer.disconnect()},[]);return null}
