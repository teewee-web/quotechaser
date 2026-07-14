"use client";
import { useEffect } from "react";
export function ServiceWorker(){useEffect(()=>{if(!("serviceWorker" in navigator))return;if(process.env.NODE_ENV==="production"){navigator.serviceWorker.register("/sw.js").catch(()=>undefined);return}navigator.serviceWorker.getRegistrations().then(items=>items.forEach(item=>item.unregister()));if("caches" in window)caches.keys().then(keys=>keys.forEach(key=>caches.delete(key)))},[]);return null}
