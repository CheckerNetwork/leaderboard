// @ts-check
import { htmlEscape } from 'escape-goat'

/**
 * @typedef {Object} Network
 * @property {string} name - The name of the network
 * @property {string} symbol - The symbol of the network
 */

/**
 * @typedef {Object} NetworkData
 * @property {string} name - The name of the network
 * @property {number} successRate - The success rate of the network (between 0 and 100)
 * @property {string} symbol - The symbol of the network
 */

/**
 * @typedef {Object} NetworkDailyMeasurments
 * @property {string} day - Date in YYYY-MM-DD format
 * @property {string} total - Total number of measurements as string
 * @property {string} successful - Number of successful measurements as string
 */

/**
 * @typedef {Object} ApiResponse
 * @property {NetworkDailyMeasurments[]} measurements - Array of daily measurements
 */

/** @type {readonly Network[]} */
export const NETWORKS = [
  { name: 'filecoin', symbol: 'FIL' },
  { name: 'arweave', symbol: 'AR' },
  { name: 'walrus', symbol: 'WAL' }
]

/** @type {string} */
export const API_BASE_URL = 'https://api.checker.network'
export const SPARK_API_BASE_URL = 'https://stats.filspark.com'

/**
 * Converts a given Date object to a local date string in ISO format (YYYY-MM-DD).
 *
 * @param {Date} d - The Date object to be converted.
 * @returns {string} The local date as a string in ISO format.
 */
const getLocalDayAsISOString = (d) => {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-')
}

/**
 * Calculates a date string in ISO format for a given number of days ago.
 *
 * @param {number} daysAgo - The number of days ago from the current date.
 * @returns {string} The ISO string representation of the calculated date.
 */
export const getDateDaysAgo = (daysAgo) => getLocalDayAsISOString(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000))

/**
 * @param {Network} network
 * @returns {string}
 */
export function getNetworkUrl ({ name: networkName }) {
  if (networkName === 'filecoin') {
    return SPARK_API_BASE_URL
  }

  return `${API_BASE_URL}/${networkName}`
}

/**
 * Calculates success rate from list of total and successful measurements.
 *
 * @param {{total: string; successful: string}[]} data - Array containing list of objects with total and successful measurements
 * @returns {number} Success rate as percentage in 0 to 100 range.
 */
function calculateSuccessRate (data) {
  let totalMeasurementsCount = 0
  let successfulMeasurementsCount = 0

  for (const { total, successful } of data) {
    const totalNum = parseInt(total, 10)
    const successfulNum = parseInt(successful, 10)
    totalMeasurementsCount += totalNum
    successfulMeasurementsCount += successfulNum
  }

  if (totalMeasurementsCount === 0) return 0
  return (successfulMeasurementsCount / totalMeasurementsCount) * 100
}

/**
 * Fetches network data from the API for a specific network
 * @param {Network} network - The name of the network to fetch data for
 * @param {typeof globalThis.fetch} [fetch=globalThis.fetch] - The fetch function to use
 * @returns {Promise<NetworkData | null>} The processed network data or null if the request fails
 */
export async function fetchNetworkData (network, fetch = globalThis.fetch) {
  try {
    const from = getDateDaysAgo(7)
    const to = getDateDaysAgo(1)

    const networkUrl = getNetworkUrl(network)
    const response = await fetch(`${networkUrl}/retrieval-success-rate?from=${from}&to=${to}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    /** @type {NetworkDailyMeasurments[]} */
    const data = await response.json()
    return {
      ...network,
      successRate: data.length > 0 ? calculateSuccessRate(data) : 0
    }
  } catch (error) {
    console.error(`Error fetching ${network} data:`, error)
    return null
  }
}

/**
 * Returns a color based on the success rate
 *
 * @param {number} successRate
 * @returns {string}
 */
const getSuccessRateColor = (successRate) => {
  if (successRate < 50) {
    return '#ED158A'
  } else if (successRate < 75) {
    return '#CAF659'
  } else {
    return '#4FF8CA'
  }
}

/**
 * Creates an HTML element for a network item
 * @param {NetworkData} network - The network data to create an element for
 * @param {number} index - The index of the network in the leaderboard
 * @returns {string} HTML string for the network item
 */
export function createNetworkItemHTML (network, index) {
  /* Circumference of circle (2 * PI * r) where r = 28 */
  const r = 28
  const circumference = 2 * Math.PI * r
  const progress = circumference - (circumference * network.successRate) / 100
  const color = getSuccessRateColor(network.successRate)

  return htmlEscape`
  <div class="table-row">
    <div class="ranking-col rank">${index}.</div>
    <div></div>
    <div class="network-col">
      <div class="network-logo">
        <img src="media/${network.name}.svg" alt="${network.name} Logo">
      </div>
      <div class="network-info">
        <div class="network-name">${network.name}</div>
        <div class="network-symbol">${network.symbol}</div>
      </div>
    </div>
    <div class="score-col">
      <div class="progress-container">
        <svg class="progress-circle" viewBox="0 0 64 64">
          <circle class="progress-background" cx="32" cy="32" r="28"></circle>
          <circle class="progress-indicator" cx="32" cy="32" r="28" style="stroke-dashoffset: ${progress}; stroke: ${color};"></circle>
        </svg>
        <div class="progress-text">
          <div class="value" style="color: ${color}">${network.successRate.toFixed(1)}</div>
          <div class="max">/100</div>
        </div>
      </div>
    </div>
  </div>
  `
}

/**
 * Updates the DOM elements with the leaderboard data
 * @returns {Promise<void>}
 */
export async function updateLeaderboard () {
  /** @type {HTMLElement | null} */
  const loadingContainer = document.getElementById('loading-container')
  /** @type {HTMLElement | null} */
  const errorElement = document.getElementById('error-container')
  /** @type {HTMLElement | null} */
  const networksElement = document.getElementById('table-rows')

  if (!loadingContainer || !errorElement || !networksElement) {
    console.error('Required DOM elements not found')
    return
  }

  try {
    const networkPromises = NETWORKS.map((network) => fetchNetworkData(network))
    const networksData = await Promise.all(networkPromises)

    /** @type {NetworkData[]} */
    const validData = networksData.filter(
      (/** @type {NetworkData | null} */ data) => data !== null
    )

    if (validData.length === 0) {
      throw new Error('No network data available')
    }

    // Sort by success rate descending
    validData.sort((a, b) => b.successRate - a.successRate)
    console.log(validData)

    // Prepend new data to the existing list
    networksElement.innerHTML = validData.map((network, index) => createNetworkItemHTML(network, index + 1)).join('') + networksElement.innerHTML

    loadingContainer.classList.add('hidden')
    errorElement.classList.add('hidden')
    networksElement.classList.remove('hidden')
  } catch (error) {
    loadingContainer.classList.add('hidden')
    errorElement.classList.remove('hidden')
    networksElement.classList.add('hidden')
    console.error('Error updating leaderboard:', error)
  }
}

// Only run in browser environment
if (typeof window !== 'undefined') {
  updateLeaderboard()
}
