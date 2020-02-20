let text = [
    "Hello! Question of the day! What sports do you play? Are you into team sports or something different? Nice to meet you :)",
    "Hi! Do you like video games? What is your favorite?",
    "Random question of the day! How tall are you?",
    "Random question of the day! Do you like driving or do you prefer public transport?",
    "Random question time! What was the first word that came to your mind after reading this?",
    "Hi! Ask me the most impossible question you can think of and I will answer! :)",
    "If you had one word for me, what would it be????",
    "Hey! Random question time! What shoes do you like the most?",
    "Random question of the day... Do you like Windows or Mac?",
    "Random question time! what would you do with a million dollars?",
    "Random question of the day! If you had a bunch of money right now, what would you do?",
    "Random question time! what do you do for work? Do you like it???",
    "Random question of the day! If you were on a deserted island right now, what would be the thing you wouldn't be without?",
    "Random question time! Tell me 5 numbers for the lottery today please!! If I win I will give you 0,1% ;)",
    "Random question time! Are you bored at work right now?",
    "Random question of the day! What would you say to me if I was a computer that could never read your message?",
    "Hi! Ask me the craziest question you can think of!!!",
]
let ids = []
const fs = require('fs')
let data = {}
data.ids = [];

let symbol = ")"
let add = false
const puppeteer = require('puppeteer')
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    try {
        if (fs.existsSync("data.json")) {
            console.log("get data")
            data = JSON.parse(fs.readFileSync("data.json"))
        }
        if (typeof data.add === "undefined") data.add = false
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.on('console', msg => {
            for (let i = 0; i < msg.args.length; ++i)
                console.log(`${i}: ${msg.args[i]}`);
        });
        await page.goto("https://interpals.net/app/search");
        let html = await page.content()
        console.log("logging in...")
        await page.type("#topLoginEmail", process.env.user)
        await page.type("#topLoginPassword", process.env.password)
        await page.click("input[type=submit]")
        console.log("logged in!");
        await page.goto(process.env.url);
        console.log("searched for profiles")
        ids = await page.evaluate(() => {
            let ids = []
            $("a[href*='pm.php?action=send&uid=']").each(function () {
                let id = this.href.split("uid=")[1]
                ids.push(this.href);
            })
            return ids;
        })
        for (let i = 0; i < ids.length; i++) {
            if (data.ids.includes(ids[i].split("uid=")[1])) {
                ids.splice(i, 1)
                i--;
            }
        }
        if (ids.length == 0) {
            console.log("No elements found")
        } else {
            console.log("Number of links" + ids.length)
        }
        for (var element of ids) {
            try {
                let id = element.split("uid=")[1]
                console.log("going to id ")
                await page.goto(element)
                await page.type("#message", text[0])
                text.splice(0, 1)
                await page.click("input[type=submit]")
                console.log("Successfully clicked send.")
                data.add = add;
                data.ids.push(id)
                fs.writeFileSync("data.json", JSON.stringify(data))
                await page.waitFor(3000)

            } catch (e) {
                console.log("Error", e.message)
            }
        }
        console.log("done!");
        await browser.close()
        process.exit()
    } catch (e) {
        console.log("Error! " + e)
    }
}
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
main()