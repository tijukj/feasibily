import { test, expect } from '@playwright/test';

test.describe('Financial Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.click('button:has-text("Load Example")');
    await page.click('button:has-text("Financial Analysis")');
  });

  test('example data shows a verdict and matching KPI bar', async ({ page }) => {
    // Top banner verdict (e.g. "GO" or "CAUTION")
    const verdictEl = page.locator('h2.text-3xl.font-black.uppercase').first();
    const verdictText = await verdictEl.textContent();
    expect(['GO', 'CAUTION', 'NO-GO']).toContain(verdictText.trim());

    // KPI bar NPV
    const topKpiNpv = await page.locator('div:has(p:has-text("NPV")) > p.text-lg').textContent();
    
    // Page NPV
    const pageNpv = await page.locator('div:has(h3:has-text("Net Present Value")) > div.text-2xl').first().textContent();
    
    expect(topKpiNpv.trim()).toEqual(pageNpv.trim());
  });

  test('enabling loan shows DSCR', async ({ page }) => {
    await page.click('button:has-text("Financing")');
    // Enable loan
    await page.locator('label:has-text("Use a loan") input[type="checkbox"]').check({ force: true });
    
    // Set some loan values
    const loanPctInput = page.locator('label:has-text("Loan amount")').locator('..').locator('input');
    await loanPctInput.fill('50');
    
    const tenorInput = page.locator('label:has-text("Tenor")').locator('..').locator('input');
    await tenorInput.fill('3');
    
    await expect(page.locator('text=Min Debt Cover')).toBeVisible();
    await expect(page.locator('text=Avg Debt Cover')).toBeVisible();
  });

  test('cash flow table net cash flow total equals row sum', async ({ page }) => {
    // Expand to full rupees
    await page.locator('label:has-text("Full ₹") input[type="checkbox"]').uncheck({ force: true });

    // The table has 7th column as Net Cash Flow
    // We want to sum all the row values and compare to the total
    const rowLocators = page.locator('tbody tr:not(.bg-slate-100) td:nth-child(7)'); // Net cash flow is col 7
    const count = await rowLocators.count();
    
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const text = await rowLocators.nth(i).textContent();
      const val = parseInt(text.replace(/[^0-9-]/g, ''), 10) * (text.includes('(') ? -1 : 1);
      if (!isNaN(val)) sum += val;
    }
    
    const totalLocator = page.locator('tbody tr.bg-slate-100 td:nth-child(7)');
    const totalText = await totalLocator.textContent();
    const totalVal = parseInt(totalText.replace(/[^0-9-]/g, ''), 10) * (totalText.includes('(') ? -1 : 1);
    
    // With rounding to full rupees there might be small discrepancies if using Lakhs, but full rupees should match perfectly.
    expect(sum).toBe(totalVal);
  });

  test('losing project shows No-go and Not applicable when IRR is null', async ({ page }) => {
    // Go to Investment Plan and add a huge cost to make it lose money
    await page.click('button:has-text("Investment Plan")');
    await page.getByRole('button', { name: 'Add Row' }).click();
    
    // cost is the first text input
    await page.locator('table input[type="text"]').nth(0).fill('Massive Cost');
    await page.locator('table input[type="text"]').nth(1).fill('999999999');
    
    await page.click('button:has-text("Financial Analysis")');
    
    const verdictEl = page.locator('h2.text-3xl.font-black.uppercase').first();
    await expect(verdictEl).toHaveText('NO-GO');
    
    // IRR Tile shows "Not applicable" and the exact reason
    await expect(page.locator('div:has(h3:has-text("Return Rate (IRR)"))')).toContainText('Not applicable');
    await expect(page.locator('div:has(h3:has-text("Return Rate (IRR)"))')).toContainText('The project never earns back its investment');
  });
});
