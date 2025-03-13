// @ts-check

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
// TODO: Add 'arweave' and 'walrus' to the NETWORKS array
export const NETWORKS = ['filecoin']

/** @type {string} */
export const API_BASE_URL = 'https://api.checker.network'
export const SPARK_API_BASE_URL = 'https://stats.filspark.com'

/**
 * @param {string} networkName
 * @returns {string}
 */
function getNetworkUrl (networkName) {
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
 * @param {string} networkName - The name of the network to fetch data for
 * @returns {Promise<NetworkData | null>} The processed network data or null if the request fails
 */
export async function fetchNetworkData (networkName) {
  try {
    const networkUrl = getNetworkUrl(networkName)
    const response = await fetch(`${networkUrl}/retrieval-success-rate`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    /** @type {NetworkDailyMeasurments[]} */
    const data = await response.json()
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
  return `
    <li class="network-item">
        <img class="network-logo" src="media/${network.name}.svg" alt="Solana logo">
        <div class="network-info">
            <div class="network-name">${network.name}</div>
        </div>
        <div class="success-rate">${network.successRate.toFixed(2)}%</div>
    </li>
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
  const networksElement = document.getElementById('network-list')

  if (!loadingContainer || !errorElement || !networksElement) {
    console.error('Required DOM elements not found')
    return
  }

  loadingContainer.classList.remove('hidden')
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
