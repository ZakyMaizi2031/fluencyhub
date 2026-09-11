function xenditKey() {
  return process.env.XENDIT_API_KEY ?? process.env.XENDIT_SECRET_KEY ?? "";
}

function authHeader() {
  return `Basic ${Buffer.from(`${xenditKey()}:`).toString("base64")}`;
}

async function xenditFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.xendit.co${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { message?: string; error_code?: string };
  if (!res.ok) {
    throw new Error(json.message ?? json.error_code ?? `Xendit error ${res.status}`);
  }
  return json;
}

const VA_BANKS: Record<string, string> = {
  XENDIT_VA_BCA: "BCA",
  XENDIT_VA_MANDIRI: "MANDIRI",
  XENDIT_VA_BSI: "BSI",
  XENDIT_VA_BRI: "BRI",
  XENDIT_VA_BNI: "BNI",
  XENDIT_VA_BJB: "BJB",
  XENDIT_VA_BNC: "BNC",
  XENDIT_VA_CIMB: "CIMB",
  XENDIT_VA_MUAMALAT: "MUAMALAT",
  XENDIT_VA_PERMATA: "PERMATA",
};

const EWALLET_CHANNELS: Record<string, string> = {
  XENDIT_EWALLET_GOPAY: "ID_GOPAY",
  XENDIT_EWALLET_SHOPEEPAY: "ID_SHOPEEPAY",
  XENDIT_EWALLET_DANA: "ID_DANA",
  XENDIT_EWALLET_LINKAJA: "ID_LINKAJA",
};

export async function createXenditVA(params: {
  externalId: string;
  methodCode: string;
  name: string;
  amount: number;
  expiresAt: Date;
}) {
  const bankCode = VA_BANKS[params.methodCode];
  if (!bankCode) throw new Error(`Unsupported Xendit VA: ${params.methodCode}`);
  return xenditFetch<{
    id: string;
    account_number: string;
    expiration_date?: string;
  }>("/callback_virtual_accounts", {
    external_id: params.externalId,
    bank_code: bankCode,
    name: params.name.slice(0, 50),
    expected_amount: Math.round(params.amount),
    is_closed: true,
    is_single_use: true,
    expiration_date: params.expiresAt.toISOString(),
  });
}

export async function createXenditQRIS(params: {
  externalId: string;
  amount: number;
}) {
  return xenditFetch<{
    id: string;
    qr_string: string;
  }>("/qr_codes", {
    reference_id: params.externalId,
    type: "DYNAMIC",
    currency: "IDR",
    amount: Math.round(params.amount),
  });
}

export async function createXenditEWallet(params: {
  externalId: string;
  amount: number;
  methodCode: string;
  successRedirectURL: string;
  failureRedirectURL: string;
  mobileNumber?: string;
}) {
  const channelCode = EWALLET_CHANNELS[params.methodCode];
  if (!channelCode) throw new Error(`Unsupported Xendit e-wallet: ${params.methodCode}`);
  return xenditFetch<{
    id: string;
    actions?: { desktop_web_checkout_url?: string; mobile_web_checkout_url?: string };
    status?: string;
  }>("/ewallets/charges", {
    reference_id: params.externalId,
    currency: "IDR",
    amount: Math.round(params.amount),
    checkout_method: "ONE_TIME_PAYMENT",
    channel_code: channelCode,
    channel_properties: {
      success_redirect_url: params.successRedirectURL,
      failure_redirect_url: params.failureRedirectURL,
      ...(params.mobileNumber ? { mobile_number: params.mobileNumber } : {}),
    },
  });
}

export async function createXenditRetail(params: {
  externalId: string;
  amount: number;
  methodCode: string;
}) {
  const channel = params.methodCode === "XENDIT_RETAIL_INDOMARET" ? "INDOMARET" : "ALFAMART";
  return xenditFetch<{
    id: string;
    payment_code: string;
  }>("/payment_codes", {
    reference_id: params.externalId,
    channel_code: channel,
    market: "ID",
    currency: "IDR",
    amount: Math.round(params.amount),
    customer_name: "FluencyHub",
  });
}

export function verifyXenditWebhook(callbackToken: string): boolean {
  const expected =
    process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN ?? process.env.XENDIT_WEBHOOK_TOKEN ?? "";
  if (!expected) return true;
  return callbackToken === expected;
}
