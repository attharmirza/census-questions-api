
/**
 * Simple fetch function for getting data from an API
 * 
 * @param {string} url URL of API with path parameters
 * @returns 
 */
export default async function queryAPI(url) {
    try {
        const response = await fetch(url)

        const json = await response.json()

        return json
    } catch (err) {
        throw err
    }
}
