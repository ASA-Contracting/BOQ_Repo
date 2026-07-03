import { ensureAspNetUser } from "@/infrastructure/persistence/boq/DrizzleBoqImportRepository";

export { ensureAspNetUser };

export async function ensureAspNetUserFromContext(input: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<void> {
  await ensureAspNetUser({
    userId: input.userId,
    email: input.email ?? null,
    displayName: input.displayName ?? null,
  });
}
