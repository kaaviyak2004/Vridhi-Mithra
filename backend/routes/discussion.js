const express = require('express');
const { authenticate } = require('../middleware/auth');
const { DiscussionPost, DiscussionReply, User } = require('../models');

const router = express.Router();
router.use(authenticate);

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const { course_id, category } = req.query;
    const collegeId = req.user.college_id;
    let where = { college_id: collegeId };
    if (course_id) where.course_id = course_id;
    if (category) where.category = category;
    const posts = await DiscussionPost.findAll({
      where, include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'role', 'avatar_url'] },
        { model: DiscussionReply, as: 'replies' }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ posts: posts.map(p => ({ ...p.toJSON(), replyCount: p.replies?.length || 0 })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// Create post
router.post('/posts', async (req, res) => {
  try {
    const { title, content, course_id, category, link_url } = req.body;
    const post = await DiscussionPost.create({ 
      user_id: req.user.id, title, content, course_id, category, link_url,
      college_id: req.user.college_id
    });
    res.status(201).json({ message: 'Post created.', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// Get post with replies
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await DiscussionPost.findOne({
      where: { id: req.params.id, college_id: req.user.college_id },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'role', 'avatar_url'] },
        { model: DiscussionReply, as: 'replies', include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role', 'avatar_url'] }] }
      ]
    });
    if (!post) return res.status(404).json({ error: 'Post not found in your college.' });
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// Reply to post
router.post('/posts/:id/replies', async (req, res) => {
  try {
    const { content } = req.body;
    // Verify post belongs to college
    const post = await DiscussionPost.findOne({ where: { id: req.params.id, college_id: req.user.college_id } });
    if (!post) return res.status(404).json({ error: 'Post not found in your college.' });

    const reply = await DiscussionReply.create({ post_id: req.params.id, user_id: req.user.id, content });
    res.status(201).json({ message: 'Reply added.', reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply.' });
  }
});

// Upvote post
router.post('/posts/:id/upvote', async (req, res) => {
  try {
    const post = await DiscussionPost.findOne({ where: { id: req.params.id, college_id: req.user.college_id } });
    if (!post) return res.status(404).json({ error: 'Post not found in your college.' });
    await post.update({ upvotes: post.upvotes + 1 });
    res.json({ upvotes: post.upvotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote.' });
  }
});

module.exports = router;
