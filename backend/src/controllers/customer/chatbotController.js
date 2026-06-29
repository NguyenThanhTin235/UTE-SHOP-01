const ChatbotSession = require('../../models/ChatbotSession');
const ChatbotMessage = require('../../models/ChatbotMessage');
const aiService = require('../../services/aiService');
const { v4: uuidv4 } = require('uuid');

exports.sendMessage = async (req, res) => {
    try {
        const { message, sessionToken } = req.body;
        const userId = req.user ? req.user.userId : null; // Assuming verifyToken or optionalAuth sets req.user

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        let session;
        let activeToken = sessionToken;

        // Find or create session
        if (activeToken) {
            session = await ChatbotSession.findOne({ session_token: activeToken });
        }

        if (!session) {
            // Create a new session
            activeToken = uuidv4();
            const sessionData = { session_token: activeToken };
            if (userId) {
                sessionData.user_id = userId;
            }
            session = await ChatbotSession.create(sessionData);
        }

        // Save user message
        await ChatbotMessage.create({
            session_id: session._id,
            sender: 'user',
            content: message
        });

        // Retrieve past messages for context (limit to last 10 pairs to save tokens)
        const pastMessages = await ChatbotMessage.find({ session_id: session._id })
            .sort({ createdAt: -1 })
            .limit(20);
        
        // Format for OpenAI API (oldest first)
        const formattedHistory = pastMessages.reverse().map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content || ''
        }));

        // Get AI response (now returns { content, attachments })
        let aiResponse;
        try {
            aiResponse = await aiService.processChatMessage(formattedHistory);
        } catch (aiError) {
            console.error('AI Service Error:', aiError.message);
            if (aiError.message.includes('429') || aiError.message.includes('quota') || aiError.message.includes('Quota')) {
                aiResponse = { content: "⚠️ The AI system has exhausted its free daily quota (Quota Exceeded). Please configure a new API Key in the .env file or wait until tomorrow!", attachments: [] };
            } else {
                aiResponse = { content: "⚠️ Sorry, the AI server is currently overloaded or experiencing connection issues. Please try again later!", attachments: [] };
            }
        }

        // Save AI response
        const aiMessage = await ChatbotMessage.create({
            session_id: session._id,
            sender: 'bot',
            content: aiResponse.content,
            attachments: aiResponse.attachments
        });

        res.status(200).json({
            success: true,
            sessionToken: activeToken,
            message: {
                sender: 'bot',
                content: aiResponse.content,
                attachments: aiResponse.attachments,
                createdAt: aiMessage.createdAt
            }
        });

    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process chat message' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { sessionToken } = req.query;
        const userId = req.user ? req.user.userId : null;

        let session;
        if (sessionToken) {
            session = await ChatbotSession.findOne({ session_token: sessionToken });
        }

        // If no sessionToken provided, return empty array (new chat)
        if (!session) {
            return res.status(200).json({ success: true, data: [] });
        }

        const messages = await ChatbotMessage.find({ session_id: session._id })
            .sort({ createdAt: 1 }); // oldest first

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};

exports.clearHistory = async (req, res) => {
    try {
        const { sessionToken } = req.query;
        const userId = req.user ? req.user.userId : null;

        let session;
        if (userId) {
            session = await ChatbotSession.findOne({ user_id: userId });
        } else if (sessionToken) {
            session = await ChatbotSession.findOne({ session_token: sessionToken });
        }

        if (session) {
            await ChatbotMessage.deleteMany({ session_id: session._id });
        }

        res.status(200).json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Clear History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear history' });
    }
};
