import inquirer from 'inquirer'
import main from './index.js'

/**
 * Get user input the prompt to send to the generative AI api.
 * 
 * @returns {Object} 
 */
async function getPrompt() {
    process.stdout.write('\x1Bc')

    const answer = await inquirer.prompt([
        { name: 'prompt', message: 'Enter test prompt:' }
    ])

    return answer
}

/**
 * Function for testing generative AI responses. Logs responses to the console.
 */
async function test() {
    const history = []

    const input = await getPrompt()

    const response = await main(input.prompt)

    console.log(response)
}

test()