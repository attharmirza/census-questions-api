import inquirer from 'inquirer'
import { initializeModel, queryModelParameters, queryModelAnalysis } from './scripts/queryModel.js'
import { queryAPI, generateSearchParams } from './scripts/queryAPI.js'
import { arrayToJSON, assignVariableNames, writeData } from './scripts/processData.js'
import validateInputs from './scripts/validateInputs.js'

/**
 * Get user input from the terminal.
 * 
 * @returns {Object} 
 */
async function getPrompt() {
    const answer = await inquirer.prompt([
        { name: 'prompt', message: '(reply STOP to end)' }
    ])

    return answer.prompt
}

/**
 * Test the primary functionality of the API
 * 
 * @param {string} prompt Question to send to Gemini
 * @returns {JSON} 
 */
async function getData(prompt) {
    // start by validating the input prompt
    validateInputs(prompt)

    // initialize model and set start timestamp
    const model = await initializeModel()

    const requestTimestamp = Date.now()

    // query model for AI prompt
    const modelResponse = await queryModelParameters(model, prompt, true)

    console.log(`btw, that prompt cost you ${(+modelResponse.usageMetadata.totalTokenCount).toLocaleString()} tokens 🤑`)

    const args = modelResponse.functionCalls()[0].args

    const { censusGroup, censusGeography } = args

    // query the API with the AI generated variables
    const censusData = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography, process.env.US_CENSUS_API_KEY))

    const censusDataFormatted = await assignVariableNames(arrayToJSON(censusData.json), censusGroup)

    const censusDataURLCleaned = () => {
        const url = censusData.url
        
        url.searchParams.delete('key')

        return url
    }

    // if necessary, analyze the returned data using AI
    const { analysisNeeded } = args

    let censusDataAnalysis

    if (analysisNeeded === 'true') {
        censusDataAnalysis = await queryModelAnalysis(model, censusDataFormatted, true)

        console.log(`oh wait, 😬 and an addiional ${(+censusDataAnalysis.usageMetadata.totalTokenCount).toLocaleString()} tokens for the analysis 😱`)
    }

    return { 
        requestTimestamp: requestTimestamp,
        requestDuration: Date.now() - requestTimestamp,
        requestTokens: (+modelResponse.usageMetadata.totalTokenCount) + (censusDataAnalysis ? +censusDataAnalysis.usageMetadata.totalTokenCount : 0),
        data: censusDataFormatted, 
        dataUrl: censusDataURLCleaned().href,
        dataSource: "The American Community Survey (ACS) is an ongoing survey that provides data every year -- giving communities the current information they need to plan investments and services. The ACS covers a broad range of topics about social, economic, demographic, and housing characteristics of the U.S. population. Much of the ACS data provided on the Census Bureau's Web site are available separately by age group, race, Hispanic origin, and sex. Summary files, Subject tables, Data profiles, and Comparison profiles are available for the nation, all 50 states, the District of Columbia, Puerto Rico, every congressional district, every metropolitan area, and all counties and places with populations of 65,000 or more. Detailed Tables contain the most detailed cross-tabulations published for areas 65k and more. The data are population counts. There are over 31,000 variables in this dataset.", // Hardcoded for now, but should be fetched from here: https://api.census.gov/data/2022/acs/acs1/
        analysis: censusDataAnalysis?.text() 
    }
}

/**
 * Function for testing generative AI responses. Logs responses to the console.
 */
async function testModel() {
    console.clear()

    console.log('Welcome to the model testing interface. What would you like to ask?\n')

    let looping = true

    while (looping) {
        const input = await getPrompt()

        if (input === 'STOP') {
            looping = false
            return
        } else {
            try {
                console.log(`\n🤔 Let me think...\n`)

                const response = await getData(input)

                console.log('\nHere\'s your data! 😄\n')
                console.log(response)
                console.log('\n')

                await writeData(response)

                console.log('\n')
            } catch (error) {
                console.error(error)
            }
        }
    }
}

testModel()