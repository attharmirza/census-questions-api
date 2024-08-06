import 'dotenv/config'
import { promises as fs } from 'fs'
import * as path from 'path'

/**
 * Simple fetch function for getting data from an API
 * 
 * @param {string} baseURL API to download from
 * @param {string} pathURL path on API to download location
 * @param {boolean} [includeKey = false] does URL need API key appended?
 * @returns desired json from API
 */
export default async function queryAPI(baseURL, pathURL, includeKey = false) {
    const fetchURL = includeKey ? `${baseURL}${pathURL}?&key=${process.env.US_CENSUS_API_KEY}` : `${baseURL}${pathURL}`
    try {
        const response = await fetch(fetchURL)

        const json = await response.json()

        return json
    } catch (err) {
        throw err
    }
}

/**
 * Download json objects from an API and save them locally.
 * 
 * @param {string} baseURL API to download from
 * @param {string} pathURL path on API to download location
 */
export async function downloadAPI(baseURL, pathURL) {
    let response

    try {
        response = await queryAPI(baseURL, pathURL)
    } catch (err) {
        throw err
    }

    const downloadPathArray = pathURL.split(/\/\\/g)
    const downloadPathLast = `${downloadPathArray.pop()}`
    const downloadPath = [downloadPathArray, downloadPathLast].flat()

    try {
        await fs.writeFile(path.join(...downloadPath), JSON.stringify(response))
    } catch (err) {
        throw err
    }

    console.log(`File written to ✨ ${path.join(...downloadPath)} ✨ successfully ✅`)
}

/**
 * Downloading all the groups and their respective variables, need to cd into
 * subdirectory between steps.
 */

const acsBaseUrl = 'https://api.census.gov/data/2022/acs/acs1/'
const acsBaseUrlGroups = 'https://api.census.gov/data/2022/acs/acs1/groups/'

// downloadAPI(acsBaseUrl, 'groups.json')

// downloadAPI(acsBaseUrl, 'variables.json')

// async function downloadAPIVariables() {
//     const groupsRaw = await fs.readFile('../groups.json')
//     const groupsJSON = JSON.parse(groupsRaw).groups

//     for (const group of groupsJSON) {
//         try {
//             await downloadAPI(acsBaseUrlGroups, `${group.name}.json`)
//         } catch (err) {
//             throw err
//         }
//     }
// }

// downloadAPIVariables()
