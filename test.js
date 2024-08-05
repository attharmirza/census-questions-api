import 'dotenv/config'
import inquirer from 'inquirer'
import queryModel from './scripts/queryModel.js'
import queryAPI from './scripts/queryAPI.js'

/**
 * Testing functions for calling the Gemini API.
 */

/**
 * Get user input the prompt to send to the generative AI api.
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
 * Function for testing generative AI responses. Logs responses to the console.
 */
async function test() {
    console.clear()

    console.log('Welcome to the model testing interface. What would you like to ask?\n')

    let looping = true

    while (looping) {
        const input = await getPrompt()

        if (input === 'STOP') {
            looping = false
            return
        }

        try {
            const response = await queryModel(input)
            console.log('\n' + response.text())
        } catch (error) {
            console.error(error)
        }
    }
}

// test()

/**
 * Testing the functions for calling the the Census API
 */

const testURL = `https://api.census.gov/data/2022/acs/acs1?get=group(B01001)&for=us:1&key=${process.env.US_CENSUS_API_KEY}`

const testURLResponse = await queryAPI(testURL)

console.log(testURLResponse)