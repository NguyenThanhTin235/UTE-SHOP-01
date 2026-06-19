const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const Order = require('../models/Order');

const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.KEY1,
    process.env.KEY2,
    process.env.KEY3
].filter(Boolean);

let currentKeyIndex = 0;

const tools = [
    {
        functionDeclarations: [
            {
                name: "search_coupons",
                description: "Get a list of available coupons/promotions. Use this when the user asks for discounts, vouchers, or coupons.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },
            {
                name: "search_products",
                description: "Search for products based on user natural language query, category, or context. Use this when the user asks for recommendations, outfits, or specific items.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: {
                            type: "STRING",
                            description: "The search query, e.g. 'váy dự tiệc', 'áo sơ mi công sở'"
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_product_details",
                description: "Get detailed information about one or more specific products for comparison. Use this when the user wants to compare products or asks for details about a specific product.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        product_ids: {
                            type: "ARRAY",
                            items: { type: "STRING" },
                            description: "Array of product Object IDs"
                        }
                    },
                    required: ["product_ids"]
                }
            },
            {
                name: "track_order",
                description: "Track an order status using the order code (e.g. '#12345' or just '12345'). Use this when the user asks 'Where is my order?'",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        order_code: {
                            type: "STRING",
                            description: "The order code, e.g. '12345'"
                        }
                    },
                    required: ["order_code"]
                }
            }
        ]
    }
];

// Tool Execution Handlers
const handleToolCall = async (functionCall) => {
    const args = functionCall.args || {};
    
    switch (functionCall.name) {
        case 'search_coupons': {
            const Coupon = require('../models/Coupon');
            const coupons = await Coupon.find({ status: 'active', $or: [{ end_at: { $gt: new Date() } }, { end_at: null }] })
                .select('code type value max_discount min_order_total start_at end_at')
                .limit(5)
                .lean();
            return coupons.length > 0 ? { coupons } : { message: "No active coupons found at the moment." };
        }

        case 'search_products': {
            const query = args.query || '';
            const ProductMedia = require('../models/ProductMedia');
            
            const products = await Product.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ],
                is_active: true,
                approval_status: 'approved'
            }).select('name selling_price mrp_price _id slug').limit(5).lean();

            for (const product of products) {
                const media = await ProductMedia.findOne({ product_id: product._id, media_type: 'image' }).sort({ sort_order: 1 });
                product.images = media ? [media.media_url] : [];
            }
            
            return products.length > 0 ? { products } : { message: "No products found matching the query." };
        }
        
        case 'get_product_details': {
            const product_ids = args.product_ids || [];
            const ProductMedia = require('../models/ProductMedia');

            const products = await Product.find({
                _id: { $in: product_ids }
            }).select('name description selling_price mrp_price attributes _id slug').lean();
            
            for (const product of products) {
                const media = await ProductMedia.findOne({ product_id: product._id, media_type: 'image' }).sort({ sort_order: 1 });
                product.images = media ? [media.media_url] : [];
            }

            return { products };
        }

        case 'track_order': {
            const rawCode = args.order_code || '';
            const orderCode = String(rawCode).replace('#', '');
            if (!orderCode) {
                return { error: "No order code provided." };
            }
            const order = await Order.findOne({ order_code: orderCode }).select('order_code status total_final payment_status createdAt');
            if (!order) {
                return { error: `Order with code ${orderCode} not found.` };
            }
            return {
                order_code: order.order_code,
                status: order.status,
                total_amount: order.total_final,
                payment_status: order.payment_status,
                order_date: order.createdAt
            };
        }
        
        default:
            return { error: "Unknown tool call" };
    }
};

const systemInstruction = `
You are a helpful, friendly, and professional AI Shopping Assistant for UTE-SHOP.
Your role is to assist customers with:
1. Product Consultation (recommend products based on their needs).
2. AI Product Search (find products that match their style/season).
3. Product Comparison (highlight differences in price, material, etc.).
4. FAQ & Store Policies (answer questions about shipping, returns, etc.).
5. Order Tracking (help them find their order status).
6. Related Product Suggestions (suggest matching items to complete an outfit).

Store Policies (FAQ):
- Returns: Allowed within 7 days of delivery for unworn items with tags.
- Shipping: Standard shipping takes 3-5 business days. Express takes 1-2 days. Free shipping for orders over 1,000,000 VND.
- Payments: COD (Cash on Delivery), VNPay, and Credit Cards are accepted.
- Warranty: Electronics have a 12-month warranty. Fashion items do not have a warranty unless defective upon arrival.
- Sizing: Refer to the size chart on each product page. If between sizes, size up.

Guidelines:
- ALWAYS use the provided tools to search for real products or track real orders when the user asks. DO NOT make up product names or order statuses.
- If you recommend a product, mention its name and price. You don't need to provide links or images, as the UI will render beautiful cards below your message.
- Be conversational, friendly, and helpful. ALWAYS respond in Vietnamese.
- When presenting search results or answering questions, use line breaks (\n) to separate sentences or paragraphs to make the text easy to read. Avoid long blocks of text.
- If comparing, create a small bulleted list or table.
`;

const doProcessChatMessage = async (messages) => {
    const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
        tools: tools,
    });

    // Extract the latest user message
    const latestUserMessage = messages[messages.length - 1].content;

    // Convert previous messages to Gemini format
    // Gemini STRICTLY requires alternating user/model roles, ending with 'model'.
    let cleanHistory = [];
    let expectedRole = 'user';
    
    // We iterate from oldest to newest (history is already oldest first)
    const rawHistory = messages.slice(0, -1).filter(msg => msg.role !== 'system');
    
    for (const msg of rawHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        if (role === expectedRole) {
            cleanHistory.push({
                role: role,
                parts: [{ text: msg.content }]
            });
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
    }

    // Gemini requires the last message in history to be from 'model' (so the next message we send is from 'user').
    // If the cleanHistory ends with 'user' (meaning a bot message was skipped/crashed), we drop that last 'user' message.
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user') {
        cleanHistory.pop();
    }

    const chat = model.startChat({ history: cleanHistory });

    let result = await chat.sendMessage([{ text: latestUserMessage }]);
    let functionCalls = result.response.functionCalls();
    
    let attachments = [];

    while (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];
        for (const call of functionCalls) {
            const toolResponseContent = await handleToolCall(call);
            
            // Extract data for attachments
            if ((call.name === 'search_products' || call.name === 'get_product_details') && toolResponseContent.products) {
                attachments.push({ type: 'products', data: toolResponseContent.products });
            } else if (call.name === 'track_order' && !toolResponseContent.error) {
                attachments.push({ type: 'order', data: toolResponseContent });
            } else if (call.name === 'search_coupons' && toolResponseContent.coupons) {
                attachments.push({ type: 'coupons', data: toolResponseContent.coupons });
            }

            functionResponses.push({
                functionResponse: {
                    name: call.name,
                    response: toolResponseContent
                }
            });
        }
        
        // Send the function responses back to the model
        result = await chat.sendMessage(functionResponses);
        functionCalls = result.response.functionCalls();
    }

    return { content: result.response.text(), attachments };
};

const processChatMessage = async (messages) => {
    let attempts = 0;
    while (attempts < apiKeys.length) {
        try {
            return await doProcessChatMessage(messages);
        } catch (error) {
            const isQuotaError = error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota'));
            if (isQuotaError) {
                console.log(`[AI Service] API Key ${currentKeyIndex + 1} exhausted. Switching to next key...`);
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                attempts++;
                if (attempts >= apiKeys.length) {
                    throw new Error("All API keys exhausted: " + error.message);
                }
            } else {
                throw error;
            }
        }
    }
};

module.exports = {
    processChatMessage
};
