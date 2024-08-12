import * as functions from '@google-cloud/functions-framework'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { queryModel, generateFunctionCall } from './scripts/queryModel.js'
import { queryAPI, generateSearchParams } from './scripts/queryAPI.js'
import { arrayToJSON, assignVariableNames } from './scripts/processData.js'
import validateInputs from './scripts/validateInputs.js'

/**
 * Entry point and primary function for the API.
 */
functions.http('answer-question', async (req, res) => {
    const key = process.env.GEMINI_API_KEY // Using my personal Gemini API key for now, temporary solution

    const { prompt } = await req.query

    res.set('Access-Control-Allow-Origin', '*') // Temporary solution for CORS

    try {
        validateInputs(prompt, key)
    } catch (err) {
        res.status(400).send('Please provide a valid prompt and key.')
        throw err
    }

    let functionCall, modelResponse, apiResponse, apiResponseFormatted

    try {
        functionCall = await generateFunctionCall()
    } catch (err) {
        res.status(502).send('The Census API responded with an error.')
        throw(err)
    }

    const genAI = new GoogleGenerativeAI(key);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: {
            functionDeclarations: [functionCall]
        }
    });

    try {
        modelResponse = await queryModel(prompt, model)
    } catch (err) {
        res.status(502).send('Gemini API responded with an error.')
        throw err
    }

    const { censusGroup, censusGeography } = modelResponse.args

    try {
        apiResponse = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography, process.env.US_CENSUS_API_KEY))
    } catch (err) {
        res.status(502).send('The Census API responded with an error.')
        throw err
    }

    try {
        apiResponseFormatted = await assignVariableNames(arrayToJSON(apiResponse))
    } catch (err) {
        res.status(500).send('Unable to process data.')
        throw err
    }


    res.status(200).send(apiResponseFormatted);
});
