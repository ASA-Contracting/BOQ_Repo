import { ListFamilyTreeUseCase } from "../application/use-cases/family/ListFamilyTreeUseCase";
import { ListFamilyLevelTypesUseCase } from "../application/use-cases/family/ListFamilyLevelTypesUseCase";
import { DrizzleFamilyLevelTypeRepository } from "../infrastructure/persistence/family/DrizzleFamilyLevelTypeRepository";
import { DrizzleFamilyRepository } from "../infrastructure/persistence/family/DrizzleFamilyRepository";
import { checkDbConnection, closeDb } from "../infrastructure/persistence/db";
import { toCorrelationId, toUserId } from "../domain/shared/ids";
import { createRequestContextValue } from "../domain/shared/RequestContext";

async function main() {
  const ctx = createRequestContextValue({
    userId: toUserId("infra-verify-user"),
    roles: ["system_administrator"],
    correlationId: toCorrelationId(crypto.randomUUID()),
  });

  const connected = await checkDbConnection();
  console.log("checkDbConnection:", connected ? "ok" : "fail");
  if (!connected) {
    process.exit(1);
  }

  const familyRepository = new DrizzleFamilyRepository();
  const flat = await familyRepository.findAllFlat();
  console.log("findAllFlat():", flat.length, "rows");

  const search = await familyRepository.search("missing-term", 5);
  console.log("search():", search.length, "rows");

  const missing = await familyRepository.findById(-1 as never);
  console.log("findById(-1):", missing === null ? "null" : "unexpected");

  const listTree = new ListFamilyTreeUseCase({ familyRepository });
  const treeResult = await listTree.execute(ctx);
  if (!treeResult.ok) {
    throw treeResult.error;
  }
  console.log("ListFamilyTreeUseCase:", treeResult.value.length, "root nodes");

  const levelTypeRepository = new DrizzleFamilyLevelTypeRepository();
  const listLevelTypes = new ListFamilyLevelTypesUseCase({
    familyLevelTypeRepository: levelTypeRepository,
  });
  const levelTypesResult = await listLevelTypes.execute(ctx);
  if (!levelTypesResult.ok) {
    throw levelTypesResult.error;
  }
  console.log(
    "ListFamilyLevelTypesUseCase:",
    levelTypesResult.value.length,
    "level types",
  );
}

main()
  .catch((error) => {
    console.error("FAIL:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
