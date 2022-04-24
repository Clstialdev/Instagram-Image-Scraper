const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('inquirer');
const crowInsta = require('./main.js');
const fs = require('fs');
const { downloadImages } = require('./main.js');

//Initializing variables, they will be overwritten by getPickledData()
let url = "https://www.instagram.com/accounts/login/?next=/explore/tags/"
let tag = undefined;
let username = undefined;
let password = undefined;
let scrollLimit = undefined;


const main = async() =>{
    try{
        let fetchPickledData = await getPickledData();
        initResponse = await initializer();
        handleResponse(initResponse);
    }
    catch(e){
        console.log(e.message);
    }

}

const getPickledData = async() =>{
    pickledData = await fetchPickledData();
    if(pickledData !== {}){
        tag = pickledData.tag;
        username = pickledData.username;
        password = pickledData.password;
        scrollLimit = pickledData.scrollLimit;
        return 1;
    }
    else{
        console.log(chalk.red("There is an error with the pickled data!"));
        return 0;
    }
} 

const fetchPickledData = async() => {
    try {
          let dir = './pickles'
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
            fs.writeFileSync('./pickles/data.json', JSON.stringify({}));
          }
      } 
    catch (err) {
        console.log(chalk.red('❌ Error makeFolder: ' + err))
    }
    
    var promise = new Promise(function(resolve, reject) {
        let pickledData = {}
        fs.readFile('./pickles/data.json', 'utf8', (err, data) => {
            if (err) {
                console.log(`Error reading file ./pickles/data.json: ${err}`);
            } else {
                pickledData = JSON.parse(data);
                resolve(pickledData)
            }
        });
        
    });
    return promise
}

 const writePickledData = (output) =>{ 
    fs.writeFileSync('./pickles/data.json', JSON.stringify(output));
}

const scriptActions = ['set Account', 'set Hashtag', 'set ScrollLimit', 'Show config', 'Run Script'];

const initializer = () => {
    getPickledData();
    clear()
    console.log(
    chalk.yellow(
        figlet.textSync('CrowInsta', {
            font: "Cosmike",
            horizontalLayout: 'full'
        })
    )
    )

    const question = [{
        type: 'list',
        name: 'action',
        message: 'Select Action:',
        choices: scriptActions,
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please select action'
          }
        }
      }]

    return inquirer.prompt(question);
}

const handleResponse = (initResponse) =>{
    switch (initResponse.action){
        case scriptActions[0]:
            setAccount();
            break;
        case scriptActions[1]:
            setHashtag();
            break;
        case scriptActions[2]:
            setScrollLimit();
            break;
        case scriptActions[3]:
            showConfig();
            break;
        case scriptActions[4]:
            RunScript();
            break;
        
    }
}

const RunScript = async() => {
    try{

        if(!tag) {throw new Error("tag is not defined");}
        if(!username) {throw new Error("username is not defined");}
        if(!password) {throw new Error("password is not defined");}
        if(!scrollLimit) {throw new Error("scrollLimit is not defined");}

        const page = await crowInsta.loginInstagram(url+tag, username, password);
        const images = await crowInsta.fetchImages(page, scrollLimit);
        const filteredImages = await crowInsta.duplicateChecker(tag, images);
        await crowInsta.downloadImages(page, tag, filteredImages, 1);
    }
    catch(e){
        switch (e.message.toString()){
            case "tag is not defined":
                console.log(chalk.red("\n\n You havn't specified an instagram tag!"));
                console.log(chalk.yellow("\n\n Script will refresh in 3 seconds"));
                break;
            case "username is not defined":
                console.log(chalk.red("\n\n Instagram account username not found!"));
                console.log(chalk.yellow("\n\n Script will refresh in 3 seconds"));
                break;
            case "password is not defined":
                console.log(chalk.red("\n\n Instagram account password not found!"));
                console.log(chalk.yellow("\n\n Script will refresh in 3 seconds"));
                break;
            case "scrollLimit is not defined":
                console.log(chalk.red("\n\n You havn't set a Scroll Limit!"));
                console.log(chalk.yellow("\n\n Script will refresh in 3 seconds"));
                break;
            default:
                console.log(e.message);
        }
        setTimeout(()=>{
            main()
        },3000);
    }
}

const setAccount = async() =>{
    clear()
    console.log(
    chalk.yellow(
        figlet.textSync('Account', {
            font: "Basic",
            horizontalLayout: 'full'
        })
    )
    )

    const usernameQuestion = [{
        type: 'input',
        name: 'username',
        message: 'Instagram username:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter a correct username!'
          }
        }
      }]

    const passwordQuestion = [{
        type: 'password',
        name: 'password',
        message: 'Instagram password:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter a correct password!'
          }
        }
      }]

    let usernameResponse = await inquirer.prompt(usernameQuestion);
    let passwordResponse = await inquirer.prompt(passwordQuestion);

    username = usernameResponse.username;
    password = passwordResponse.password;

    const output = {tag: tag, username: username, password: password, scrollLimit: scrollLimit};

    writePickledData(output);

    setTimeout(()=>{
        main()
    },3000);

}

const setHashtag = async() =>{
    clear()
    console.log(
    chalk.yellow(
        figlet.textSync('#Hashtag', {
            font: "Basic",
            horizontalLayout: 'full'
        })
    )
    )

    const hashtagQuestion = [{
        type: 'input',
        name: 'tag',
        message: 'Instagram hashtag:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter a correct hashtag!'
          }
        }
      }]

    let hashtagResponse = await inquirer.prompt(hashtagQuestion);

    tag = hashtagResponse.tag;

    const output = {tag: tag, username: username, password: password, scrollLimit: scrollLimit};

    writePickledData(output);

    setTimeout(()=>{
        main()
    },3000);

}

const setScrollLimit = async() =>{
    clear()
    console.log(
    chalk.yellow(
        figlet.textSync('Scroll', {
            font: "Basic",
            horizontalLayout: 'full'
        })
    )
    )

    const scrollLimitQuestion = [{
        type: 'number',
        name: 'scrollLimit',
        message: 'new Scroll Limit:',
        validate: function (value) {
          if (value.toString().length && value > 0) {
            return true
          } else {
            return 'Please enter a correct scroll limit!'
          }
        }
      }]

    let scrollLimitResponse = await inquirer.prompt(scrollLimitQuestion);

    scrollLimit = scrollLimitResponse.scrollLimit;

    const output = {tag: tag, username: username, password: password, scrollLimit: scrollLimit};

    writePickledData(output);

    setTimeout(()=>{
        main()
    },3000);

}

const showConfig = () =>{
    clear();
    console.log(
        chalk.yellow(
            figlet.textSync('Config', {
                font: "Basic",
                horizontalLayout: 'full'
            })
        )
    )
    
    console.log(chalk.yellow("Username: ") + username + '\n');
    console.log(chalk.yellow("Hashtag: ") + tag + '\n');
    console.log(chalk.yellow("Scroll Limit: ") + scrollLimit + '\n');

    setTimeout(()=>{
        main()
    },3000);
}

main();

 