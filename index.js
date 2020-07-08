let otext = [
"Hey hey!!! :)",
"Hmmm hi!!!! :3",
"Hmmmm, hi hi!!",
];

let text = [
"Hey!!!! Nice to meet you. I live in Spain. :) I love reading, you too?",
"Hey.. How's your super lockdown going? I live in spain.... :)",
"Heeeey how is super lockdown???? I live in Spain.. Super boring here :P",

];
let page, browser;
let counter = 0;
let ids = [];
const fs = require("fs");
let data = {};
data.ids = [];
data.threads = [];
let symbol = ")";
let add = false;
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
dotenv.config();
let search;
if (process.env.search == 1) search = true;
if (process.env.search == 0) search = false;
let clearThreads = Number(process.env.clearthreads);
async function main() {
  try {
    if (fs.existsSync("data.json")) {
      console.log("get data");
      data = JSON.parse(fs.readFileSync("data.json"));
    }
    if (typeof data.threads === "undefined") data.threads = [];
    if (clearThreads == 1) {
      console.log("Clearing threads!");
      data.threads = [];
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(15000);
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );
    page.on("console", msg => {
      for (let i = 0; i < msg.args.length; ++i)
        console.log(`${i}: ${msg.args[i]}`);
    });
    await page.goto("https://interpals.net/app/search");
    let html = await page.content();
    console.log("logging in...");
    await page.type("#topLoginEmail", process.env.user);
    await page.type("#topLoginPassword", process.env.password);
    await page.click("input[type=submit]");
    console.log("logged in!");
    if (search) await doSearch();
    if (!search) await doScroll();
    if (ids.length == 0) {
      console.log("No elements found");
    } else {
      console.log("Number of links" + ids.length);
    }
    let id;
    for (var element of ids) {
      try {
        if (search) id = element.split("uid=")[1];
        if (!search) id = element.split("thread_id=")[1];
        console.log("next");
        await page.goto(element);
        console.log("loaded");
        if (search) await page.type("#message", text[counter]);
        if (!search) await page.type("#message", otext[counter]);
        counter++;
        if (
          (counter >= text.length && search) ||
          (counter >= otext.length && !search)
        )
          counter = 0;
        await page.click("input[type=submit]");
        console.log("sent.");
        data.add = add;
        if (search) data.ids.push(id);
        if (!search) data.threads.push(id);
        fs.writeFileSync("data.json", JSON.stringify(data));
        if (search) await page.waitFor(Number(process.env.time));
        if (!search) await page.waitFor(4000);        
      } catch (e) {
        console.log("Error", e.message);
      }
    }
    console.log("done!");
    await browser.close();
    process.exit();
  } catch (e) {
    console.log("Error! " + e.message);
  }
}
async function autoScroll(page) {
  console.log("scroll start");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 1000;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        console.log("scrolling", totalHeight);
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          console.log("done scrolling!");
          resolve();
        }
      }, 1000);
    });
  });
}
async function doSearch() {
  await page.goto(process.env.url);
  console.log("searched for profiles");
  ids = await page.evaluate(() => {
    let ids = [];
    $("a[href*='pm.php?action=send&uid=']").each(function() {
      let id = this.href.split("uid=")[1];
      ids.push(this.href);
    });
    return ids;
  });
  for (let i = 0; i < ids.length; i++) {
    if (data.ids.includes(ids[i].split("uid=")[1])) {
      ids.splice(i, 1);
      i--;
    }
  }
}

async function doScroll() {
  console.log("going through threads.");
  let allIds = [];
  try {
    await page.goto("https://interpals.net/pm.php?filter=online");
    await page.click("#paged_view");
  } catch (e) {
    console.log("Paged view skipped.");
  }
  try {
    let firstPage = Number(process.env.firstpage);
    let pageCap = Number(process.env.pagecap) + firstPage;
    for (let i = firstPage; i <= pageCap; i++) {
      console.log("getting page " + i);
      await page.waitFor(3900);
      await page.goto("https://interpals.net/pm.php?filter=online&page=" + i);
      console.log("loaded");
      ids = await page.evaluate(() => {
        let ids = [];
        $("a[href*='thread_id=']").each(function() {
          let id = this.href.split("thread_id=")[1];
          ids.push(this.href);
        });
        return ids;
      });
      for (let i = 0; i < ids.length; i++) {
        allIds.push(ids[i]);
      }
      ids = [];
    } //process pages
  } catch (e) {
    console.log("Error getting ids, abort+: " + e.message);
    await page.waitFor(5000)
  }
  ids = allIds;
  await page.click("#change_view");
  console.log("proceed");
  for (let i = 0; i < ids.length; i++) {
    if (data.threads.includes(ids[i].split("thread_id=")[1])) {
      ids.splice(i, 1);
      i--;
    }
  }
}
main();
