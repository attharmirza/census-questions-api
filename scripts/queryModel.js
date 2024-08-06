import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import queryAPI from './queryAPI.js'

/**
 * Generate function calls from parameter files
 */
async function generateFunctionCall() {
    const acsBaseUrl = 'https://api.census.gov/data/2022/acs/acs1/'

    let groups, variables, geographies

    try {
        groups = await queryAPI(acsBaseUrl, 'groups.json')
        variables = await queryAPI(acsBaseUrl, 'variables.json')
        geographies = await queryAPI(acsBaseUrl, 'geography.json')
    } catch (err) {
        throw err
    }

    const groupsCall = {
        name: 'get_data_from_us_census_american_community_survey_1_year_2022',
        description: 'Get a combination of demographic data from the U.S. Census Bureau\'s American Community Survey 1 Year dataset, including things like age, race, sex, household income, ancestry, education and so on.',
        parameters: {
            type: 'OBJECT',
            properties: {
                groups: {
                    type: 'ARRAY',
                    values: groups.map(d => d.name),
                    description: `Can be any combination of the following group IDs. Here is each ID value followed by an equals sign that points to the description of data it represents: ${groups.map(d => `${d.name} = ${d.description}`)}`
                }
            },
            required: ["groups"]
        }
    }

    console.log(groupsCall)

    return groupsCall
}

generateFunctionCall()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Use this function to get API code from a generative AI model.
 * 
 * @param {string} prompt User generated text to query an API
 * @returns {string}
 */
export default async function queryModel(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response
}