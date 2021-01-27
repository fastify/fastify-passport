import { spawnSync } from 'child_process'
import * as semver from 'semver'
import { join } from 'path'

describe('Native ESM import', () => {
  const defaultExportTest = semver.lt(process.versions.node, '13.3.0') ? it.skip : it
  const namedExportTest = semver.lt(process.versions.node, '14.13.0') ? it.skip : it

  defaultExportTest('should be able to use default export', () => {
    const { status } = spawnSync('node', [join(__dirname, 'default-esm-export.mjs')])

    expect(status).toBe(0)
  })

  namedExportTest('should be able to use named export', () => {
    const { status } = spawnSync('node', [join(__dirname, 'named-esm-export.mjs')])

    expect(status).toBe(0)
  })
})
