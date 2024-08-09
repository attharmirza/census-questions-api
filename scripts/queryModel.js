import { promises as fs } from 'fs'
import { queryAPI } from './queryAPI.js'
import { csvParse, groups, ascending } from 'd3'

/**
 * Pull possible variables from the Census API and then generate a function call
 * for Gemini using those variables.
 * 
 * @returns {object} Function call following the Gemini [specification](https://ai.google.dev/gemini-api/docs/function-calling), based on Open API
 */
export async function generateFunctionCall() {
    let censusGroups, geographyCounties

    try {
        const hostname = 'api.census.gov'
        const pathnameCommon = 'data/2022/acs/acs1/'

        censusGroups = await queryAPI(hostname, `${pathnameCommon}groups.json`)

        geographyCounties = await fs.readFile('data/county_fips_master.csv', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    censusGroups = censusGroups.groups
        .filter(f => !f.name === false && !f.description === false)
        .sort((a, b) => ascending(a.name, b.name))

    geographyCounties = groups(csvParse(geographyCounties), d => d.state_name).map(d => ({
        state_name: d[0],
        fips: d[1][0].state,
        counties: d[1].map(e => ({
            county_name: e.county_name,
            fips: e.fips
        }))
    }))

    const functionCall = {
        name: 'get_data_from_us_census_american_community_survey_1_year_2022',
        description: 'Get a combination of demographic data from the U.S. Census Bureau\'s American Community Survey 1 Year dataset, including things like age, race, sex, household income, ancestry, education and so on.',
        parameters: {
            type: 'OBJECT',
            properties: {
                censusGroup: {
                    type: 'STRING',
                    description: `This has to be one group ID from the following list of group ID values and the description of data each represents: ${censusGroups.map(d => `${d.name} = ${d.description}`).join(', ')}.`
                },
                censusGeography: {
                    type: 'STRING',
                    description: `For statistics and data covering national level data in the United States, the value is always us:1. For statistics and data covering state level data for states within the United States. Value is "state:" followed by a comma separated list of relevant state FIPS codes. The FIPS code for each state are as follows: ${geographyCounties.map(d => `${d.state_name} = ${d.fips}`).join(', ')}.`
                }
            },
            required: ["censusGroup", "censusGeography"]
        }
    }

    return functionCall
}

/**
 * Use this function to get API code from a generative AI model.
 * 
 * @param {string} prompt User generated text to query an API
 * @param {GenerativeModel} model Pre-defined Gemini model instance
 * @returns {string}
 */
export async function queryModel(prompt, model) {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response.functionCalls()) return

    return response.functionCalls()[0]
}