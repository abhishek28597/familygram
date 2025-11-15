import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { postsAPI, commentsAPI } from '../../services/api';
import Comment from '../Comment/Comment';
import { motion, AnimatePresence } from 'framer-motion';

const Post = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [liking, setLiking] = useState(false);
  const [disliking, setDisliking] = useState(false);

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
    if (liking) return;
    setLiking(true);
    try {
      await postsAPI.likePost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to like post:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleDislike = async () => {
    if (disliking) return;
    setDisliking(true);
    try {
      await postsAPI.dislikePost(post.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to dislike post:', error);
    } finally {
      setDisliking(false);
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
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: 'var(--shadow-xl)' }}
    >
      {/* Post Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 'var(--spacing-md)',
        paddingBottom: 'var(--spacing-md)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '1.125rem'
            }}>
              {(post.user?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <strong style={{ 
                fontSize: '1.0625rem',
                color: 'var(--text-primary)',
                display: 'block'
              }}>
                {post.user?.username || 'Unknown'}
              </strong>
              {post.user?.full_name && (
                <span style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.875rem'
                }}>
                  {post.user.full_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ 
          color: 'var(--text-tertiary)', 
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          marginLeft: 'var(--spacing-md)'
        }}>
          {formatDate(post.created_at)}
        </div>
      </div>
      
      {/* Post Content */}
      <p style={{ 
        marginBottom: 'var(--spacing-lg)', 
        whiteSpace: 'pre-wrap',
        lineHeight: 1.7,
        color: 'var(--text-primary)',
        fontSize: '1rem'
      }}>
        {post.content}
      </p>
      
      {/* Post Actions */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-md)',
        paddingTop: 'var(--spacing-md)',
        borderTop: '1px solid var(--border-light)',
        flexWrap: 'wrap'
      }}>
        <motion.button
          onClick={handleLike}
          className="btn btn-secondary"
          style={{ 
            flex: '1 1 auto',
            minWidth: '100px'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={liking}
        >
          <span style={{ fontSize: '1.125rem' }}>👍</span>
          <span>Like ({post.likes_count})</span>
        </motion.button>
        
        <motion.button
          onClick={handleDislike}
          className="btn btn-secondary"
          style={{ 
            flex: '1 1 auto',
            minWidth: '100px'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={disliking}
        >
          <span style={{ fontSize: '1.125rem' }}>👎</span>
          <span>Dislike ({post.dislikes_count})</span>
        </motion.button>
        
        <motion.button
          onClick={() => setShowComments(!showComments)}
          className="btn btn-secondary"
          style={{ 
            flex: '1 1 auto',
            minWidth: '100px'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span style={{ fontSize: '1.125rem' }}>💬</span>
          <span>Comments ({post.comments_count})</span>
        </motion.button>
        
        {user?.id === post.user_id && (
          <motion.button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this post?')) {
                onDelete(post.id);
              }
            }}
            className="btn btn-danger"
            style={{ marginLeft: 'auto' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete
          </motion.button>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-md)',
              borderTop: '1px solid var(--border-light)'
            }}
          >
            <form onSubmit={handleAddComment} style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows="2"
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm" 
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {comments.length === 0 ? (
                <p style={{ 
                  textAlign: 'center', 
                  color: 'var(--text-tertiary)',
                  padding: 'var(--spacing-lg)'
                }}>
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Comment
                      comment={comment}
                      onDelete={handleDeleteComment}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Post;
