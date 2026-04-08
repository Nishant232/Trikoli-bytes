import { expect, test } from "@playwright/test";

test("customer can reach public pages and auth entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/Triloki/i)).toBeVisible();
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByRole("heading", { name: /welcome back|create account/i })).toBeVisible();

  await page.getByRole("button", { name: /back to menu/i }).click();
  await expect(page).toHaveURL(/\/$/);
});
