import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NETWORKS, createNetworkItemHTML, fetchNetworkData, getDateDaysAgo, getNetworkUrl } from '../src/js/script.js'
import { createMockedFetch } from './test-helpers.js'

const FILECOIN = {
  name: 'filecoin',
  symbol: 'FIL'
}

const TEST_NETWORK = {
  name: 'test-network',
  symbol: 'TST'
}

const from = getDateDaysAgo(7)
const to = getDateDaysAgo(1)

test('NETWORKS array contains expected networks', () => {
  assert.deepEqual(NETWORKS, [FILECOIN, { name: 'arweave', symbol: 'AR' }, { name: 'walrus', symbol: 'WAL' }])
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
  assert.ok(html.includes('score-col'))
  assert.ok(html.includes('progress-container'))
  assert.ok(html.includes('progress-circle'))
  assert.ok(html.includes('progress-text'))
  assert.ok(html.includes('value'))
  assert.ok(html.includes('max'))
  assert.ok(html.includes('stroke: #4FF8CA'))
  assert.ok(html.includes('color: #4FF8CA'))
})

test('createNetworkItemHTML handles zero success rate', () => {
  const testNetwork = {
    name: 'test-network',
    symbol: 'TST',
    successRate: 0
  }

  const html = createNetworkItemHTML(testNetwork, 1)
  assert.ok(html.includes('0.0'))
  assert.ok(html.includes('stroke: #ED158A'))
  assert.ok(html.includes('color: #ED158A'))
})

test('createNetworkItemHTML handles 55% success rate', () => {
  const testNetwork = {
    name: 'test-network',
    symbol: 'TST',
    successRate: 55
  }

  const html = createNetworkItemHTML(testNetwork, 1)
  assert.ok(html.includes('55.0'))
  assert.ok(html.includes('stroke: #CAF659'))
  assert.ok(html.includes('color: #CAF659'))
})

test('createNetworkItemHTML handles 100% success rate', () => {
  const testNetwork = {
    name: 'test-network',
    symbol: 'TST',
    successRate: 100
  }

  const html = createNetworkItemHTML(testNetwork, 1)
  assert.ok(html.includes('100.0'))
  assert.ok(html.includes('stroke: #4FF8CA'))
  assert.ok(html.includes('color: #4FF8CA'))
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
  assert.deepEqual(requestedUrls, [`https://stats.filspark.com/retrieval-success-rate?from=${from}&to=${to}`])
  assert.deepEqual(data, { ...FILECOIN, successRate: 95 })
})

test('fetchNetworkData returns correct data for test-network', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: [{ total: '100', successful: '95' }] })

  const data = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.deepEqual(requestedUrls, [`https://api.checker.network/test-network/retrieval-success-rate?from=${from}&to=${to}`])
  assert.deepEqual(data, { ...TEST_NETWORK, successRate: 95 })
})

test('fetchNetworkData returns 0 RSR data for test-network', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: [] })

  const data = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.deepEqual(requestedUrls, [`https://api.checker.network/test-network/retrieval-success-rate?from=${from}&to=${to}`])
  assert.deepEqual(data, { ...TEST_NETWORK, successRate: 0 })
})

test('fetchNetworkData fetch throws error', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ throwError: true, errorMessage: 'Network error' })

  const response = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.deepEqual(requestedUrls, [`https://api.checker.network/test-network/retrieval-success-rate?from=${from}&to=${to}`])
  assert.equal(response, null)
})

test('fetchNetworkData fails to fetch data', async () => {
  const { requestedUrls, mockFetch } = createMockedFetch({ responseBody: null, status: 500 })

  const response = await fetchNetworkData(TEST_NETWORK, mockFetch)
  assert.equal(response, null)
  assert.deepEqual(requestedUrls, [`https://api.checker.network/test-network/retrieval-success-rate?from=${from}&to=${to}`])
})
