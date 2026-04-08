import { expect, test } from "@playwright/test";

test("admin login page is reachable and protected", async ({ page }) => {
  await page.goto("/admin/login");

  await expect(page.getByRole("heading", { name: /operations login/i })).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
