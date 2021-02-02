# whatsapp-tracking

Proof of concept about tracking contacts in WhatsApp.

The `blog1` branch refers to a single user tracking associated to this [blog entry](https://jorislacance.fr/blog/2020/04/01/whatsapp-tracking).
The `master` branch is associated with the [second blog entry](https://jorislacance.fr/blog/2021/02/05/whatsapp-tracking-2) and deals about mass tracking.

**DISCLAIMER: This is a Proof of Concept to raise awareness and a bit to challenge myself. Don't use the source code to actually track someone, don't be a dick.**

![grafana](https://i.imgur.com/MMq8q4u.png)

## architecture

The POC is composed of:

- The Node.js WhatsApp scraper robot - Gather the data
- The InfluxDB 2.0 service - Store the data
- The Grafana 6.7 service - Visualize the data

## setup

```bash
# run the InfluxDB and Grafana services
docker-compose up -d influxdb grafana
```

### influxDB setup

- Go to [http://localhost:9999](http://localhost:9999), setup an admin account
  - Name the initial organization like you want, `initial-org` for instance
  - Name the initial bucket anything, like `yolo`, we won't use the initial one because there will be sample data in it
- Create a new bucket `whatsapp-tracking`
- Generate a token `whatsapp-tracking-scraper` with write permission to `whatsapp-tracking` bucket
- Generate a token `grafana` with 'all access'

### grafana setup

- Go to [http://localhost:3000](http://localhost:3000), setup an admin account
- Add the data source using the plugin `Flux (InfluxDB) [BETA]` (for InfluxDB 2.0)
  - URL: `http://influxdb:9999`
  - with credentials: `true`
  - Organization: `initial-org`
  - Default Bucket: `whatsapp-tracking`
  - Token: the grafana token
- Import the dashboard (file `grafana-dashboard.json`)

### scraper setup

Create a file `.env` in the root directory to setup your environment.

```text
CONTACT_TARGET=YourContactName
INFLUXDB_TOKEN=The whatsapp-tracking-scraper token
INFLUXDB_ORG=initial-org
INFLUXDB_BUCKET=whatsapp-tracking
```

## scraper usage Windows

```powershell
# init the robot
npm install
# run the robot
node index.js
```

## scraper usage docker

```bash
docker-compose up scraper
# Look at `./data/screenshots/` to get the QR code peering.
```

## todo

- [x] Dockerize the scraper too ? Hardly with the peering procedure that requires us to scan the QR code. -> screenshot through file system
- [x] Track several contacts by rotating the contact tracked every hours or so (we will loose the precise `online` state tracking but gather more `last seen` data)
