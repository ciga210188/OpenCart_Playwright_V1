import { test, expect } from '../../fixtures/pageFixtures';
import dotenv from 'dotenv';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AdminCustomerDetails } from '../../pages/AdminCustomersPage';
import { CustomerRegistrationData } from '../../pages/RegistrationPage';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { executeQuery } from '../../utils/dbClient';

dotenv.config();

type CustomerRecord = RowDataPacket & {
    firstname: string;
    lastname: string;
    email: string;
    status: number;
    date_added: Date;
};

test('New customer matches in frontend, Admin, and database @master @regression @db @web @end-to-end', async ({
    homePage,
    registrationPage,
    adminCustomersPage,
}) => {
    test.setTimeout(120_000);

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminUsername || !adminPassword) {
        throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be configured in .env.');
    }
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
        throw new Error('DB_HOST, DB_USER, and DB_NAME must be configured in .env.');
    }

    const customer: CustomerRegistrationData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email: `pw.${Date.now()}.${RandomDataUtil.getEmail()}`,
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(16),
    };
    let registered = false;

    try {
        await test.step('1) Register a uniquely generated customer through the frontend', async () => {
            expect(await homePage.isHomePageDisplayed(), 'The OpenCart storefront should be available').toBeTruthy();
            await homePage.openRegistration();
            expect(
                await registrationPage.isRegistrationPageDisplayed(),
                'The customer registration page should be displayed',
            ).toBeTruthy();
            await registrationPage.completeRegistration(customer);
            expect(
                await registrationPage.isRegistrationSuccessful(),
                'The registration confirmation should be displayed',
            ).toBeTruthy();
            registered = true;
        });

        await test.step('2) Verify the same customer in the Admin Portal', async () => {
            await adminCustomersPage.login(adminUsername, adminPassword);
            const adminCustomer: AdminCustomerDetails = await adminCustomersPage.findCustomerByEmail(customer.email);

            expect(adminCustomer.firstName, 'Admin first name should match the registered customer')
                .toBe(customer.firstName);
            expect(adminCustomer.lastName, 'Admin last name should match the registered customer')
                .toBe(customer.lastName);
            expect(adminCustomer.email, 'Admin email should match the registered customer')
                .toBe(customer.email);
            expect(adminCustomer.status, 'New customer status should be enabled in Admin')
                .toBe('1');
            expect(adminCustomer.customerListRow, 'Admin customer list should display the customer as Enabled')
                .toContain('Enabled');
        });

        await test.step('3) Verify the same customer in the OpenCart MySQL database', async () => {
            const [rows] = await executeQuery(
                'SELECT firstname, lastname, email, status, date_added FROM oc_customer WHERE email = ?',
                [customer.email],
            ) as [CustomerRecord[], unknown[]];

            expect(rows.length, 'Exactly one database record should match the new customer email').toBe(1);
            expect(rows[0].firstname, 'Database first name should match the registered customer')
                .toBe(customer.firstName);
            expect(rows[0].lastname, 'Database last name should match the registered customer')
                .toBe(customer.lastName);
            expect(rows[0].email, 'Database email should match the registered customer')
                .toBe(customer.email);
            expect(rows[0].status, 'A newly registered customer should have enabled status')
                .toBe(1);
            expect(rows[0].date_added, 'The customer creation timestamp should be present').toBeTruthy();
        });
    } finally {
        if (registered) {
            const [cleanup] = await executeQuery(
                'DELETE FROM oc_customer WHERE email = ?',
                [customer.email],
            ) as [ResultSetHeader, unknown[]];
            expect(cleanup.affectedRows, 'The test-created customer should be removed during cleanup').toBe(1);
        }
    }
});
