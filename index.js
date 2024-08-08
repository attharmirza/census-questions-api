import { GoogleGenerativeAI } from '@google/generative-ai'
import { queryModel, generateFunctionCall } from './scripts/queryModel.js'
import { queryAPI, writeData, generateSearchParams } from './scripts/queryAPI.js'

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
    // query model for AI prompt
    const modelResponse = await queryModel(prompt, model)

    const { censusVariables, censusGeography } = modelResponse.args

    console.log(`The relevant census variables I found were 👑 ${censusVariables} 👑 and the geography variables are 🌎 ${censusGeography} 🌎\n`)

    // query the API with the AI generated variables
    const response = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusVariables, censusGeography))

    console.log('Here\'s your data!\n')
    console.log(response)
    console.log('\n')
    
    // take the response from the model and query the census api, write the 
    // response to the downloads folder
    await writeData(response)
}
