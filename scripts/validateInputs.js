/**
 * Function to check input prompt and make sure it's valid, important step for
 * development in the backend.
 * 
 * @param {string} prompt Natural language prompt for fetching data
 */
export default function validateInputs(prompt, key) {
    if (!prompt || prompt.length === 0) {
        throw new Error('No prompt found.')
    }

    if (prompt.length > 500) {
        throw new Error('Prompt length is too long.')
    }

    if (prompt.search(/[^A-Z0-9 ,.'?!()]/gi) >= 0) {
        throw new Error('Prompt contains invalid character. Only letters, numbers or basic grammatical marks are allowed.')
    }

    if (!key) {
        throw new Error('No key found.')
    }

    // Also to add a proper api key test, Found a good solution for it here:
    // https://console.cloud.google.com/functions/details/us-east4/answer-question?env=gen2&project=census-questions&tab=logs
}