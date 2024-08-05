import { promises as fs } from 'fs'
import * as path from 'path'
import queryAPI from './scripts/queryAPI.js'

const baseURL = 'https://api.census.gov/data/2022/acs/acs1/'

/**
 * Download json objects from an API and save them locally.
 * 
 * @param {string} path path on API and to download location, should end with name of json file
 */
async function downloadAPI(filepath) {
    let response
    
    try {
        response = await queryAPI(`${baseURL}${filepath}`)
    } catch (err) {
        throw err
    }

    const downloadPathArray = filepath.split('/')
    const downloadPathLast = `${downloadPathArray.pop()}.json`
    const downloadPath = ['paramatersACS', downloadPathArray, downloadPathLast].flat()

    try {
        await fs.writeFile(path.join(...downloadPath), JSON.stringify(response))
    } catch (err) {
        throw err
    }

    console.log(`File written to ✨${path.join(...downloadPath)}✨ successfully ✅`)
}

downloadAPI('groups')

// async function downloadGroupsAndVariables(

// )