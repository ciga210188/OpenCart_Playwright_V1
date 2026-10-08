import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { AdminCustomersPage } from '../pages/AdminCustomersPage';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { LogoutPage } from '../pages/LogoutPage';
import { ProductPage } from '../pages/ProductPage';
import { RegistrationPage } from '../pages/RegistrationPage';

dotenv.config();

const APP_URL = process.env.WEB_APP_URL;
if (!APP_URL) {
    throw new Error('WEB_APP_URL must be configured in .env before running web tests.');
}

type PageFixtures = {
    adminCustomersPage: AdminCustomersPage;
    homePage: HomePage;
    registrationPage: RegistrationPage;
    loginPage: LoginPage;
    logoutPage: LogoutPage;
    productPage: ProductPage;
    cartPage: CartPage;
};

export const test = base.extend<PageFixtures>({
    adminCustomersPage: async ({ page }, use) => {
        await use(new AdminCustomersPage(page));
    },
    homePage: async ({ page }, use) => {
        await page.goto(APP_URL);
        await use(new HomePage(page));
    },
    registrationPage: async ({ page }, use) => {
        await use(new RegistrationPage(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    logoutPage: async ({ page }, use) => {
        await use(new LogoutPage(page));
    },
    productPage: async ({ page }, use) => {
        await use(new ProductPage(page));
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },
});

test.afterEach(async ({ page, context }) => {
    if (!page.isClosed()) {
        await page.close();
    }
    if (context.pages().length === 0) {
        await context.close();
    }
});

export { expect };
