import { test, expect, type Page } from '@playwright/test';

async function fillContact(page: Page) {
  await page.goto('/#contact');
  await page.getByRole('textbox', { name: 'Nom et prénom' }).fill('Mamadou Diallo');
  await page.getByRole('textbox', { name: 'Adresse e-mail' }).fill('test@example.com');
  await page.getByRole('textbox', { name: 'Téléphone' }).fill('+224 600 00 00 00');
  await page.getByRole('combobox', { name: 'Votre besoin' }).selectOption('Graphisme & Design');
  await page.getByRole('textbox', { name: 'Objet de la demande' }).fill('Identité visuelle');
  await page
    .getByRole('textbox', { name: 'Votre projet, vos idées' })
    .fill('Je souhaite créer une identité visuelle pour mon activité.');
  await page.locator('[name="consent"]').check();
}

for (const width of [390, 1440]) {
  test(`confirmation, reset et anti-double soumission à ${width}px (API simulée)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let requests = 0;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/contact', async (route) => {
      requests++;
      const data = route.request().postDataJSON();
      expect(data.email).toBe('test@example.com');
      expect(data.phone).toBe('+224 600 00 00 00');
      await pending;
      // A failed acknowledgement must still display primary success, not invite a duplicate.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ acknowledgement: 'failed' }),
      });
    });
    await fillContact(page);
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByRole('button', { name: 'Envoi en cours...' })).toBeDisabled();
    await page
      .locator('form.contact-form')
      .evaluate((form: HTMLFormElement) => form.requestSubmit());
    expect(requests).toBe(1);
    release();
    await expect(page.locator('.success-message')).toHaveText(
      'Votre message a bien été envoyé. Nous vous répondrons dans les meilleurs délais.',
    );
    await expect(page.getByRole('textbox', { name: 'Nom et prénom' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Votre projet, vos idées' })).toHaveValue('');
    await expect(page.locator('[name="consent"]')).not.toBeChecked();
    expect(requests).toBe(1);
  });
}

test('une erreur conserve les champs et autorise un nouvel essai (API simulée)', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/api/contact', async (route) => {
    requests++;
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        message: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
      }),
    });
  });
  await fillContact(page);
  const submit = page.getByRole('button', { name: 'Envoyer le message' });
  await submit.click();
  await expect(page.locator('.error-message')).toContainText(
    "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
  );
  await expect(page.getByRole('textbox', { name: 'Nom et prénom' })).toHaveValue('Mamadou Diallo');
  await expect(page.locator('[name="consent"]')).toBeChecked();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(() => requests).toBe(2);
});

test('les méthodes GET et PUT sont refusées par la route Next.js', async ({ request }) => {
  expect((await request.get('/api/contact')).status()).toBe(405);
  expect((await request.put('/api/contact', { data: {} })).status()).toBe(405);
});
