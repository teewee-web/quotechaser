import { repairTextEncoding } from "./text";

export const gbp = (pence:number) => new Intl.NumberFormat("en-GB", { style:"currency", currency:"GBP" }).format(pence/100);
export const ukDate = (date:string|null|undefined) => date ? new Intl.DateTimeFormat("en-GB").format(new Date(`${date.slice(0,10)}T12:00:00`)) : "—";
export const todayISO = () => new Date().toLocaleDateString("en-CA", { timeZone:"Europe/London" });
export const daysBetween = (from:string,to=todayISO()) => Math.floor((new Date(`${to}T12:00:00Z`).getTime()-new Date(`${from}T12:00:00Z`).getTime())/86400000);
export const fillTemplate = (template:string, values:Record<string,string>) => Object.entries(values).reduce((text,[key,value]) => text.replaceAll(`[${key}]`,value),repairTextEncoding(template));
export const whatsappUrl = (mobile:string,message:string) => `https://wa.me/${mobile.replace(/\D/g,"").replace(/^0/,"44")}?text=${encodeURIComponent(message)}`;
