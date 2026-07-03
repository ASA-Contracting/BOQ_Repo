import type { RequestContext } from "@/domain/shared/RequestContext";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { Result } from "@/domain/shared/Result";

export interface IUseCase<TInput, TOutput, TError extends DomainError = DomainError> {
  execute(
    ctx: RequestContext,
    input: TInput,
  ): Promise<Result<TOutput, TError>>;
}

export interface IUseCaseWithoutInput<
  TOutput,
  TError extends DomainError = DomainError,
> {
  execute(ctx: RequestContext): Promise<Result<TOutput, TError>>;
}

export interface IPublicUseCase<TOutput> {
  execute(): Promise<TOutput>;
}
