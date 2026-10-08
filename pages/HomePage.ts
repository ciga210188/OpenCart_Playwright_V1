import { Locator, Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { LogoutPage } from './LogoutPage';
import { ProductPage } from './ProductPage';
import { RegistrationPage } from './RegistrationPage';

export class HomePage {
    private readonly page: Page;

    // Locators
    private readonly accountMenu: Locator;
    private readonly registerLink: Locator;
    private readonly loginLink: Locator;
    private readonly logoutLink: Locator;
    private readonly searchInput: Locator;
    private readonly searchButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        const topLinks = page.locator('#top-links');
        this.accountMenu = topLinks.getByRole('link', { name: /My Account/ });
        this.registerLink = topLinks.getByRole('link', { name: 'Register', exact: true });
        this.loginLink = topLinks.getByRole('link', { name: 'Login', exact: true });
        this.logoutLink = topLinks.getByRole('link', { name: 'Logout', exact: true });
        this.searchInput = page.getByPlaceholder('Search');
        this.searchButton = page.locator('#search button');
    }

    /**
     * Checks whether the store search control is displayed.
     * @returns Promise<boolean> - true when the store page is available
     */
    async isHomePageDisplayed(): Promise<boolean> {
        return this.searchInput.isVisible();
    }

    /**
     * Opens the customer registration page.
     * @returns Promise<RegistrationPage> - the registration page object
     */
    async openRegistration(): Promise<RegistrationPage> {
        try {
            await this.accountMenu.click();
            await this.registerLink.click();
            return new RegistrationPage(this.page);
        } catch (error) {
            console.log(`Error opening registration: ${error}`);
            throw error;
        }
    }

    /**
     * Opens the customer login page.
     * @returns Promise<LoginPage> - the login page object
     */
    async openLogin(): Promise<LoginPage> {
        try {
            await this.accountMenu.click();
            await this.loginLink.click();
            return new LoginPage(this.page);
        } catch (error) {
            console.log(`Error opening login: ${error}`);
            throw error;
        }
    }

    /**
     * Logs out the currently authenticated customer.
     * @returns Promise<LogoutPage> - the logout confirmation page object
     */
    async logout(): Promise<LogoutPage> {
        try {
            await this.accountMenu.click();
            await this.logoutLink.click();
            return new LogoutPage(this.page);
        } catch (error) {
            console.log(`Error logging out: ${error}`);
            throw error;
        }
    }

    /**
     * Searches the catalog for a product.
     * @param productName - product name to search for
     */
    async searchProduct(productName: string): Promise<void> {
        await this.searchInput.fill(productName);
        await this.searchButton.click();
    }

    /**
     * Opens a product from the catalog or search results.
     * @param productName - exact product name to open
     * @returns Promise<ProductPage> - the product details page object
     */
    async openProduct(productName: string): Promise<ProductPage> {
        const productHeading = this.page.getByRole('heading', { name: productName, exact: true });
        await productHeading.getByRole('link', { name: productName, exact: true }).click();
        return new ProductPage(this.page);
    }
}
