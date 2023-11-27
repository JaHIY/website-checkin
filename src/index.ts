import { By, Builder, error, until, WebDriver, WebElement } from 'selenium-webdriver';
import Chrome from 'selenium-webdriver/chrome';
import winston from 'winston';
import { Command } from 'commander';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import R from 'ramda';

interface Account {
    readonly username: string;
    readonly password: string;
}

interface LoginConfig {
    readonly loginPageUrl: URL;
    readonly usernameSelector: By;
    readonly passwordSelector: By;
    readonly submitSelector: By;
    readonly loginSuccessfullyPageUrl: URL;
}

interface CheckinConfig {
    readonly checkinPageUrl: URL;
    readonly checkinSelector: By;
}

interface Website {
    readonly name: string;
    readonly accounts: Account[];
    readonly loginConfig: LoginConfig;
    readonly checkinConfig: CheckinConfig;
}

interface PlainAccount {
    readonly username: string;
    readonly password: string;
}

interface PlainElementSelector {
    readonly selector: string;
    readonly value: string;
}

interface PlainLoginConfig {
    readonly login_page_url: string;
    readonly username_element: PlainElementSelector;
    readonly password_element: PlainElementSelector;
    readonly submit_element: PlainElementSelector;
    readonly login_successfully_page_url: string;
}

interface PlainCheckinConfig {
    readonly checkin_page_url: string;
    readonly checkin_element: PlainElementSelector;
}

interface PlainWebsite {
    readonly name: string;
    readonly accounts: PlainAccount[];
    readonly login_config: PlainLoginConfig;
    readonly checkin_config: PlainCheckinConfig;
}

const logger: winston.Logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.printf(
                    ({ level, message, timestamp}) => `${timestamp}\t| ${level}\t| ${message}`
                ),
            ),
        }),
    ],
});

function parseArgs(): Command {
    const program: Command = new Command();

    program.requiredOption('-c, --config <config-file-path>', 'Specify configuration file', './config.yaml');

    return program.parse();
}

async function setupWebDriver(): Promise<WebDriver> {
    const chromeOptions: Chrome.Options = new Chrome.Options();
    chromeOptions.headless();
    chromeOptions.setPageLoadStrategy('eager');
    // ref: https://github.com/open-wa/wa-automate-nodejs/blob/master/src/config/puppeteer.config.ts
    chromeOptions.addArguments(
        '--log-level=3', // fatal only
        '--no-default-browser-check',
        '--disable-site-isolation-trials',
        '--no-experiments',
        '--ignore-gpu-blacklist',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--enable-features=NetworkService',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        // Extra
        '--disable-webgl',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-in-process-stack-traces',
        '--disable-histogram-customizer',
        '--disable-gl-extensions',
        '--disable-composited-antialiasing',
        '--disable-session-crashed-bubble',
        '--disable-canvas-aa',
        '--disable-3d-apis',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--disable-accelerated-mjpeg-decode',
        '--disable-app-list-dismiss-on-blur',
        '--disable-accelerated-video-decode',
        '--disable-dev-shm-usage',
        '--js-flags=--expose-gc',
        '--disable-features=site-per-process',
        '--disable-gl-drawing-for-tests',
        //keep awake in all situations
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
    );

    const driver: WebDriver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    logger.info('Setup web driver');

    return driver;
}

async function login(driver: WebDriver,
                     account: Account,
                     loginConfig: LoginConfig): Promise<void> {

    logger.info(`Waiting for page '${loginConfig.loginPageUrl}'`);
    await driver.get(loginConfig.loginPageUrl.toString());

    const title: string = await driver.getTitle();
    logger.info(`Get page title: ${title}`);

    const usernameElement: WebElement = await driver.findElement(loginConfig.usernameSelector);
    logger.info('Find usernameElement');
    await usernameElement.clear();
    logger.info('Clear usernameElement');
    await usernameElement.sendKeys(account.username);
    logger.info('Fill usernameElement');

    const passwordElement: WebElement = await driver.findElement(loginConfig.passwordSelector);
    logger.info('Find passwordElement');
    await passwordElement.clear();
    logger.info('Clear passwordElement');
    await passwordElement.sendKeys(account.password);
    logger.info('Fill passwordElement');

    const submitElement: WebElement = await driver.findElement(loginConfig.submitSelector);
    logger.info('Find submitElement');
    await submitElement.click();
    logger.info('Click submitElement');

    await driver.wait(until.urlIs(loginConfig.loginSuccessfullyPageUrl.toString()));
    logger.info('Login successfully');
}

async function clickCheckinElement(driver: WebDriver,
                                   checkinConfig: CheckinConfig): Promise<void> {
    try {
        await driver.get(checkinConfig.checkinPageUrl.toString());

        const title: string = await driver.getTitle();
        logger.info(`Get checkinPage title: ${title}`);

        const checkinElement: WebElement = await driver.findElement(checkinConfig.checkinSelector);
        logger.info('Find checkinElement');

        logger.info('Checkin');
        await checkinElement.click();
        logger.info('Checkin completed');

    } catch (e) {

        if (e instanceof error.NoSuchElementError) {

            logger.error('Cannot find checkinElement. You may have already checked in!');
            return;

        } else {

            throw e;

        }

    }
}

async function checkin_account(account: Account,
                     loginConfig: LoginConfig,
                     checkinConfig: CheckinConfig): Promise<void> {
    const driver: WebDriver = await setupWebDriver();

    try {
        logger.info(`Start checkin: ${account.username} - ${loginConfig.loginPageUrl.toString()}`);
        await login(driver, account, loginConfig);
        await clickCheckinElement(driver, checkinConfig);
    } finally {
        await driver.quit();
    }
}

async function checkin(website: Website): Promise<void> {
    const tasks = R.map(R.curry(checkin_account)(R.__, website.loginConfig, website.checkinConfig), website.accounts);
    Promise.all(tasks);
}

async function readConfig(configFilePath: string) {
    const file = await fs.readFile(configFilePath, { encoding: 'utf8' });
    logger.info(`Read config from ${configFilePath}`);

    return YAML.parse(file);
}

function toAccount(plainAccount: PlainAccount): Account {
    return {
        username: plainAccount.username,
        password: plainAccount.password,
    };
}

function toAccounts(plainAccounts: PlainAccount[]): Account[] {
    return R.map(toAccount, plainAccounts);
}

function toBy(es: PlainElementSelector): By {
    const available_selectors = R.difference(Object.getOwnPropertyNames(By), ['length', 'prototype']);
    if (R.and(R.includes(es.selector, available_selectors), R.compose(R.is(Function), R.prop(es.selector))(By))) {

        // @ts-ignore
        return By[es.selector](es.value);
    }

    throw new RangeError(`The selector '${es.selector}' is not availble in [${available_selectors.toString()}]`);
}

function toLoginConfig(plainLoginConfig: PlainLoginConfig): LoginConfig {
    return {
        loginPageUrl: new URL(plainLoginConfig.login_page_url),
        usernameSelector: toBy(plainLoginConfig.username_element),
        passwordSelector: toBy(plainLoginConfig.password_element),
        submitSelector: toBy(plainLoginConfig.submit_element),
        loginSuccessfullyPageUrl: new URL(plainLoginConfig.login_successfully_page_url),
    };
}

function toCheckinConfig(plainCheckinConfig: PlainCheckinConfig): CheckinConfig {
    return {
        checkinPageUrl: new URL(plainCheckinConfig.checkin_page_url),
        checkinSelector: toBy(plainCheckinConfig.checkin_element),
    };
}

function toWebsite(plainWebsite: PlainWebsite): Website {
    return {
        name: plainWebsite.name,
        accounts: toAccounts(plainWebsite.accounts),
        loginConfig: toLoginConfig(plainWebsite.login_config),
        checkinConfig: toCheckinConfig(plainWebsite.checkin_config),
    };
}

function toWebsites(plainWebsites: PlainWebsite[]): Website[] {
    return R.map(toWebsite, plainWebsites);
}

async function main(): Promise<void> {
    const opts = parseArgs().opts();

    const config = await readConfig(opts.config);
    const websites: Website[] = toWebsites(config.websites);

    const tasks = R.map(checkin, websites);

    Promise.all(tasks);
}

main();
