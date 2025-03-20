import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NETWORKS, createNetworkItemHTML, fetchNetworkData, getNetworkUrl } from '../src/js/script.js'
import { createMockedFetch } from './test-helpers.js'

const FILECOIN = {
  name: 'filecoin',
  symbol: 'FIL'
}

const TEST_NETWORK = {
  name: 'test-network',
  symbol: 'TST'
}

test('NETWORKS array contains expected networks', () => {
  assert.deepEqual(NETWORKS, [FILECOIN])
})

test('createNetworkItemHTML generates correct HTML', () => {
  const testNetwork = {
    name: 'test-network',
    symbol: 'TST',
    successRate: 95.60
  }

  const html = createNetworkItemHTML(testNetwork, 1)

  assert.ok(html.includes('1'))
  assert.ok(html.includes('test-network'))
  assert.ok(html.includes('TST'))
  assert.ok(html.includes('95.6'))
  assert.ok(html.includes('network-info'))
  assert.ok(html.includes('network-logo'))
  assert.ok(html.includes('network-name'))
  assert.ok(html.includes('network-symbol'))
  assert.ok(html.includes('circular-progress'))
  assert.ok(html.includes('value'))
})

test('createNetworkItemHTML handles zero success rate', () => {
  const testNetwork = {
    name: 'test-network',
    symbol: 'TST',
    successRate: 0
  }

  const html = createNetworkItemHTML(testNetwork, 1)
  assert.ok(html.includes('0.0'))
})

test('createNetworkItemHTML handles 100% success rate', () => {
  const testNetwork = {
    name: 'test-network',
    symbol: 'TST',
    successRate: 100
  }

  const html = createNetworkItemHTML(testNetwork, 1)
  assert.ok(html.includes('100.0'))
})

test('getNetworkUrl returns correct URL for filecoin', () => {
  const url = getNetworkUrl(FILECOIN)
  assert.equal(url, 'https://stats.filspark.com')
})

test('getNetworkUrl returns correct URL for other networks', () => {
  const url = getNetworkUrl(TEST_NETWORK)
  assert.equal(url, 'https://api.checker.network/test-network')
})

test('fetchNetworkData returns correct data for filecoin', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: [{ total: '100', successful: '95' }] })

  const data = await fetchNetworkData(FILECOIN, mockFetch)
  assert.deepEqual(requestedUrls, ['https://stats.filspark.com/retrieval-success-rate'])
  assert.deepEqual(data, { ...FILECOIN, successRate: 95 })
})

test('fetchNetworkData returns correct data for test-network', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: [{ total: '100', successful: '95' }] })

  const data = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.deepEqual(requestedUrls, ['https://api.checker.network/test-network/retrieval-success-rate'])
  assert.deepEqual(data, { ...TEST_NETWORK, successRate: 95 })
})

test('fetchNetworkData returns 0 RSR data for test-network', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: [] })

  const data = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.deepEqual(requestedUrls, ['https://api.checker.network/test-network/retrieval-success-rate'])
  assert.deepEqual(data, { ...TEST_NETWORK, successRate: 0 })
})

test('fetchNetworkData fetch throws error', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ throwError: true, errorMessage: 'Network error' })

  const response = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.deepEqual(requestedUrls, ['https://api.checker.network/test-network/retrieval-success-rate'])
  assert.equal(response, null)
})

test('fetchNetworkData fails to fetch data', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: null, status: 500 })

  const response = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.equal(response, null)
  assert.deepEqual(requestedUrls, ['https://api.checker.network/test-network/retrieval-success-rate'])
})
