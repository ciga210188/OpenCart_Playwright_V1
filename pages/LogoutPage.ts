import { Locator, Page } from '@playwright/test';

export class LogoutPage {
    private readonly page: Page;

    // Locators
    private readonly logoutHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.logoutHeading = page.getByRole('heading', { name: 'Account Logout', exact: true });
    }

    /**
     * Checks whether the logged-out confirmation is displayed.
     * @returns Promise<boolean> - true when logout succeeded
     */
    async isLogoutSuccessful(): Promise<boolean> {
        return this.logoutHeading.isVisible();
    }
}
