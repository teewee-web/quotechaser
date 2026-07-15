"use client";

import { useEffect } from "react";
import { repairTextEncoding } from "@/lib/text";

export function TextEncodingRepair() {
  useEffect(() => {
    const repairFields = () => {
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((field) => {
        const repaired = repairTextEncoding(field.value);
        if (repaired !== field.value) field.value = repaired;
      });
    };

    repairFields();
    const observer = new MutationObserver(repairFields);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
