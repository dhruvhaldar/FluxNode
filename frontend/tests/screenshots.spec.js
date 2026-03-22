import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Take Screenshots for README', () => {

  test.beforeAll(async () => {
    // Ensure docs directory exists
    if (!fs.existsSync('../docs')) {
      fs.mkdirSync('../docs', { recursive: true });
    }
  });

  test('screenshot auth page', async ({ page }) => {
    await page.goto('/');
    // Wait for the form to be visible
    await page.waitForSelector('form');
    await page.screenshot({ path: '../docs/auth.png', fullPage: true });
  });

  test('screenshot dashboard page', async ({ page }) => {
    const mockProjects = [
      { _id: 'proj1', projectName: 'Airfoil Simulation' },
      { _id: 'proj2', projectName: 'Pipe Flow' }
    ];

    const mockJobs = [
      {
        _id: 'job1',
        status: 'Completed',
        config: {
          kinematicViscosity: 1.5e-5,
          inletVelocity: [10.0, 0, 0],
          turbulenceModel: 'kOmegaSST'
        },
        resultsUrl: '/api/results/job1',
        residuals: {
            timeSteps: [1, 2, 3, 4, 5],
            error: [1.0, 0.1, 0.01, 0.001, 0.0001]
        }
      }
    ];

    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProjects)
      });
    });

    await page.route('**/api/jobs/project/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    await page.route('**/api/jobs/*/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs[0])
      });
    });

    await page.goto('/dashboard');

    // Select a project to populate the right side
    await page.locator('text=Airfoil Simulation').click();

    // Wait for the chart to be visible (or just wait a bit for it to render)
    await page.waitForSelector('.recharts-wrapper');

    await page.screenshot({ path: '../docs/dashboard.png', fullPage: true });
  });
});
