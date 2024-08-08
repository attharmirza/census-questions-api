import { promises as fs } from 'fs'
import * as path from 'path'

/**
 * Convert two-dimensional Array with column headers into a JSON object with key
 * -value pairs.
 */

/**
 * Join variable descriptions from the census API to the data.
 */

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