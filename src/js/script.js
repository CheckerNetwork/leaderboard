// @ts-check

/**
 * @typedef {Object} NetworkData
 * @property {string} name - The name of the network
 * @property {number} successRate - The success rate of the network (between 0 and 100)
 */

/**
 * @typedef {Object} ApiResponse
 * @property {number} success_rate - The success rate returned from the API
 */

/** @type {readonly string[]} */
export const NETWORKS = ['arweave', 'filecoin', 'walrus'];

/** @type {string} */
export const API_BASE_URL = 'https://api.checker.network';

/**
 * Fetches network data from the API for a specific network
 * @param {string} networkName - The name of the network to fetch data for
 * @returns {Promise<NetworkData | null>} The processed network data or null if the request fails
 */
export async function fetchNetworkData(networkName) {
  try {
    // TODO: Uncomment this when the API is ready
    // const response = await fetch(`${API_BASE_URL}/${networkName}/measurements`);
    // if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    // }
    // /** @type {ApiResponse} */
    // const data = await response.json();
    return {
      name: networkName,
      successRate: Math.random() * 100, // data.success_rate
    };
  } catch (error) {
    console.error(`Error fetching ${networkName} data:`, error);
    return null;
  }
}

/**
 * Creates an HTML element for a network item
 * @param {NetworkData} network - The network data to create an element for
 * @returns {string} HTML string for the network item
 */
export function createNetworkItemHTML(network) {
  return `
        <div class="network-item">
            <span class="network-name">${network.name}</span>
            <span class="success-rate">${network.successRate.toFixed(2)}%</span>
        </div>
    `;
}

/**
 * Updates the DOM elements with the leaderboard data
 * @returns {Promise<void>}
 */
export async function updateLeaderboard() {
  /** @type {HTMLElement | null} */
  const loadingElement = document.getElementById('loading');
  /** @type {HTMLElement | null} */
  const errorElement = document.getElementById('error');
  /** @type {HTMLElement | null} */
  const networksElement = document.getElementById('networks');

  if (!loadingElement || !errorElement || !networksElement) {
    console.error('Required DOM elements not found');
    return;
  }

  try {
    const networkPromises = NETWORKS.map(fetchNetworkData);
    const networksData = await Promise.all(networkPromises);

    /** @type {NetworkData[]} */
    const validData = networksData.filter(
      (/** @type {NetworkData | null} */ data) => data !== null
    );

    if (validData.length === 0) {
      throw new Error('No network data available');
    }

    // Sort by success rate descending
    validData.sort((a, b) => b.successRate - a.successRate);

    networksElement.innerHTML = validData.map(createNetworkItemHTML).join('');

    loadingElement.style.display = 'none';
    errorElement.style.display = 'none';
    networksElement.style.display = 'block';
  } catch (error) {
    loadingElement.style.display = 'none';
    errorElement.style.display = 'block';
    networksElement.style.display = 'none';
    console.error('Error updating leaderboard:', error);
  }
}

// Only run in browser environment
if (typeof window !== 'undefined') {
  updateLeaderboard();
  setInterval(updateLeaderboard, 30000);
}
