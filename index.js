/* eslint-disable node/prefer-global/process */
import fs from 'node:fs/promises'
import * as core from '@actions/core'
import { context } from '@actions/github'
import axios from 'axios'
import fileExists from 'fs.promises.exists'

let countAllTests = 0

async function getStatsFor(lang, task) {
  const file = `${process.cwd()}/audits/${task}/${task}.json`
  const reportExists = await fileExists(file)

  if (reportExists === true) {
    const stats = {}

    if (lang === 'javascript' || lang === 'python') {
      const rawData = await fs.readFile(
        `${process.cwd()}/audits/${task}/${task}.json`,
        'utf8',
      )
      const payload = JSON.parse(rawData)
      const { numTotalTests, numPassedTests, numPendingTests } = payload

      stats.passed = numPassedTests
      stats.tests = numTotalTests - numPendingTests
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

    return stats
  }

  return {
    tests: 0,
    passed: 0,
  }
}

function taskToChallengeName(t) {
  const [, n] = t.split('-')
  return `Challenge-0${n}`
}



async function reportATask(language, task, opts) {
  const challenge = taskToChallengeName(task)
  const { token, server, sheetid } = opts
  console.log({ token, server, sheetid })
  const stats = await getStatsFor(language, task)

  let { repo, owner } = context.repo
  console.log({ repo, owner })

  /* support for GitHub classroom repos */
  if (repo.startsWith('javascript-basics')) {
    const splitted = repo.split('-')
    console.log({ splitted })

    if (splitted.length === 3) {
      owner = splitted[2]
      console.log({ owner })
    }
    else {
      // remove the first two words from splitted
      const [, , ...rest] = splitted
      console.log('rest:', rest)
      owner = rest.join('-')
    }
  }

  const { repository, pusher } = context.payload

  // dont send data for skipped tests
  countAllTests += stats.tests
  if (stats.tests <= 0)
    return

  const {
    data: { name },
  } = await axios.get(`https://api.github.com/users/${owner}`)

  console.log({ name })

  const data = {
    name,
    repo,
    owner,
    ...stats,
    language,
    task: challenge,
    url: repository.url,
    source: 'gha-jest-tests',
    since: new Date().toUTCString(),
    email: repository.owner.email || pusher.email,
  }
  console.log({ data })

  const apiHeaders = {
    'X-Spreadsheet-Id': `${sheetid}`,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const sheet = 'month1'

  const { data: existing } = await axios.get(
    `${server}/${sheet}?where={'repo':'${repo}'}`,
    {
      headers: apiHeaders,
    },
  ).catch(error => {
    console.error('First API Error:', error.response?.data || error.message)
    core.setFailed(error.message)
  })

  const found = existing?.results?.find(
    e => e.repo === repo && e.task === challenge,
  )
  if (found) {
    // update the record and exit this function
    data.attempts = Number.parseInt(found.attempts, 10) + 1
    await axios.put(`${server}/${found.rowIndex}`, data, {
      headers: apiHeaders,
    })
    return
  }

  data.attempts = 1
  await axios.post(`${server}/month1`, data, {
    headers: apiHeaders,
  }).catch(error => {
    console.error('API Error:', error.response?.data || error.message)
    console.error('Status:', error.response?.status)
    console.error('Headers:', error.response?.headers)
    core.setFailed(error.message)
  })
}

async function run() {
  try {
    const token = core.getInput('token')
    const language = core.getInput('lang')
    const server = core.getInput('server')
    const sheetid = core.getInput('sheetid')

    const allTasks = core.getInput('challenge').split(/;\s*/)

    await allTasks.reduce(async (previous, task) => {
      return previous.then(() =>
        reportATask(language, task, { token, server, sheetid }),
      )
    }, Promise.resolve())

    // Flag it if no tests ran at all
    if (countAllTests === 0) {
      core.warning(
        'Unless you are window shopping here, please review the instructions carefully',
      )
      core.setFailed('All tests were skipped!!')
    }
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
