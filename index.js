const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { setTimeout } = require("timers/promises");
//var userAgent = require('user-agents');
(async () => {
    const browser = await puppeteer.launch(
        {   headless: false,
            defaultViewport: null,
            args: ["--start-maximized"],
            userDataDir: "./tmp",
        });
        const page = await browser.newPage();
        //Moscow upper part
        //pageLink = 'https://yandex.com/maps/213/moscow/streetview/?ll=37.612780%2C55.820016&z=12';
        //Crimea Feodosia
        const pageLink = 'https://yandex.com/maps/11469/feodosia/streetview/?ll=35.376533%2C45.027277&z=19';
        await page.goto(pageLink,{timeout:0
        });


/*         await page.evaluate(() => {
            const divToRemove = document.querySelector('.sidebar-view__panel');
            if(divToRemove){
                divToRemove.remove();
            }
        }) */
        const mapArea = {x: 384, y: 0, width: 1464, height: 915};
        const stepSize = 100;
        const numClicks = 1000;
        const screenshotsDir = './screenshots';
        if(!fs.existsSync(screenshotsDir)){
            fs.mkdirSync(screenshotsDir);
        }
        //await page.setUserAgent(userAgent.random().toString());
    const city = 'Feodosia';
    const outputDir = path.join(__dirname, 'Extracted_locs');
    const urlsFile = path.join(outputDir,city);
    //const urlsFile = path.join(__dirname,'testCaptcha');
    const fileStream = fs.createWriteStream(urlsFile, {flags: 'a'});

    const getRandomCoordinates = () => {
        const randomX = Math.random()*mapArea.width + mapArea.x;
        const randomY = Math.random()*mapArea.height + mapArea.y;
        return{x: randomX, y: randomY};
    };

    const randomDelay = (min, max) => Math.floor(Math.random()*(max-min+1)+min);
/*     const extractCoordinatesFromURL = (url) => {
        const regex = /panorama\[point\]=([\d.]+)%2C([\d.]+)/;
        const match = url.match(regex);
        if (match) {
            return {longitude: match[1], latitude: match[2]};
        }
        return null;
    }; */
    for (let i = 0; i < numClicks; i++) {
        const {x, y} = getRandomCoordinates();
        await page.mouse.move(x-50,y-20);
        await page.mouse.move(x,y,{steps: 20});
        await page.mouse.click(x,y);
        console.log(`Current iteration ${i}`);
        console.log(`Clicked at (${x}, ${y})`);
        //await page.waitForTimeout(randomDelay(1000,3000));
        await setTimeout(3000);
        const url = page.url();
        console.log(`URL: ${url}`);
        if(url.includes('point')){
            await page.waitForSelector('.panorama-player-view',{timeout: 5000});

            const isUnofficial = await page.evaluate(() => {
                return !!document.querySelector('.author-view');
            });

            if (isUnofficial){
                console.log("Skipped unofficial panorama");
                await page.goto(pageLink,{timeout: 0});
                continue;
            }
            fileStream.write(`${url}\n`);
/*             const screenshotPath = `${screenshotsDir}/screenshot_${x}_${y}.png`;
            await page.screenshot({path: screenshotPath}); */
        }
/*         const coordinates = extractCoordinatesFromURL(url);
        if(coordinates){
            console.log(`Extracted coordinates: longitude=${coordinates.longitude}, latitude=${coordinates.latitude}`);
        } */
        await page.goto(pageLink,{timeout: 0
    });
    }
    await browser.close();
/*     const frame = await page.waitForSelector("map-container");
    const rect = await page.evaluate(el => {
        const {x, y} = el.getBoundingClientRect();
        return {x, y};
    }, frame) */
/*     await page.waitForNavigation({
        waitUntil: 'networkidle2',
    }); */
})();
