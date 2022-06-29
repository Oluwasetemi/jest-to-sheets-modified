const fs = require('fs').promises;
const axios = require('axios');
const core = require('@actions/core');
const { context } = require('@actions/github');

const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));

const getStatsFor = async (lang, task) => {
  const report = `${process.cwd()}/audits/${task}.json`;
  const reportExists = await fileExists(report);

  if (reportExists === true) {
    let stats = {};

    if (lang === 'javascript' || lang === 'python') {
        const json = fs.readFileSync(`${process.cwd()}/audits/${task}.json`, 'utf8');
        const payload = JSON.parse(json);
    
        stats.tests = payload.numTotalTests;
        stats.passed = payload.numPassedTests;
      }
    
      if (lang === 'php') {
        // TODO install xml2json and read test output in xml
        // before converting to json 
    
        // const xml = fs.readFileSync(`${process.cwd()}/audits/${task}.xml`, 'utf8');
        // const data = xml2json.toJson(xml, { object: true });
    
        // const payload = data.testsuites.testsuite;
        // stats.totalTests = payload.tests;
        // stats.passedTests = parseInt(payload.tests, 10) - parseInt(payload.failures, 10);
      }

    return stats;
  }

  return {
    tests: 0,
    passed: 0
  };
  
};

const tastToChallengeName = (t) => {
    const [, n] = t.split('-');
    return `Challenge-0${n}`;
};

const alphabets = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const shards = {
    '0-4': 'A-E',
    '5-9': 'F-J',
    '10-14': 'K-O',
    '15-19': 'P-T',
    '20-25': 'U-Z'
};

const ownerToSheetPartition = (owner) => {
    const initial = owner.charAt(0).toLowerCase();

    let index = alphabets.indexOf(initial);
    if (index === -1) index = 25;

    const key = Object.keys(shards).find(k => {
        const [start, end] = k.split('-');
        return index >= parseInt(start, 10) && index <= parseInt(end, 10);
    });

    return shards[key];
};

const reportATask = async (language, task, opts) => {
    const stats = getStatsFor(language, task);
    const { token, server, sheetid } = opts;

    const { repo, owner } = context.repo;
    const data = {
      repo,
      owner,
      ...stats,
      language,
      source: 'gha-jest-tests',
      type: tastToChallengeName(task)
    };

    const sheet = ownerToSheetPartition(owner);
    await axios.post(`${server}/${sheet}`, data, {
        headers: {
            "X-Spreadsheet-Id": `${sheetid}`,
            "Authorization": `Bearer ${token}`
        }
    });
};

const run = async () => {
  try {
    const token = core.getInput('token');
    const language = core.getInput('lang');
    const server = core.getInput('server');
    const sheetid = core.getInput('sheetid');

    const allTasks = core.getInput('challenge').split(/;\s*/);

    const reportingStack = allTasks.reduce(async (previous, task) => {
        return previous.then(
            () => reportATask(language, task, {
                token,
                server,
                sheetid
            })
        );
    }, Promise.resolve());

    await reportingStack;
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();