const aiService = require('../services/ai.service');

module.exports.getReview = async (req, res) => {
    const text = req.body.text; // Changed from code to text

    if (!text) {
        return res.status(400).send("Text is required"); // Updated error message
    }

    try {
        const response = await aiService(text);
        res.send(response);
    } catch (error) {
        console.error('Error in AI service:', error.message);
        res.status(500).send("Internal Server Error");
    }
};