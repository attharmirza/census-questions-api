import { promises as fs } from 'fs'
import { csvParse, groups, ascending } from 'd3'
import { ChatSession, GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Pull possible variables from the Census API and then generate a function call
 * for Gemini using those variables.
 * 
 * @returns {object} Function call following the Gemini/Open API [spec](https://ai.google.dev/gemini-api/docs/function-calling)
 */
async function generateFunctionDeclaration() {
    let censusGroups, geographyCounties

    // Setting up the censusGroup parameter in the function call

    try {
        censusGroups = await fs.readFile('assets/census_2022_groups.json', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    // I can filter some of the groups down to make the query more efficient,
    // and to make it use less tokens, based on a better understanding of Table
    // IDs. See more here: https://www.census.gov/programs-surveys/acs/data/data-tables/table-ids-explained.html

    censusGroups = JSON.parse(censusGroups).groups
        .filter(f => !f.name === false && !f.description === false)
        .filter(f => f.name.slice(0, 1) === 'B')
        .sort((a, b) => ascending(a.name, b.name))

    const censusGroupsDescription = `This has to be one group ID from the following list of group ID values and the description of data each represents: ${censusGroups.map(d => `${d.name} = ${d.description}`).join(', ')}.`

    // Setting up the censusGeography function parameter in the function call.

    try {
        geographyCounties = await fs.readFile('assets/fips_codes.csv', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    geographyCounties = groups(csvParse(geographyCounties), d => d.state_name).map(d => ({
        state_name: d[0],
        state_abbr: d[1][0].state_abbr,
        fips: (d[1][0].state.length === 1) ? `0${d[1][0].state}` : d[1][0].state, // Need to add back leading zeroes for FIPS codes. Should probably edit source dataset.
        counties: d[1].map(e => ({
            county_name: e.county_name,
            fips: e.fips
        }))
    }))

    const geographyCountiesDescription = `For statistics and data covering national level data in the United States, the value is always us:1. For statistics and data covering state level data for states within the United States, the value is "state:" followed by a comma separated list of relevant state FIPS codes. The FIPS code for each state are as follows: ${geographyCounties.map(d => `${d.state_name} abbreviated as ${d.state_abbr} = ${d.fips}`).join(', ')}.`

    // Finally, assembling and returning the function call

    return {
        name: 'get_data_from_us_census_american_community_survey_1_year_2022',
        description: 'Get a combination of demographic data from the U.S. Census Bureau\'s American Community Survey 1 Year dataset, including things like age, race, sex, household income, ancestry, education and so on.',
        parameters: {
            type: 'OBJECT',
            properties: {
                censusGroup: {
                    type: 'STRING',
                    description: censusGroupsDescription
                },
                censusGeography: {
                    type: 'STRING',
                    description: geographyCountiesDescription
                },
                analysisNeeded: {
                    type: 'BOOLEAN',
                    description: 'Does the prompt require calculation of an average, maximum, minimum, ratio, percentage or change? Or does it require selecting the highest, lowest or most relevant value from a group or list? If yes, return "true". If no, return "false".'
                }
            },
            required: ["censusGroup", "censusGeography", "analysisNeeded"]
        }
    }
}

const functionDeclaration = await generateFunctionDeclaration()

/**
 * Initialize a Gemini AI model with function calls.
 * 
 * @returns {ChatSession} 
 */
export async function initializeModel() {
    const key = process.env.GEMINI_API_KEY // Using my personal Gemini API key for now, temporary solution

    const genAI = new GoogleGenerativeAI(key);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: {
            functionDeclarations: [functionDeclaration]
        }
    });

    return model.startChat()
}

/**
 * Get API query parameters from the AI model.
 * 
 * @param {ChatSession} chat Gemini model chat session
 * @param {string} prompt User generated text to query an API
 * @param {boolean} [isFullResponse = false] Get full responses instead of just function call
 * @returns {import('@google/generative-ai').EnhancedGenerateContentResponse | Object}
 */
export async function queryModelParameters(chat, prompt, isFullResponse) {
    const result = await chat.sendMessage(prompt)

    const response = result.response

    if (response.functionCalls() === undefined) throw new Error('Unable to execute function call from prompt.') // cannot catch this error!!!

    if (isFullResponse) return response

    return response.functionCalls()[0].args
}

/**
 * Get paragraph of analysis from the AI model, used after queryModelParameters() function.
 * 
 * @param {ChatSession} chat Gemini model chat session
 * @param {Array} data Data pulled from API
 * @param {boolean} [isFullResponse = false] Get full responses instead of just text
 * @returns {import('@google/generative-ai').EnhancedGenerateContentResponse | string}
 */
export async function queryModelAnalysis(chat, data, isFullResponse) {
    const result = await chat.sendMessage([{
        functionResponse: {
            name: functionDeclaration.name,
            response: { content: data }
        }
    }])

    const response = result.response

    if (!response.text())
        throw new Error('Unable to generate text from data.')

    if (isFullResponse) return response

    return response.text()
}