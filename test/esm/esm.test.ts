import { spawnSync } from 'child_process'
import { join } from 'path'

describe('Native ESM import', () => {
  it('should be able to use default export', () => {
    const { status } = spawnSync('node', [join(__dirname, 'default-esm-export.mjs')])

    expect(status).toBe(0)
  })

  it('should be able to use named export', () => {
    const { status } = spawnSync('node', [join(__dirname, 'named-esm-export.mjs')])

    expect(status).toBe(0)
  })
})
