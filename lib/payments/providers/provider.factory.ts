import type { IPaymentProvider } from "@/lib/payments/providers/IPaymentProvider";
import { HttpPaymentProvider } from "@/lib/payments/providers/http.provider";
import { getPaymentProviderConfig } from "@/lib/payments/settings";

export async function getPaymentProvider(
  providerName?: string,
): Promise<IPaymentProvider> {
  const config = await getPaymentProviderConfig(providerName);
  if (!config) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  return new HttpPaymentProvider(config);
}
