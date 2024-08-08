import 'dotenv/config'
import { promises as fs } from 'fs'
import * as path from 'path'

/**
 * Search parameters for the US Census Bureau 
 * @typedef {Object} censusSearchParams
 * @property {string} get Variable names, separated by commas. Group names in parentheses (e.g. group(B01001))
 * @property {string} for Geography type, then colon, then FIPS codes seperated by commas (e.g. state:01,06)
 * @property {string} key API key
 */

/**
 * Construct query parameters for queryAPI() function based on input string of a group 
 * name, variable names, and geography fips codes.
 * 
 * @param {string} censusVariables comma separated list of [variables](https://api.census.gov/data/2022/acs/acs1/variables.json) from the Census API
 * @param {string} censusGeography geography type and FIPS codes 
 * @returns {censusSearchParams}
 */
export function generateSearchParams(censusVariables, censusGeography) {
    return {
        get: `NAME,${censusVariables}`,
        for: censusGeography,
        key: process.env.US_CENSUS_API_KEY
    }
}

/**
 * Simple fetch function for getting data from an API
 * 
 * @param {string} hostname API to download from
 * @param {string} pathname path on API to download location
 * @param {censusSearchParams} [searchParams] search parameters for filtering API data
 * @returns {JSON} desired json from API
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

        return json
    } catch (err) {
        throw err
    }
}

/**
 * Write the JSON response from the API into a file named after the epoch time of the download.
 * 
 * @param {JSON} data data from the API
 */
export async function writeData(data) {
    const downloadPath = ['downloads', `${Date.now()}.json`]
    const downloadPathJoined = path.join(...downloadPath)

    try {
        await fs.writeFile(downloadPathJoined, JSON.stringify(data))
    } catch (err) {
        throw err
    }

    console.log(`File written to ✨ ${downloadPathJoined} ✨ successfully ✅`)
}
