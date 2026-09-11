"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export function SnapModal({
  token,
  clientKey,
  scriptUrl,
  onDone,
}: {
  token: string;
  clientKey: string;
  scriptUrl: string;
  onDone: (kind: "success" | "pending" | "error" | "close") => void;
}) {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-midtrans-snap]");
    const start = () => {
      window.snap?.pay(token, {
        onSuccess: () => onDone("success"),
        onPending: () => onDone("pending"),
        onError: () => onDone("error"),
        onClose: () => onDone("close"),
      });
    };

    if (existing && window.snap) {
      start();
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.setAttribute("data-midtrans-snap", "1");
    script.onload = start;
    document.body.appendChild(script);
  }, [token, clientKey, scriptUrl, onDone]);

  return null;
}
