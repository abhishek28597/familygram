import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Comment = ({ comment, onDelete }) => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div style={{
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: '#f9f9f9',
      borderRadius: '5px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <strong style={{ fontSize: '14px' }}>{comment.user?.username || 'Unknown'}</strong>
        <span style={{ color: '#666', fontSize: '12px' }}>{formatDate(comment.created_at)}</span>
      </div>
      <p style={{ marginBottom: '5px', fontSize: '14px' }}>{comment.content}</p>
      {user?.id === comment.user_id && (
        <button
          onClick={() => onDelete(comment.id)}
          className="btn btn-danger"
          style={{ fontSize: '12px', padding: '5px 10px' }}
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default Comment;

