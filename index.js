const puppeteer = require('puppeteer');

async function run() {
  let args = require('yargs')
    .example("node index.js --url https://learn.javascript.info")
    .demand(['url'])
    .argv;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let errorCode = 0;
  page.on("pageerror", function(err) { 
    errorCode = 1; 
    console.log("Page error: " + err); 
  });

  page.on("error", function (err) {  
    errorCode = 1;
    console.log("Error: " + err); 
  });

  await page.goto(args.url, {
    waitUntil: 'networkidle0'
  });

  await browser.close();

  process.exit(errorCode)
}

run();