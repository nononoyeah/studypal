import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { extractSseEvents } from '../src/api/chat.ts'

describe('extractSseEvents', () => {
  it('解析单个完整事件', () => {
    const { events, rest } = extractSseEvents('data: {"type":"delta","content":"你好"}\n\n')
    assert.deepEqual(events, [{ type: 'delta', content: '你好' }])
    assert.equal(rest, '')
  })

  it('多事件且保留不完整尾部', () => {
    const buffer =
      'data: {"type":"delta","content":"a"}\n\ndata: {"type":"done"}\n\ndata: {"type":"del'
    const { events, rest } = extractSseEvents(buffer)
    assert.deepEqual(events, [
      { type: 'delta', content: 'a' },
      { type: 'done' },
    ])
    assert.equal(rest, 'data: {"type":"del')
  })

  it('跳过坏 JSON 不崩溃', () => {
    const { events } = extractSseEvents('data: {broken\n\ndata: {"type":"done"}\n\n')
    assert.deepEqual(events, [{ type: 'done' }])
  })

  it('跳过无 data 行的空事件块', () => {
    const { events, rest } = extractSseEvents('event: ping\n\nrest-not-complete')
    assert.deepEqual(events, [])
    assert.equal(rest, 'rest-not-complete')
  })
})
