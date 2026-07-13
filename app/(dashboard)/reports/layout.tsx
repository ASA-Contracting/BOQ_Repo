import { ShellContent } from "@/components/shared/AppShell";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellContent className="flex min-h-0 flex-col overflow-hidden" flush>
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </ShellContent>
  );
}
