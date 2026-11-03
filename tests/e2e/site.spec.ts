import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('la navigation, le journal et la 404 fonctionnent', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/OptimaWorks/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page
    .getByRole('navigation', { name: 'Navigation principale', exact: true })
    .getByRole('link', { name: 'Blog' })
    .click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByText('Nos premiers articles sont en préparation')).toBeVisible();
  const response = await page.goto('/blog/article-inexistant');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Une idée perdue en chemin ?' })).toBeVisible();
});
test('les quatre détails de service sont accessibles', async ({ page }) => {
  await page.goto('/');
  const buttons = page.getByRole('button', { name: 'Explorer ce service' });
  await expect(buttons).toHaveCount(4);
  await buttons.nth(0).click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog.getByRole('heading', { name: 'Graphisme & Design' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(buttons.nth(0)).toBeFocused();
});
test('la FAQ fonctionne au clavier', async ({ page }) => {
  await page.goto('/#faq');
  const summary = page.locator('summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await expect(page.getByText('OptimaWorks réunit quatre domaines')).toBeVisible();
});
test('le formulaire signale les champs invalides et un envoi non configuré', async ({ page }) => {
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.getByRole('textbox', { name: 'Nom et prénom' })).toBeFocused();
  await expect(page.getByText('Indiquez au moins 2 caractères.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Nom et prénom' }).fill('Mamadou Diallo');
  await page.getByRole('textbox', { name: 'Adresse e-mail' }).fill('test@example.com');
  await page.getByRole('combobox', { name: 'Votre besoin' }).selectOption('Graphisme & Design');
  await page.getByRole('textbox', { name: 'Objet de la demande' }).fill('Identité visuelle');
  await page
    .getByRole('textbox', { name: 'Votre projet, vos idées' })
    .fill('Je souhaite créer une identité visuelle pour mon activité.');
  await page.locator('[name="consent"]').check();
  await page.getByRole('button', { name: 'Envoyer le message' }).click();
  await expect(page.locator('.error-message')).toContainText('Aucun message n’a été transmis');
  await expect(page.getByText('Votre message a bien été envoyé')).toHaveCount(0);
  await expect(
    page
      .locator('.error-message')
      .getByRole('link', { name: 'Écrivez-nous directement par e-mail' }),
  ).toHaveAttribute('href', 'mailto:optimaworksgn@gmail.com');
});
test('le menu mobile gère fermeture et focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
  await toggle.click();
  await expect(page.getByRole('navigation', { name: 'Navigation mobile' })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Navigation mobile' })
      .getByRole('link', { name: 'Accueil' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page
    .getByRole('navigation', { name: 'Navigation mobile' })
    .getByRole('link', { name: 'Contact', exact: true })
    .click();
  await expect(page.getByRole('navigation', { name: 'Navigation mobile' })).toHaveCount(0);
  await expect(page).toHaveURL(/#contact$/);
});
test('aucun débordement à 360, 390, 768 et 1440 pixels', async ({ page }) => {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `Débordement à ${width}px`,
    ).toBeTruthy();
  }
});
test('respecte le mouvement réduit et ne masque pas de section', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(
    await page
      .locator('.service-card')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('1');
  expect(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
    'auto',
  );
});
test('contrôle automatisé WCAG AA', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});

test('les trois visuels fournis sont affichés sans recadrage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const selector of [
    '.hero-brand-visual img',
    '.about-brand-visual img',
    '.why-brand-visual img',
  ]) {
    const image = page.locator(selector);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    await expect(image).not.toHaveAttribute('alt', '');
  }
});

test('la série Explorer, Créateur et Connecteur complète les images existantes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Explorer. Créer. Connecter.' });
  await expect(section.locator('figure')).toHaveCount(3);
  for (const name of ['Explorer', 'Créateur', 'Connecteur']) {
    await expect(section.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  for (const image of await section.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    await expect(image).not.toHaveAttribute('alt', '');
    const ratio = await image.evaluate((el: HTMLImageElement) => ({
      original: el.naturalWidth / el.naturalHeight,
      displayed: el.getBoundingClientRect().width / el.getBoundingClientRect().height,
    }));
    expect(Math.abs(ratio.original - ratio.displayed)).toBeLessThan(0.01);
  }
  await expect(
    page.locator('.hero-brand-visual img, .about-brand-visual img, .why-brand-visual img'),
  ).toHaveCount(3);
});

test('le logo officiel remplace la marque provisoire et sert les icônes', async ({ page }) => {
  await page.goto('/');
  const logos = page.getByRole('img', { name: 'Logo officiel OptimaWorks', exact: true });
  await expect(logos).toHaveCount(2);
  for (const logo of await logos.all())
    await expect(logo).toHaveAttribute('src', /optimaworks-logo-clair/);
  for (const logo of await logos.all()) {
    await logo.scrollIntoViewIfNeeded();
    await expect
      .poll(() => logo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    const ratio = await logo.evaluate(
      (el: HTMLImageElement) =>
        el.getBoundingClientRect().width / el.getBoundingClientRect().height,
    );
    expect(ratio).toBeCloseTo(1044 / 312, 1);
  }
  await expect(page.locator('.logo-symbol')).toHaveCount(0);
  const link = page.locator('header').getByRole('link', { name: 'OptimaWorks — Accueil' });
  await expect(link).toHaveAttribute('href', '/');
  for (const asset of ['/icon.png', '/apple-icon.png', '/opengraph-image']) {
    const response = await page.request.get(asset);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  }
});

test('l’adresse officielle est publiée dans le contact et le pied de page', async ({ page }) => {
  await page.goto('/');
  for (const selector of ['#contact', 'footer']) {
    await expect(
      page.locator(selector).getByRole('link', { name: 'optimaworksgn@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:optimaworksgn@gmail.com');
  }
  await expect(page.getByText('Les coordonnées directes seront affichées')).toHaveCount(0);
});
