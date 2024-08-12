import { promises as fs } from 'fs'
import * as path from 'path'
import { queryAPI } from './queryAPI.js'

/**
 * Convert two-dimensional Array with column headers into a JSON object with key
 * -value pairs.
 * 
 * @param {Array} data Raw two dimensional array from Census API
 * @returns {JSON} Array of objects, column headers formatted as keys for each "row" of data
 */
export function arrayToJSON(data) {
    const columnHeaders = data[0]
    const columns = data.slice(1)

    return columns.map(d => {
        const pairs = []

        d.forEach((value, index) => pairs.push([columnHeaders[index], value]))

        return Object.fromEntries(new Map(pairs))
    })
}

/**
 * Join variable descriptions from the census API to the data.
 * 
 * @param {JSON} dataJSON output from  arrayToJSON function
 * @returns {JSON} changes values into objects with value, label and concept keys
 */
export async function assignVariableNames(dataJSON) {
    let censusVariables = await queryAPI('api.census.gov', 'data/2022/acs/acs1/variables.json')
    censusVariables = new Map(Object.entries(censusVariables.variables))

    return dataJSON.map(d => {
        const { NAME, GEO_ID } = d

        delete d['NAME']
        delete d['GEO_ID']

        let DESCRIPTION

        const CATEGORIES = Object
            .entries(d)
            .map(e => {
                const variableInfo = censusVariables.get(e[0]) ? censusVariables.get(e[0]) : undefined

                if (!variableInfo) return

                const { label, concept } = variableInfo
                const VALUE = e[1]
                const ID = e[0]

                DESCRIPTION = concept

                return { ID, LABEL: label, VALUE }
            })
            .filter(f => !f === false)

        return { NAME, GEO_ID, DESCRIPTION, CATEGORIES }
    })
}

/**
 * Write the JSON response from the API into a file named after the epoch time of the download.
 * 
 * @param {JSON} data data from the API
 */
export async function writeData(data) {
    try {
        await fs.access('downloads')
    } catch (err) {
        try {
            await fs.mkdir('downloads')
        } catch (err) {
            throw err
        }
    }

    const downloadPath = ['downloads', `${Date.now()}.json`]
    const downloadPathJoined = path.join(...downloadPath)

    try {
        await fs.writeFile(downloadPathJoined, JSON.stringify(data))
    } catch (err) {
        throw err
    }

    console.log(`File written to ✨ ${downloadPathJoined} ✨ successfully ✅`)
}