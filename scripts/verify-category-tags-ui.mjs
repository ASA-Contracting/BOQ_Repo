/**
 * Browser verification for category tag CRUD inside the category builder dialog.
 * Auth: TEST_USER_EMAIL + TEST_USER_PASSWORD from .env.local only.
 */
import { chromium } from "playwright";
import {
  loadEnvLocal,
  loginTestUserViaForm,
} from "./lib/auth-script-guard.mjs";

const env = { ...loadEnvLocal(), ...process.env };
const baseUrl = env.TEST_BASE_URL ?? "http://localhost:3000";
const supabaseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SECRET_KEY;
const testEmail = env.TEST_USER_EMAIL ?? "tamim@tamim.com";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("FAIL: SUPABASE_URL and SUPABASE_SECRET_KEY required in .env.local");
  process.exit(1);
}

if (!env.TEST_USER_PASSWORD) {
  console.error("FAIL: TEST_USER_PASSWORD required in .env.local");
  process.exit(1);
}

const stamp = `ui-tag-${Date.now()}`;
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await loginTestUserViaForm(page, {
    baseUrl,
    supabaseUrl,
    serviceRoleKey,
    env: { ...env, TEST_USER_EMAIL: testEmail },
  });

  await page.goto(`${baseUrl}/boq`, { waitUntil: "networkidle" });
  const boqHref =
    (await page.locator('a[href^="/boq/"]').evaluateAll((links) => {
      const match = links
        .map((link) => link.getAttribute("href") ?? "")
        .find((href) => /^\/boq\/\d+/.test(href) && !href.startsWith("/boq/import"));
      return match ?? null;
    })) ?? null;
  if (!boqHref) throw new Error("No BOQ breakdown link found");

  await page.goto(`${baseUrl}${boqHref}${boqHref.includes("?") ? "&" : "?"}categoryBuilder=1`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector(".boq-category-builder-dialog .cls-workspace", { timeout: 30000 });

  const dialogScope = page.locator(".boq-category-builder-dialog");
  const treeMore = dialogScope.locator(".explorer-tree__more").first();
  await treeMore.waitFor({ timeout: 15000 });
  await treeMore.click();

  const menu = page.locator(".mc-tree-context-menu");
  await menu.waitFor({ state: "visible", timeout: 5000 });

  const tagTrigger = menu.locator(".mc-tree-context-tag-trigger__field");
  await tagTrigger.click();
  const picker = page.locator(".mc-tree-tag-picker");
  await picker.waitFor({ state: "visible", timeout: 5000 });

  const pickerInput = picker.locator("input").first();
  await pickerInput.click();
  await pickerInput.fill("");
  await pickerInput.type(stamp, { delay: 20 });
  const typedValue = await pickerInput.inputValue();
  record("picker input accepts typing", typedValue === stamp, `value=${typedValue}`);

  const createPill = picker.locator(".mc-tree-tag-picker__create-pill");
  await createPill.waitFor({ state: "visible", timeout: 8000 });
  await createPill.click();
  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/classification/tags") && response.request().method() === "POST",
    { timeout: 15000 },
  );
  await page.waitForResponse(
    (response) => response.url().includes("/api/classification/material-tags/bulk"),
    { timeout: 15000 },
  );
  await picker.waitFor({ state: "hidden", timeout: 5000 }).catch(async () => {
    await page.keyboard.press("Escape");
  });

  await menu
    .locator(".mc-tree-context-tag-pill__label", { hasText: stamp })
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => undefined);
  const assignedVisible = await menu
    .locator(".mc-tree-context-tag-pill__label", { hasText: stamp })
    .isVisible()
    .catch(() => false);
  record("create + assign tag on category", assignedVisible, stamp);

  await page.locator(".mc-tree-overlay-backdrop").click({ position: { x: 2, y: 2 }, force: true });
  await menu.waitFor({ state: "hidden", timeout: 5000 });

  const filterTrigger = dialogScope.locator(".mc-tree-filter__trigger");
  await filterTrigger.click();
  await dialogScope.locator(".mc-tree-filter__menu").waitFor({ state: "visible" });

  const manageEdit = dialogScope
    .locator(".mc-tree-filter__manage-row", { hasText: stamp })
    .locator(".mc-tree-filter__manage-edit")
    .first();
  await manageEdit.click();
  const editPopover = page.locator(".mc-tree-tag-edit-popover");
  await editPopover.waitFor({ state: "visible", timeout: 5000 });

  const editInput = editPopover.locator("input").first();
  const renamed = `${stamp}-edited`;
  await editInput.click();
  await editInput.fill("");
  await editInput.type(renamed, { delay: 20 });
  const editTyped = await editInput.inputValue();
  record("edit popover input accepts typing", editTyped === renamed, `value=${editTyped}`);

  await editPopover.locator(".mc-tree-tag-edit-popover__save").click();
  const putResponse = await page.waitForResponse(
    (response) =>
      response.url().includes("/api/classification/tags") && response.request().method() === "PUT",
    { timeout: 15000 },
  );
  record("edit tag PUT succeeded", putResponse.ok(), String(putResponse.status()));
  await editPopover.waitFor({ state: "hidden", timeout: 5000 });

  const renamedVisible = await dialogScope
    .locator(".mc-tree-filter__manage-pill", { hasText: renamed })
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  record("edit tag in manage list", renamedVisible, renamed);

  await page.locator(".mc-tree-overlay-backdrop").click({ position: { x: 2, y: 2 }, force: true }).catch(() => undefined);
  await menu.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);

  await treeMore.click();
  await menu.waitFor({ state: "visible", timeout: 5000 });
  const pill = menu.locator(".mc-tree-context-tag-pill", { hasText: renamed });
  await pill.waitFor({ state: "visible", timeout: 10000 });
  await pill.locator(".mc-tree-context-tag-pill__action--remove").click({ force: true });
  const removeResponse = await page.waitForResponse(
    (response) =>
      response.url().includes("/api/classification/material-tags/bulk") &&
      response.request().method() === "DELETE",
    { timeout: 15000 },
  );
  record("remove tag DELETE succeeded", removeResponse.ok(), String(removeResponse.status()));
  await page.waitForResponse(
    (response) => response.url().includes("/api/classification/state"),
    { timeout: 15000 },
  ).catch(() => undefined);
  await page.locator(".mc-tree-overlay-backdrop").click({ position: { x: 2, y: 2 }, force: true });
  await menu.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
  await treeMore.click();
  await menu.waitFor({ state: "visible", timeout: 5000 });
  const removedFromCategory = (await menu
    .locator(".mc-tree-context-tag-pill__label", { hasText: renamed })
    .count()) === 0;
  record("remove tag from category", removedFromCategory, renamed);

  await page.locator(".mc-tree-overlay-backdrop").click({ position: { x: 2, y: 2 }, force: true });
  await menu.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
  await filterTrigger.click();
  await dialogScope.locator(".mc-tree-filter__menu").waitFor({ state: "visible" });

  page.once("dialog", (dialog) => dialog.accept());
  const deleteEdit = dialogScope
    .locator(".mc-tree-filter__manage-row", { hasText: renamed })
    .locator(".mc-tree-filter__manage-edit")
    .first();
  await deleteEdit.waitFor({ state: "visible", timeout: 10000 });
  await deleteEdit.click();
  await editPopover.waitFor({ state: "visible", timeout: 5000 });
  await editPopover.locator(".mc-tree-tag-edit-popover__delete").click();
  const deleteResponse = await page.waitForResponse(
    (response) =>
      response.url().includes("/api/classification/tags") && response.request().method() === "DELETE",
    { timeout: 15000 },
  );
  record("delete tag DELETE succeeded", deleteResponse.ok(), String(deleteResponse.status()));
  await page.waitForResponse(
    (response) => response.url().includes("/api/classification/state"),
    { timeout: 15000 },
  ).catch(() => undefined);
  const deletedGlobally = !(await dialogScope
    .locator(".mc-tree-filter__manage-pill", { hasText: renamed })
    .isVisible()
    .catch(() => false));
  record("delete tag globally", deletedGlobally, renamed);

  const failed = results.filter((row) => !row.pass);
  if (failed.length) {
    await page.screenshot({ path: "scripts/verify-category-tags-ui-failure.png", fullPage: true });
    console.error(`FAIL: ${failed.length} check(s) failed — screenshot scripts/verify-category-tags-ui-failure.png`);
    process.exitCode = 1;
  } else {
    console.log(`ALL PASS (${results.length} checks)`);
  }
} catch (error) {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  await page.screenshot({ path: "scripts/verify-category-tags-ui-failure.png", fullPage: true }).catch(() => undefined);
  process.exitCode = 1;
} finally {
  await browser.close();
}
