const fs = require("fs");
require("dotenv").config();
const startingNumber = process.env.STARTINGNUMBER;
const fileName = "5000contacts.csv";

const csvHeader =
  "Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,Phone 1 - Type,Phone 1 - Value";

fs.appendFileSync(fileName, csvHeader + "\n");

let numbers = startingNumber.split(" ");

let counter2 = Number(numbers[2]);
let counter3 = Number(numbers[3]);
let counter4 = Number(numbers[4]);
for (let index = 0; index < 5000; index++) {
  if (counter4 == 99) {
    counter4 = 0;
    counter3++;
  }
  if (counter3 == 99) {
    counter3 = 0;
    counter2++;
  }
  let number = `${numbers[0]} ${numbers[1]} ${twoDigit(counter2)} ${twoDigit(
    counter3
  )} ${twoDigit(counter4)}`;

  let csvRow = `Unknown${index},,,,,,,,,,,,,,,,,,,,,,,,,,,,,Mobile,${number}`;
  fs.appendFileSync(fileName, csvRow + "\n");

  counter4++;

  console.log(`${index} -> ${number}`);
}

function twoDigit(number) {
  var twodigit = number >= 10 ? number : "0" + number.toString();
  return twodigit;
}
