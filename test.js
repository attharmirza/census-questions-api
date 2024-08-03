import inquirer from 'inquirer'
import queryModel from './scripts/queryModel.js'

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

    while(looping) {
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

test()
