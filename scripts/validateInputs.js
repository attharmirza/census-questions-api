/**
 * Function to check input prompt and make sure it's valid, important step for
 * development in the backend.
 * 
 * @param {string} prompt Natural language prompt for fetching data
 */
export default function validateInputs(prompt) {
    if (prompt.length > 500) {
        throw new Error('Prompt length is too long.')
    }

    if (prompt.includes(/[^A-Z0-9 ,.'?!()]/gi)) {
        throw new Error('Prompt contains invalid character. Only letters, numbers or basic grammatical marks are allowed.')
    }
}