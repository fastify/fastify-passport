import { test, describe } from 'node:test'
import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

describe('Native ESM import', () => {
  test('should be able to use default export', () => {
    const { status } = spawnSync('node', [join(__dirname, '../../../test/esm', 'default-esm-export.mjs')])
    assert.strictEqual(status, 0)
  })

  test('should be able to use named export', () => {
    const { status } = spawnSync('node', [join(__dirname, '../../../test/esm', 'named-esm-export.mjs')])

    assert.strictEqual(status, 0)
  })
})
