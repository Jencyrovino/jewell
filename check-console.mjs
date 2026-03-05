import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ channel: 'msedge' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
        console.log(error.stack);
    });

    // Create an empty page to inject localStorage
    await page.goto('http://localhost:5173/');

    // Wait for the page to be ready so we can run JS in the context
    await page.evaluate(() => {
        const fakeOrder = {
            id: "17095200000000",
            orderId: "ORD-BILL-INV-123-0",
            customerId: "",
            customerName: "Walk-in Customer",
            productType: undefined,
            weight: 10,
            remarks: "Auto-generated",
            orderDate: undefined,
            dueDate: undefined,
            advanceAmount: 0,
            status: "Completed",
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('orders', JSON.stringify([fakeOrder]));
    });

    await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle' });
    await browser.close();
})().catch(console.error);
