const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { setTimeout } = require("timers/promises");
const { PNG } = require("pngjs");
//var userAgent = require('user-agents');
//

async function pixelAt(page, x, y) {
  // small safety margin to stay within viewport
  const clip = { x: Math.max(0, x), y: Math.max(0, y), width: 1, height: 1 };
  const buf = await page.screenshot({ clip });
  const png = PNG.sync.read(buf);
  const idx = 0 * 4; // only one pixel
  const r = png.data[idx], g = png.data[idx + 1], b = png.data[idx + 2];
  return { r, g, b };
}

// adjust to the color you observe for panorama lines (example: cyan-ish)
function isPanoramaColor({ r, g, b }) {
  // tolerant range; tune these after inspecting a few samples
    return (
    b > 200 &&                 // strong blue component
    r > 100 &&                 // some red
    g < 150 &&                 // relatively low green
    (r < 200 || b > 240)       // either deep violet or bright purple highlight
  );
}


(async () => {
    const browser = await puppeteer.launch(
        {   headless: false,
            defaultViewport: null,
            args: ["--start-maximized"],
            userDataDir: "./tmp",
        });
        const page = await browser.newPage();
        //Moscow upper part
        const pageLink = 'https://yandex.com/maps/213/moscow/streetview/?ll=37.612780%2C55.820016&z=12';
        //Crimea Feodosia
        //const pageLink = 'https://yandex.com/maps/11469/feodosia/streetview/?ll=35.376533%2C45.027277&z=19';
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
        //await page.setUserAgent(userAgent.random().toString());
    const city = 'testCity';
    const screenshotsDir = `./screenshots/${city}`;
        if(!fs.existsSync(screenshotsDir)){
            fs.mkdirSync(screenshotsDir,{recursive: true});
        }
    const outputDir = path.join(__dirname, 'Extracted_locs');
    if(!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir,{recursive: true});
    }
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
        const rgb = await pixelAt(page, x, y);
        if (isPanoramaColor(rgb)) {
        await page.mouse.click(x,y);
        } else {
            continue;
        }
        console.log(`Current iteration ${i}`);
        console.log(`Clicked at (${x}, ${y})`);
        await setTimeout(3000);
        const url = page.url();
        console.log(`URL: ${url}`);
        if(url.includes('point')){
            await page.waitForSelector('.panorama-player-view',{timeout: 20000});

            const isUnofficial = await page.evaluate(() => {
                return !!document.querySelector('.author-view');
            });

            if (isUnofficial){
                console.log("Skipped unofficial panorama");
                await page.goto(pageLink,{timeout: 0});
                continue;
            }
            fileStream.write(`${url}\n`);
             const screenshotPath = `${screenshotsDir}/screenshot_${x}_${y}.png`;
            await page.screenshot({path: screenshotPath});
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
