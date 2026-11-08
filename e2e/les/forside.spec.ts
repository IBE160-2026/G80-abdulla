// Røyktest: forsiden svarer og er tilgjengelig.
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "../a11y";

test("forsiden svarer 200, har overskriften og ingen alvorlige axe-funn", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "LocalFix · Campus Molde" }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});
