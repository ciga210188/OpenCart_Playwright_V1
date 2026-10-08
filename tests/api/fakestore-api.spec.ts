import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import dotenv from 'dotenv';
import path from 'node:path';
import { Routes } from '../../api/endpoints/routes';
import { DataProvider } from '../../utils/DataReader';
import { RandomDataUtil } from '../../utils/dataGenerator';

const dotenvConfig = dotenv.config();
const dotenvValues = dotenvConfig.parsed ?? {};

type Product = {
    id: number;
    title: string;
    price: number;
    category: string;
    image: string;
};

type User = {
    id: number;
    username: string;
    email: string;
};

type Cart = {
    id: number;
    userId: number;
    date: string;
    products: { productId: number; quantity: number }[];
};

test.describe('FakeStore API Tests', () => {
    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
    const USERNAME =
        process.env.API_USERNAME ??
        dotenvValues.API_USERNAME ??
        dotenvValues.USERNAME ??
        process.env.USERNAME;
    const PASSWORD =
        process.env.API_PASSWORD ??
        dotenvValues.API_PASSWORD ??
        process.env.PASSWORD ??
        dotenvValues.PASSWORD;
    const USER_ID = Number(process.env.USER_ID ?? 1);
    const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
    const CART_ID = Number(process.env.CART_ID ?? 1);
    const LIMIT = Number(process.env.LIMIT ?? 3);
    const START_DATE = process.env.START_DATE ?? '2019-12-10';
    const END_DATE = process.env.END_DATE ?? '2020-10-10';

    const productByIdRoute = (id: number): string =>
        Routes.GET_PRODUCT_BY_ID.replace('{id}', String(id));
    const userByIdRoute = (id: number): string =>
        Routes.GET_USER_BY_ID.replace('{id}', String(id));
    const cartByIdRoute = (id: number): string =>
        Routes.GET_CART_BY_ID.replace('{id}', String(id));

    const productPayload = {
        title: 'Playwright API Test Product',
        price: 19.99,
        description: 'Product created by the Playwright API test suite.',
        image: 'https://i.pravatar.cc',
        category: 'electronics',
    };
    const updatedProductPayload = {
        title: 'Updated Playwright API Test Product',
        price: 29.99,
        description: 'Product updated by the Playwright API test suite.',
        image: 'https://i.pravatar.cc',
        category: 'electronics',
    };
    const userPayload = {
        email: 'playwright.api.user@example.com',
        username: 'playwright_api_user',
        password: 'PlaywrightApiPassword123',
        name: { firstname: 'Playwright', lastname: 'Api' },
        address: {
            city: 'Test City',
            street: 'Test Street',
            number: 1,
            zipcode: '12345',
            geolocation: { lat: '0', long: '0' },
        },
        phone: '123-456-7890',
    };
    const updatedUserPayload = {
        ...userPayload,
        username: 'updated_playwright_api_user',
        email: 'updated.playwright.api.user@example.com',
    };
    const cartPayload = {
        userId: USER_ID,
        date: START_DATE,
        products: [{ productId: PRODUCT_ID, quantity: 1 }],
    };
    const updatedCartPayload = {
        ...cartPayload,
        products: [{ productId: PRODUCT_ID, quantity: 2 }],
    };

    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

    test('POST - Successful login @master @sanity @api', async ({ request }) => {
        expect(USERNAME, 'USERNAME must be configured in .env').toBeTruthy();
        expect(PASSWORD, 'PASSWORD must be configured in .env').toBeTruthy();

        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: { username: USERNAME, password: PASSWORD },
        });

        expect(response.status(), 'Valid credentials should return HTTP 201').toBe(201);
        const body = await response.json();
        expect(typeof body.token, 'The login response should contain a token string').toBe('string');
        expect(body.token.length, 'The authentication token should not be empty').toBeGreaterThan(0);
    });

    test('POST - Invalid login @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: {
                username: `invalid-user-${Date.now()}`,
                password: 'invalid-password',
            },
        });

        expect(response.status(), 'Invalid credentials should return HTTP 401').toBe(401);
        const message = await response.text();
        expect(message, 'The API should explain the authentication failure')
            .toBe('username or password is incorrect');
    });

    // ---------------------------------------------------------
    // Products
    // ---------------------------------------------------------

    test('GET - All products @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
        expect(response.status(), 'Product listing should return HTTP 200').toBe(200);

        const products = await response.json();
        expect(Array.isArray(products), 'Product listing should be an array').toBeTruthy();
        expect(products.length, 'Product listing should not be empty').toBeGreaterThan(0);

        for (const product of products as Product[]) {
            expect(product.id, 'Each product should have a numeric ID').toEqual(expect.any(Number));
            expect(product.title, 'Each product should have a title').toEqual(expect.any(String));
            expect(product.price, 'Each product should have a numeric price').toEqual(expect.any(Number));
            expect(product.category, 'Each product should have a category').toEqual(expect.any(String));
            expect(product.image, 'Each product should have an image URL').toEqual(expect.any(String));
        }
    });

    test('GET - Product by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${productByIdRoute(PRODUCT_ID)}`);
        expect(response.status(), 'Known product should return HTTP 200').toBe(200);

        const product = await response.json() as Product;
        expect(product.id, 'Returned product ID should match the requested ID').toBe(PRODUCT_ID);
        expect(product.title, 'Product title should be a string').toEqual(expect.any(String));
        expect(product.price, 'Product price should be numeric').toEqual(expect.any(Number));
        expect(product.category, 'Product category should be a string').toEqual(expect.any(String));
        expect(product.image, 'Product image should be a string').toEqual(expect.any(String));
    });

    test('GET - Products with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Limited product listing should return HTTP 200').toBe(200);

        const products = await response.json();
        expect(Array.isArray(products), 'Limited product listing should be an array').toBeTruthy();
        expect(products.length, 'Product count should equal the requested limit').toBe(LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Products sorted ${order}ending @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Product sort (${order}) should return HTTP 200`).toBe(200);

            const products = await response.json() as Product[];
            expect(products.length, 'Sorted product listing should not be empty').toBeGreaterThan(0);
            const ids = products.map((product) => product.id);
            const sortedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left);
            expect(ids, `Product IDs should be sorted ${order}ending`).toEqual(sortedIds);
        });
    }

    test('GET - Product categories @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);
        expect(response.status(), 'Product categories should return HTTP 200').toBe(200);

        const categories = await response.json();
        expect(Array.isArray(categories), 'Categories should be returned as an array').toBeTruthy();
        expect(categories.length, 'Category list should not be empty').toBeGreaterThan(0);
    });

    test('GET - Products by category @master @regression @api', async ({ request }) => {
        const category = 'electronics';
        const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', category);
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Category products should return HTTP 200').toBe(200);

        const products = await response.json() as Product[];
        expect(Array.isArray(products), 'Category products should be an array').toBeTruthy();
        expect(products.length, 'The selected category should contain products').toBeGreaterThan(0);
        for (const product of products) {
            expect(product.category, 'Every result should belong to the requested category').toBe(category);
        }
    });

    test('POST - Create product @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, {
            data: productPayload,
        });
        expect(response.status(), 'Product creation should return HTTP 201').toBe(201);

        const created = await response.json();
        expect(created.id, 'Created product should have an ID').toEqual(expect.any(Number));
        expect(created.title, 'Created product title should match the request').toBe(productPayload.title);
        expect(created.price, 'Created product price should match the request').toBe(productPayload.price);
        expect(created.category, 'Created product category should match the request').toBe(productPayload.category);
        expect(created.image, 'Created product image should match the request').toBe(productPayload.image);
    });

    test('PUT - Update product @master @regression @api', async ({ request }) => {
        const route = Routes.UPDATE_PRODUCT.replace('{id}', String(PRODUCT_ID));
        const response = await request.put(`${BASE_URL}${route}`, {
            data: updatedProductPayload,
        });
        expect(response.status(), 'Product update should return HTTP 200').toBe(200);

        const updated = await response.json();
        expect(updated.id, 'Updated product ID should match the requested ID').toBe(PRODUCT_ID);
        expect(updated.title, 'Updated product title should match the request').toBe(updatedProductPayload.title);
        expect(updated.price, 'Updated product price should match the request').toBe(updatedProductPayload.price);
        expect(updated.category, 'Updated product category should match the request').toBe(updatedProductPayload.category);
    });

    test('DELETE - Product @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_PRODUCT.replace('{id}', String(PRODUCT_ID));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Product deletion should return HTTP 200').toBe(200);

        const deleted = await response.json();
        if (deleted && typeof deleted === 'object' && 'id' in deleted) {
            expect(deleted.id, 'Deleted product response ID should match the requested ID').toBe(PRODUCT_ID);
        }
    });

    // ---------------------------------------------------------
    // Users
    // ---------------------------------------------------------

    test('GET - All users @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
        expect(response.status(), 'User listing should return HTTP 200').toBe(200);

        const users = await response.json();
        expect(Array.isArray(users), 'User listing should be an array').toBeTruthy();
        expect(users.length, 'User listing should not be empty').toBeGreaterThan(0);
    });

    test('GET - User by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${userByIdRoute(USER_ID)}`);
        expect(response.status(), 'Known user should return HTTP 200').toBe(200);

        const user = await response.json() as User;
        expect(user.id, 'Returned user ID should match the requested ID').toBe(USER_ID);
        expect(user.username, 'User should include a username').toEqual(expect.any(String));
        expect(user.email, 'User should include an email').toEqual(expect.any(String));
    });

    test('GET - Users with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Limited user listing should return HTTP 200').toBe(200);

        const users = await response.json();
        expect(Array.isArray(users), 'Limited user listing should be an array').toBeTruthy();
        expect(users.length, 'User count should equal the requested limit').toBe(LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Users sorted ${order}ending @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_USERS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `User sort (${order}) should return HTTP 200`).toBe(200);

            const users = await response.json() as User[];
            expect(users.length, 'Sorted user listing should not be empty').toBeGreaterThan(0);
            const ids = users.map((user) => user.id);
            const sortedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left);
            expect(ids, `User IDs should be sorted ${order}ending`).toEqual(sortedIds);
        });
    }

    test('POST - Create user @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
            data: userPayload,
        });
        expect(response.status(), 'User creation should return HTTP 201').toBe(201);

        const created = await response.json();
        expect(created.id, 'Created user should have an ID').toEqual(expect.any(Number));
    });

    test('PUT - Update user @master @regression @api', async ({ request }) => {
        const route = Routes.UPDATE_USER.replace('{id}', String(USER_ID));
        const response = await request.put(`${BASE_URL}${route}`, {
            data: updatedUserPayload,
        });
        expect(response.status(), 'User update should return HTTP 200').toBe(200);

        const updated = await response.json();
        expect(updated.username, 'Updated username should match the request').toBe(updatedUserPayload.username);
        expect(updated.email, 'Updated email should match the request').toBe(updatedUserPayload.email);
    });

    test('DELETE - User @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_USER.replace('{id}', String(USER_ID));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'User deletion should return HTTP 200').toBe(200);

        const deleted = await response.json();
        if (deleted && typeof deleted === 'object' && 'id' in deleted) {
            expect(deleted.id, 'Deleted user response ID should match the requested ID').toBe(USER_ID);
        }
    });

    // ---------------------------------------------------------
    // Carts
    // ---------------------------------------------------------

    test('GET - All carts @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
        expect(response.status(), 'Cart listing should return HTTP 200').toBe(200);

        const carts = await response.json();
        expect(Array.isArray(carts), 'Cart listing should be an array').toBeTruthy();
        expect(carts.length, 'Cart listing should not be empty').toBeGreaterThan(0);
    });

    test('GET - Cart by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${cartByIdRoute(CART_ID)}`);
        expect(response.status(), 'Known cart should return HTTP 200').toBe(200);

        const cart = await response.json() as Cart;
        expect(cart.id, 'Returned cart ID should match the requested ID').toBe(CART_ID);
        expect(cart.userId, 'Cart should include a numeric user ID').toEqual(expect.any(Number));
        expect(Array.isArray(cart.products), 'Cart products should be an array').toBeTruthy();
    });

    test('GET - Carts by date range @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CARTS_BY_DATE_RANGE
            .replace('{startdate}', encodeURIComponent(START_DATE))
            .replace('{enddate}', encodeURIComponent(END_DATE));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Cart date filter should return HTTP 200').toBe(200);

        const carts = await response.json() as Cart[];
        expect(Array.isArray(carts), 'Date-filtered carts should be an array').toBeTruthy();
        const start = new Date(START_DATE).getTime();
        const end = new Date(END_DATE).getTime();
        for (const cart of carts) {
            const cartDate = new Date(cart.date).getTime();
            expect(cartDate, 'Each cart should be on or after the requested start date').toBeGreaterThanOrEqual(start);
            expect(cartDate, 'Each cart should be on or before the requested end date').toBeLessThanOrEqual(end);
        }
    });

    test('GET - Carts by user @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USER_CART.replace('{userId}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'User cart lookup should return HTTP 200').toBe(200);

        const carts = await response.json() as Cart[];
        expect(Array.isArray(carts), 'User carts should be returned as an array').toBeTruthy();
        for (const cart of carts) {
            expect(cart.userId, 'Each returned cart should belong to the requested user').toBe(USER_ID);
        }
    });

    test('GET - Carts with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Limited cart listing should return HTTP 200').toBe(200);

        const carts = await response.json();
        expect(Array.isArray(carts), 'Limited cart listing should be an array').toBeTruthy();
        expect(carts.length, 'Cart count should equal the requested limit').toBe(LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Carts sorted ${order}ending @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_CARTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Cart sort (${order}) should return HTTP 200`).toBe(200);

            const carts = await response.json() as Cart[];
            expect(carts.length, 'Sorted cart listing should not be empty').toBeGreaterThan(0);
            const ids = carts.map((cart) => cart.id);
            const sortedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left);
            expect(ids, `Cart IDs should be sorted ${order}ending`).toEqual(sortedIds);
        });
    }

    test('POST - Create cart @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
            data: cartPayload,
        });
        expect(response.status(), 'Cart creation should return HTTP 201').toBe(201);

        const created = await response.json() as Cart;
        expect(created.id, 'Created cart should have an ID').toEqual(expect.any(Number));
        expect(created.userId, 'Created cart user ID should match the request').toBe(cartPayload.userId);
        expect(created.products, 'Created cart products should match the request').toEqual(cartPayload.products);
    });

    test('PUT - Update cart @master @regression @api', async ({ request }) => {
        const route = Routes.UPDATE_CART.replace('{id}', String(CART_ID));
        const response = await request.put(`${BASE_URL}${route}`, {
            data: updatedCartPayload,
        });
        expect(response.status(), 'Cart update should return HTTP 200').toBe(200);

        const updated = await response.json() as Cart;
        expect(updated.id, 'Updated cart ID should match the requested ID').toBe(CART_ID);
        expect(updated.userId, 'Updated cart user ID should match the request').toBe(updatedCartPayload.userId);
        expect(updated.products, 'Updated cart products should match the request').toEqual(updatedCartPayload.products);
    });

    test('DELETE - Cart @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_CART.replace('{id}', String(CART_ID));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Cart deletion should return HTTP 200').toBe(200);

        const deleted = await response.json();
        if (deleted && typeof deleted === 'object' && 'id' in deleted) {
            expect(deleted.id, 'Deleted cart response ID should match the requested ID').toBe(CART_ID);
        }
    });

    // ---------------------------------------------------------
    // JSON Schema Validation
    // ---------------------------------------------------------

    test('SCHEMA - Product response @master @regression @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${productByIdRoute(PRODUCT_ID)}`);
        expect(response.status(), 'Product schema endpoint should return HTTP 200').toBe(200);

        const schema = DataProvider.readJson(path.resolve(__dirname, '../../api/schemas/product_api_schema.json'));
        const validate = new Ajv().compile(schema);
        const isValid = validate(await response.json());
        expect(isValid, `Product response schema mismatch: ${new Ajv().errorsText(validate.errors)}`).toBeTruthy();
    });

    test('SCHEMA - User response @master @regression @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${userByIdRoute(USER_ID)}`);
        expect(response.status(), 'User schema endpoint should return HTTP 200').toBe(200);

        const schema = DataProvider.readJson(path.resolve(__dirname, '../../api/schemas/user_api_schema.json'));
        const validate = new Ajv().compile(schema);
        const isValid = validate(await response.json());
        expect(isValid, `User response schema mismatch: ${new Ajv().errorsText(validate.errors)}`).toBeTruthy();
    });

    test('SCHEMA - Cart response @master @regression @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${cartByIdRoute(CART_ID)}`);
        expect(response.status(), 'Cart schema endpoint should return HTTP 200').toBe(200);

        const schema = DataProvider.readJson(path.resolve(__dirname, '../../api/schemas/cart_api_schema.json'));
        const validate = new Ajv().compile(schema);
        const isValid = validate(await response.json());
        expect(isValid, `Cart response schema mismatch: ${new Ajv().errorsText(validate.errors)}`).toBeTruthy();
    });

    // ---------------------------------------------------------
    // End-to-End CRUD Workflows
    // ---------------------------------------------------------

    test.describe.serial('Product CRUD workflow', () => {
        test('POST → PUT → DELETE - Product @master @regression @api', async ({ request }) => {
            const createdResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, {
                data: productPayload,
            });
            expect(createdResponse.status(), 'Workflow product creation should return HTTP 201').toBe(201);
            const created = await createdResponse.json();
            expect(created.id, 'Workflow should capture the created product ID').toEqual(expect.any(Number));
            const productId = Number(created.id);

            const updateRoute = Routes.UPDATE_PRODUCT.replace('{id}', String(productId));
            const updatedResponse = await request.put(`${BASE_URL}${updateRoute}`, {
                data: updatedProductPayload,
            });
            expect(updatedResponse.status(), 'Workflow product update should return HTTP 200').toBe(200);
            const updated = await updatedResponse.json();
            expect(updated.id, 'Update should use the ID returned by creation').toBe(productId);
            expect(updated.title, 'Update response should contain the new product title')
                .toBe(updatedProductPayload.title);
            expect(updated.price, 'Update response should contain the new product price')
                .toBe(updatedProductPayload.price);

            const deleteRoute = Routes.DELETE_PRODUCT.replace('{id}', String(productId));
            const deletedResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
            expect(deletedResponse.status(), 'Workflow product deletion should return HTTP 200').toBe(200);
        });
    });

    test.describe.serial('User CRUD workflow', () => {
        test('POST → PUT → DELETE - User @master @regression @api', async ({ request }) => {
            const createdResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
                data: userPayload,
            });
            expect(createdResponse.status(), 'Workflow user creation should return HTTP 201').toBe(201);
            const created = await createdResponse.json();
            expect(created.id, 'Workflow should capture the created user ID').toEqual(expect.any(Number));
            const userId = Number(created.id);

            const updateRoute = Routes.UPDATE_USER.replace('{id}', String(userId));
            const updatedResponse = await request.put(`${BASE_URL}${updateRoute}`, {
                data: updatedUserPayload,
            });
            expect(updatedResponse.status(), 'Workflow user update should return HTTP 200').toBe(200);
            const updated = await updatedResponse.json();
            expect(updated.username, 'Update response should contain the new username')
                .toBe(updatedUserPayload.username);
            expect(updated.email, 'Update response should contain the new email')
                .toBe(updatedUserPayload.email);

            const deleteRoute = Routes.DELETE_USER.replace('{id}', String(userId));
            const deletedResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
            expect(deletedResponse.status(), 'Workflow user deletion should return HTTP 200').toBe(200);
        });
    });

    test.describe.serial('Cart CRUD workflow', () => {
        test('POST → PUT → DELETE - Cart @master @regression @api', async ({ request }) => {
            const createdResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
                data: cartPayload,
            });
            expect(createdResponse.status(), 'Workflow cart creation should return HTTP 201').toBe(201);
            const created = await createdResponse.json() as Cart;
            expect(created.id, 'Workflow should capture the created cart ID').toEqual(expect.any(Number));
            expect(created.userId, 'Created cart should retain the requested user ID').toBe(cartPayload.userId);
            expect(created.products, 'Created cart should retain the requested products').toEqual(cartPayload.products);
            const cartId = Number(created.id);

            const updateRoute = Routes.UPDATE_CART.replace('{id}', String(cartId));
            const updatedResponse = await request.put(`${BASE_URL}${updateRoute}`, {
                data: updatedCartPayload,
            });
            expect(updatedResponse.status(), 'Workflow cart update should return HTTP 200').toBe(200);
            const updated = await updatedResponse.json() as Cart;
            expect(updated.id, 'Update should use the ID returned by creation').toBe(cartId);
            expect(updated.products, 'Updated cart should contain the changed quantity')
                .toEqual(updatedCartPayload.products);

            const deleteRoute = Routes.DELETE_CART.replace('{id}', String(cartId));
            const deletedResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
            expect(deletedResponse.status(), 'Workflow cart deletion should return HTTP 200').toBe(200);
        });
    });
});
