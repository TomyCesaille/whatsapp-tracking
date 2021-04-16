const csv = require("csv-parser");
const fs = require("fs");

const records = [];
let recordsPick = [];

fs.createReadStream("scan-logs.csv")
  .pipe(csv())
  .on("data", data => records.push(data))
  .on("end", () => {
    console.log(records);
    for (let record of records) {
      let recordPick = recordsPick.find(
        x => x.contactLabel === record.contactLabel
      );
      if (recordPick) {
        if (
          recordPick.LastSeenDate === "null" &&
          record.LastSeenDate !== "null"
        ) {
          recordsPick[
            recordsPick.findIndex(x => x.contactLabel == record.contactLabel)
          ] = record;
        } else if (
          recordPick.LastSeenDate !== "null" &&
          record.LastSeenDate !== "null" &&
          new Date(recordPick.LastSeenDate) < new Date(record.LastSeenDate)
        ) {
          recordsPick[
            recordsPick.findIndex(x => x.contactLabel == record.contactLabel)
          ] = record;
        }
      } else {
        recordsPick.push(record);
      }
    }

    let refDate = new Date("2021-02-15T12:30:57.301Z");

    let stats = {
      hasWhatsapp: recordsPick.filter(x => x.HasWhatsapp === "true").length,
      lastSeenDataAvailable: recordsPick.filter(x => x.LastSeenDate !== "null")
        .length,
      acticeLastYear: recordsPick.filter(
        x =>
          new Date(x.LastSeenDate) >
          new Date(refDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      ).length,
      acticeLastMonth: recordsPick.filter(
        x =>
          new Date(x.LastSeenDate) >
          new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      acticeLastDay: recordsPick.filter(
        x =>
          new Date(x.LastSeenDate) >
          new Date(refDate.getTime() - 1 * 24 * 60 * 60 * 1000)
      ).length,
      acticeLastHour: recordsPick.filter(
        x =>
          new Date(x.LastSeenDate) >
          new Date(refDate.getTime() - 1 * 60 * 60 * 1000)
      ).length
    };

    let data = JSON.stringify(stats);
    fs.writeFileSync("stats.json", data);
  });
