import { CmsSettingsForm } from "@/components/admin/CmsSettingsForm";
import { getSettingsMap } from "@/lib/db/landing.queries";

export default async function CmsSettingsPage() {
  const settings = await getSettingsMap();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Landing settings</h1>
      <CmsSettingsForm initial={settings} />
    </div>
  );
}
