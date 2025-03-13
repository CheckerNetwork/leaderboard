import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NETWORKS, createNetworkItemHTML, fetchNetworkData, getNetworkUrl } from '../src/js/script.js'

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

test('fetchNetworkData returns correct data for filecoin', async () => {
  /**
   * @type {string[]}
   */
  const requests = []

  /**
   * @param {string | URL | RequestInfo} url
   * @param {RequestInit} [allOpts]
   * @returns {Promise<Response>}
   */
  const mockFetch = async (url, allOpts) => {
    assert(typeof url === 'string')
    requests.push(url)

    return new Response(JSON.stringify([{ total: '100', successful: '95' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const data = await fetchNetworkData('filecoin', mockFetch)
  assert.deepEqual(requests, ['https://stats.filspark.com/retrieval-success-rate'])
  assert.deepEqual(data, { name: 'filecoin', successRate: 95 })
})

test('fetchNetworkData returns correct data for test-network', async () => {
  /**
   * @type {string[]}
   */
  const requests = []

  /**
   * @param {string | URL | RequestInfo} url
   * @param {RequestInit} [allOpts]
   * @returns {Promise<Response>}
   */
  const mockFetch = async (url, allOpts) => {
    assert(typeof url === 'string')
    requests.push(url)

    return new Response(JSON.stringify([{ total: '100', successful: '95' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const data = await fetchNetworkData('test-network', mockFetch)
  assert.deepEqual(requests, ['https://api.checker.network/test-network/retrieval-success-rate'])
  assert.deepEqual(data, { name: 'test-network', successRate: 95 })
})

test('fetchNetworkData returns 0 RSR data for test-network', async () => {
  /**
   * @type {string[]}
   */
  const requests = []

  /**
   * @param {string | URL | RequestInfo} url
   * @param {RequestInit} [allOpts]
   * @returns {Promise<Response>}
   */
  const mockFetch = async (url, allOpts) => {
    assert(typeof url === 'string')
    requests.push(url)

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const data = await fetchNetworkData('test-network', mockFetch)
  assert.deepEqual(requests, ['https://api.checker.network/test-network/retrieval-success-rate'])
  assert.deepEqual(data, { name: 'test-network', successRate: 0 })
})

test('fetchNetworkData fetch throws error', async () => {
  /**
   * @type {string[]}
   */
  const requests = []

  /**
   * @param {string | URL | RequestInfo} url
   * @param {RequestInit} [allOpts]
   * @returns {Promise<Response>}
   */
  const mockFetch = async (url, allOpts) => {
    assert(typeof url === 'string')
    requests.push(url)

    throw new Error('Network error')
  }

  const response = await fetchNetworkData('test-network', mockFetch)
  assert.deepEqual(requests, ['https://api.checker.network/test-network/retrieval-success-rate'])
  assert.equal(response, null)
})

test('fetchNetworkData fails to fetch data', async () => {
  /**
   * @type {string[]}
   */
  const requests = []

  /**
   * @param {string | URL | RequestInfo} url
   * @param {RequestInit} [allOpts]
   * @returns {Promise<Response>}
   */
  const mockFetch = async (url, allOpts) => {
    assert(typeof url === 'string')
    requests.push(url)
    return new Response(null, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const response = await fetchNetworkData('test-network', mockFetch)
  assert.equal(response, null)
  assert.deepEqual(requests, ['https://api.checker.network/test-network/retrieval-success-rate'])
})
