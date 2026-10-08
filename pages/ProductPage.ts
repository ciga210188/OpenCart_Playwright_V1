import { Locator, Page } from '@playwright/test';
import { CartPage } from './CartPage';

export class ProductPage {
    private readonly page: Page;

    // Locators
    private readonly productHeading: Locator;
    private readonly productPrice: Locator;
    private readonly quantityInput: Locator;
    private readonly addToCartButton: Locator;
    private readonly addToCartConfirmation: Locator;
    private readonly shoppingCartLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.productHeading = page.getByRole('heading', { level: 1 });
        this.productPrice = page.getByRole('heading', { level: 2 });
        this.quantityInput = page.getByRole('textbox', { name: 'Qty' });
        this.addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
        this.addToCartConfirmation = page.getByText(/Success: You have added/);
        this.shoppingCartLink = page.getByRole('link', { name: 'shopping cart', exact: true });
    }

    /**
     * Checks that the expected product detail page is displayed.
     * @param productName - expected product name
     * @returns Promise<boolean> - true when the product heading matches
     */
    async isProductDetailsDisplayed(productName: string): Promise<boolean> {
        return (await this.productHeading.innerText()).trim() === productName;
    }

    /**
     * Reads the product price displayed on the details page.
     * @returns Promise<string> - displayed product price
     */
    async getProductPrice(): Promise<string> {
        return (await this.productPrice.innerText()).trim();
    }

    /**
     * Sets the requested product quantity.
     * @param quantity - quantity to add to the cart
     */
    async setQuantity(quantity: string): Promise<void> {
        await this.quantityInput.fill(quantity);
    }

    /**
     * Adds the displayed product to the shopping cart.
     */
    async addToCart(): Promise<void> {
        await this.addToCartButton.click();
    }

    /**
     * Checks whether the product-added confirmation is displayed.
     * @returns Promise<boolean> - true when the cart confirmation is visible
     */
    async isProductAddedToCart(): Promise<boolean> {
        await this.addToCartConfirmation.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Opens the shopping cart from the add-to-cart confirmation.
     * @returns Promise<CartPage> - the shopping cart page object
     */
    async openShoppingCart(): Promise<CartPage> {
        await this.shoppingCartLink.click();
        return new CartPage(this.page);
    }
}
