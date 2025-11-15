import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Comment = ({ comment, onDelete }) => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
      }}
      whileHover={{ 
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 'var(--spacing-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            {(comment.user?.username || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ 
              fontSize: '0.9375rem',
              color: 'var(--text-primary)',
              display: 'block'
            }}>
              {comment.user?.username || 'Unknown'}
            </strong>
            <span style={{ 
              color: 'var(--text-tertiary)', 
              fontSize: '0.75rem'
            }}>
              {formatDate(comment.created_at)}
            </span>
          </div>
        </div>
        {user?.id === comment.user_id && (
          <motion.button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this comment?')) {
                onDelete(comment.id);
              }
            }}
            className="btn btn-danger btn-sm"
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.25rem 0.75rem',
              marginLeft: 'var(--spacing-sm)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete
          </motion.button>
        )}
      </div>
      <p style={{ 
        margin: 0, 
        fontSize: '0.9375rem',
        lineHeight: 1.6,
        color: 'var(--text-primary)'
      }}>
        {comment.content}
      </p>
    </motion.div>
  );
};

export default Comment;
