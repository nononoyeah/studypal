// 端到端：mock localStorage + 真实 fetch + 真实后端，走 auth.ts 全链路
import assert from 'node:assert/strict'

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => void store.set(k, v),
  removeItem: (k) => void store.delete(k),
} as Storage

const { register, login, authFetch, hasToken, clearTokens, UnauthorizedError } = await import(
  '../src/api/auth.ts'
)

const BASE = 'http://localhost:8000'
const user = { username: `e2e_${Date.now()}`, password: 'password123' }

// 1. 注册（201，无 token）
const reg = await register(user.username, user.password)
assert.equal(reg.username, user.username)
assert.equal(hasToken(), false, 'register 不产生 token（后端契约）')
console.log('1. register OK:', reg.username)

// 2. 登录 → 双 token 存储
const result = await login(user.username, user.password)
assert.ok(result.accessToken && result.refreshToken)
assert.equal(store.get('access_token'), result.accessToken)
assert.equal(store.get('refresh_token'), result.refreshToken)
console.log('2. login OK: tokens stored')

// 3. authFetch 受保护请求（历史为空）
const hist = await authFetch(`${BASE}/api/chat/messages`)
assert.equal(hist.status, 200)
assert.deepEqual((await hist.json()).messages, [])
console.log('3. authFetch history OK (200, empty)')

// 4. 破坏 access token（模拟过期）→ 自动刷新重放成功
store.set('access_token', 'broken-expired-token')
const after = await authFetch(`${BASE}/api/chat/messages`)
assert.equal(after.status, 200)
assert.notEqual(store.get('access_token'), 'broken-expired-token', 'access token 已被刷新')
console.log('4. expired access → auto refresh + replay OK')

// 5. refresh 也失效 → 清凭据抛 UnauthorizedError（引导重登路径）
store.set('access_token', 'broken-expired-token')
store.set('refresh_token', 'broken-refresh-token')
await assert.rejects(() => authFetch(`${BASE}/api/chat/messages`), UnauthorizedError)
assert.equal(hasToken(), false, '凭据已被清除')
console.log('5. broken refresh → cleared + UnauthorizedError OK')

// 6. 登出路径：重新登录后 clearTokens
await login(user.username, user.password)
assert.equal(hasToken(), true)
clearTokens()
assert.equal(hasToken(), false)
console.log('6. logout path OK')
console.log('E2E ALL PASSED')
