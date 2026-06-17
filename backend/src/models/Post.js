const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
     title: { type: String, required: true },
     slug: { type: String, required: true, unique: true },
     content: { type: String },
     cover_image: { type: String },
     category: { type: String, default: 'General' },
     tags: [{ type: String }],
     author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
     status: { type: String, enum: ['draft', 'published'], default: 'draft' },
     views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
