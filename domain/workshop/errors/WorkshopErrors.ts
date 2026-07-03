import { DomainError } from "@/domain/shared/errors/DomainError";
import type { WorkshopBatchId, WorkshopItemId } from "@/domain/workshop/ids";

export class WorkshopBatchNotFoundError extends DomainError {
  readonly code = "WORKSHOP_BATCH_NOT_FOUND";

  constructor(batchId: WorkshopBatchId) {
    super(`Workshop batch ${batchId} was not found.`);
  }
}

export class WorkshopItemNotFoundError extends DomainError {
  readonly code = "WORKSHOP_ITEM_NOT_FOUND";

  constructor(itemId: WorkshopItemId) {
    super(`Workshop item ${itemId} was not found.`);
  }
}

export class WorkshopQueueEmptyError extends DomainError {
  readonly code = "WORKSHOP_QUEUE_EMPTY";

  constructor() {
    super("No items remain in the categorization queue.");
  }
}

export class WorkshopAiRunError extends DomainError {
  readonly code = "WORKSHOP_AI_RUN_ERROR";

  constructor(message: string) {
    super(message);
  }
}

export class WorkshopNothingToPublishError extends DomainError {
  readonly code = "WORKSHOP_NOTHING_TO_PUBLISH";

  constructor() {
    super("No approved items are ready to publish.");
  }
}

export class WorkshopPublishNotCompleteError extends DomainError {
  readonly code = "WORKSHOP_PUBLISH_NOT_COMPLETE";

  constructor(pendingCount: number) {
    super(
      `Full publish requires all items to be approved or skipped. ${pendingCount} item(s) still pending review.`,
    );
  }
}

export class ImportCampaignNotFoundError extends DomainError {
  readonly code = "IMPORT_CAMPAIGN_NOT_FOUND";

  constructor(campaignId: number) {
    super(`Import campaign ${campaignId} was not found.`);
  }
}

export class ImportJobNotFoundError extends DomainError {
  readonly code = "IMPORT_JOB_NOT_FOUND";

  constructor(jobId: number) {
    super(`Import job ${jobId} was not found.`);
  }
}

export class WorkshopImportNoRowsError extends DomainError {
  readonly code = "WORKSHOP_IMPORT_NO_ROWS";

  constructor() {
    super(
      "No BOQ rows could be imported. Map Description (and Unit or Quantity where applicable) and ensure rows contain data.",
    );
  }
}

export class WorkshopEmptyZipError extends DomainError {
  readonly code = "WORKSHOP_EMPTY_ZIP";

  constructor() {
    super("ZIP archive contains no Excel files.");
  }
}

export class WorkshopWorkflowError extends DomainError {
  readonly code = "WORKSHOP_WORKFLOW_ERROR";

  constructor(message: string) {
    super(message);
  }
}
