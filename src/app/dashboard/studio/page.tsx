import { LandingIcon } from "@/components/landing/LandingIcon";

export default function StudioPage() {
  return (
    <main className="flex h-[calc(100vh-72px)] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
        <LandingIcon name="Building2" color="currentColor" />
      </div>
      <h1 className="mb-3 text-3xl font-extrabold text-zinc-900">Studio</h1>
      <p className="max-w-md text-zinc-500">
        Halaman ini sedang dalam tahap pengembangan. Fitur Studio khusus akan segera hadir.
      </p>
    </main>
  );
}
