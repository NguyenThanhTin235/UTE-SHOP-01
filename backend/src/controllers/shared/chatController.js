const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const Shop = require('../../models/Shop');

// @desc    Init or get Admin conversation
// @route   POST /api/chat/admin/init
// @access  Private (Customer)
exports.initAdminChat = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    let conversation = await Conversation.findOne({
      customer_id: customerId,
      type: 'admin'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        customer_id: customerId,
        type: 'admin'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Init or get Shop conversation
// @route   POST /api/chat/shop/init
// @access  Private (Customer)
exports.initShopChat = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, message: 'Shop ID is required' });
    }

    let conversation = await Conversation.findOne({
      customer_id: customerId,
      shop_id: shopId,
      type: 'shop'
    }).populate('shop_id', 'name logo_url');

    if (!conversation) {
      conversation = await Conversation.create({
        customer_id: customerId,
        shop_id: shopId,
        type: 'shop'
      });
      await conversation.populate('shop_id', 'name logo_url');
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const messages = await Message.find({ conversation_id: id })
      .populate('sender_id', 'full_name avatar_url')
      .sort({ createdAt: 1 }); // Oldest to newest

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversation_id, content, message_type } = req.body;
    const sender_id = req.user.id;

    if (!conversation_id || !content) {
      return res.status(400).json({ success: false, message: 'Conversation ID and content are required' });
    }

    const message = await Message.create({
      conversation_id,
      sender_id,
      content,
      message_type: message_type || 'text'
    });

    await message.populate('sender_id', 'full_name avatar_url');

    // Update conversation's updatedAt
    await Conversation.findByIdAndUpdate(conversation_id, { updatedAt: Date.now() });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const conversations = await Conversation.find({ customer_id: customerId })
      .populate('shop_id', 'name logo_url')
      .sort({ updatedAt: -1 });

    const convWithLatestMsg = await Promise.all(conversations.map(async (conv) => {
      const latestMessage = await Message.findOne({ conversation_id: conv._id }).sort({ createdAt: -1 });
      return {
        ...conv._doc,
        latestMessage
      };
    }));

    res.status(200).json({
      success: true,
      data: convWithLatestMsg
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admin conversations
// @route   GET /api/chat/admin/all-conversations
// @access  Private (Admin)
exports.getAllAdminConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ type: 'admin' })
      .populate('customer_id', 'full_name avatar_url email')
      .sort({ updatedAt: -1 });

    const convWithLatestMsg = await Promise.all(conversations.map(async (conv) => {
      const latestMessage = await Message.findOne({ conversation_id: conv._id }).sort({ createdAt: -1 });
      return {
        ...conv._doc,
        latestMessage
      };
    }));

    res.status(200).json({
      success: true,
      data: convWithLatestMsg
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all shop conversations
// @route   GET /api/chat/shop/all-conversations
// @access  Private (Seller)
exports.getAllShopConversations = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner_user_id: req.user.id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const conversations = await Conversation.find({ type: 'shop', shop_id: shop._id })
      .populate('customer_id', 'full_name avatar_url email')
      .sort({ updatedAt: -1 });

    const convWithLatestMsg = await Promise.all(conversations.map(async (conv) => {
      const latestMessage = await Message.findOne({ conversation_id: conv._id }).sort({ createdAt: -1 });
      return {
        ...conv._doc,
        latestMessage
      };
    }));

    res.status(200).json({
      success: true,
      data: convWithLatestMsg
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/chat/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let query = { customer_id: userId };
    
    if (req.query.role === 'admin') {
      query = { type: 'admin' };
    } else if (req.query.role === 'seller') {
      const shop = await Shop.findOne({ owner_user_id: userId });
      if (shop) {
        query = { type: 'shop', shop_id: shop._id };
      } else {
        return res.status(200).json({ success: true, data: 0 });
      }
    }

    const convs = await Conversation.find(query);
    const convIds = convs.map(c => c._id);

    const unreadMessages = await Message.find({
      conversation_id: { $in: convIds },
      sender_id: { $ne: userId },
      is_read: false
    });

    const uniqueConvIds = new Set(unreadMessages.map(m => m.conversation_id.toString()));

    res.status(200).json({
      success: true,
      data: uniqueConvIds.size
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/chat/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        conversation_id: id,
        sender_id: { $ne: userId },
        is_read: false
      },
      {
        $set: { is_read: true }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Marked as read'
    });
  } catch (error) {
    next(error);
  }
};
