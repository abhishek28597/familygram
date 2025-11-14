import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, familyAPI } from '../services/api';

const Family = () => {
  const { user, activeFamily } = useAuth();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [apiKeyEntered, setApiKeyEntered] = useState(false);
  const [familySummary, setFamilySummary] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  // Separate effect to handle user-specific API key loading
  useEffect(() => {
    if (!user?.id) {
      // No user logged in, clear state
      setApiKeyEntered(false);
      setGroqApiKey('');
      setFamilySummary(null);
      setUserSummary(null);
      setSelectedUser(null);
      return;
    }

    // Check if API key is stored in localStorage for current user
    const storedKey = localStorage.getItem(`groq_api_key_${user.id}`);
    if (storedKey) {
      setGroqApiKey(storedKey);
      setApiKeyEntered(true);
    } else {
      // Check for old non-user-specific key (migration)
      const oldKey = localStorage.getItem('groq_api_key');
      if (oldKey) {
        // Migrate to user-specific key
        localStorage.setItem(`groq_api_key_${user.id}`, oldKey);
        localStorage.removeItem('groq_api_key');
        setGroqApiKey(oldKey);
        setApiKeyEntered(true);
      } else {
        // No key found for this user
        setApiKeyEntered(false);
        setGroqApiKey('');
      }
    }
  }, [user]);

  const loadFamilyMembers = async () => {
    try {
      const response = await usersAPI.getAllUsers();
      setFamilyMembers(response.data);
    } catch (error) {
      console.error('Failed to load family members:', error);
    }
  };

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (groqApiKey.trim() && user?.id) {
      // Store API key with user ID to make it user-specific
      localStorage.setItem(`groq_api_key_${user.id}`, groqApiKey);
      // Also clear old non-user-specific key if exists
      localStorage.removeItem('groq_api_key');
      setApiKeyEntered(true);
      setError('');
    }
  };

  const handleGetFamilySummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await familyAPI.getFamilySummary(groqApiKey);
      setFamilySummary(response.data);
    } catch (error) {
      console.error('Failed to get family summary:', error);
      setError(error.response?.data?.detail || 'Error generating summary. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetUserSummary = async (userId) => {
    setLoading(true);
    setError('');
    setSelectedUser(userId);
    try {
      const response = await familyAPI.getUserSummary(userId, groqApiKey);
      setUserSummary(response.data);
    } catch (error) {
      console.error('Failed to get user summary:', error);
      setError(error.response?.data?.detail || 'Error generating user summary.');
    } finally {
      setLoading(false);
    }
  };

  if (!apiKeyEntered) {
    return (
      <div className="container">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div>
          <h1>Family Insights</h1>
          {activeFamily && (
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px' }}>
              Family: <strong style={{ color: '#2196F3' }}>{activeFamily.name}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/join-family')} 
            className="btn btn-primary"
          >
            Join Family
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Home
          </button>
        </div>
      </header>
        
        <div className="card">
          <h2 style={{ marginBottom: '15px' }}>Enter Groq API Key</h2>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            To use Family Insights, please enter your Groq API key. 
            This key is stored locally in your browser, associated with your account, and used only for generating AI summaries.
            {user?.username && (
              <span style={{ display: 'block', marginTop: '5px', fontWeight: 'bold' }}>
                Key will be stored for: {user.username}
              </span>
            )}
          </p>
          <form onSubmit={handleApiKeySubmit}>
            <div className="form-group">
              <label>Groq API Key</label>
              <input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="gsk_..."
                required
                style={{ fontFamily: 'monospace' }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Get your API key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">Groq Console</a>
              </small>
            </div>
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div>
          <h1>Family Insights</h1>
          {activeFamily && (
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px' }}>
              Family: <strong style={{ color: '#2196F3' }}>{activeFamily.name}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/join-family')} 
            className="btn btn-primary"
          >
            Join Family
          </button>
          <button 
            onClick={() => {
              // Clear user-specific API key
              if (user?.id) {
                localStorage.removeItem(`groq_api_key_${user.id}`);
              }
              // Also clear old key for migration
              localStorage.removeItem('groq_api_key');
              setApiKeyEntered(false);
              setGroqApiKey('');
              setFamilySummary(null);
              setUserSummary(null);
              setSelectedUser(null);
            }}
            className="btn btn-secondary"
          >
            Change API Key
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Home
          </button>
        </div>
      </header>

      {error && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
          <p style={{ color: '#856404', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Family Summary</h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Get an AI-generated summary of all family posts for today.
        </p>
        <button 
          onClick={handleGetFamilySummary} 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Generating Summary...' : 'Request Family Summary'}
        </button>
        
        {familySummary && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
            <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <p style={{ margin: '5px 0' }}><strong>Date:</strong> {new Date(familySummary.date).toLocaleDateString()}</p>
              <p style={{ margin: '5px 0' }}><strong>Total Posts:</strong> {familySummary.total_posts}</p>
              <p style={{ margin: '5px 0' }}><strong>Active Members:</strong> {familySummary.users_active}</p>
            </div>
            <div>
              <strong>Summary:</strong>
              <p style={{ marginTop: '10px', lineHeight: '1.6' }}>{familySummary.summary}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '15px' }}>Family Members</h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Click on a family member to see their daily summary and sentiment analysis.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {familyMembers.length === 0 ? (
            <p style={{ color: '#666' }}>No family members found.</p>
          ) : (
            familyMembers.map((member) => (
              <div 
                key={member.id} 
                className="card"
                style={{ 
                  cursor: 'pointer', 
                  padding: '15px',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => handleGetUserSummary(member.id)}
              >
                <h3 style={{ marginBottom: '10px' }}>{member.username}</h3>
                {member.full_name && (
                  <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>{member.full_name}</p>
                )}
                <button 
                  className="btn btn-primary"
                  style={{ marginTop: '10px', width: '100%' }}
                  disabled={loading}
                >
                  {loading && selectedUser === member.id ? 'Analyzing...' : 'View Summary'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {userSummary && selectedUser && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Summary: {userSummary.username}</h2>
            <button 
              onClick={() => {
                setUserSummary(null);
                setSelectedUser(null);
              }}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
          
          <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
            <p style={{ margin: '5px 0' }}><strong>Date:</strong> {new Date(userSummary.date).toLocaleDateString()}</p>
            <p style={{ margin: '5px 0' }}><strong>Posts Today:</strong> {userSummary.posts_count}</p>
            {userSummary.messages_with_you && (
              <p style={{ margin: '5px 0' }}><strong>Messages with You:</strong> {userSummary.messages_with_you.count}</p>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>Post Summary</h3>
            <p style={{ lineHeight: '1.6' }}>{userSummary.post_summary}</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '5px' }}>
            <h3 style={{ marginBottom: '10px' }}>Today's Sentiment</h3>
            <p style={{ lineHeight: '1.6', margin: 0 }}>{userSummary.sentiment}</p>
          </div>
          
          {userSummary.messages_with_you && (
            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              <h3 style={{ marginBottom: '10px' }}>Your Conversations</h3>
              <p style={{ lineHeight: '1.6', margin: 0 }}>{userSummary.messages_with_you.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Family;

