export function midtransSnapScriptUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function midtransClientKey() {
  return process.env.MIDTRANS_CLIENT_KEY ?? "";
}
