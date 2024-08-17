import inquirer from 'inquirer'
import { initializeModel, queryModel } from './scripts/queryModel.js'
import { queryAPI, generateSearchParams } from './scripts/queryAPI.js'
import { arrayToJSON, assignVariableNames, writeData } from './scripts/processData.js'
import validateInputs from './scripts/validateInputs.js'

const model = await initializeModel()

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
    const modelResponse = await queryModel(prompt, model, true)

    console.log(`btw, that prompt cost you ${(+modelResponse.usageMetadata.totalTokenCount).toLocaleString()} tokens 🤑`)

    if (!modelResponse.functionCalls()[0]) {
        throw new Error('Unable to determine function calls from prompt.')
    }

    const { censusGroup, censusGeography } = modelResponse.functionCalls()[0].args

    // query the API with the AI generated variables
    const response = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography, process.env.US_CENSUS_API_KEY))

    const responseFormatted = await assignVariableNames(arrayToJSON(response))

    return responseFormatted
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
                console.log(`\nhmm, let me think 🤔\n`)
    
                const response = await getData(input)

                console.log('\nhere\'s your data! 😄\n')
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