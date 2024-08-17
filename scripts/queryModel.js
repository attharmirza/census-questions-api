import { promises as fs } from 'fs'
import { csvParse, groups, ascending } from 'd3'

/**
 * Pull possible variables from the Census API and then generate a function call
 * for Gemini using those variables.
 * 
 * @returns {object} Function call following the Gemini [specification](https://ai.google.dev/gemini-api/docs/function-calling), based on Open API
 */
export async function generateFunctionCall() {
    let censusGroups, geographyCounties

    /**
     * Setting up the censusGroup parameter in the function call
     */
    
    try {
        censusGroups = await fs.readFile('assets/census_2022_groups.json', { encoding: 'utf-8' })
    } catch (err) {
        throw err
    }

    /**
     * I can filter some of the groups down to make the query more efficient,
     * and to make it use less tokens, based on a better understanding of Table
     * IDs. See more here: 
     * https://www.census.gov/programs-surveys/acs/data/data-tables/table-ids-explained.html
     */
    censusGroups = JSON.parse(censusGroups).groups
        .filter(f => !f.name === false && !f.description === false)
        .filter(f => f.name.slice(0, 1) === 'B')
        .sort((a, b) => ascending(a.name, b.name))

    const censusGroupsDescription = `This has to be one group ID from the following list of group ID values and the description of data each represents: ${censusGroups.map(d => `${d.name} = ${d.description}`).join(', ')}.`

    /**
     * Setting up the censusGeography function parameter in the function call    
     */

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

    /**
     * Finally, assembling and returning the function call
     */

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
                }
            },
            required: ["censusGroup", "censusGeography"]
        }
    }
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