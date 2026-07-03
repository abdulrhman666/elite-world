import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  inverse?: boolean;
  className?: string;
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  inverse = false,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <Badge
          className={cn(inverse && "border-white/15 bg-white/10 text-cyan-100")}
        >
          {eyebrow}
        </Badge>
      )}
      <h2
        id={id}
        className={cn(
          "text-brand-ink mt-4 text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl",
          inverse && "text-white",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-8 text-slate-600 sm:text-lg",
            inverse && "text-slate-200",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
