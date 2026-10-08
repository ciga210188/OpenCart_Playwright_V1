import { Locator, Page } from '@playwright/test';

export type AdminCustomerDetails = {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    customerListRow: string;
};

export class AdminCustomersPage {
    private readonly page: Page;

    // Locators
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly securityNoticeCloseButton: Locator;
    private readonly customersMenu: Locator;
    private readonly customersLink: Locator;
    private readonly emailFilter: Locator;
    private readonly filterButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.usernameInput = page.getByLabel('Username');
        this.passwordInput = page.getByLabel('Password');
        this.loginButton = page.getByRole('button', { name: /Login/ });
        this.securityNoticeCloseButton = page.locator('#modal-security button.close');
        this.customersMenu = page.locator('#menu a[href="#collapse5"]');
        this.customersLink = page.locator('#menu a[href*="route=customer/customer&"]');
        this.emailFilter = page.getByPlaceholder('E-Mail');
        this.filterButton = page.locator('#button-filter');
    }

    /**
     * Logs into the OpenCart Admin Portal and opens its customer list.
     * @param username - configured administrator username
     * @param password - configured administrator password
     */
    async login(username: string, password: string): Promise<void> {
        const appUrl = process.env.WEB_APP_URL;
        if (!appUrl) {
            throw new Error('WEB_APP_URL must be configured before opening the Admin Portal.');
        }

        try {
            await this.page.goto(new URL('admin/index.php', appUrl).toString());
            await this.usernameInput.fill(username);
            await this.passwordInput.fill(password);
            await this.loginButton.click();
            await this.page.waitForURL(/route=common\/dashboard/);

            if (await this.securityNoticeCloseButton.isVisible()) {
                await this.securityNoticeCloseButton.click();
            }

            await this.customersMenu.click();
            await this.customersLink.click();
            await this.page.waitForURL(/route=customer\/customer&/);
        } catch (error) {
            console.log(`Error opening the Admin Portal customer list: ${error}`);
            throw error;
        }
    }

    /**
     * Filters the Admin Portal customer list by email and opens the matching record.
     * @param email - unique customer email to search for
     * @returns Promise<AdminCustomerDetails> - customer details from the edit form
     */
    async findCustomerByEmail(email: string): Promise<AdminCustomerDetails> {
        await this.emailFilter.fill(email);
        await this.page.keyboard.press('Escape');
        await this.filterButton.click();

        const customerRow = this.page.getByRole('row').filter({ hasText: email });
        await customerRow.waitFor({ state: 'visible' });
        const rowText = await customerRow.innerText();
        const editLink = customerRow.locator('a[href*="route=customer/customer/edit"]');
        await editLink.click();
        await this.page.waitForURL(/route=customer\/customer\/edit&/);

        const firstName = this.page.locator('#input-firstname');
        const lastName = this.page.locator('#input-lastname');
        const customerEmail = this.page.locator('#input-email');
        const status = this.page.locator('#input-status');

        return {
            firstName: await firstName.inputValue(),
            lastName: await lastName.inputValue(),
            email: await customerEmail.inputValue(),
            status: await status.inputValue(),
            customerListRow: rowText,
        };
    }
}
