export function QrCodeImage({ src, alt = "QRIS payment" }: { src: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="mx-auto h-64 w-64 rounded-md border border-[var(--border)] bg-white p-2"
    />
  );
}
