import 'dotenv/config'
import { promises as fs } from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { queryAPI } from './queryAPI.js'
import { csvParse } from 'd3'

/**
 * Pull possible variables from the Census API and then generate a function call
 * for Gemini using those variables.
 * 
 * @returns {object} Function call following the Gemini [specification](https://ai.google.dev/gemini-api/docs/function-calling), based on Open API
 */
async function generateFunctionCall() {
    const hostname = 'https://api.census.gov/'
    const pathnameCommon = 'data/2022/acs/acs1/'

    let variables, geographyStates, geographyCounties

    try {
        variables = await queryAPI(hostname, `${pathnameCommon}variables.json`)
        geographyStates = await fs.readFile('data/state_fips_master.csv', { encoding: 'utf-8' })
        geographyCounties = await fs.readFile('data/county_fips_master.csv', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    variables = [...Object.entries(variables.variables)].map(d => {
        d[1].name = d[0]
        return d[1]
    })

    geographyStates = csvParse(geographyStates)

    geographyCounties = csvParse(geographyCounties)

    const functionCall = {
        name: 'get_data_from_us_census_american_community_survey_1_year_2022',
        description: 'Get a combination of demographic data from the U.S. Census Bureau\'s American Community Survey 1 Year dataset, including things like age, race, sex, household income, ancestry, education and so on.',
        parameters: {
            type: 'OBJECT',
            properties: {
                censusVariables: {
                    type: 'STRING',
                    description: `Can be any combination of up to 50 of the following variable IDs, seperated by commas. Here is each variable ID value followed by the description of data it represents: ${variables.map(d => `${d.name} = ${d.concept}`).join(', ')}`
                },
                censusGeographyCountry: {
                    type: 'STRING',
                    description: 'Used for statistics and data covering the entire United States, national level data. Value is always us:1.'
                },
                censusGeographyStates: {
                    type: 'STRING',
                    description: `Used for statistics and data covering states within the United States, state level data. Value is "state:" followed by a comma separated list of relevant state FIPS codes. The FIPS code for each state are as follows: ${geographyStates.map(d => `${d.state_name} = ${d.fips}`).join(', ')}`
                },
                censusGeographyCounties: {
                    type: 'STRING',
                    description: `Used for statistics and data covering counties within the United States, county level data. Value is "county:" followed by a comma separated list of relevant county FIPS codes. The FIPS code for each county are as follows: ${geographyCounties.map(d => `${d.county_name} in the state of ${d.state_name} = ${d.fips}`).join(', ')}`
                }
            },
            required: ["censusVariables"]
        }
    }

    return functionCall
}

const functionCall = await generateFunctionCall()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: {
        functionDeclarations: [functionCall]
    }
});

/**
 * Use this function to get API code from a generative AI model.
 * 
 * @param {string} prompt User generated text to query an API
 * @returns {string}
 */
export async function queryModel(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.functionCalls()[0]
}

const testQuery = await queryModel('Can you break down the population of the United States by household income?')

console.log(testQuery)