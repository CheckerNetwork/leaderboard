// @ts-check
import { htmlEscape } from 'https://cdn.jsdelivr.net/npm/escape-goat@4.0.0/+esm';

/**
 * @typedef {Object} NetworkData
 * @property {string} name - The name of the network
 * @property {number} successRate - The success rate of the network (between 0 and 100)
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

/** @type {readonly string[]} */
export const NETWORKS = ['arweave', 'filecoin', 'walrus']

/** @type {string} */
export const API_BASE_URL = 'https://api.checker.network'

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
 * @param {string} networkName - The name of the network to fetch data for
 * @returns {Promise<NetworkData | null>} The processed network data or null if the request fails
 */
export async function fetchNetworkData (networkName) {
  try {
    // const response = await fetch(`${API_BASE_URL}/${networkName}/measurements`)
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`)
    // }

    // /** @type {NetworkDailyMeasurments[]} */
    // const data = await response.json()
    // TODO: Uncomment the above code and remove the below code when the API is available
    const data = [
      {
        day: '2021-10-03',
        total: `${Math.floor(Math.random() * 100) + 50}`,
        successful: `${Math.floor(Math.random() * 50)}`
      }
    ]
    return {
      name: networkName,
      successRate: data.length > 0 ? calculateSuccessRate(data[0].total, data[0].successful) : 0
    }
  } catch (error) {
    console.error(`Error fetching ${networkName} data:`, error)
    return null
  }
}

/**
 * Creates an HTML element for a network item
 * @param {NetworkData} network - The network data to create an element for
 * @returns {string} HTML string for the network item
 */
export function createNetworkItemHTML (network) {
  return htmlEscape`
    <div class="network-item">
      <span class="network-name">${network.name}</span>
      <span class="success-rate">${network.successRate.toFixed(2)}%</span>
    </div>
  `
}

/**
 * Updates the DOM elements with the leaderboard data
 * @returns {Promise<void>}
 */
export async function updateLeaderboard () {
  /** @type {HTMLElement | null} */
  const loadingElement = document.getElementById('loading')
  /** @type {HTMLElement | null} */
  const errorElement = document.getElementById('error')
  /** @type {HTMLElement | null} */
  const networksElement = document.getElementById('networks')

  if (!loadingElement || !errorElement || !networksElement) {
    console.error('Required DOM elements not found')
    return
  }

  try {
    const networkPromises = NETWORKS.map(fetchNetworkData)
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

    networksElement.innerHTML = validData.map(createNetworkItemHTML).join('')

    loadingElement.style.display = 'none'
    errorElement.style.display = 'none'
    networksElement.style.display = 'block'
  } catch (error) {
    loadingElement.style.display = 'none'
    errorElement.style.display = 'block'
    networksElement.style.display = 'none'
    console.error('Error updating leaderboard:', error)
  }
}

// Only run in browser environment
if (typeof window !== 'undefined') {
  updateLeaderboard()
  setInterval(updateLeaderboard, 30000)
}
