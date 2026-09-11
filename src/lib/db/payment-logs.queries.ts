import { sql } from "./client";

export async function createPaymentLog(data: {
  orderNumber: string;
  endpoint?: string | null;
  logType?: string | null;
  requestPayload?: string | null;
  responsePayload?: string | null;
  httpStatus?: number | null;
}): Promise<void> {
  await sql`
    INSERT INTO payment_logs (
      order_number, endpoint, log_type, request_payload, response_payload, http_status
    ) VALUES (
      ${data.orderNumber}, ${data.endpoint ?? null}, ${data.logType ?? null},
      ${data.requestPayload ?? null}, ${data.responsePayload ?? null}, ${data.httpStatus ?? null}
    )
  `;
}
