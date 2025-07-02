const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Ensure environment variables are loaded

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `
You are an expert project workflow assistant.

Your job is to carefully review a service request from a client and generate a task summary in the following **exact JSON format**:

{
  "task_id": "TASK-YYYYMMDD-XXX",        // Use today's date and a random 3-digit number
  "task_title": "string",                // Brief and clear task name
  "task_description": "string",          // Detailed description of the task
  "required_skills": ["string"],         // Key skills needed
  "estimated_duration_hrs": number,      // Approximate time in hours
  "priority": "High | Medium | Low",     
  "location_constraint": "On-site | Remote | Hybrid",
  "preferred_availability": ["string"],  // e.g., ["Weekdays", "9AM-5PM"]
  "workflow": ["string"]                 // Step-by-step actions to complete the task
}

Only return the JSON object, without any commentary or explanation.

Be concise but provide enough clarity for a technical team to understand and execute the task.`
});

async function generateContent(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = generateContent;
