import { Settings } from "lucide-react";
import { AdminMessage } from "@/components/admin/admin-message";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getAdminSiteSettingsEditor } from "@/lib/admin/site-settings-admin";

type AdminSettingsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const params = await searchParams;
  const editor = await getAdminSiteSettingsEditor();

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="bg-brand-cyan/10 text-brand-petroleum grid size-12 place-items-center rounded-2xl">
          <Settings className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-brand-cyan text-sm font-bold">إعدادات الموقع</p>
          <h1 className="text-brand-ink mt-1 text-3xl font-bold">
            مركز إعدادات سهل
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
        عدّل بيانات الشركة والرئيسية والهوية والتواصل والفوتر من مكان واحد. تظهر
        التغييرات مباشرة بعد الحفظ.
      </p>

      <div className="mt-6 space-y-3">
        {editor.message && (
          <AdminMessage tone="error">{editor.message}</AdminMessage>
        )}
        {params.success === "saved" && (
          <AdminMessage tone="success">
            تم حفظ الإعدادات وتحديث صفحات الموقع.
          </AdminMessage>
        )}
        {params.success === "restored" && (
          <AdminMessage tone="success">
            تمت استعادة القيم الافتراضية وتحديث صفحات الموقع.
          </AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">{params.error}</AdminMessage>
        )}
      </div>

      <SiteSettingsForm
        settings={editor.settings}
        media={editor.media}
        readOnly={editor.readOnly}
      />
    </div>
  );
}
