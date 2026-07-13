import { redirect } from "next/navigation";

export default function DevPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return children;
}
