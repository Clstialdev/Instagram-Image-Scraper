const puppeteer = require('puppeteer');
const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs');

const loginInstagram = async(url, username, password) => {
    let spinner = ora('Logging in').start()

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    
    const page = await browser.newPage();
    
    await page.goto(url);
    try{
      await page.waitForSelector('.aOOlW', {timeout: 2000});
      await page.click('.aOOlW');
    }
    catch(e){
      console.log(chalk.yellow("\nPrivacy Screen not found, continuing!"));
    }

    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    await setTimeout(async()=>{await page.click('button[type="submit"]')},2000)


    async function ErrorCheck() {
      var promise = new Promise(function(resolve, reject) {
        setTimeout(async()=>{
          let catchError = await page.evaluate(()=>{
            const error = document.querySelector('#slfErrorAlert');
            return error;
          });
          resolve(catchError);
        },5500);
      });
      return promise;
   }
   let loginError = await ErrorCheck();

   if(loginError !== null){
      browser.close();
      spinner.fail(chalk.red('Login Failed'));
      throw new Error("Error Encountered, Restarting Script!");
    }
    else{
      spinner.succeed(chalk.green('Login Successful'));
    }
    
    
    await page.waitForSelector('.coreSpriteKeyhole');
    await page.click('button[type="button"]');
    
    await setTimeout(async()=>{
        await page.waitForSelector('input[type="text"]');
        await page.click('button[type="button"]');
    },6000)

    return page;
}


const fetchImages =  async(page, scrollLimit) =>{

    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min)
    };

    const findDuplicateInArray = async (hrefs) => {
        let i = hrefs.length
        let len = hrefs.length
        let result = []
        let obj = {}
        for (i = 0; i < len; i++) {
          obj[hrefs[i]] = 0
        }
        for (i in obj) {
          result.push(i)
        }
        return result
    };
    
    let mediaText = []
    let previousHeight
    let spinner = ora('Loading').start()

    await page.waitForSelector('.v1Nh3');

    for (let i = 1; i <= scrollLimit; i++) {
        try {
          previousHeight = await page.evaluate('document.body.scrollHeight')
          await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
          await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`)
        //   await page.waitForFunction(randomInt(400, 1000))
          spinner.color = 'yellow'
          spinner.text = chalk.yellow(' | ⏳ Scrolling [ ' + i + ' / ' + scrollLimit + ' ]')
          const textPost = await page.evaluate(() => {
            const images = document.querySelectorAll('a > div > div.KL4Bh > img')
            return [].map.call(images, img => img.src)
          })
          for (let post of textPost) {
            mediaText.push(post)
          }
          mediaText = await findDuplicateInArray(mediaText)
        } catch (e) {
          spinner.fail(chalk.red('Scroll Timeout ' + e))
          await page.evaluate('window.scrollTo(0, document.documentElement.scrollTop || document.body.scrollTop)')
          const imgPost = await page.evaluate(() => {
            const images = document.querySelectorAll('a > div > div.KL4Bh > img')
            return [].map.call(images, img => img.src)
          })
          for (let post of imgPost) {
            mediaText.push(post)
          }
          mediaText = await findDuplicateInArray(mediaText)
          break
        }
      }
      spinner.succeed(chalk.yellow('Scroll Succeed'))

    console.log(`Fetched: ${mediaText.length} Images`);

    return mediaText;
    
}

const fetchCache = async(tag, images)=>{
  var promise = new Promise(function(resolve, reject) {
    let cachedData = {}
    fs.readFile('./pickles/'+ tag +'.json', 'utf8', (err, data) => {
        if (err) {
            console.log(chalk.yellow('No Cached Data for: ' + tag));
            fs.writeFileSync('./pickles/'+ tag +'.json', JSON.stringify(images));
            console.log(chalk.green('\nNew Cache Written!'));
            resolve(0);
        } else { 
            cachedData = JSON.parse(data);
            resolve(cachedData)
        }
    });
});
return promise;

}

const duplicateChecker = async(tag, images) => {
  let cachedArray = await fetchCache(tag, images);

  if(cachedArray !==0){
      cachedArray.forEach((element,i) => {
        cachedArray[i] = element.split("?")[0]
      });

      const cleanArray = [];
      images.forEach(img => {
          if(!cachedArray.includes(img.split("?")[0])){
                cleanArray.push(img);
            }
      });
      const updatedCache = [...cachedArray, ...cleanArray];
      fs.writeFileSync('./pickles/'+ tag +'.json', JSON.stringify(updatedCache));
      console.log(chalk.green("\n Number of non-duplicates:", cleanArray.length));
      return cleanArray
  }
  else{
    return images;
  }
}

const downloadImages = async(page, tag, images, index) =>{
  duplicateChecker(tag, images);
  try{
  let count = 0
    let countTotal = images.length
    for (const img of images) {
      try {
        let timestamp = Date.now();
        let viewSource = await page.goto(img)
        let savePath = './downloads/hashtags/' 
        
        fs.writeFile(savePath + tag + '/bot-' + index + '-' + timestamp + '-' + count + '.jpg', await viewSource.buffer(), function (err) {
          if (err) {
            console.log(err.message);
            if(err.message.split(":")[0] === "ENOENT"){
              console.log("no downloads directory")
              try{
                makeFolder(tag);
              }
              catch(e){
                console.log(e.message)
              }
            }
          }
          count = count + 1
          console.log(chalk.green('BOT🤖[' + index + ']The file was saved! [ ' + count + ' / ' + countTotal + ' ]'))
        })
      } catch (error) {
        console.log(chalk.red('❌ Error: invalid URL undefined'))
        continue
      }
    }
  }
  catch(e){
    console.log(e.message);
  }
}

const makeFolder = (name) =>{
  try {
    let fullDir = 'downloads/hashtags/' + name
    const dirs = fullDir.split("/");
    for(let i=0; i<dirs.length; i++){
        let targetDir = "";

        for(let x=0; x<=i; x++){
            targetDir = "./" + targetDir + "/" + dirs[x];
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir)
        }
    }
} catch (err) {
  console.log(chalk.red('❌ Error makeFolder: ' + err))
}
}

var methods = {
	  loginInstagram: loginInstagram,
    fetchImages: fetchImages,
    downloadImages: downloadImages,
    duplicateChecker: duplicateChecker,
};

module.exports = methods;