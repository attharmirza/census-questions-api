import 'dotenv/config'

const testURL = `https://api.census.gov/data/2022/acs/acs1/spp?get=NAME&for=state:*&key=${process.env.US_CENSUS_API_KEY}`

export default async function queryAPI(url) {
    try {
        const response = await fetch(url)

        const json = await response.json()

        console.log(json)
    } catch (error) {
        console.error(error)
    }
}

queryAPI(testURL)