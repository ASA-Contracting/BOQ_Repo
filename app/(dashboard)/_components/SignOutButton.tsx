import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button variant="ghost" size="icon" aria-label="Sign out" type="submit">
        <LogOut className="h-4 w-4" />
      </Button>
    </form>
  );
}
