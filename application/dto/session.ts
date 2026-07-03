import type { Role } from "@/domain/shared/Role";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  roles: Role[];
};
