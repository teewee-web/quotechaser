"use client";
import { useEffect } from "react";
export function TrackedLink({href,className,children}:{event?:string;href:string;className?:string;children:React.ReactNode}){return <a href={href} className={className}>{children}</a>}
export function PricingTracker(){useEffect(()=>{const node=document.getElementById("pricing");if(!node)return;let fired=false;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!fired){fired=true;window.quoteChaserAnalytics?.("pricing_view");observer.disconnect()}},{threshold:.35});observer.observe(node);return()=>observer.disconnect()},[]);return null}
