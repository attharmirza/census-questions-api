/**
 * Search parameters for the US Census Bureau 
 * 
 * @typedef {Object} censusSearchParams
 * @property {string} get Variable names, separated by commas. Group name in parentheses (e.g. group(B01001))
 * @property {string} for Geography type, then colon, then FIPS codes seperated by commas (e.g. state:01,06)
 * @property {string} [key] API key
 */

/**
 * Construct query parameters for queryAPI() function based on input string of a group 
 * name, variable names, and geography fips codes.
 * 
 * @param {string} censusGroup single [group name](https://api.census.gov/data/2022/acs/acs1/groups.json) from the Census API
 * @param {string} censusGeography geography type and FIPS codes 
 * @returns {censusSearchParams}
 */
export function generateSearchParams(censusGroup, censusGeography, key) {
    const searchParams = {
        get: `group(${censusGroup})`,
        for: censusGeography
    }

    if (!key) return searchParams

    searchParams.key = key
    
    return searchParams
}

/**
 * Census data with API call url.
 * 
 * @typedef {Object} censusDataWithUrl
 * @property {JSON} json raw data from census API
 * @property {URL} url url object containing API call
 */

/**
 * Simple fetch function for getting data from an API
 * 
 * @param {string} hostname API to download from
 * @param {string} pathname path on API to download location
 * @param {censusSearchParams} [searchParams] search parameters for filtering API data
 * @returns {censusDataWithUrl} raw data from census API with URL
 */
export async function queryAPI(hostname, pathname, searchParams) {
    let url = new URL('https://api.census.gov/')

    url.hostname = hostname
    url.pathname = pathname

    if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
            url.searchParams.set(key, value)
        }
    }

    try {
        const response = await fetch(url)

        const json = await response.json()

        return { json, url }
    } catch (err) {
        throw err
    }
}
