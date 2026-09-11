import { createHash } from "crypto";
import midtransClient from "midtrans-client";

function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function snapClient() {
  return new midtransClient.Snap({
    isProduction: isProduction(),
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
  });
}

const ENABLED_BY_CODE: Record<string, string[]> = {
  MIDTRANS_QRIS_GOPAY: ["qris", "gopay"],
  MIDTRANS_BNI_VA: ["bni_va"],
  MIDTRANS_GOPAY: ["gopay"],
  MIDTRANS_MANDIRI_VA: ["echannel", "mandiri_va"],
  MIDTRANS_PERMATA_VA: ["permata_va"],
  MIDTRANS_SHOPEEPAY: ["shopeepay"],
  MIDTRANS_DANA: ["dana"],
  MIDTRANS_OVO: ["other_qris"],
  MIDTRANS_BCA_VA: ["bca_va"],
  MIDTRANS_BRI_VA: ["bri_va"],
  MIDTRANS_BSI_VA: ["other_va"],
  MIDTRANS_CIMB_VA: ["cimb_va"],
  MIDTRANS_DANAMON_VA: ["other_va"],
  MIDTRANS_GOOGLEPAY: ["gopay"],
  MIDTRANS_CREDITCARD: ["credit_card"],
};

export function midtransSnapScriptUrl() {
  return isProduction()
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function midtransClientKey() {
  return process.env.MIDTRANS_CLIENT_KEY ?? "";
}

export async function createSnapToken(params: {
  orderNumber: string;
  grossAmount: number;
  customerDetails: { firstName: string; email: string; phone: string };
  methodCode?: string;
}) {
  const enabled = params.methodCode ? ENABLED_BY_CODE[params.methodCode] : undefined;
  const snap = snapClient();
  const result = await snap.createTransaction({
    transaction_details: {
      order_id: params.orderNumber,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      email: params.customerDetails.email,
      phone: params.customerDetails.phone,
    },
    ...(enabled ? { enabled_payments: enabled } : {}),
  });
  return result as { token: string; redirect_url: string };
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const hash = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY ?? ""}`)
    .digest("hex");
  return hash === signatureKey;
}
