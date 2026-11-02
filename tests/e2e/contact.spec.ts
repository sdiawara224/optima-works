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

for (const width of [390, 1440]) {
  test(`tous les champs et le fichier sont transmis puis réinitialisés à ${width}px (API simulée)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let sent = 0;
    await page.route('**/api/contact', async (route) => {
      const type = route.request().headers()['content-type'];
      expect(type).toContain('multipart/form-data; boundary=');
      const form = await new Response(new Uint8Array(route.request().postDataBuffer()!), {
        headers: { 'Content-Type': type },
      }).formData();
      for (const [field, value] of Object.entries({
        name: 'Mamadou Diallo',
        company: 'Entreprise de test',
        email: 'test@example.com',
        phone: '+224 600 00 00 00',
        service: 'Graphisme & Design',
        subject: 'Identité visuelle',
        message: 'Je souhaite créer une identité visuelle pour mon activité.',
        consent: 'true',
      }))
        expect(form.get(field)).toBe(value);
      const file = form.get('descriptionFile') as File;
      expect(file.name).toBe('description.txt');
      expect(await file.text()).toBe('Description détaillée du projet de test.');
      expect(form.getAll('descriptionFile')).toHaveLength(1);
      sent++;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await fillContact(page);
    await page.getByRole('textbox', { name: 'Entreprise', exact: true }).fill('Entreprise de test');
    const input = page.locator('[name="descriptionFile"]');
    await input.setInputFiles({
      name: 'description.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Description détaillée du projet de test.'),
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(input).toHaveValue('');
    expect(sent).toBe(1);
  });
}

test('un fichier interdit ou trop lourd est refusé avant tout appel API', async ({ page }) => {
  let sent = 0;
  await page.route('**/api/contact', async (route) => {
    sent++;
    await route.abort();
  });
  await fillContact(page);
  const input = page.locator('[name="descriptionFile"]');
  await input.setInputFiles({
    name: 'script.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('MZ'),
  });
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.locator('#error-descriptionFile')).toContainText(
    'uniquement un fichier PDF ou TXT',
  );
  await expect(input).toBeFocused();
  await input.setInputFiles({
    name: 'volumineux.txt',
    mimeType: 'text/plain',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 'a'),
  });
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.locator('#error-descriptionFile')).toContainText('2 Mo');
  expect(sent).toBe(0);
});

test('une erreur conserve aussi le fichier sélectionné pour réessayer', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Envoi indisponible.' }),
    }),
  );
  await fillContact(page);
  const input = page.locator('[name="descriptionFile"]');
  await input.setInputFiles({
    name: 'description.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Projet de test.'),
  });
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.locator('.error-message')).toContainText('Envoi indisponible');
  await expect(input).toHaveValue(/description\.txt$/);
  await expect(page.getByRole('textbox', { name: 'Nom et prénom' })).toHaveValue('Mamadou Diallo');
});

test('une adresse Gmail non conforme bloque le frontend sans envoi', async ({ page }) => {
  let sent = 0;
  await page.route('**/api/contact', async (route) => {
    sent++;
    await route.abort();
  });
  await fillContact(page);
  await page.getByRole('textbox', { name: 'Adresse e-mail' }).fill('prenom_nom@gmail.com');
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.locator('#error-email')).toContainText('Gmail n’est pas conforme');
  expect(sent).toBe(0);
});

test('le vrai serveur Next.js traite le multipart et refuse un faux PDF', async ({
  request,
  baseURL,
}) => {
  const multipart = {
    name: 'Mamadou Diallo',
    email: 'test@example.com',
    service: 'Graphisme & Design',
    subject: 'Test fichier',
    message: 'Une description de projet assez longue pour être valide.',
    consent: 'true',
    descriptionFile: {
      name: 'description.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Description du projet.'),
    },
  };
  const options = { headers: { origin: new URL(baseURL!).origin }, multipart };
  const valid = await request.post('/api/contact', options);
  // No credentials in this test server: a valid upload reaches the explicit configuration check.
  expect(valid.status()).toBe(503);
  expect((await valid.json()).message).toContain('Aucun message n’a été transmis');
  const invalid = await request.post('/api/contact', {
    ...options,
    multipart: {
      ...multipart,
      descriptionFile: {
        name: 'description.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('not a pdf'),
      },
    },
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).errors.descriptionFile).toContain('PDF');
});
