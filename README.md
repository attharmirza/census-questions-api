# Data Robot AIde

Query and analyze data from census and statistics offices around the world. Currently supported countries are:

- India 🇮🇳, via the [Office of the Registrar General & Census Commissioner](https://censusindia.gov.in/census.website/data/census-tables)

- Italy 🇮🇹, via the [Istituto Nazionale di Statistica](https://www.istat.it/en/data/databases/)

- United States 🇺🇸, via the [U.S. Census Bureau](https://www.census.gov/)

## Quick Start

Information coming soon.

## Installation

Information coming soon.

## Update API on Google Cloud

`gcloud functions deploy answer-question --gen2 --region=us-east4 --runtime=nodejs20 --entry-point=answer-question --env-vars-file .env.yaml --trigger-http`