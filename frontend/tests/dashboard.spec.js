import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {

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
      resultsUrl: '/api/results/job1'
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Set a fake token to simulate being logged in
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    });

    // Mock the projects API
    await page.route('**/api/projects', async (route) => {
      // Handle both GET (list projects) and POST (create project)
      if (route.request().method() === 'POST') {
        const postData = JSON.parse(route.request().postData());
        const newProject = { _id: `proj${Date.now()}`, projectName: postData.projectName };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newProject)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProjects)
        });
      }
    });

    // Mock jobs for project
    await page.route('**/api/jobs/project/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs)
      });
    });

    // Mock job status
    await page.route('**/api/jobs/*/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJobs[0])
      });
    });

    await page.goto('/dashboard');
  });

  test('loads and displays projects', async ({ page }) => {
    // Wait for the projects to load and be displayed
    await expect(page.locator('.list-group-item').first()).toBeVisible();

    // Check that projects are in the list
    await expect(page.locator('text=Airfoil Simulation')).toBeVisible();
    await expect(page.locator('text=Pipe Flow')).toBeVisible();

    // Default state when no project selected
    await expect(page.locator('h4', { hasText: 'Select or create a project to get started' })).toBeVisible();
  });

  test('can create a new project', async ({ page }) => {
    // Re-mock GET projects to include the newly created one after POST
    const updatedProjects = [...mockProjects, { _id: 'proj3', projectName: 'New Aerodynamics' }];
    let getCallCount = 0;

    await page.unroute('**/api/projects');
    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ _id: 'proj3', projectName: 'New Aerodynamics' })
        });
      } else {
        getCallCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(getCallCount > 1 ? updatedProjects : mockProjects)
        });
      }
    });

    // Click the + button in the Projects header
    await page.locator('.card-header button', { hasText: '+' }).click();

    // Wait for modal
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toHaveText('Create New Project');

    // Fill and submit the form
    await modal.locator('input[type="text"]').fill('New Aerodynamics');
    await modal.getByRole('button', { name: 'Create' }).click();

    // Modal should close and new project should appear in the list
    await expect(modal).not.toBeVisible();
    await expect(page.locator('text=New Aerodynamics')).toBeVisible();
  });

  test('selecting a project shows job configuration', async ({ page }) => {
    // Click on a project
    await page.locator('text=Airfoil Simulation').click();

    // Wait for job config to appear
    await expect(page.locator('h4', { hasText: 'Airfoil Simulation - Job Configuration' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Kinematic Viscosity (m²/s)' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Inlet Velocity X (m/s)' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'End Time (s)' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Turbulence Model' })).toBeVisible();

    // Also check if existing jobs are displayed
    await expect(page.locator('h4', { hasText: 'Simulation Jobs' })).toBeVisible();
    await expect(page.locator('text=Job ID: job1')).toBeVisible();
  });

  test('starting a job sends correct data', async ({ page }) => {
    // Select a project first
    await page.locator('text=Airfoil Simulation').click();
    await expect(page.locator('h4', { hasText: 'Airfoil Simulation - Job Configuration' })).toBeVisible();

    // Set up route for starting a job to capture the request data
    let requestData = null;
    await page.route('**/api/jobs/start', async (route) => {
      requestData = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Job started successfully' })
      });
    });

    // Fill form data
    await page.locator('input[type="number"]').first().fill('0.00002'); // Viscosity
    await page.locator('input[type="number"]').nth(1).fill('15'); // Velocity X
    await page.locator('input[type="number"]').nth(2).fill('20'); // End Time
    await page.locator('select').selectOption('kEpsilon'); // Turbulence Model

    // Submit form
    await page.getByRole('button', { name: 'Start Simulation' }).click();

    // Verify the request data
    expect(requestData).not.toBeNull();
    expect(requestData.projectId).toBe('proj1');
    expect(requestData.config.kinematicViscosity).toBe(0.00002);
    expect(requestData.config.inletVelocity).toEqual([15, 0, 0]);
    expect(requestData.config.endTime).toBe(20);
    expect(requestData.config.turbulenceModel).toBe('kEpsilon');
  });

  test('logout removes token and redirects', async ({ page }) => {
    // Click logout button
    await page.getByRole('button', { name: 'Logout' }).click();

    // Verify redirect to home/login
    await expect(page).toHaveURL('/');

    // Verify local storage is cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));

    expect(token).toBeNull();
    expect(user).toBeNull();
  });
});
