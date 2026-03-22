import { test, expect } from '@playwright/test';

test.describe('Authentication Page', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the auth page
    await page.goto('/');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Log In');
    await expect(page.getByRole('button', { name: 'Log In', exact: true })).toBeVisible();
    await expect(page.locator('text=Need an account?')).toBeVisible();
  });

  test('should toggle to sign up form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.locator('h2')).toHaveText('Sign Up');
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
    await expect(page.locator('text=Already have an account?')).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    // Mock the login API call
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-jwt-token',
          user: { id: '1', email: 'test@example.com' }
        })
      });
    });

    // Mock the projects API call which happens on dashboard load
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: 'Log In', exact: true }).click();

    // Verify redirect
    await expect(page).toHaveURL('/dashboard');

    // Verify local storage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('fake-jwt-token');
  });

  test('login failure displays error message', async ({ page }) => {
    // Mock the login API call to fail
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' })
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: 'Log In', exact: true }).click();

    // Verify error message
    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText('Invalid credentials');

    // Ensure we are still on the auth page
    await expect(page.locator('h2')).toHaveText('Log In');
  });

  test('successful registration redirects to dashboard', async ({ page }) => {
    // Switch to Sign Up
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

    // Mock the register API call
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fake-jwt-token-new',
          user: { id: '2', email: 'new@example.com' }
        })
      });
    });

    // Mock the projects API call which happens on dashboard load
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.fill('input[type="email"]', 'new@example.com');
    await page.fill('input[type="password"]', 'password123');
    // Ensure we click the main Sign Up button in the form, not the toggle
    await page.locator('form').getByRole('button', { name: 'Sign Up' }).click();

    // Verify redirect
    await expect(page).toHaveURL('/dashboard');

    // Verify local storage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('fake-jwt-token-new');
  });
});
