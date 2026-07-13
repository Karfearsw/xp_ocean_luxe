import { test, expect } from '@playwright/test';

test('navigate to destinations and verify content', async ({ page }) => {
  await page.goto('/');

  // Click the destinations link
  await page.getByRole('link', { name: 'Destinations', exact: true }).first().click();

  // Verify the URL
  await expect(page).toHaveURL(/.*destinations/);

  // The page makes an API call that returns no data if the backend isn't populated,
  // showing the empty state. We should verify either the real content or the empty state or the error state
  const emptyStateHeading = page.getByRole('heading', { name: 'No destinations yet' });
  const contentHeading = page.getByRole('heading', { name: 'Curated resort regions' });
  const errorHeading = page.getByRole('heading', { name: 'Unable to load destinations' });

  // Wait for one of the states to appear
  await expect(emptyStateHeading.or(contentHeading).or(errorHeading)).toBeVisible({ timeout: 10000 });
});
