import assert from 'assert'

/**
 * @param {object} args
 * @param {any} [args.responseBody]
 * @param {number} [args.status=200]
 * @param {boolean} [args.throwError=false]
 * @param {string} [args.errorMessage]
 * @returns {{requestedUrls: string[], mockFetch: typeof globalThis.fetch}}
 */
export function createMockedFetch ({ responseBody, status, throwError, errorMessage }) {
  /** @type {string[]} */
  const requestedUrls = []

  /** @type {typeof globalThis.fetch} */
  const mockFetch = async (url, allOpts) => {
    assert(typeof url === 'string')
    requestedUrls.push(url.toString())

    if (throwError) {
      throw new Error(errorMessage)
    }

    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return { requestedUrls, mockFetch }
}
