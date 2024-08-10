# Census Questions (API)

The back-end code for the Census Questions application. This code runs on a Google Cloud endpoint takes a prompt input and then uses Google's Gemini API to generate a query for [U.S. Census Bureau](https://www.census.gov/) data.

## Quick Start

1. Clone this repository and then run `nvm use` from the root folder to switch to the correct node version. 
2. Run `yarn` to install dependencies and `yarn start` to launch a local server. 
3. When finished with development, run `yarn deploy` to update the Google Cloud function.

Additionally, running `yarn test` launches a special CLI for testing various prompts and the accuracty of the model. Results are downloaded to a `./downloads/` directory in the project root.

## Installation

Information coming soon.