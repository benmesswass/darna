import path from "node:path";
import { test as base, type Page } from "@playwright/test";

/**
 * Comptes E2E multi-rôles (seedés + connectés une fois dans global-setup.ts).
 * Chaque fixture ouvre un contexte isolé depuis le storageState pré-authentifié
 * du rôle — permet de composer plusieurs rôles dans un même test (ex. IDOR,
 * double-réservation à 2 voyageurs).
 */
const AUTH_DIR = path.join(__dirname, ".auth");

type Roles = {
  hostPage: Page;
  hostCancelPage: Page;
  travelerAPage: Page;
  travelerBPage: Page;
};

function roleFixture(file: string) {
  return async (
    { browser }: { browser: import("@playwright/test").Browser },
    use: (page: Page) => Promise<void>
  ) => {
    const context = await browser.newContext({ storageState: path.join(AUTH_DIR, file) });
    const page = await context.newPage();
    await use(page);
    await context.close();
  };
}

export const test = base.extend<Roles>({
  hostPage: roleFixture("host.json"),
  hostCancelPage: roleFixture("host-cancel.json"),
  travelerAPage: roleFixture("traveler-a.json"),
  travelerBPage: roleFixture("traveler-b.json"),
});

export { expect } from "@playwright/test";
