import { z } from "zod";

import type {
  BoqLookupOptionDto,
  CreateBoqLookupOptionInput,
  DeleteBoqLookupOptionInput,
  ListBoqLookupOptionsInput,
  ReorderBoqLookupOptionsInput,
  UpdateBoqLookupOptionInput,
} from "@/application/dto/boq/boqLookupOptionDto";
import {
  createBoqLookupOptionSchema,
  deleteBoqLookupOptionSchema,
  listBoqLookupOptionsSchema,
  reorderBoqLookupOptionsSchema,
  updateBoqLookupOptionSchema,
} from "@/application/dto/boq/boqLookupOptionDto";
import type { IBoqLookupOptionRepository } from "@/application/ports/IBoqLookupOptionRepository";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import { NotFoundError } from "@/domain/shared/errors/NotFoundError";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import { findBoqSettingsConflict } from "@/lib/boq-settings/validation";

export type BoqLookupOptionUseCaseDependencies = {
  boqLookupOptionRepository: IBoqLookupOptionRepository;
};

function mapZodError(error: z.ZodError): ValidationError {
  return new ValidationError(error.issues.map((issue) => issue.message).join("; "));
}

export class ListBoqLookupOptionsUseCase
  implements IUseCase<ListBoqLookupOptionsInput, BoqLookupOptionDto[], DomainError>
{
  constructor(private readonly deps: BoqLookupOptionUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListBoqLookupOptionsInput,
  ): Promise<Result<BoqLookupOptionDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) return auth;

    const parsed = listBoqLookupOptionsSchema.safeParse(input);
    if (!parsed.success) return err(mapZodError(parsed.error));

    const items = await this.deps.boqLookupOptionRepository.listByCategory(parsed.data.category);
    return ok(items);
  }
}

export class CreateBoqLookupOptionUseCase
  implements IUseCase<CreateBoqLookupOptionInput, BoqLookupOptionDto, DomainError>
{
  constructor(private readonly deps: BoqLookupOptionUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: CreateBoqLookupOptionInput,
  ): Promise<Result<BoqLookupOptionDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) return auth;

    const parsed = createBoqLookupOptionSchema.safeParse(input);
    if (!parsed.success) return err(mapZodError(parsed.error));

    const existing = await this.deps.boqLookupOptionRepository.listByCategory(parsed.data.category);
    const conflict = findBoqSettingsConflict(existing, {
      name: parsed.data.name,
      customLabel: parsed.data.customLabel,
    });
    if (conflict) {
      return err(new ValidationError(conflict.message));
    }

    const created = await this.deps.boqLookupOptionRepository.create(parsed.data);
    return ok(created);
  }
}

export class UpdateBoqLookupOptionUseCase
  implements IUseCase<UpdateBoqLookupOptionInput, BoqLookupOptionDto, DomainError>
{
  constructor(private readonly deps: BoqLookupOptionUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: UpdateBoqLookupOptionInput,
  ): Promise<Result<BoqLookupOptionDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) return auth;

    const parsed = updateBoqLookupOptionSchema.safeParse(input);
    if (!parsed.success) return err(mapZodError(parsed.error));

    const current = await this.deps.boqLookupOptionRepository.findById(parsed.data.id);
    if (!current) return err(new NotFoundError("BOQ lookup option", String(parsed.data.id)));

    const existing = await this.deps.boqLookupOptionRepository.listByCategory(current.category);
    const conflict = findBoqSettingsConflict(existing, {
      id: parsed.data.id,
      name: parsed.data.name,
      customLabel: parsed.data.customLabel,
    });
    if (conflict) {
      return err(new ValidationError(conflict.message));
    }

    const updated = await this.deps.boqLookupOptionRepository.update({
      ...parsed.data,
      sortOrder: parsed.data.sortOrder ?? current.sortOrder,
    });
    return ok(updated);
  }
}

export class DeleteBoqLookupOptionUseCase
  implements IUseCase<DeleteBoqLookupOptionInput, void, DomainError>
{
  constructor(private readonly deps: BoqLookupOptionUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: DeleteBoqLookupOptionInput,
  ): Promise<Result<void, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) return auth;

    const parsed = deleteBoqLookupOptionSchema.safeParse(input);
    if (!parsed.success) return err(mapZodError(parsed.error));

    const current = await this.deps.boqLookupOptionRepository.findById(parsed.data.id);
    if (!current) return err(new NotFoundError("BOQ lookup option", String(parsed.data.id)));

    await this.deps.boqLookupOptionRepository.softDelete(parsed.data.id);
    return ok(undefined);
  }
}

export class ReorderBoqLookupOptionsUseCase
  implements IUseCase<ReorderBoqLookupOptionsInput, BoqLookupOptionDto[], DomainError>
{
  constructor(private readonly deps: BoqLookupOptionUseCaseDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ReorderBoqLookupOptionsInput,
  ): Promise<Result<BoqLookupOptionDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) return auth;

    const parsed = reorderBoqLookupOptionsSchema.safeParse(input);
    if (!parsed.success) return err(mapZodError(parsed.error));

    const existing = await this.deps.boqLookupOptionRepository.listByCategory(parsed.data.category);
    const existingIds = new Set(existing.map((item) => item.id));
    const allMatch =
      parsed.data.orderedIds.length === existing.length &&
      parsed.data.orderedIds.every((id) => existingIds.has(id));

    if (!allMatch) {
      return err(new ValidationError("Reorder payload does not match current lookup items."));
    }

    const reordered = await this.deps.boqLookupOptionRepository.reorder(parsed.data);
    return ok(reordered);
  }
}
