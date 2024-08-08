import { promises as fs } from 'fs'
import { queryAPI } from './queryAPI.js'
import { csvParse, groups } from 'd3'

/**
 * Pull possible variables from the Census API and then generate a function call
 * for Gemini using those variables.
 * 
 * @returns {object} Function call following the Gemini [specification](https://ai.google.dev/gemini-api/docs/function-calling), based on Open API
 */
export async function generateFunctionCall() {
    const hostname = 'api.census.gov'
    const pathnameCommon = 'data/2022/acs/acs1/'

    let variables, geographyCounties

    try {
        variables = await queryAPI(hostname, `${pathnameCommon}variables.json`)
        geographyCounties = await fs.readFile('data/county_fips_master.csv', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    variables = [...Object.entries(variables.variables)]
        .map(d => {
            d[1].name = d[0]
            return d[1]
        })
        .filter(f => !f.concept === false && !f.label === false)

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
                censusVariables: {
                    type: 'STRING',
                    description: `Can be any combination of up to 50 of the following variable IDs, seperated by commas. Here is each variable ID value followed by the description of data it represents: ${variables.map(d => `${d.name} = ${d.concept.replace(/()/g, '')}`).join(', ')}.`
                },
                censusGeography: {
                    type: 'STRING',
                    description: `For statistics and data covering national level data in the United States, the value is always us:1. For statistics and data covering state level data for states within the United States. Value is "state:" followed by a comma separated list of relevant state FIPS codes. The FIPS code for each state are as follows: ${geographyCounties.map(d => `${d.state_name} = ${d.fips}`).join(', ')}.`
                }
            },
            required: ["censusVariables", "censusGeography"]
        }
    }

    // console.log(functionCall.parameters.properties.censusGeography.description)

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

    return response.functionCalls()[0]
}