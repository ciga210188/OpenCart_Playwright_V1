import { Locator, Page } from '@playwright/test';

export type CustomerRegistrationData = {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
};

export class RegistrationPage {
    private readonly page: Page;

    // Locators
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly emailInput: Locator;
    private readonly telephoneInput: Locator;
    private readonly passwordInput: Locator;
    private readonly confirmPasswordInput: Locator;
    private readonly privacyPolicyCheckbox: Locator;
    private readonly continueButton: Locator;
    private readonly registrationHeading: Locator;
    private readonly registrationSuccessHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.firstNameInput = page.getByPlaceholder('First Name');
        this.lastNameInput = page.getByPlaceholder('Last Name');
        this.emailInput = page.getByPlaceholder('E-Mail');
        this.telephoneInput = page.getByPlaceholder('Telephone');
        this.passwordInput = page.getByPlaceholder('Password', { exact: true });
        this.confirmPasswordInput = page.getByPlaceholder('Password Confirm');
        this.privacyPolicyCheckbox = page.getByRole('checkbox');
        this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
        this.registrationHeading = page.getByRole('heading', { name: 'Register Account', exact: true });
        this.registrationSuccessHeading = page.getByRole('heading', {
            name: 'Your Account Has Been Created!',
            exact: true,
        });
    }

    /**
     * Checks whether the customer registration form is displayed.
     * @returns Promise<boolean> - true when the registration page is visible
     */
    async isRegistrationPageDisplayed(): Promise<boolean> {
        return this.registrationHeading.isVisible();
    }

    /**
     * Completes the registration form and submits it.
     * @param customer - dynamically generated customer details
     */
    async completeRegistration(customer: CustomerRegistrationData): Promise<void> {
        try {
            await this.firstNameInput.fill(customer.firstName);
            await this.lastNameInput.fill(customer.lastName);
            await this.emailInput.fill(customer.email);
            await this.telephoneInput.fill(customer.telephone);
            await this.passwordInput.fill(customer.password);
            await this.confirmPasswordInput.fill(customer.password);
            await this.privacyPolicyCheckbox.check();
            await this.continueButton.click();
        } catch (error) {
            console.log(`Error completing customer registration: ${error}`);
            throw error;
        }
    }

    /**
     * Checks whether the account creation confirmation is displayed.
     * @returns Promise<boolean> - true when registration succeeded
     */
    async isRegistrationSuccessful(): Promise<boolean> {
        return this.registrationSuccessHeading.isVisible();
    }
}
