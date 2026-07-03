"use client";

import { useEffect } from "react";
import { QUOTE_DRAFT_STORAGE_KEY } from "@/components/quote/add-to-quote-button";

export function ClearQuoteDraft() {
  useEffect(() => {
    window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
  }, []);
  return null;
}
