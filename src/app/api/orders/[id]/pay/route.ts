import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getOrderById, updateOrderStatus } from "@/lib/db/orders.queries";
import { createPaymentLog } from "@/lib/db/payment-logs.queries";
import { getPaymentMethodById } from "@/lib/db/payment-methods.queries";
import { getUserById } from "@/lib/db/users.queries";
import { chargeMidtransCore, createSnapToken } from "@/lib/payment/midtrans";
import {
  createXenditEWallet,
  createXenditQRIS,
  createXenditRetail,
  createXenditVA,
} from "@/lib/payment/xendit";
import { auth } from "@/lib/session";

function appBaseUrl() {
  return process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

async function makeQrImage(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  return QRCode.toDataURL(value, { width: 280, margin: 2, errorCorrectionLevel: "M" });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order || order.userId !== Number(session.user.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [method, user] = await Promise.all([
    order.paymentMethodId ? getPaymentMethodById(order.paymentMethodId) : Promise.resolve(null),
    getUserById(order.userId),
  ]);
  if (!method || !user) {
    return NextResponse.json({ error: "Payment method missing" }, { status: 400 });
  }

  const amount = Number(order.totalAmount);
  const customer = {
    firstName: user.name,
    email: user.email,
    phone: user.whatsappNumber ?? "081000000000",
  };

  if (order.status === "awaiting_payment") {
    const storedQr = order.gatewayPaymentUrl;
    if (storedQr && (method.type === "qr_code" || method.code.includes("QRIS") || storedQr.startsWith("000201"))) {
      return NextResponse.json({
        data: {
          order,
          path: "qris",
          qrString: storedQr,
          qrImage: await makeQrImage(storedQr),
        },
      });
    }
    if (order.vaNumber) {
      return NextResponse.json({ data: { order, path: "va", vaNumber: order.vaNumber } });
    }
    if (method.provider === "midtrans" && order.gatewayTransactionId) {
      return NextResponse.json({
        data: { order, path: "snap", snapToken: order.gatewayTransactionId },
      });
    }
    if (storedQr?.startsWith("http")) {
      return NextResponse.json({ data: { order, path: "redirect", checkoutUrl: storedQr } });
    }
  }

  try {
    if (method.provider === "manual") {
      const updated = await updateOrderStatus(order.id, "awaiting_payment");
      await createPaymentLog({
        orderNumber: order.orderNumber,
        endpoint: "/api/orders/pay",
        logType: "payment_request",
        responsePayload: JSON.stringify({ path: "manual" }),
        httpStatus: 200,
      });
      return NextResponse.json({ data: { order: updated, path: "manual" } });
    }

    if (method.provider === "midtrans") {
      if (!process.env.MIDTRANS_SERVER_KEY) {
        return NextResponse.json({ error: "Midtrans is not configured" }, { status: 400 });
      }
      const callbackUrl = `${appBaseUrl()}/checkout/success?orderNumber=${order.orderNumber}`;
      const charged = await chargeMidtransCore({
        orderNumber: order.orderNumber,
        grossAmount: amount,
        methodCode: method.code,
        customerDetails: customer,
        callbackUrl,
      });
      if (charged.success) {
        const qrString = charged.qrString ?? null;
        const qrImage = charged.qrImageUrl
          ? charged.qrImageUrl
          : qrString
            ? await makeQrImage(qrString)
            : null;
        const updated = await updateOrderStatus(order.id, "awaiting_payment", {
          vaNumber: charged.vaNumber ?? null,
          gatewayTransactionId: charged.transactionId || null,
          gatewayPaymentUrl: qrString ?? charged.redirectUrl ?? charged.qrImageUrl ?? null,
        });
        await createPaymentLog({
          orderNumber: order.orderNumber,
          endpoint: "midtrans.core.charge",
          logType: "payment_request",
          responsePayload: JSON.stringify({
            transactionId: charged.transactionId,
            hasVa: Boolean(charged.vaNumber),
            hasQr: Boolean(qrImage),
          }),
          httpStatus: 200,
        });
        if (qrImage) {
          return NextResponse.json({
            data: { order: updated, path: "qris", qrString, qrImage },
          });
        }
        if (charged.vaNumber) {
          return NextResponse.json({
            data: { order: updated, path: "va", vaNumber: charged.vaNumber },
          });
        }
        if (charged.redirectUrl) {
          return NextResponse.json({
            data: { order: updated, path: "redirect", checkoutUrl: charged.redirectUrl },
          });
        }
      }
      const snap = await createSnapToken({
        orderNumber: order.orderNumber,
        grossAmount: amount,
        customerDetails: customer,
        methodCode: method.code,
      });
      const updated = await updateOrderStatus(order.id, "awaiting_payment", {
        gatewayPaymentUrl: snap.redirect_url,
        gatewayTransactionId: snap.token,
      });
      await createPaymentLog({
        orderNumber: order.orderNumber,
        endpoint: "midtrans.snap.createTransaction",
        logType: "payment_request",
        responsePayload: JSON.stringify({ token: snap.token, coreFallback: !charged.success }),
        httpStatus: 200,
      });
      return NextResponse.json({
        data: { order: updated, path: "snap", snapToken: snap.token },
      });
    }

    if (method.provider === "xendit") {
      if (!process.env.XENDIT_API_KEY && !process.env.XENDIT_SECRET_KEY) {
        return NextResponse.json({ error: "Xendit is not configured" }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const successUrl = `${appBaseUrl()}/checkout/success?orderNumber=${order.orderNumber}`;
      const failUrl = `${appBaseUrl()}/checkout?courseId=${order.courseId}`;

      if (method.type === "va") {
        const va = await createXenditVA({
          externalId: order.orderNumber,
          methodCode: method.code,
          name: user.name,
          amount,
          expiresAt,
        });
        const updated = await updateOrderStatus(order.id, "awaiting_payment", {
          vaNumber: va.account_number,
          gatewayTransactionId: va.id,
          expiresAt,
        });
        await createPaymentLog({
          orderNumber: order.orderNumber,
          endpoint: "xendit.va",
          logType: "payment_request",
          responsePayload: JSON.stringify(va),
          httpStatus: 200,
        });
        return NextResponse.json({
          data: { order: updated, path: "va", vaNumber: va.account_number, expiresAt },
        });
      }

      if (method.type === "qr_code" || method.code.includes("QRIS")) {
        const qr = await createXenditQRIS({ externalId: order.orderNumber, amount });
        const qrImage = await QRCode.toDataURL(qr.qr_string, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        const updated = await updateOrderStatus(order.id, "awaiting_payment", {
          gatewayTransactionId: qr.id,
          gatewayPaymentUrl: qr.qr_string,
        });
        await createPaymentLog({
          orderNumber: order.orderNumber,
          endpoint: "xendit.qris",
          logType: "payment_request",
          responsePayload: JSON.stringify({ id: qr.id, hasQrString: Boolean(qr.qr_string) }),
          httpStatus: 200,
        });
        return NextResponse.json({
          data: { order: updated, path: "qris", qrString: qr.qr_string, qrImage },
        });
      }

      if (method.type === "e_wallet") {
        const charge = await createXenditEWallet({
          externalId: order.orderNumber,
          amount,
          methodCode: method.code,
          successRedirectURL: successUrl,
          failureRedirectURL: failUrl,
          mobileNumber: user.whatsappNumber ?? undefined,
        });
        const checkoutUrl =
          charge.actions?.desktop_web_checkout_url ??
          charge.actions?.mobile_web_checkout_url ??
          null;
        const updated = await updateOrderStatus(order.id, "awaiting_payment", {
          gatewayTransactionId: charge.id,
          gatewayPaymentUrl: checkoutUrl,
        });
        await createPaymentLog({
          orderNumber: order.orderNumber,
          endpoint: "xendit.ewallet",
          logType: "payment_request",
          responsePayload: JSON.stringify(charge),
          httpStatus: 200,
        });
        return NextResponse.json({
          data: { order: updated, path: "redirect", checkoutUrl },
        });
      }

      if (method.type === "retail_outlet") {
        const retail = await createXenditRetail({
          externalId: order.orderNumber,
          amount,
          methodCode: method.code,
        });
        const updated = await updateOrderStatus(order.id, "awaiting_payment", {
          vaNumber: retail.payment_code,
          gatewayTransactionId: retail.id,
        });
        await createPaymentLog({
          orderNumber: order.orderNumber,
          endpoint: "xendit.retail",
          logType: "payment_request",
          responsePayload: JSON.stringify(retail),
          httpStatus: 200,
        });
        return NextResponse.json({
          data: { order: updated, path: "va", vaNumber: retail.payment_code },
        });
      }
    }

    return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    await createPaymentLog({
      orderNumber: order.orderNumber,
      endpoint: "/api/orders/pay",
      logType: "payment_request",
      responsePayload: message,
      httpStatus: 502,
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
