import 'dotenv/config'
import { promises as fs } from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { queryAPI } from './queryAPI.js'
import { csvParse, groups } from 'd3'

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
        geographyCounties = await fs.readFile('data/county_fips_master.csv', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    variables = [...Object.entries(variables.variables)].map(d => {
        d[1].name = d[0]
        return d[1]
    })

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
                    description: `Can be any combination of up to 50 of the following variable IDs, seperated by commas. Here is each variable ID value followed by the description of data it represents: ${variables.map(d => `${d.name} = ${d.concept}`).join(', ')}`
                },
                censusGeography: {
                    type: 'STRING',
                    description: `For statistics and data covering national level data in the United States, the value is always us:1.\n\nFor statistics and data covering state level data for states within the United States. Value is "state:" followed by a comma separated list of relevant state FIPS codes. The FIPS code for each state are as follows: ${geographyCounties.map(d => `${d.state_name} = ${d.fips}`).join(', ')}.\n\nData can be further broken down into counties within each state in the United States. For county level data, the value is "county:" followed by a comma separated list of relevant county FIPS codes. ${geographyCounties.map(d => `The FIPS codes for counties in the state of ${d.state_name} are as follows: ${d.counties.map(e => `${e.county_name} = ${e.fips}`).join(', ')}`).join('. ')}`
                }
            },
            required: ["censusVariables", "censusGeography"]
        }
    }

    // console.log(functionCall.parameters.properties.censusGeography.description)

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

const testQuery = await queryModel('What\'s the population of each county in Alabama?')

console.log(testQuery)