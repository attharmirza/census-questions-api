import inquirer from 'inquirer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { queryModel, generateFunctionCall } from './scripts/queryModel.js'
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

const functionCall = await generateFunctionCall()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    tools: {
        functionDeclarations: [functionCall]
    }
});

/**
 * Test the primary functionality of the API
 * 
 * @param {string} prompt Question to send to Gemini
 * @returns {JSON} 
 */
async function getData(prompt) {
    // start by validating the input prompt
    validateInputs(prompt, process.env.GEMINI_API_KEY)

    // query model for AI prompt
    const modelResponse = await queryModel(prompt, model)

    if (!modelResponse) return

    const { censusGroup, censusGeography } = modelResponse.args

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