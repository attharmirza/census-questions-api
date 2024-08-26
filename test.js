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

    // query model for AI prompt
const model = await initializeModel()

    const modelResponse = await queryModelParameters(model, prompt, true)

    console.log(`btw, that prompt cost you ${(+modelResponse.usageMetadata.totalTokenCount).toLocaleString()} tokens 🤑`)

    const args = modelResponse.functionCalls()[0].args

    const { censusGroup, censusGeography } = args

    // query the API with the AI generated variables
    const censusData = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography, process.env.US_CENSUS_API_KEY))

    const censusDataFormatted = await assignVariableNames(arrayToJSON(censusData))

    const { analysisNeeded } = args

    let censusDataAnalysis

    if (analysisNeeded === 'true') {
        censusDataAnalysis = await queryModelAnalysis(model, censusDataFormatted, true)

        console.log(`oh wait, 😬 and an addiional ${(+censusDataAnalysis.usageMetadata.totalTokenCount).toLocaleString()} tokens for the analysis 😱`)
    }

    return { censusDataFormatted, censusDataAnalysis: censusDataAnalysis?.text() }
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