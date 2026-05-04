import { useState, useEffect } from 'react';
import { FiMessageSquare, FiThumbsUp, FiCheck, FiPlus } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Discussions() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'discussion', link_url: '' });
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/discussions/posts');
      setPosts(data.posts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const createPost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/discussions/posts', newPost);
      toast.success('Post created!');
      setShowCreate(false);
      setNewPost({ title: '', content: '', category: 'discussion', link_url: '' });
      fetchPosts();
    } catch (err) { toast.error('Failed to create post'); }
  };

  const viewPost = async (postId) => {
    try {
      const { data } = await api.get(`/discussions/posts/${postId}`);
      setSelectedPost(data.post);
    } catch (err) { toast.error('Failed to load post'); }
  };

  const addReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await api.post(`/discussions/posts/${selectedPost.id}/replies`, { content: replyContent });
      toast.success('Reply added!');
      setReplyContent('');
      viewPost(selectedPost.id);
    } catch (err) { toast.error('Failed to reply'); }
  };

  const upvote = async (postId) => {
    try {
      await api.post(`/discussions/posts/${postId}/upvote`);
      fetchPosts();
    } catch (err) { console.error(err); }
  };

  const categoryColors = { doubt: 'danger', discussion: 'primary', resource: 'success', announcement: 'warning' };

  if (loading) return <div className="skeleton" style={{height: 400, borderRadius: 16}} />;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div>
          <h1>💬 Discussions</h1>
          <p>Ask doubts, share resources, and learn from peers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <FiPlus /> New Post
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="card" style={{marginBottom:24,border:'1px solid var(--primary)',animation:'fadeIn 0.3s ease'}}>
          <h3 style={{marginBottom:16}}>Create New Post</h3>
          <form onSubmit={createPost}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" placeholder="What's your question?" value={newPost.title}
                onChange={(e) => setNewPost(p => ({...p, title: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={newPost.category}
                onChange={(e) => setNewPost(p => ({...p, category: e.target.value}))}>
                <option value="doubt">❓ Doubt</option>
                <option value="discussion">💬 Discussion</option>
                <option value="resource">📚 Resource</option>
                <option value="announcement">📢 Announcement</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea className="form-input" rows={4} placeholder="Describe in detail..." value={newPost.content}
                onChange={(e) => setNewPost(p => ({...p, content: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Resource Link (Optional)</label>
              <input className="form-input" type="url" placeholder="https://example.com" value={newPost.link_url}
                onChange={(e) => setNewPost(p => ({...p, link_url: e.target.value}))} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary">Post</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Post detail view */}
      {selectedPost ? (
        <div>
          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedPost(null)} style={{marginBottom:16}}>
            ← Back to Posts
          </button>
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:700}}>{selectedPost.title}</h2>
                <span className={`badge badge-${categoryColors[selectedPost.category]}`}>{selectedPost.category}</span>
              </div>
              {selectedPost.is_resolved && <span className="badge badge-success"><FiCheck /> Resolved</span>}
            </div>
            <p style={{fontSize:14,color:'var(--text-secondary)',lineHeight:1.7}}>{selectedPost.content}</p>
            {selectedPost.link_url && (
              <div style={{marginTop: 12}}>
                <a href={selectedPost.link_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                  <FiPlus /> View Attached Link
                </a>
              </div>
            )}
            <div style={{marginTop:12,fontSize:12,color:'var(--text-muted)'}}>
              by <strong>{selectedPost.author?.name}</strong> · {new Date(selectedPost.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Replies */}
          <h3 style={{marginBottom:12}}>Replies ({selectedPost.replies?.length || 0})</h3>
          {selectedPost.replies?.map(reply => (
            <div key={reply.id} className="card" style={{marginBottom:8,padding:16}}>
              <p style={{fontSize:14,color:'var(--text-secondary)'}}>{reply.content}</p>
              <div style={{marginTop:8,fontSize:12,color:'var(--text-muted)'}}>
                <strong>{reply.author?.name}</strong> ({reply.author?.role}) · {new Date(reply.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}

          <div style={{marginTop:16,display:'flex',gap:10}}>
            <textarea className="form-input" rows={2} placeholder="Write a reply..." value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)} style={{flex:1}} />
            <button className="btn btn-primary" onClick={addReply} disabled={!replyContent.trim()}>Reply</button>
          </div>
        </div>
      ) : (
        /* Posts list */
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {posts.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="empty-icon">💬</div><h3>No discussions yet</h3><p>Start a conversation!</p></div></div>
          ) : posts.map(post => (
            <div key={post.id} className="card" style={{cursor:'pointer'}} onClick={() => viewPost(post.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <h3 style={{fontSize:15,fontWeight:600}}>{post.title}</h3>
                    <span className={`badge badge-${categoryColors[post.category]}`}>{post.category}</span>
                    {post.is_resolved && <span className="badge badge-success">Resolved</span>}
                  </div>
                  <p style={{fontSize:13,color:'var(--text-muted)'}}>
                    by {post.author?.name} · {new Date(post.created_at).toLocaleDateString()} · {post.replyCount || 0} replies
                  </p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); upvote(post.id); }}>
                    <FiThumbsUp /> {post.upvotes || 0}
                  </button>
                  <FiMessageSquare style={{color:'var(--text-muted)'}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
