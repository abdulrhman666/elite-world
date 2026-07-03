import Image from "next/image";
import { LoadingSpinner } from "@/components/ui/feedback";
import { siteConfig } from "@/config/site";

export default function Loading() {
  return (
    <div
      className="bg-brand-surface grid min-h-[65vh] place-items-center"
      role="status"
      aria-label="جارٍ تحميل الصفحة"
    >
      <div className="text-center">
        <Image
          src={siteConfig.logo}
          width={126}
          height={100}
          alt="شعار ELITE WORLD"
          className="mx-auto h-24 w-auto object-contain"
          priority
        />
        <div className="mt-6">
          <LoadingSpinner label="جارٍ تجهيز الصفحة" />
        </div>
      </div>
    </div>
  );
}
