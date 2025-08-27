/* eslint-disable node/prefer-global/process */
import fs from 'node:fs/promises'
import * as core from '@actions/core'
import { context } from '@actions/github'
import axios from 'axios'
import fileExists from 'fs.promises.exists'

let countAllTests = 0
let attempts = 0

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

/**
 * Return the standard GitHub “web” URL for a repo.
 *
 * @param {string} apiUrl
 *   Example: "https://api.github.com/repos/Oluwasetemi/try2"
 * @returns {string}
 *   Example: "https://github.com/repos/Oluwasetemi/try2"
 *
 * The function only tweaks the hostname – it doesn't touch the path.
 * If the given URL already uses “github.com”, it is returned unchanged.
 */
function clearRepoUrl(url) {
  // Make sure we only replace a leading “api.” part and
  // keep the rest of the URL untouched.
  return url.replace(/^https:\/\/api\.github\.com/, 'https://github.com');
}



async function collectTaskData(language, task) {
  const challenge = taskToChallengeName(task)
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
    return null

  const {
    data: { name },
  } = await axios.get(`https://api.github.com/users/${owner}`)

  console.log({ name })

  // Return task data instead of making API calls
  return {
    name,
    repo,
    owner,
    ...stats,
    language,
    task: challenge,
    url: clearRepoUrl(repository.url),
    source: 'gha-jest-tests',
    since: new Date().toUTCString(),
    email: repository.owner.email || pusher.email,
    attempts: attempts + 1
  }
}

async function run() {
  try {
    const token = core.getInput('token')
    const language = core.getInput('lang')
    const server = core.getInput('server')
    const sheetid = core.getInput('sheetid')
    const sheet = core.getInput('sheet')

    const allTasks = core.getInput('challenge').split(/;\s*/)

    // Collect all task data first
    const taskDataPromises = allTasks.map(task =>
      collectTaskData(language, task)
    )

    const taskDataResults = await Promise.all(taskDataPromises)
    const validTaskData = taskDataResults.filter(data => data !== null)

    // Flag it if no tests ran at all
    if (countAllTests === 0) {
      core.warning(
        'Unless you are window shopping here, please review the instructions carefully',
      )
      core.setFailed('All tests were skipped!!')
    }

    if (validTaskData.length === 0) {
      return
    }

    // Aggregate data for the repo as a single record
    const firstTask = validTaskData[0]
    const aggregatedData = {
      name: firstTask.name,
      repo: firstTask.repo,
      owner: firstTask.owner,
      language: firstTask.language,
      url: firstTask.url,
      source: firstTask.source,
      since: firstTask.since,
      email: firstTask.email,
      // Combine all tasks
      task: validTaskData.map(t => t.task).join(';'),
      // Sum up all tests and passed tests
      tests: validTaskData.reduce((sum, t) => sum + t.tests, 0),
      passed: validTaskData.reduce((sum, t) => sum + t.passed, 0),
      attempts: firstTask.attempts
    }

    console.log('Aggregated data:', aggregatedData)

    // Check if repo already exists
    const queryParams = new URLSearchParams({
      where: `{ "repo": "${firstTask.repo}" }`,
      apiKey: token,
      spreadsheetId: sheetid
    })

    console.log('Query URL:', `${server}/${sheet}?${queryParams.toString()}`)
    console.log('Query params:', queryParams.toString())
    
    const { data: existing } = await axios.get(
      `${server}/${sheet}?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).catch(error => {
      console.error('GET API Error:', error.response?.data || error.message)
      console.error('GET API Status:', error.response?.status)
      console.error('GET API Headers:', error.response?.headers)
      core.setFailed(error.message)
    })

    console.log('API Response - existing:', existing)
    console.log('API Response type:', typeof existing)
    console.log('API Response keys:', existing ? Object.keys(existing) : 'null/undefined')

    console.log('Searching for repo:', firstTask.repo)
    console.log('Available results:', existing?.results?.length || 0)
    console.log('Results array:', existing?.results)
    
    const found = existing?.results?.find(
      e => e.repo === firstTask.repo,
    )

    console.log('Found record:', found)
    console.log('Found record type:', typeof found)
    console.log('Found record keys:', found ? Object.keys(found) : 'null/undefined')

    if (found) {
      console.log('Updating existing record')
      console.log('Current attempts in found:', found.attempts)
      console.log('Global attempts:', attempts)
      console.log('Calculated new attempts:', Number.parseInt(found.attempts, 10) + attempts + 1)
      
      // Update existing record
      aggregatedData.attempts = Number.parseInt(found.attempts, 10) + attempts + 1

      const updateParams = new URLSearchParams({
        apiKey: token,
        spreadsheetId: sheetid
      })

      await axios.put(`${server}/${sheet}/${found.rowIndex}?${updateParams.toString()}`, aggregatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.error('Update API Error:', error.response?.data || error.message)
        throw error
      })
    } else {
      console.log('Creating new record - no existing record found')
      // Create new record
      const postParams = new URLSearchParams({
        apiKey: token,
        spreadsheetId: sheetid
      })

      await axios.post(`${server}/${sheet}?${postParams.toString()}`, aggregatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.error('POST API Error:', error.response?.data || error.message)
        console.error('Status:', error.response?.status)
        console.error('Headers:', error.response?.headers)
        core.setFailed(error.message)
      })
    }
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
