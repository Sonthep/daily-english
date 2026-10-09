import { expect, test } from '@playwright/test';

test('legacy onboarding links open Today for new users', async ({ page }) => {
  await page.goto('/#/onboarding');

  await expect(page.getByRole('heading', { name: /ยินดีต้อนรับ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /เริ่มฝึกวันนี้/ })).toBeVisible();
});

test('selected daily practice duration persists after refresh', async ({ page }) => {
  await page.goto('/#/today');

  const durationOptions = page.getByRole('group', { name: 'เลือกระยะเวลาฝึกฝน' });
  const fifteenMinuteOption = durationOptions.getByRole('button', { name: /15 นาที/ });
  await expect(fifteenMinuteOption).toBeVisible();
  await fifteenMinuteOption.click();
  await expect(fifteenMinuteOption).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.getByRole('heading', { name: /ยินดีต้อนรับ/ })).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'เลือกระยะเวลาฝึกฝน' }).getByRole('button', { name: /15 นาที/ })
  ).toHaveAttribute('aria-pressed', 'true');
});

test('profile goal and confidence can be changed in Settings', async ({ page }) => {
  await page.goto('/#/settings');

  const goalSelect = page.getByLabel('เป้าหมายหลักในการฝึก');
  const confidenceSelect = page.getByLabel('ระดับความมั่นใจในภาษาอังกฤษ');
  await expect(goalSelect).toHaveValue('daily');
  await expect(confidenceSelect).toHaveValue('beginner');

  await goalSelect.selectOption('gaming');
  await confidenceSelect.selectOption('advancing');
  await page.getByRole('button', { name: 'บันทึกข้อมูล' }).click();
  await expect(page.getByText('บันทึกการเปลี่ยนแปลงแล้ว')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('เป้าหมายหลักในการฝึก')).toHaveValue('gaming');
  await expect(page.getByLabel('ระดับความมั่นใจในภาษาอังกฤษ')).toHaveValue('advancing');
});

test('Settings no longer requests an external AI API key', async ({ page }) => {
  await page.goto('/#/settings');

  await expect(page.getByText(/OpenRouter|API Key|BYOK/)).toHaveCount(0);
});

test('invalid lesson and resource URLs show recoverable not-found states', async ({ page }) => {
  await page.goto('/#/lesson/does-not-exist');
  await expect(page.getByText('ไม่พบบทเรียนนี้', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'กลับไปหน้าบทเรียน' })).toBeVisible();

  await page.goto('/#/resource-study/does-not-exist');
  await expect(page.getByText('ไม่พบสื่อฝึกนี้', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'กลับไปคลังสื่อ' })).toBeVisible();
});

test('a fresh profile does not impersonate the example persona', async ({ page }) => {
  await page.goto('/#/today');

  await expect(page.getByRole('heading', { name: /ยินดีต้อนรับ/ })).toBeVisible();
  await expect(page.getByText('ปุ๊ก', { exact: true })).toHaveCount(0);
  await expect(page.getByText('ผู้เรียน', { exact: true })).toBeVisible();
});

test('deleting the last resource stays deleted after refresh', async ({ page }) => {
  const seededTitle = 'Jack Ma: Why Most People Never Speak English Fluently';

  await page.goto('/#/resources');
  await expect(page.getByRole('heading', { name: seededTitle })).toBeVisible();
  await page.getByRole('button', { name: 'ลบ Resource' }).click();
  await page.getByRole('button', { name: 'ยืนยันลบ' }).click();

  await expect(page.getByRole('heading', { name: seededTitle })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: seededTitle })).toHaveCount(0);
});
