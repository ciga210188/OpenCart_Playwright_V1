import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { CustomerRegistrationData } from '../../pages/RegistrationPage';

test('End-to-end shopping flow @master @sanity @regression @web @end-to-end', async ({
    page,
    homePage,
    registrationPage,
    loginPage,
    logoutPage,
    productPage,
    cartPage,
}) => {
    test.setTimeout(90_000);

    const product = Helper.getProductDetails();
    const email = RandomDataUtil.getEmail().replace('@', `.${Date.now()}@`);
    const customer: CustomerRegistrationData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email,
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(16),
    };
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await test.step('1) Open the application', async () => {
        expect(await homePage.isHomePageDisplayed()).toBeTruthy();
    });

    await test.step('2) Register a new customer with unique data', async () => {
        await homePage.openRegistration();
        await registrationPage.completeRegistration(customer);
    });

    await test.step('3) Verify successful registration', async () => {
        expect(await registrationPage.isRegistrationSuccessful()).toBeTruthy();
    });

    await test.step('4) Log out of the new customer account', async () => {
        await homePage.logout();
        expect(await logoutPage.isLogoutSuccessful()).toBeTruthy();
    });

    await test.step('5) Log in with the newly created credentials', async () => {
        await homePage.openLogin();
        await loginPage.login(customer.email, customer.password);
    });

    await test.step('6) Verify successful authentication', async () => {
        expect(await loginPage.isAuthenticationSuccessful()).toBeTruthy();
    });

    await test.step('7) Search for the known product', async () => {
        await homePage.searchProduct(product.productName);
    });

    await test.step('8) Open the product details page', async () => {
        await homePage.openProduct(product.productName);
        expect(await productPage.isProductDetailsDisplayed(product.productName)).toBeTruthy();
    });

    await test.step('9) Add the product to the cart', async () => {
        await productPage.setQuantity(product.productQuantity);
        expect(await productPage.getProductPrice()).toBe(product.totalPrice);
        await productPage.addToCart();
        expect(await productPage.isProductAddedToCart()).toBeTruthy();
    });

    await test.step('10) Open the shopping cart', async () => {
        await productPage.openShoppingCart();
        expect(await cartPage.isCartDisplayed()).toBeTruthy();
    });

    await test.step('11) Verify the correct product is in the cart', async () => {
        const productRow = await cartPage.getProductRowText(product.productName);
        expect(productRow).toContain(product.productName);
    });

    await test.step('12) Verify the cart quantity', async () => {
        expect(await cartPage.getProductQuantity(product.productName)).toBe(product.productQuantity);
    });

    await test.step('13) Verify the product price', async () => {
        const productRow = await cartPage.getProductRowText(product.productName);
        expect(productRow).toContain(product.totalPrice);
    });

    await test.step('14) Verify the applicable cart total', async () => {
        const totalRow = await cartPage.getGrandTotalRowText();
        expect(totalRow).toContain(product.totalPrice);
    });

    await test.step('15) Verify the journey completed without page errors', async () => {
        expect(pageErrors).toEqual([]);
    });

    console.log('✅ End-to-end shopping flow completed successfully.');
});
