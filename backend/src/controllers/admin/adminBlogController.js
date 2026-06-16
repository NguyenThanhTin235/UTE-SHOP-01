const Post = require('../../models/Post');

exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const query = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (status !== 'all') {
      query.status = status;
    }

    const posts = await Post.find(query)
      .populate('author_id', 'full_name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const count = await Post.countDocuments(query);
    
    res.json({
      success: true,
      data: posts,
      meta: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('getAllPosts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('getPostById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const NewsletterSubscriber = require('../../models/NewsletterSubscriber');
const sendEmail = require('../../utils/mail');
const { getNewsletterTemplate } = require('../../utils/emailTemplates');

exports.createPost = async (req, res) => {
  try {
    const { title, slug, content, cover_image, category, tags, status } = req.body;
    
    // Check if slug exists
    const existing = await Post.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const post = new Post({
      title,
      slug,
      content,
      cover_image,
      category,
      tags,
      status,
      author_id: req.user.id
    });

    await post.save();

    // If published, notify subscribers
    if (status === 'published') {
      const subscribers = await NewsletterSubscriber.find({ isActive: true });
      if (subscribers.length > 0) {
        // Strip HTML from content for a brief excerpt (approx 150 chars)
        const excerpt = content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
        const blogUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/blog/${slug}`;
        const htmlContent = getNewsletterTemplate(title, excerpt, blogUrl);

        // Fire and forget
        Promise.all(subscribers.map(sub => 
          sendEmail({
            email: sub.email,
            subject: `New Blog Post: ${title}`,
            message: `A new blog post has been published: ${title}`,
            html: htmlContent
          }).catch(err => console.error(`Failed to send newsletter to ${sub.email}:`, err))
        ));
      }
    }

    res.status(201).json({ success: true, data: post, message: 'Post created successfully' });

  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, slug, content, cover_image, category, tags, status } = req.body;
    
    if (slug) {
      const existing = await Post.findOne({ slug, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, slug, content, cover_image, category, tags, status },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post, message: 'Post updated successfully' });
  } catch (error) {
    console.error('updatePost error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('deletePost error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    res.json({ success: true, url: req.file.path });
  } catch (error) {
    console.error('uploadBlogImage error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading image' });
  }
};
