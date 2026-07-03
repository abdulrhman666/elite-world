import "server-only";
import { getSiteSettings } from "@/lib/site-settings";

export type DeliveryEstimates = {
  riyadh: string;
  outsideRiyadh: string;
};

function normalizedCity(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u0623\u0625\u0622]/g, "ا")
    .replace(/\s+/g, " ");
}

export function isRiyadhCity(city: string) {
  const normalized = normalizedCity(city);
  return normalized.includes("الرياض") || normalized.includes("riyadh");
}

export async function getDeliveryEstimates(): Promise<DeliveryEstimates> {
  const settings = await getSiteSettings();
  return {
    riyadh: settings.riyadhDeliveryEstimate,
    outsideRiyadh: settings.outsideDeliveryEstimate,
  };
}

export function deliveryEstimateForCity(
  city: string,
  estimates: DeliveryEstimates,
) {
  return isRiyadhCity(city) ? estimates.riyadh : estimates.outsideRiyadh;
}
