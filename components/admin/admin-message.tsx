export function AdminMessage({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm font-medium ${
        tone === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-red-300 bg-red-50 text-red-900"
      }`}
      role="status"
    >
      {children}
    </div>
  );
}
