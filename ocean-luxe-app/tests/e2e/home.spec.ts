import { test, expect } from '@playwright/test';

test('homepage has title and navigation links', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/XP Ocean Luxe/);

  // Expect navigation link to Destinations
  const destinationsLink = page.getByRole('link', { name: 'Destinations', exact: true });
  await expect(destinationsLink).toBeVisible();

  // Expect Check Availability button
  const bookButton = page.getByRole('link', { name: 'Check availability' }).first();
  await expect(bookButton).toBeVisible();
});
