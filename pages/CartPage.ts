import { Locator, Page } from '@playwright/test';

export class CartPage {
    private readonly page: Page;

    // Locators
    private readonly cartHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.cartHeading = page.getByRole('heading', { name: /Shopping Cart/ });
    }

    /**
     * Checks whether the shopping cart page is displayed.
     * @returns Promise<boolean> - true when the cart heading is visible
     */
    async isCartDisplayed(): Promise<boolean> {
        return this.cartHeading.isVisible();
    }

    /**
     * Reads the cart row for a product.
     * @param productName - exact product name in the cart
     * @returns Promise<string> - rendered cart row text
     */
    async getProductRowText(productName: string): Promise<string> {
        const productRow = this.page.getByRole('row').filter({ hasText: productName });
        return productRow.innerText();
    }

    /**
     * Reads the editable quantity for a product in the cart.
     * @param productName - exact product name in the cart
     * @returns Promise<string> - current cart quantity
     */
    async getProductQuantity(productName: string): Promise<string> {
        const productRow = this.page.getByRole('row').filter({ hasText: productName });
        return productRow.getByRole('textbox').inputValue();
    }

    /**
     * Reads the grand-total row in the cart summary.
     * @returns Promise<string> - rendered grand-total row text
     */
    async getGrandTotalRowText(): Promise<string> {
        const totalRow = this.page.getByRole('row', { name: /^Total:/ });
        return totalRow.innerText();
    }
}
