import { test, expect } from "@playwright/test";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running e2e tests.`);
  }
  return value;
};

test("create site flow", async ({ page }) => {
  const email = requireEnv("E2E_EMAIL");
  const password = requireEnv("E2E_PASSWORD");
  const siteName = `E2E Site ${Date.now()}`;

  await page.goto("/login?next=/sites/new");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/sites\/new/);

  await page.getByLabel("Site name").fill(siteName);
  await page.getByLabel("Address").fill("Land north-east of Steephurst, TR12 7HB");
  await page.getByLabel("Local planning authority").fill("Cornwall Council");
  await page.getByLabel("Status").selectOption("submitted");
  await page.getByLabel("Asking price").fill("350000");
  await page.getByLabel("Proposed units").fill("4");
  await page
    .getByLabel("Initial notes / planning summary")
    .fill("E2E test create and analyse flow");

  await page.getByRole("button", { name: "Create and analyse" }).click();
  await expect(page).toHaveURL(/\/sites\/[0-9a-f-]+$/);

  await page.goto("/sites");
  await expect(page.getByRole("link", { name: siteName })).toBeVisible();
});
