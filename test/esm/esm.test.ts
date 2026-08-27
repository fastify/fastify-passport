import { test, describe, TestContext } from 'node:test'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

describe('Native ESM import', () => {
  test('should be able to use default export', (t: TestContext) => {
    const { status } = spawnSync('node', [join(__dirname, '../../../test/esm', 'default-esm-export.mjs')])
    t.assert.strictEqual(status, 0)
  })

  test('should be able to use named export', (t: TestContext) => {
    const { status } = spawnSync('node', [join(__dirname, '../../../test/esm', 'named-esm-export.mjs')])

    t.assert.strictEqual(status, 0)
  })
})
