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
// TODO: Add 'arweave' and 'walrus' to the NETWORKS array once we start collecting data for them
export const NETWORKS = [
  { name: 'filecoin', symbol: 'FIL' }
]

/** @type {string} */
export const API_BASE_URL = 'https://api.checker.network'
export const SPARK_API_BASE_URL = 'https://stats.filspark.com'

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
 * Calculates success rate from total and successful measurements
 * @param {string} total - Total number of measurements
 * @param {string} successful - Number of successful measurements
 * @returns {number} Success rate as percentage (0-100)
 */
function calculateSuccessRate (total, successful) {
  const totalNum = parseInt(total, 10)
  const successfulNum = parseInt(successful, 10)

  if (totalNum === 0) return 0
  return (successfulNum / totalNum) * 100
}

/**
 * Fetches network data from the API for a specific network
 * @param {Network} network - The name of the network to fetch data for
 * @param {typeof globalThis.fetch} [fetch=globalThis.fetch] - The fetch function to use
 * @returns {Promise<NetworkData | null>} The processed network data or null if the request fails
 */
export async function fetchNetworkData (network, fetch = globalThis.fetch) {
  try {
    const networkUrl = getNetworkUrl(network)
    const response = await fetch(`${networkUrl}/retrieval-success-rate`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    /** @type {NetworkDailyMeasurments[]} */
    const data = await response.json()
    return {
      ...network,
      successRate: data.length > 0 ? calculateSuccessRate(data[0].total, data[0].successful) : 0
    }
  } catch (error) {
    console.error(`Error fetching ${network} data:`, error)
    return null
  }
}

/**
 * Creates an HTML element for a network item
 * @param {NetworkData} network - The network data to create an element for
 * @param {number} index - The index of the network in the leaderboard
 * @returns {string} HTML string for the network item
 */
export function createNetworkItemHTML (network, index) {
  const color = '#4ff8ca'
  const fillProgressValue = ((network.successRate / 100) * 360).toFixed(1)
  const fillProgress = `conic-gradient(${color} 0deg ${fillProgressValue}deg, rgba(255, 255, 255, 0) ${fillProgressValue}deg 360deg)`

  return htmlEscape`
  <div class="table-row">
    <div class="ranking-col">${index}.</div>
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
      <div class="circular-progress" data-value="${network.successRate.toFixed(1)}" style="background: ${fillProgress}">
        <div class="progress-value">
          <span class="value" style="color: ${color}">${network.successRate.toFixed(1)}</span>
          <span class="max">/100</span>
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
  // /** @type {HTMLElement | null} */
  // const loadingContainer = document.getElementById('loading-container')
  // /** @type {HTMLElement | null} */
  // const errorElement = document.getElementById('error-container')
  /** @type {HTMLElement | null} */
  const networksElement = document.getElementById('table-rows')

  // if (!loadingContainer || !errorElement || !networksElement) {
  //   console.error('Required DOM elements not found')
  //   return
  // }
  if (!networksElement) {
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

    // Prepend new data to the existing list
    networksElement.innerHTML = validData.map((network, index) => createNetworkItemHTML(network, index + 1)).join('') + networksElement.innerHTML

    // loadingContainer.classList.add('hidden')
    // errorElement.classList.add('hidden')
    // networksElement.classList.remove('hidden')
  } catch (error) {
    // loadingContainer.classList.add('hidden')
    // errorElement.classList.remove('hidden')
    networksElement.classList.add('hidden')
    console.error('Error updating leaderboard:', error)
  }
}

// Only run in browser environment
if (typeof window !== 'undefined') {
  updateLeaderboard()
}
