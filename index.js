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

const reportATask = async (language, task, server) => {
    const stats = getStatsFor(language, task);

    const { repo, owner } = context.repo;
    const report = {
      repo,
      owner,
      ...stats,
      language,
      source: 'unit-tests',
      type: tastToChallengeName(task)
    };

    
    await axios.post(`${server}/api/entry-tests`, { report });
};

const run = async () => {
  try {
    const allTasks = core.getInput('challenge').split(/;\s*/);
    const language = core.getInput('lang');
    const server = core.getInput('server');

    const reportingStack = allTasks.reduce(async (job, task) => {
        await job;
        reportATask(language, task, server)
    }, Promise.resolve());

    await reportingStack;
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();