import * as functions from '@google-cloud/functions-framework'
import { initializeModel, queryModelParameters, queryModelAnalysis } from './scripts/queryModel.js'
import { queryAPI, generateSearchParams, removeKeyParameter } from './scripts/queryAPI.js'
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

    const chat = model.startChat()

    const responseObject = {
        requestTimestamp: Date.now(),
        requestDuration: 0,
        requestTokens: 0,
        data: undefined, 
        dataUrl: undefined,
        dataSource: "The American Community Survey (ACS) is an ongoing survey that provides data every year -- giving communities the current information they need to plan investments and services. The ACS covers a broad range of topics about social, economic, demographic, and housing characteristics of the U.S. population. Much of the ACS data provided on the Census Bureau's Web site are available separately by age group, race, Hispanic origin, and sex. Summary files, Subject tables, Data profiles, and Comparison profiles are available for the nation, all 50 states, the District of Columbia, Puerto Rico, every congressional district, every metropolitan area, and all counties and places with populations of 65,000 or more. Detailed Tables contain the most detailed cross-tabulations published for areas 65k and more. The data are population counts. There are over 31,000 variables in this dataset.", // Hardcoded for now, but should be fetched from here: https://api.census.gov/data/2022/acs/acs1/
        analysis: undefined
    }

    let modelParametersArgs

    try {
        const modelParameters = await queryModelParameters(chat, prompt)

        responseObject.requestTokens = responseObject.requestTokens + (+modelParameters.usageMetadata.totalTokenCount)

        modelParametersArgs = modelParameters.functionCalls()[0].args
    } catch (err) {
        res.status(502).send('Unable to query Gemini API.')
        throw err
    }

    const { censusGroup, censusGeography, analysisNeeded } = modelParametersArgs

    let apiResponse, apiResponseFormatted

    try {
        apiResponse = await queryAPI('api.census.gov', 'data/2022/acs/acs1', generateSearchParams(censusGroup, censusGeography, process.env.US_CENSUS_API_KEY))

        responseObject.dataUrl = removeKeyParameter(apiResponse.url).href
    } catch (err) {
        res.status(502).send('Unable to query Census API.')
        throw err
    }

    try {
        apiResponseFormatted = await assignVariableNames(arrayToJSON(apiResponse.json), censusGroup)

        responseObject.data = apiResponseFormatted
    } catch (err) {
        res.status(500).send('Error processing data.')
        throw err
    }

    if (analysisNeeded === 'true') {
        try {
            const modelAnalysis = await queryModelAnalysis(chat, apiResponseFormatted)

            responseObject.requestTokens = responseObject.requestTokens + (+modelAnalysis.usageMetadata.totalTokenCount)

            responseObject.analysis = modelAnalysis.text()
        } catch (err) {
            res.status(502).send('Unable to query Gemini API.')
            throw err
        }
    }

    responseObject.requestDuration = Date.now() - responseObject.requestTimestamp

    res.status(200).send(responseObject)
});
