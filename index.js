const puppeteer = require("puppeteer");
const chrono = require("chrono-node");
const { InfluxDB } = require("@influxdata/influxdb-client");
require("dotenv").config();
console.log(`CONTACT_TARGET=${process.env.CONTACT_TARGET}`);
console.log(`INFLUXDB_TOKEN=${process.env.INFLUXDB_TOKEN}`);
console.log(`INFLUXDB_ORG=${process.env.INFLUXDB_ORG}`);
console.log(`INFLUXDB_BUCKET=${process.env.INFLUXDB_BUCKET}`);
console.log(`ISDOCKER=${process.env.ISDOCKER}`);
console.log(`HEADLESS=${process.env.HEADLESS}`);

// The contact name to track (mind the case).
const contactTarget = process.env.CONTACT_TARGET;
const headless = process.env.HEADLESS === "TRUE";

let docker = process.env.ISDOCKER === "TRUE";
let influxUrl = docker ? `http://influxdb:9999` : "http://localhost:9999";
let userDataDir = docker ? `/usr/data/userdata` : "data/userdata";
let args = docker ? ["--no-sandbox", "--disable-setuid-sandbox"] : [];
let screenshotPath = docker
  ? "/usr/data/screenshots/screenshot.png"
  : "data/screenshots/screenshot.png";

let client = new InfluxDB({
  url: influxUrl,
  token: process.env.INFLUXDB_TOKEN
});
const writeApi = client.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET
);

(async () => {
  const page = await loadBrowser();

  await loadWhatsappWebLogin(page);

  while (true) {
    var contacts = [
      "Unknown1",
      "Unknown2",
      "Unknown3",
      "Unknown4",
      "Unknown5",
      "Unknown6",
      "Unknown7",
      "Unknown8",
      "Unknown9",
      "Unknown10"
    ];
    for (let index = 0; index < contacts.length; index++) {
      const contact = contacts[index];
      await scanStatus(page, contact);
      await page.waitForTimeout(10000);
    }
  }
})();

async function loadBrowser() {
  const browser = await puppeteer.launch({
    args: args,
    headless: headless,
    userDataDir: userDataDir // Persist the session.
  });

  const page = await browser.newPage();
  page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0"
  );
  return page;
}

async function loadWhatsappWebLogin(page) {
  await page.goto("https://web.whatsapp.com/");
  await page.waitForTimeout(30000);

  await page.screenshot({ path: screenshotPath });

  console.log(
    `Awaiting/Checking peering with WhatsApp phone.
    Use the QR code in the screenshot ${screenshotPath} to peer if headless.`
  );
  await page
    .waitForSelector("#side", { timeout: 120000 })
    .then(() => {
      // Scan the QR code within the next 2 minutes.
      console.log("Connected !");
    })
    .catch(res => {
      console.log("Not connected !", res);
      return -1;
    });
  await page.waitForTimeout(1000);
}

async function scanStatus(page, contactTarget) {
  console.log(`Scanning status for ${contactTarget}.`);
  let searchInput = await page.$("._1awRl");
  await searchInput.click({ clickCount: 3 });
  await searchInput.press("Backspace");
  await searchInput.type(contactTarget, { delay: 100 });
  await page.waitForTimeout(6000);

  let contactElt = (
    await page.$x(`//*[@class="_3Tw1q" and . = "${contactTarget}"]`)
  )[0]; // Select the best result.
  if (!contactElt) {
    console.log(
      `No whatsApp for ${contactTarget} (or not in phone contacts list).`
    );
    return;
  }
  contactElt.click();
  await page.waitForTimeout(30000); // Status shows up late sometimes.

  let statusElt = await page.$("._3Id9P"); // Status text.

  let statusAvailable = statusElt ? 1 : 0;
  let scan = `status,contactName=${contactTarget} statusAvailable=${statusAvailable}u`;
  writeApi.writeRecord(scan);

  if (!statusElt) {
    console.log(`No status available for ${contactTarget}.`);
    return;
  }
  let status = await statusElt.evaluate(x => x.textContent); // `last seen today at 13:15` format.
  console.log(`Status for ${contactTarget} is '${status}'.`);

  if (status == "click here for contact info") {
    console.log(`'click here for contact info' case for ${contactTarget}.`);
    return;
  }

  let lastSeenDate = chrono.parseDate(status);
  console.log(`Last seen date parsed: ${lastSeenDate}`);

  let offlineSince =
    lastSeenDate === null
      ? 0
      : ((new Date().getTime() - lastSeenDate.getTime()) / 1000).toFixed(0);
  if (offlineSince < 0) offlineSince = 0;

  let data = `status,contactName=${contactTarget} offlineSince=${offlineSince}u`;
  writeApi.writeRecord(data);
}
