import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Feasibly App E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('a/b) export a project and import it back', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: 'Export', exact: true });
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    const jsonStr = fs.readFileSync(downloadPath, 'utf8');
    const project = JSON.parse(jsonStr);
    expect(project.schemaVersion).toBe(1);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('label:has-text("Import")').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(downloadPath);

    await expect(exportBtn).toBeVisible(); 
  });

  test('c) import a corrupt JSON file and old-schema object', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('label:has-text("Import")').click();
    const fileChooser = await fileChooserPromise;
    
    fs.writeFileSync('corrupt.json', '{ bad json');
    const dialogPromise = page.waitForEvent('dialog');
    await fileChooser.setFiles('corrupt.json');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Error parsing JSON');
    await dialog.accept();

    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await page.locator('label:has-text("Import")').click();
    const fileChooser2 = await fileChooserPromise2;
    fs.writeFileSync('old.json', '{"name":"old"}');
    const dialogPromise2 = page.waitForEvent('dialog');
    await fileChooser2.setFiles('old.json');
    const dialog2 = await dialogPromise2;
    expect(dialog2.message()).toContain('Invalid project file');
    await dialog2.accept();
  });

  test('d) invalid JSON in localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('feasibly_projects_v1', '{ invalid }');
    });
    
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await page.goto('http://localhost:5173/');
    await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeVisible(); 
    expect(errors.length).toBe(0); 
  });

  test('e) setViewportSize 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    
    const checkNoScroll = async () => {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    };

    await checkNoScroll();
    await page.click('button:has-text("Current Situation")');
    await checkNoScroll();
    await page.click('button:has-text("Investment Plan")');
    await checkNoScroll();
  });

  test('f) project create, duplicate, rename, delete', async ({ page }) => {
    await page.getByRole('button', { name: 'New', exact: true }).click();
    await page.locator('input[placeholder="e.g. Factory Expansion"]').first().fill('Renamed Project');
    await page.locator('input[placeholder="e.g. Factory Expansion"]').first().blur();
    
    await expect(page.locator('select').first()).toContainText('Renamed Project');
    
    await page.getByRole('button', { name: 'Dup', exact: true }).click();
    await expect(page.locator('select').first()).toContainText('Renamed Project (Copy)');
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Del', exact: true }).click();
  });

  test('g) specific component defaults', async ({ page }) => {
    await page.click('button:has-text("Investment Plan")');
    await page.getByRole('button', { name: 'Add Row' }).click();
    const selectCat = page.locator('table select').first();
    await selectCat.selectOption('vehicle');
    const itcBox = page.locator('table input[type="checkbox"]').first();
    await expect(itcBox).not.toBeChecked();

    await selectCat.selectOption('land');
    // text inputs: 0=name, 1=cost, 2=year, 3=life
    await expect(page.locator('table input[type="text"]').nth(3)).toBeDisabled();
    
    await page.click('button:has-text("Benefits")');
    await page.getByRole('button', { name: 'Add Row' }).click();
    const selectType = page.locator('table select').first();
    await selectType.selectOption('Productivity gain');
    // text inputs: 0=name, 1=amount, 2=growth, 3=contribution (margin)
    await expect(page.locator('table input[type="text"]').nth(3)).toBeDisabled();
  });

  test('h) locked output tab message', async ({ page }) => {
    await page.click('button:has-text("Financial Analysis")');
    await expect(page.locator('text=Financial Analysis Locked')).toBeVisible();
    await expect(page.locator('text=Please complete the earlier steps')).toBeVisible();
  });

  test('Overlay Test: settings open/close with escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('text=Global Settings').first()).toBeVisible();
    
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.locator('text=Global Settings')).not.toBeVisible();
    
    await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeEnabled();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('text=Global Settings').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('text=Global Settings')).not.toBeVisible();
  });

  test('Blank Project Life validation', async ({ page }) => {
    // Go to Project Details explicitly
    await page.click('button:has-text("Project Details")');
    const input = page.locator('label:has-text("Project Life (Years)")').locator('..').locator('input');
    await input.click();
    await input.fill('');
    await page.keyboard.press('Tab');

    await expect(page.locator('text=Enter project life in Project Details to view live results')).toBeVisible();
  });

  test('GST Dropdown options', async ({ page }) => {
    await page.click('button:has-text("Investment Plan")');
    await page.getByRole('button', { name: 'Add Row' }).click();
    const selectGST = page.locator('table select').nth(1);
    
    const options = await selectGST.locator('option').allTextContents();
    expect(options).toEqual(['0', '5', '18', '40']);
  });

});
