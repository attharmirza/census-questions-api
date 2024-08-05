import queryModel from './scripts/queryModel.js'
import queryAPI from './scripts/queryAPI'

async function main() {
    // query model for AI prompt
    queryModel()

    // take the response from the model and query the census api
    queryAPI()

    // return the data
}
