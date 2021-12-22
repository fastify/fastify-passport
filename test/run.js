/* eslint-disable @typescript-eslint/no-var-requires */
const { runCLI } = require('jest')
const jestConfig = require('../jest.config.js')

const sessionPlugins = ['fastify-secure-session', '@fastify/session']

async function runTests(sessionPlugin) {
  process.env.SESSION_PLUGIN = sessionPlugin
  const result = await runCLI(jestConfig, ['./'])
  if (result.results.success) {
    console.log(`Tests completed`)
  } else {
    console.error(`Tests failed`)
  }
}

async function start() {
  for (const sessionPlugin of sessionPlugins) {
    await runTests(sessionPlugin)
  }
}

start().catch((err) => console.error(err))
