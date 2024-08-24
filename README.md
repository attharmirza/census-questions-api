# Census Questions (API)

The back-end code for the Census Questions application. This code runs on a Google Cloud endpoint takes a prompt input and then uses Google's Gemini API to generate a query for [U.S. Census Bureau](https://www.census.gov/) data.

## Quick Start

1. Clone this repository and then run `nvm use` from the root folder to switch to the correct node version. 
2. Run `yarn` to install dependencies and `yarn start` to launch a local server. 
3. When finished with development, run `yarn deploy` to update the Google Cloud function.

Additionally, running `yarn test` launches a special CLI for testing various prompts and the accuracty of the model. Results are downloaded to a `./downloads/` directory in the project root.

## Inputs & Output

The API lives on the path `/answer-question` and takes the following query parameter(s):

| Parameter | Type | Example URL String |
| --------- | ---- | ------------------ |
| `prompt` | `String` | `/answer-question?prompt=What%27s+the+population+of+the+United+States%3F` |

The output is a JSON file as defined in `schema.json`.

## Requirements 

- [Node.js](https://nodejs.org/en/download/package-manager) (v20.16.0)
- [Yarn](https://classic.yarnpkg.com/en/) (v1.22.22)

Optionally, [gcloud CLI](https://cloud.google.com/sdk/gcloud) for updating API on Google Cloud Platform.

## Installation

This project requires [Node.js v20.16.0](https://nodejs.org/en/download/package-manager). In additon, [nvm](https://github.com/nvm-sh/nvm) (or [nvm-windows](https://github.com/coreybutler/nvm-windows)) is highly recommended for managing node versions.

First, navigate to the root directory of this repository in your terminal and run `nvm install` (or `nvm use` if you already have the correct version) to switch your shell to the correct version of Node.js.

Then, run `npm install -g yarn` to get the [Yarn](https://classic.yarnpkg.com/en/) package manager.

Next, running `yarn start` launches a local development server (at `http://localhost:8080/` by default) using Google's [Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs).

Now, you should be able to `curl http://localhost:8080` from another terminal shell and get an error message prompting you to `Please provide a valid prompt or key`.

There is **one more important step** before you can start querying the API and getting census data. Create a `.env.yaml` file in the root directory and provide a valid `GEMINI_API_KEY` value and `US_CENSUS_API_KEY` value. You can get a Gemini API key [here](https://ai.google.dev/gemini-api/docs/api-key) and Census data key [here](https://api.census.gov/data/key_signup.html). Here's an example of the contents:

```yaml
---
    GEMINI_API_KEY: "YOUR API KEY HERE"
    US_CENSUS_API_KEY: "YOUR API KEY HERE"

```

Make sure to include a new line at the end of the file, otherwise the tool will throw an error.

---

To update the API on Google Cloud, it's necessary to download and configure the [gcloud CLI](https://cloud.google.com/sdk/gcloud). See documentation [here](https://cloud.google.com/functions/docs/create-deploy-gcloud) on interacting with the [Cloud Functions API](https://cloud.google.com/functions/docs/concepts/overview) using `gcloud`.

## Usage

Start a local server and run the following in another terminal window.

```bash
curl http://localhost:8080/answer-question?prompt=What%27s+the+population+of+the+United+States%3F
```

The response should be something like the following.

```bash
StatusCode        : 200
StatusDescription : OK
Content           : [{"NAME":"United States","GEO_ID":"01000
                    00US","DESCRIPTION":"Total Population","
                    CATEGORIES":[{"ID":"B01003_001E","LABEL"
                    :"Estimate!!Total","VALUE":"333287562"}]
                    }]
RawContent        : HTTP/1.1 200 OK
                    Access-Control-Allow-Origin: *
                    Connection: keep-alive
                    Keep-Alive: timeout=5
                    Content-Length: 162
                    Content-Type: application/json;
                    charset=utf-8
                    Date: Mon, 12 Aug 2024 23:17:08 GMT...   
Forms             : {}
Headers           : {[Access-Control-Allow-Origin, *],       
                    [Connection, keep-alive], [Keep-Alive,   
                    timeout=5], [Content-Length, 162]...}    
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : System.__ComObject
RawContentLength  : 162
```

Alternatively, you can use the `yarn test` command and follow the instructions to fetch data without a local development server. This is useful for testing the accuracy of various prompts. Results are downloaded to a `./downloads/` directory in the project root.

Happy census data hunting! 🌎
