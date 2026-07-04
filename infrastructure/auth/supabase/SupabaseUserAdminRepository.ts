import type {
  AdminUserRecord,
  InviteUserParams,
  IUserAdminRepository,
  ListUsersParams,
  UpdateUserParams,
} from "@/application/ports/IUserAdminRepository";
import type { Role } from "@/domain/shared/Role";
import { isRole } from "@/domain/shared/Role";
import { createSupabaseAdminClient } from "@/infrastructure/auth/supabase/adminClient";

function parseRolesFromAppMetadata(
  appMetadata: Record<string, unknown> | undefined,
): Role[] {
  const raw = appMetadata?.roles;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(
    (entry): entry is Role => typeof entry === "string" && isRole(entry),
  );
}

function mapSupabaseUser(user: {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): AdminUserRecord {
  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null;

  const isBanned =
    user.banned_until !== null &&
    user.banned_until !== undefined &&
    new Date(user.banned_until).getTime() > Date.now();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    roles: parseRolesFromAppMetadata(user.app_metadata),
    isActive: !isBanned,
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

export class SupabaseUserAdminRepository implements IUserAdminRepository {
  private getClient() {
    const client = createSupabaseAdminClient();
    if (!client) {
      throw new Error("Supabase admin client is not configured.");
    }
    return client;
  }

  async listUsers(
    params: ListUsersParams,
  ): Promise<{ items: AdminUserRecord[]; total: number }> {
    const client = this.getClient();
    const { data, error } = await client.auth.admin.listUsers({
      page: params.page,
      perPage: params.pageSize,
    });

    if (error) {
      throw new Error(error.message);
    }

    let items = (data.users ?? []).map(mapSupabaseUser);

    if (params.search) {
      const needle = params.search.toLowerCase();
      items = items.filter(
        (user) =>
          user.email.toLowerCase().includes(needle) ||
          (user.displayName?.toLowerCase().includes(needle) ?? false),
      );
    }

    return {
      items,
      total: params.search ? items.length : data.total ?? items.length,
    };
  }

  async getUserById(id: string): Promise<AdminUserRecord | null> {
    const client = this.getClient();
    const { data, error } = await client.auth.admin.getUserById(id);

    if (error) {
      if (error.message.toLowerCase().includes("not found")) {
        return null;
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      return null;
    }

    return mapSupabaseUser(data.user);
  }

  async inviteUser(params: InviteUserParams): Promise<AdminUserRecord> {
    const client = this.getClient();
    const { data, error } = await client.auth.admin.inviteUserByEmail(
      params.email,
      {
        data: params.displayName
          ? { display_name: params.displayName }
          : undefined,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Invite succeeded but no user was returned.");
    }

    const { data: updated, error: updateError } =
      await client.auth.admin.updateUserById(data.user.id, {
        app_metadata: { roles: params.roles },
      });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return mapSupabaseUser(updated.user ?? data.user);
  }

  async updateUser(params: UpdateUserParams): Promise<AdminUserRecord> {
    const client = this.getClient();
    const existing = await this.getUserById(params.id);
    if (!existing) {
      throw new Error(`User "${params.id}" was not found.`);
    }

    const nextRoles = params.roles ?? existing.roles;
    const nextDisplayName =
      params.displayName === undefined
        ? existing.displayName
        : params.displayName;
    const nextActive =
      params.isActive === undefined ? existing.isActive : params.isActive;

    const { data, error } = await client.auth.admin.updateUserById(params.id, {
      app_metadata: { roles: nextRoles },
      user_metadata: {
        display_name: nextDisplayName,
      },
      ban_duration: nextActive ? "none" : "876000h",
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Update succeeded but no user was returned.");
    }

    return mapSupabaseUser(data.user);
  }

  async countActiveSystemAdministrators(
    excludeUserId?: string,
  ): Promise<number> {
    const client = this.getClient();
    const { data, error } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data.users ?? [])
      .map(mapSupabaseUser)
      .filter(
        (user) =>
          user.isActive &&
          user.roles.includes("system_administrator") &&
          user.id !== excludeUserId,
      ).length;
  }
}
