export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrentYear() {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", { year: "numeric" }).format(
    new Date(),
  );
}
