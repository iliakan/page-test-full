const puppeteer = require('puppeteer');

let args = require('yargs')
.example("node index.js --url https://learn.javascript.ru")
.demand(['url'])
.argv;

async function run() {

  // no-sandbox needed for linux (@amax telegram)
  const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
  const page = await browser.newPage();

  page.setDefaultTimeout(10e3);

  let errorCode = 0;
  page.on("pageerror", function(err) { 
    errorCode = 1; 
    console.log("Page error: " + err); 
  });

  page.on("error", function (err) {  
    errorCode = 1;
    console.log("Error: " + err); 
  });

  page.on("console", (message) => {  
    // catches 404 for network requests
    if (message.type() != 'error') return;
    errorCode = 1;
    console.log("Console error: " + message.text()); 

    let trace = message.stackTrace();
    for(let stackItem of trace) {
      let at = stackItem.lineNumber ? `@${stackItem.lineNumber}:${stackItem.lineNumber}`: ``;
      console.log(`At ${stackItem.url || ''}${at}`);
    }
  });


  try {
    await page.goto(args.url, {
      waitUntil: 'networkidle0'
    });
  } finally {
    await browser.close();

    process.exit(errorCode)
  }
}

run();