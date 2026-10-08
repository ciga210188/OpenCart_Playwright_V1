import { Locator, Page } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;

    // Locators
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly myAccountHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.emailInput = page.getByLabel('E-Mail Address');
        this.passwordInput = page.getByLabel('Password');
        this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
        this.myAccountHeading = page.locator('#content')
            .getByRole('heading', { name: 'My Account', exact: true });
    }

    /**
     * Logs in with a customer's credentials.
     * @param email - registered customer email
     * @param password - registered customer password
     */
    async login(email: string, password: string): Promise<void> {
        try {
            await this.emailInput.fill(email);
            await this.passwordInput.fill(password);
            await this.loginButton.click();
        } catch (error) {
            console.log(`Error logging in: ${error}`);
            throw error;
        }
    }

    /**
     * Checks whether login reached the authenticated customer account page.
     * @returns Promise<boolean> - true when the account page is displayed
     */
    async isAuthenticationSuccessful(): Promise<boolean> {
        return this.myAccountHeading.isVisible();
    }
}
