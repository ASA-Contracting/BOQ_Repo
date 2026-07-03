import { redirect } from "next/navigation";

import { ImportWizard } from "@/app/(dashboard)/workshop/import/_components/ImportWizard";
import { getSessionUser } from "@/infrastructure/auth/getSessionUser";

export default async function WorkshopImportPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <ImportWizard />;
}
