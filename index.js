import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

/**
 * Use this function to fetch and ask questions about data pulled from various 
 * census and statistics APIs around the world.
 * 
 * @param {string} prompt User generated text to query an API
 * @returns {string}
 */
export default async function main(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text()
}