import * as functions from '@google-cloud/functions-framework'
import { initializeModel, queryModel } from './scripts/queryModel.js'
import { queryAPI, generateSearchParams } from './scripts/queryAPI.js'
import { arrayToJSON, assignVariableNames } from './scripts/processData.js'
import validateInputs from './scripts/validateInputs.js'

// Initializing the model outside of the http function to take advantage of
// reused data between Cloud Function instances.
const model = await initializeModel()

/**
 * Entry point and primary function for the API.
 */
functions.http('answer-question', async (req, res) => {
    const { prompt } = await req.query

    res.set('Access-Control-Allow-Origin', '*') // Temporary solution for CORS

    try {
        validateInputs(prompt)
    } catch (err) {
        res.status(400).send('Prompt provided is invalid.')
        throw err
    }

    let modelResponse, apiResponse, apiResponseFormatted

    try {
        modelResponse = await queryModel(prompt, model)
    } catch (err) {
        res.status(502).send('Unable to query Gemini API.')
        throw err
    }

    const { censusGroup, censusGeography } = modelResponse.args

    try {
        apiResponse = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography, process.env.US_CENSUS_API_KEY))
    } catch (err) {
        res.status(502).send('Unable to query Census API.')
        throw err
    }

    try {
        apiResponseFormatted = await assignVariableNames(arrayToJSON(apiResponse))
    } catch (err) {
        res.status(500).send('Error processing data.')
        throw err
    }

    res.status(200).send(apiResponseFormatted)
});
