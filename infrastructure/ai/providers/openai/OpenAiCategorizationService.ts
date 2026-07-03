import { z } from "zod";

import type {
  CategorizationBatchResult,
  ICategorizationService,
} from "@/application/ports/ICategorizationService";
import { flattenFamilyTreeWithPaths } from "@/application/mappers/workshop/familyPathMapper";
import { WorkshopAiRunError } from "@/domain/workshop/errors/WorkshopErrors";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import { err, ok, type Result } from "@/domain/shared/Result";
import { getOpenAiEnv } from "@/infrastructure/config/env";

const suggestionSchema = z.object({
  workshopItemId: z.number().int().positive(),
  familyId: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  alternativeFamilyIds: z.array(z.number().int().positive()).optional(),
});

const responseSchema = z.object({
  suggestions: z.array(suggestionSchema),
});

const PROMPT_VERSION = "v1";
const MODEL_NAME = "gpt-4o-mini";

export class OpenAiCategorizationService implements ICategorizationService {
  async categorizeBatch(input: {
    batchId: import("@/domain/workshop/ids").WorkshopBatchId;
    items: import("@/application/ports/ICategorizationService").CategorizationItemInput[];
    familyTree: import("@/application/dto/family/familyDto").FamilyTreeNodeDto[];
    correlationId: import("@/domain/shared/ids").CorrelationId;
  }): Promise<Result<CategorizationBatchResult, DomainError>> {
    let apiKey: string;
    try {
      apiKey = getOpenAiEnv().OPENAI_API_KEY;
    } catch {
      return err(
        new WorkshopAiRunError(
          "OPENAI_API_KEY is not configured. Add it to .env.local to run AI categorization.",
        ),
      );
    }

    const families = flattenFamilyTreeWithPaths(input.familyTree);
    const validFamilyIds = new Set(families.map((family) => family.id));

    const familyListText = families
      .map((family) => `${family.id}: ${family.path}`)
      .join("\n");

    const itemsText = input.items
      .map(
        (item) =>
          `- id=${item.id}; description="${item.description}"; unit=${item.unit ?? "n/a"}; qty=${item.quantity ?? "n/a"}`,
      )
      .join("\n");

    const systemPrompt = `You classify MEP BOQ line items into a fixed Family hierarchy.
Return JSON only: {"suggestions":[{"workshopItemId":number,"familyId":number,"confidence":0-1,"rationale":"string","alternativeFamilyIds":[number]}]}
Each familyId MUST be one of the allowed IDs below. Never invent IDs.`;

    const userPrompt = `Allowed families (id: path):
${familyListText}

BOQ lines:
${itemsText}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return err(
          new WorkshopAiRunError(
            `OpenAI request failed (${response.status}): ${errorText.slice(0, 200)}`,
          ),
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        return err(new WorkshopAiRunError("OpenAI returned an empty response."));
      }

      const parsedJson = JSON.parse(content) as unknown;
      const parsed = responseSchema.safeParse(parsedJson);
      if (!parsed.success) {
        return err(new WorkshopAiRunError("OpenAI response failed validation."));
      }

      const suggestions = parsed.data.suggestions.filter((suggestion) =>
        validFamilyIds.has(suggestion.familyId),
      );

      if (suggestions.length === 0) {
        return err(
          new WorkshopAiRunError("No valid family suggestions returned by AI."),
        );
      }

      const overallConfidence =
        suggestions.reduce((sum, item) => sum + item.confidence, 0) /
        suggestions.length;

      return ok({
        suggestions: suggestions.map((suggestion) => ({
          workshopItemId: suggestion.workshopItemId as import("@/domain/workshop/ids").WorkshopItemId,
          familyId: suggestion.familyId,
          confidence: suggestion.confidence,
          rationale: suggestion.rationale,
          alternativeFamilyIds: suggestion.alternativeFamilyIds ?? [],
        })),
        modelName: MODEL_NAME,
        promptVersion: PROMPT_VERSION,
        rawResponseJson: content,
        overallConfidence,
      });
    } catch (error) {
      return err(
        new WorkshopAiRunError(
          error instanceof Error ? error.message : "AI categorization failed.",
        ),
      );
    }
  }
}
