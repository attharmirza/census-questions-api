import { GoogleGenerativeAI } from '@google/generative-ai'
import { queryModel, generateFunctionCall } from './scripts/queryModel.js'
import { queryAPI, generateSearchParams } from './scripts/queryAPI.js'
import { arrayToJSON, assignVariableNames, writeData } from './scripts/processData.js'
import validateInputs from './scripts/validateInputs.js'

const functionCall = await generateFunctionCall()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: {
        functionDeclarations: [functionCall]
    }
});

/**
 * Primary function of the application, take a prompt, generate a function call
 * with Gemini, and then use the model's response to query the Census API.
 */
export default async function main(prompt) {
    // start by validating the input prompt
    validateInputs(prompt)

    // query model for AI prompt
    const modelResponse = await queryModel(prompt, model)

    if (!modelResponse) {
        console.log('Unable to resolve data request, please try again.')
        return
    }

    const { censusGroup, censusGeography } = modelResponse.args

    console.log(`The most relevant group is 👑 ${censusGroup} 👑 and your geography variables are 🌎 ${censusGeography} 🌎\n`)

    // query the API with the AI generated variables
    const response = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography))

    const responseFormatted = await assignVariableNames(arrayToJSON(response))

    console.log('Here\'s your data!\n')
    console.log(responseFormatted)
    console.log('\n')
    
    // take the response from the model and query the census api, write the 
    // response to the downloads folder
    await writeData(responseFormatted)
}
