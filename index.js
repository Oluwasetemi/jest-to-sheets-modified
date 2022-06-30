const fs = require('fs').promises;
const fileExists = require('fs.promises.exists');
const core = require('@actions/core');
const { context } = require('@actions/github');
const axios = require('axios');

const getStatsFor = async (lang, task) => {
  const report = `${process.cwd()}/audits/${task}/${task}.json`;
  const reportExists = await fileExists(report);

  console.log(`/audits/${task}/${task}.json exists:`, reportExists);

  if (reportExists === true) {
    let stats = {};

    if (lang === 'javascript' || lang === 'python') {
        const rawData = await fs.readFile(`${process.cwd()}/audits/${task}/${task}.json`, 'utf8');
        const payload = JSON.parse(rawData);

        console.log(payload);
    
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
    const challenge = tastToChallengeName(task);
    const { token, server, sheetid } = opts;
    const stats = await getStatsFor(language, task);

    console.log('reportATask', task);
    console.log('reportATask', stats);

    const { repo, owner } = context.repo;
    console.log('reportATask', owner, repo);
    const sheet = ownerToSheetPartition(owner);
    console.log('reportATask', sheet);

    const data = {
        repo,
        owner,
        ...stats,
        language,
        task: challenge,
        source: 'gha-jest-tests'
    };

    console.log('reportATask', data);

    // const apiHeaders = {
    //     "X-Spreadsheet-Id": `${sheetid}`,
    //     "Authorization": `Bearer ${token}`,
    //     "Content-Type": "application/json"
    // };

    // const { data: existing } = await axios.get(`${server}/${sheet}`, {
    //     headers: apiHeaders
    // });

    // const found = existing.results.find((e) => e.owner === owner && e.task === challenge);
    // if (found) {
    //     // update the record and exit this function
    //     return await axios.put(`${server}/${sheet}/${found.rowIndex}`, data, {
    //         headers: apiHeaders
    //     });
    // }
    
    // await axios.post(`${server}/${sheet}`, data, {
    //     headers: apiHeaders
    // });
};

const run = async () => {
  try {
    const token = core.getInput('token');
    const language = core.getInput('lang');
    const server = core.getInput('server');
    const sheetid = core.getInput('sheetid');

    const allTasks = core.getInput('challenge').split(/;\s*/);

    await allTasks.reduce(async (previous, task) => {
        return previous.then(
            () => reportATask(language, task, { token, server, sheetid })
        );
    }, Promise.resolve());

  } catch (error) {
    core.setFailed(error.message);
  }
};

run();