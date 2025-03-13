import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NETWORKS, createNetworkItemHTML, getNetworkUrl } from '../src/js/script.js'

test('NETWORKS array contains expected networks', () => {
  assert.deepEqual(NETWORKS, ['filecoin'])
})

test('createNetworkItemHTML generates correct HTML', () => {
  const testNetwork = {
    name: 'test-network',
    successRate: 95.60
  }

  const html = createNetworkItemHTML(testNetwork)

  assert.ok(html.includes('test-network'))
  assert.ok(html.includes('95.60%'))
  assert.ok(html.includes('network-logo'))
  assert.ok(html.includes('network-item'))
  assert.ok(html.includes('network-name'))
  assert.ok(html.includes('success-rate'))
})

test('createNetworkItemHTML handles zero success rate', () => {
  const testNetwork = {
    name: 'test-network',
    successRate: 0
  }

  const html = createNetworkItemHTML(testNetwork)
  assert.ok(html.includes('0.00%'))
})

test('createNetworkItemHTML handles 100% success rate', () => {
  const testNetwork = {
    name: 'test-network',
    successRate: 100
  }

  const html = createNetworkItemHTML(testNetwork)
  assert.ok(html.includes('100.00%'))
})

test('getNetworkUrl returns correct URL for filecoin', () => {
  const url = getNetworkUrl('filecoin')
  assert.equal(url, 'https://stats.filspark.com')
})

test('getNetworkUrl returns correct URL for other networks', () => {
  const url = getNetworkUrl('test-network')
  assert.equal(url, 'https://api.checker.network/test-network')
})
