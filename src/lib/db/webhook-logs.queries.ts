import { sql } from "./client";

export async function createWebhookLog(data: {
  orderNumber?: string | null;
  provider: "midtrans" | "xendit";
  eventType?: string | null;
  gatewayTxnId?: string | null;
  payloadJson: unknown;
  signatureValid: boolean;
  processingStatus?: string;
  errorMessage?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO webhook_logs (
      order_number, provider, event_type, gateway_txn_id, payload_json,
      signature_valid, processing_status, error_message
    ) VALUES (
      ${data.orderNumber ?? null}, ${data.provider}, ${data.eventType ?? null},
      ${data.gatewayTxnId ?? null}, ${JSON.stringify(data.payloadJson)}::jsonb,
      ${data.signatureValid}, ${data.processingStatus ?? "received"}, ${data.errorMessage ?? null}
    )
  `;
}
