import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsAPI, commentsAPI } from '../../services/api';
import Comment from '../Comment/Comment';

const Post = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, post.id]);

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getComments(post.id);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await postsAPI.likePost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDislike = async () => {
    try {
      await postsAPI.dislikePost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to dislike post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await commentsAPI.createComment(post.id, { content: newComment });
      setNewComment('');
      await loadComments();
      onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.deleteComment(commentId);
      await loadComments();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <strong>{post.user?.username || 'Unknown'}</strong>
          {post.user?.full_name && <span style={{ color: '#666', marginLeft: '10px' }}>{post.user.full_name}</span>}
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>{formatDate(post.created_at)}</div>
      </div>
      
      <p style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{post.content}</p>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <button
          onClick={handleLike}
          className="btn"
          style={{
            backgroundColor: '#f0f0f0',
            color: 'black',
          }}
        >
          👍 Like ({post.likes_count})
        </button>
        <button
          onClick={handleDislike}
          className="btn"
          style={{
            backgroundColor: '#f0f0f0',
            color: 'black',
          }}
        >
          👎 Dislike ({post.dislikes_count})
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="btn"
          style={{ backgroundColor: '#f0f0f0' }}
        >
          💬 Comments ({post.comments_count})
        </button>
        {user?.id === post.user_id && (
          <button
            onClick={() => onDelete(post.id)}
            className="btn btn-danger"
            style={{ marginLeft: 'auto' }}
          >
            Delete
          </button>
        )}
      </div>

      {showComments && (
        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <form onSubmit={handleAddComment} style={{ marginBottom: '15px' }}>
            <div className="form-group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows="2"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
          
          <div>
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;

