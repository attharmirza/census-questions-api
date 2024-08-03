import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

/**
 * Use this function to get API code from a generative AI model.
 * 
 * @param {string} prompt User generated text to query an API
 * @returns {string}
 */
export default async function queryModel(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response
}