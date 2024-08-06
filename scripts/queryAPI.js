import 'dotenv/config'
import { promises as fs } from 'fs'
import * as path from 'path'

const acsBaseUrl = 'https://api.census.gov/data/2022/acs/acs1/'

/**
 * Simple fetch function for getting data from an API
 * 
 * @param {string} url URL of API with path parameters
 * @returns 
 */
export default async function queryAPI(baseURL, pathURL) {
    try {
        const response = await fetch(`${baseURL}${pathURL}?&key=${process.env.US_CENSUS_API_KEY}`)

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

// downloadAPI('groups.json', 'parametersACS')

// const acsBaseUrlGroups = 'https://api.census.gov/data/2022/acs/acs1/groups/'

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
