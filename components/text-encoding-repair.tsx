"use client";

import { useEffect } from "react";
import { repairTextEncoding } from "@/lib/text";

export function TextEncodingRepair() {
  useEffect(() => {
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((field) => {
      const repaired = repairTextEncoding(field.value);
      if (repaired !== field.value) field.value = repaired;
    });
  }, []);

  return null;
}
