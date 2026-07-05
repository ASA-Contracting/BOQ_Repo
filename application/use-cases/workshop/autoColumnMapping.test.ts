import { describe, expect, it } from "vitest";

import { inferWizardColumnMapping } from "@/application/use-cases/workshop/autoColumnMapping";

describe("inferWizardColumnMapping", () => {
  it("maps standard BOQ headers including unit price", () => {
    const headers = ["BOQ #", "Item Description", "Unit", "QTY", "Unit Rate", "Total Sale"];
    const mapping = inferWizardColumnMapping(headers);

    expect(mapping).toEqual({
      "BOQ #": "item_no",
      "Item Description": "description",
      Unit: "unit",
      QTY: "quantity",
      "Unit Rate": "unit_price",
      "Total Sale": "skip",
    });
  });

  it("infers unit price from a numeric header when sample row contains Unit Rate", () => {
    const headers = ["BOQ #", "Item Description", "Unit", "QTY", "4470431", "Total Sale"];
    const previewRows = [
      ["", "", "", "", "Unit Rate", "Total Sale"],
      ["1", "Gate valve", "EA", "10", "25.50", "255"],
    ];

    const mapping = inferWizardColumnMapping(headers, previewRows);

    expect(mapping["4470431"]).toBe("unit_price");
  });

  it("infers unit price from resolved header labels like E · Unit Rate", () => {
    const headers = ["BOQ #", "Item Description", "Unit", "QTY", "E · Unit Rate"];
    const mapping = inferWizardColumnMapping(headers);

    expect(mapping["E · Unit Rate"]).toBe("unit_price");
  });
});
