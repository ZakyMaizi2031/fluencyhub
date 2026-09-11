import { put } from "@vercel/blob";

export async function uploadFile(params: {
  file: File | Blob;
  folder: string;
  filename: string;
}) {
  const pathname = `${params.folder}/${Date.now()}-${params.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const result = await put(pathname, params.file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: result.url, pathname: result.pathname };
}
