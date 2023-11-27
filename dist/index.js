"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
const winston_1 = __importDefault(require("winston"));
const commander_1 = require("commander");
const promises_1 = __importDefault(require("node:fs/promises"));
const yaml_1 = __importDefault(require("yaml"));
const ramda_1 = __importDefault(require("ramda"));
const logger = winston_1.default.createLogger({
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.printf(({ level, message, timestamp }) => `${timestamp}\t| ${level}\t| ${message}`)),
        }),
    ],
});
function parseArgs() {
    const program = new commander_1.Command();
    program.requiredOption('-c, --config <config-file-path>', 'Specify configuration file', './config.yaml');
    return program.parse();
}
function setupWebDriver() {
    return __awaiter(this, void 0, void 0, function* () {
        const chromeOptions = new chrome_1.default.Options();
        chromeOptions.headless();
        chromeOptions.setPageLoadStrategy('eager');
        // ref: https://github.com/open-wa/wa-automate-nodejs/blob/master/src/config/puppeteer.config.ts
        chromeOptions.addArguments('--log-level=3', // fatal only
        '--no-default-browser-check', '--disable-site-isolation-trials', '--no-experiments', '--ignore-gpu-blacklist', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list', '--disable-gpu', '--disable-extensions', '--disable-default-apps', '--enable-features=NetworkService', '--disable-setuid-sandbox', '--no-sandbox', 
        // Extra
        '--disable-webgl', '--disable-infobars', '--window-position=0,0', '--ignore-certifcate-errors', '--ignore-certifcate-errors-spki-list', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-in-process-stack-traces', '--disable-histogram-customizer', '--disable-gl-extensions', '--disable-composited-antialiasing', '--disable-session-crashed-bubble', '--disable-canvas-aa', '--disable-3d-apis', '--disable-accelerated-2d-canvas', '--disable-accelerated-jpeg-decoding', '--disable-accelerated-mjpeg-decode', '--disable-app-list-dismiss-on-blur', '--disable-accelerated-video-decode', '--disable-dev-shm-usage', '--js-flags=--expose-gc', '--disable-features=site-per-process', '--disable-gl-drawing-for-tests', 
        //keep awake in all situations
        '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding');
        const driver = yield new selenium_webdriver_1.Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();
        logger.info('Setup web driver');
        return driver;
    });
}
function login(driver, account, loginConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        logger.info(`Waiting for page '${loginConfig.loginPageUrl}'`);
        yield driver.get(loginConfig.loginPageUrl.toString());
        const title = yield driver.getTitle();
        logger.info(`Get page title: ${title}`);
        const usernameElement = yield driver.findElement(loginConfig.usernameSelector);
        logger.info('Find usernameElement');
        yield usernameElement.clear();
        logger.info('Clear usernameElement');
        yield usernameElement.sendKeys(account.username);
        logger.info('Fill usernameElement');
        const passwordElement = yield driver.findElement(loginConfig.passwordSelector);
        logger.info('Find passwordElement');
        yield passwordElement.clear();
        logger.info('Clear passwordElement');
        yield passwordElement.sendKeys(account.password);
        logger.info('Fill passwordElement');
        const submitElement = yield driver.findElement(loginConfig.submitSelector);
        logger.info('Find submitElement');
        yield submitElement.click();
        logger.info('Click submitElement');
        yield driver.wait(selenium_webdriver_1.until.urlIs(loginConfig.loginSuccessfullyPageUrl.toString()));
        logger.info('Login successfully');
    });
}
function clickCheckinElement(driver, checkinConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield driver.get(checkinConfig.checkinPageUrl.toString());
            const title = yield driver.getTitle();
            logger.info(`Get checkinPage title: ${title}`);
            const checkinElement = yield driver.findElement(checkinConfig.checkinSelector);
            logger.info('Find checkinElement');
            logger.info('Checkin');
            yield checkinElement.click();
            logger.info('Checkin completed');
        }
        catch (e) {
            if (e instanceof selenium_webdriver_1.error.NoSuchElementError) {
                logger.error('Cannot find checkinElement. You may have already checked in!');
                return;
            }
            else {
                throw e;
            }
        }
    });
}
function checkin_account(account, loginConfig, checkinConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield setupWebDriver();
        try {
            logger.info(`Start checkin: ${account.username} - ${loginConfig.loginPageUrl.toString()}`);
            yield login(driver, account, loginConfig);
            yield clickCheckinElement(driver, checkinConfig);
        }
        finally {
            yield driver.quit();
        }
    });
}
function checkin(website) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = ramda_1.default.map(ramda_1.default.curry(checkin_account)(ramda_1.default.__, website.loginConfig, website.checkinConfig), website.accounts);
        Promise.all(tasks);
    });
}
function readConfig(configFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = yield promises_1.default.readFile(configFilePath, { encoding: 'utf8' });
        logger.info(`Read config from ${configFilePath}`);
        return yaml_1.default.parse(file);
    });
}
function toAccount(plainAccount) {
    return {
        username: plainAccount.username,
        password: plainAccount.password,
    };
}
function toAccounts(plainAccounts) {
    return ramda_1.default.map(toAccount, plainAccounts);
}
function isSelectorName(s) {
    const available_selectors = ramda_1.default.difference(Object.getOwnPropertyNames(selenium_webdriver_1.By), ['length', 'prototype', 'js']);
    return ramda_1.default.and(ramda_1.default.includes(s, available_selectors), ramda_1.default.compose(ramda_1.default.is(Function), ramda_1.default.prop(s))(selenium_webdriver_1.By));
}
function toBy(es) {
    if (isSelectorName(es.selector)) {
        return selenium_webdriver_1.By[es.selector](es.value);
    }
    throw new RangeError(`The selector '${es.selector}' is not availble.`);
}
function toLoginConfig(plainLoginConfig) {
    return {
        loginPageUrl: new URL(plainLoginConfig.login_page_url),
        usernameSelector: toBy(plainLoginConfig.username_element),
        passwordSelector: toBy(plainLoginConfig.password_element),
        submitSelector: toBy(plainLoginConfig.submit_element),
        loginSuccessfullyPageUrl: new URL(plainLoginConfig.login_successfully_page_url),
    };
}
function toCheckinConfig(plainCheckinConfig) {
    return {
        checkinPageUrl: new URL(plainCheckinConfig.checkin_page_url),
        checkinSelector: toBy(plainCheckinConfig.checkin_element),
    };
}
function toWebsite(plainWebsite) {
    return {
        name: plainWebsite.name,
        accounts: toAccounts(plainWebsite.accounts),
        loginConfig: toLoginConfig(plainWebsite.login_config),
        checkinConfig: toCheckinConfig(plainWebsite.checkin_config),
    };
}
function toWebsites(plainWebsites) {
    return ramda_1.default.map(toWebsite, plainWebsites);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = parseArgs().opts();
        const config = yield readConfig(opts.config);
        const websites = toWebsites(config.websites);
        const tasks = ramda_1.default.map(checkin, websites);
        Promise.all(tasks);
    });
}
main();
//# sourceMappingURL=index.js.map