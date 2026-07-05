import { z } from "zod";

import type {
  DeleteSavedFilterInput,
  ListSavedFiltersInput,
  SavedFilterDto,
  SetFavoriteSavedFilterInput,
  UpsertSavedFilterInput,
} from "@/application/dto/preferences/savedFilterDto";
import type { ISavedFilterRepository } from "@/application/ports/ISavedFilterRepository";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import { NotFoundError } from "@/domain/shared/errors/NotFoundError";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import { normalizeSavedViewDefinition } from "@/lib/filter-engine/saved-views";
import type { SavedFilterDefinition } from "@/lib/filter-engine";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

const savedFilterJoinSchema = z.enum(["and", "or"]);
const filterOperatorSchema = z.enum([
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
  "greaterThan",
  "lessThan",
  "greaterThanOrEqual",
  "lessThanOrEqual",
  "in",
  "notIn",
  "isEmpty",
  "notEmpty",
  "globalSearch",
]);

const sortDirectionSchema = z.enum(["asc", "desc"]);

const savedViewLayoutSchema = z
  .object({
    hiddenColumnIds: z.array(z.string()).optional(),
    columnOrder: z.array(z.string()).optional(),
    pinById: z.record(z.string(), z.enum(["left", "right"])).optional(),
    alignById: z.record(z.string(), z.enum(["left", "center", "right"])).optional(),
    widthById: z.record(z.string(), z.string()).optional(),
  })
  .optional();

const savedFilterDefinitionSchema = z.object({
  groups: z
    .array(
      z.object({
        joinWithPrev: savedFilterJoinSchema.optional(),
        rows: z.array(
          z.object({
            field: z.string().min(1),
            operator: filterOperatorSchema,
            value: z.string(),
            joinWithPrev: savedFilterJoinSchema.optional(),
          }),
        ),
      }),
    )
    .default([]),
  globalSearch: z.string().optional(),
  sorts: z
    .array(
      z.object({
        field: z.string().min(1),
        direction: sortDirectionSchema,
      }),
    )
    .optional(),
  columnFilters: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: filterOperatorSchema,
        value: z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.null(),
          z.array(z.union([z.string(), z.number(), z.boolean()])),
        ]),
      }),
    )
    .optional(),
  grouping: z
    .object({
      selections: z
        .array(
          z.object({
            field: z.string(),
            direction: sortDirectionSchema,
          }),
        )
        .optional(),
      expandedGroupKeys: z.array(z.string()).optional(),
      columnAggregates: z.record(z.string(), z.string().nullable()).optional(),
    })
    .optional(),
  layout: savedViewLayoutSchema,
});

const listSavedFiltersSchema = z.object({
  pageKey: z.string().trim().min(1).max(200),
});

const upsertSavedFilterSchema = z.object({
  pageKey: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  definition: savedFilterDefinitionSchema,
});

const deleteSavedFilterSchema = z.object({
  id: z.number().int().positive(),
});

const setFavoriteSavedFilterSchema = deleteSavedFilterSchema;

export type SavedFilterUseCaseDependencies = {
  savedFilterRepository: ISavedFilterRepository;
};

export class ListSavedFiltersUseCase
  implements IUseCase<ListSavedFiltersInput, SavedFilterDto[], DomainError>
{
  constructor(private readonly deps: SavedFilterUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListSavedFiltersInput,
  ): Promise<Result<SavedFilterDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const parsed = listSavedFiltersSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input"));
    }

    const items = await this.deps.savedFilterRepository.listByUserAndPage(ctx.userId, parsed.data);
    return ok(items);
  }
}

export class UpsertSavedFilterUseCase
  implements IUseCase<UpsertSavedFilterInput, SavedFilterDto, DomainError>
{
  constructor(private readonly deps: SavedFilterUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: UpsertSavedFilterInput,
  ): Promise<Result<SavedFilterDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const parsed = upsertSavedFilterSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input"));
    }

    try {
      const definition = normalizeSavedViewDefinition(
        parsed.data.definition as SavedFilterDefinition,
      );
      if (!definition) {
        return err(new ValidationError("Saved view definition is empty."));
      }
      const item = await this.deps.savedFilterRepository.upsert(ctx.userId, {
        ...parsed.data,
        definition,
      });
      return ok(item);
    } catch (error) {
      return err(new ValidationError(error instanceof Error ? error.message : "Failed to save view"));
    }
  }
}

export class DeleteSavedFilterUseCase implements IUseCase<DeleteSavedFilterInput, void, DomainError> {
  constructor(private readonly deps: SavedFilterUseCaseDependencies) {}

  async execute(ctx: RequestContext, input: DeleteSavedFilterInput): Promise<Result<void, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const parsed = deleteSavedFilterSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input"));
    }

    await this.deps.savedFilterRepository.delete(ctx.userId, parsed.data);
    return ok(undefined);
  }
}

export class SetFavoriteSavedFilterUseCase
  implements IUseCase<SetFavoriteSavedFilterInput, SavedFilterDto, DomainError>
{
  constructor(private readonly deps: SavedFilterUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: SetFavoriteSavedFilterInput,
  ): Promise<Result<SavedFilterDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const parsed = setFavoriteSavedFilterSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input"));
    }

    try {
      const item = await this.deps.savedFilterRepository.setFavorite(ctx.userId, parsed.data);
      return ok(item);
    } catch (error) {
      return err(new NotFoundError("Saved filter", String(parsed.data.id)));
    }
  }
}
