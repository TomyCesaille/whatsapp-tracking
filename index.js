const puppeteer = require('puppeteer');
const chrono = require('chrono-node');
const { InfluxDB, FluxTableMetaData } = require('@influxdata/influxdb-client')
require('dotenv').config()
console.log(`CONTACT_TARGET=${process.env.CONTACT_TARGET}`);
console.log(`INFLUXDB_TOKEN=${process.env.INFLUXDB_TOKEN}`);
console.log(`INFLUXDB_ORG=${process.env.INFLUXDB_ORG}`);
console.log(`INFLUXDB_BUCKET=${process.env.INFLUXDB_BUCKET}`);

// The contact name to track (mind the case).
const contactTarget = process.env.CONTACT_TARGET;

let client = new InfluxDB({ url: 'http://localhost:9999', token: process.env.INFLUXDB_TOKEN });
const writeApi = client.getWriteApi(process.env.INFLUXDB_ORG, process.env.INFLUXDB_BUCKET);

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false, // No headless to scan the QR code.
        userDataDir: 'data/userdata' // Persist the session.
    });

    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');
    await page.waitFor(5000);

    console.log('Awaiting/Checking peering with WhatsApp phone');
    await page.waitFor('#side', { timeout: 60000 }).then(() => { // Scan the QR code within the next minute.
        console.log('Connected !');
    }).catch((res) => {
        console.log('Not connected !', res);
        return -1;
    })
    await page.waitFor(1000);

    await page.focus('._2S1VP'); // Focus search input form.
    await page.keyboard.type(contactTarget, { delay: 100 });
    await page.waitFor(6000);

    let contactElt = (await page.$x(`//*[@class="_25Ooe" and . = "${contactTarget}"]`))[0]; // Select the best result.
    contactElt.click();

    while (true) {
        await page.waitFor(5000);

        let statusElt = await page.$('.O90ur');

        let statusAvailable = (statusElt) ? 1 : 0;
        let scan = `status,contactName=${contactTarget} statusAvailable=${statusAvailable}u`;
        writeApi.writeRecord(scan);

        if (!statusElt) {
            console.log(`No status available for ${contactTarget}.`);
            continue;
        }
        let status = await statusElt.evaluate(x => x.textContent);  // `last seen today at 13:15` format.
        console.log(`Status for ${contactTarget} is '${status}'.`);
        let lastSeenDate = chrono.parseDate(status);
        console.log(`Last seen date parsed: ${lastSeenDate}`);

        let offlineSince = (lastSeenDate === null) ? 0 : ((new Date().getTime() - lastSeenDate.getTime()) / 1000).toFixed(0);
        if (offlineSince < 0)
            offlineSince = 0;

        let data = `status,contactName=${contactTarget} offlineSince=${offlineSince}u`;
        writeApi.writeRecord(data);
    }

    await browser.close();
})();
