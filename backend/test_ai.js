const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModel(modelName) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent("Test");
        console.log(`${modelName} WORKS:`, res.response.text());
    } catch (err) {
        console.error(`${modelName} ERROR:`, err.message);
    }
}

async function runTest() {
    await testModel("gemini-2.5-pro");
}
runTest();
