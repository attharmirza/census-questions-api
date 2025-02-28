/**
 * Function to check input prompt and make sure it's valid, important step for
 * development in the backend.
 * 
 * @param {string} prompt Natural language prompt for fetching data
 */
export default function validateInputs(prompt) {
    if (!prompt || prompt.length === 0) {
        throw new Error('No prompt found.')
    }

    if (prompt.length > 500) {
        throw new Error('Prompt length is too long.')
    }

    if (prompt.search(/[^A-Z0-9 ,.'?!()]/gi) >= 0) {
        throw new Error('Prompt contains invalid character. Only letters, numbers or basic grammatical marks are allowed.')
    }
}