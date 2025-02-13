const {ConversationModel,MessageModel} = require('../models/ConversationModel');

async function clearChat(req, res) {
    console.log('User : ',req.user)
    const { userId } = req.params;

    try {
        const conversation = await ConversationModel.findOne({
            "$or": [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        await MessageModel.deleteMany({ _id: { "$in": conversation.messages } });
        conversation.messages = [];
        await conversation.save();

        return res.status(200).json({ message: "Chat cleared successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = clearChat