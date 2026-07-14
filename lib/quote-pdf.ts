export type QuoteItemInput={description:string;quantity:number;unitPricePence:number;sortOrder?:number};
export type QuoteTotals={subtotalPence:number;discountPence:number;vatPence:number;finalTotalPence:number};

export function calculateQuoteTotals(items:QuoteItemInput[],discountType:"fixed"|"percentage"="fixed",discountValue=0,vatEnabled=false,vatRate=20):QuoteTotals{
  const subtotalPence=items.reduce((sum,item)=>sum+Math.round(item.quantity*item.unitPricePence),0);
  const discountPence=discountType==="percentage"?Math.min(subtotalPence,Math.round(subtotalPence*Math.max(0,discountValue)/100)):Math.min(subtotalPence,Math.round(Math.max(0,discountValue)*100));
  const taxable=Math.max(0,subtotalPence-discountPence);
  const vatPence=vatEnabled?Math.round(taxable*Math.max(0,vatRate)/100):0;
  return{subtotalPence,discountPence,vatPence,finalTotalPence:taxable+vatPence};
}
export function defaultExpiry(quoteDate:string,days=30){const d=new Date(`${quoteDate}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function formatQuoteNumber(year:number,sequence:number){return `QC-${year}-${String(sequence).padStart(4,"0")}`}
export function safePdfFilename(number:string,customer:string){const safe=(customer.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"")||"Customer");return `Quote-${number.replace(/[^A-Za-z0-9-]/g,"")}-${safe}.pdf`}
export function compatibleItems(items:QuoteItemInput[]|null|undefined,valuePence:number,job:string){return items?.length?items:[{description:job||"Quoted work",quantity:1,unitPricePence:valuePence,sortOrder:0}]}
