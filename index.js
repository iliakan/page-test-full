const puppeteer = require('puppeteer');

let args = require('yargs')
.example("node index.js --url https://learn.javascript.ru")
.demand(['url'])
.argv;

async function run() {

  // no-sandbox needed for linux (@amax telegram)
  const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.setDefaultTimeout(10e3);

  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().includes('mc.yandex.ru')) {
      request.respond({
        status: 200,
        contentType: 'text/javascript',
        body: ''
      });
    } else {
      interceptedRequest.continue();
    }
  });

  let errorCode = 0;
  page.on("pageerror", function(err) { 
    errorCode = 1; 
    console.log("Page error: " + err); 
  });

  page.on("error", function (err) {  
    errorCode = 1;
    console.log("Error: " + err); 
  });


  // invalid server name, e.g. http://notexists.com/
  page.on("requestfailed", function (request) {  
    errorCode = 1;
    let failure = request.failure();
    // console.log(err);
    console.log("Error: " + failure.errorText + " at " + request.url()); 
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

  /*
  let emit = page.emit;
  page.emit = function() {
    console.log(arguments);
    return emit.apply(this, arguments);
  }*/

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