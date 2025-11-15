import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI } from '../services/api';
import Navigation from '../components/Navigation/Navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Family = () => {
  const { user, activeFamily, selectFamily, refreshFamilies } = useAuth();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [apiKeyEntered, setApiKeyEntered] = useState(false);
  const [familySummary, setFamilySummary] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFamilies, setUserFamilies] = useState([]);
  const [switchingFamily, setSwitchingFamily] = useState(false);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [creatingFamily, setCreatingFamily] = useState(false);

  useEffect(() => {
    loadUserFamilies();
    if (activeFamily?.id) {
      loadFamilyMembers();
    } else {
      setFamilyMembers([]);
    }
  }, [activeFamily]);

  const loadUserFamilies = async () => {
    try {
      const response = await familyAPI.getFamilies();
      setUserFamilies(response.data);
    } catch (error) {
      console.error('Failed to load families:', error);
    }
  };

  const handleSwitchFamily = async (familyId) => {
    setSwitchingFamily(true);
    setError('');
    try {
      const result = await selectFamily(familyId);
      if (result.success) {
        if (refreshFamilies) {
          await refreshFamilies();
        }
        window.location.reload();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to switch family');
    } finally {
      setSwitchingFamily(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyName.trim()) {
      setError('Please enter a family name');
      return;
    }

    setCreatingFamily(true);
    setError('');
    try {
      await familyAPI.joinFamilyByName(newFamilyName.trim());
      setNewFamilyName('');
      setShowCreateFamily(false);
      await loadUserFamilies();
      if (refreshFamilies) {
        await refreshFamilies();
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create family');
    } finally {
      setCreatingFamily(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setApiKeyEntered(false);
      setGroqApiKey('');
      setFamilySummary(null);
      setUserSummary(null);
      setSelectedUser(null);
      return;
    }

    const storedKey = localStorage.getItem(`groq_api_key_${user.id}`);
    if (storedKey) {
      setGroqApiKey(storedKey);
      setApiKeyEntered(true);
    } else {
      const oldKey = localStorage.getItem('groq_api_key');
      if (oldKey) {
        localStorage.setItem(`groq_api_key_${user.id}`, oldKey);
        localStorage.removeItem('groq_api_key');
        setGroqApiKey(oldKey);
        setApiKeyEntered(true);
      } else {
        setApiKeyEntered(false);
        setGroqApiKey('');
      }
    }
  }, [user]);

  const loadFamilyMembers = async () => {
    if (!activeFamily?.id) {
      setFamilyMembers([]);
      return;
    }
    
    try {
      const response = await familyAPI.getFamilyMembers(activeFamily.id);
      setFamilyMembers(response.data);
    } catch (error) {
      console.error('Failed to load family members:', error);
      setFamilyMembers([]);
    }
  };

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (groqApiKey.trim() && user?.id) {
      localStorage.setItem(`groq_api_key_${user.id}`, groqApiKey);
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

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {error && (
            <motion.div
              className="card"
              style={{ 
                marginBottom: 'var(--spacing-lg)', 
                backgroundColor: '#FFF3CD',
                border: '2px solid var(--warning)'
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p style={{ color: '#856404', margin: 0 }}>{error}</p>
            </motion.div>
          )}

          {/* Switch Family Section - Always visible */}
          <motion.div
            className="card"
            style={{ marginBottom: 'var(--spacing-lg)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
                Your Families
              </h2>
              <motion.button
                onClick={() => setShowCreateFamily(true)}
                className="btn btn-primary btn-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              >
                <span style={{ fontSize: '1.25rem' }}>+</span>
                <span>Create Family</span>
              </motion.button>
            </div>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
              {userFamilies.length > 0 
                ? `You are a member of ${userFamilies.length} ${userFamilies.length === 1 ? 'family' : 'families'}. Switch between them to see different family content.`
                : 'You are not a member of any families yet. Create one to get started!'
              }
              {activeFamily && (
                <span style={{ 
                  display: 'block', 
                  marginTop: 'var(--spacing-sm)', 
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  Currently viewing: <span style={{ color: 'var(--primary)' }}>{activeFamily.name}</span>
                </span>
              )}
            </p>
            {userFamilies.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: 'var(--spacing-md)'
              }}>
                {userFamilies.map((family, index) => (
                  <motion.div
                    key={family.id}
                    style={{ 
                      padding: 'var(--spacing-md)',
                      backgroundColor: activeFamily?.id === family.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      border: activeFamily?.id === family.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
                  >
                    <h3 style={{ 
                      marginBottom: 'var(--spacing-sm)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.125rem'
                    }}>
                      {family.name}
                    </h3>
                    {activeFamily?.id === family.id ? (
                      <p style={{ 
                        color: 'var(--primary)', 
                        fontWeight: 600, 
                        margin: 0,
                        fontSize: '0.875rem'
                      }}>
                        Active
                      </p>
                    ) : (
                      <motion.button
                        onClick={() => handleSwitchFamily(family.id)}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
                        disabled={switchingFamily}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {switchingFamily ? 'Switching...' : 'Switch'}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                  No families yet. Create your first family to get started!
                </p>
                <motion.button
                  onClick={() => setShowCreateFamily(true)}
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Your First Family
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Family Insights Section - Only if API key is entered */}
          {!apiKeyEntered ? (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                Family Insights
              </h1>
              {activeFamily && (
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                  Family: <strong style={{ color: 'var(--primary)' }}>{activeFamily.name}</strong>
                </p>
              )}
              <h2 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                Enter Groq API Key
              </h2>
              <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                To use Family Insights, please enter your Groq API key. 
                This key is stored locally in your browser, associated with your account, and used only for generating AI summaries.
                {user?.username && (
                  <span style={{ display: 'block', marginTop: 'var(--spacing-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', display: 'block', marginTop: 'var(--spacing-xs)' }}>
                    Get your API key from{' '}
                    <a 
                      href="https://console.groq.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      Groq Console
                    </a>
                  </small>
                </div>
                <button type="submit" className="btn btn-primary">
                  Continue
                </button>
              </form>
            </motion.div>
          ) : (
            <>
              {/* Family Summary Section */}
              <motion.div
                className="card"
                style={{ marginBottom: 'var(--spacing-lg)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                  Family Summary
                </h2>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                  Get an AI-generated summary of all family posts for today.
                </p>
                <motion.button
                  onClick={handleGetFamilySummary}
                  className="btn btn-primary"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Generating Summary...' : 'Request Family Summary'}
                </motion.button>
                
                <AnimatePresence>
                  {familySummary && (
                    <motion.div
                      style={{ 
                        marginTop: 'var(--spacing-xl)', 
                        padding: 'var(--spacing-lg)', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        borderRadius: 'var(--radius-md)'
                      }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div style={{ 
                        marginBottom: 'var(--spacing-lg)', 
                        paddingBottom: 'var(--spacing-md)', 
                        borderBottom: '1px solid var(--border-light)'
                      }}>
                        <p style={{ margin: 'var(--spacing-xs) 0' }}>
                          <strong>Date:</strong> {new Date(familySummary.date).toLocaleDateString()}
                        </p>
                        <p style={{ margin: 'var(--spacing-xs) 0' }}>
                          <strong>Total Posts:</strong> {familySummary.total_posts}
                        </p>
                        <p style={{ margin: 'var(--spacing-xs) 0' }}>
                          <strong>Active Members:</strong> {familySummary.users_active}
                        </p>
                      </div>
                      <div>
                        <strong style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>Summary:</strong>
                        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                          {familySummary.summary}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Family Members Section */}
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                  Family Members
                </h2>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                  Click on a family member to see their daily summary and sentiment analysis.
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: 'var(--spacing-lg)', 
                  marginTop: 'var(--spacing-lg)'
                }}>
                  {familyMembers.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No family members found.</p>
                  ) : (
                    familyMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        className="card"
                        style={{ 
                          cursor: 'pointer',
                          padding: 'var(--spacing-lg)',
                          textAlign: 'center'
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.05, boxShadow: 'var(--shadow-xl)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGetUserSummary(member.id)}
                      >
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '2rem',
                          margin: '0 auto var(--spacing-md)',
                          boxShadow: 'var(--shadow-lg)'
                        }}>
                          {(member.username || 'U')[0].toUpperCase()}
                        </div>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontFamily: 'var(--font-display)' }}>
                          {member.username}
                        </h3>
                        {member.full_name && (
                          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.9375rem' }}>
                            {member.full_name}
                          </p>
                        )}
                        <motion.button
                          className="btn btn-primary"
                          style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {loading && selectedUser === member.id ? 'Analyzing...' : 'View Summary'}
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* User Summary Modal */}
              <AnimatePresence>
                {userSummary && selectedUser && (
                  <motion.div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1000,
                      padding: 'var(--spacing-lg)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setUserSummary(null);
                      setSelectedUser(null);
                    }}
                  >
                    <motion.div
                      className="card"
                      style={{ 
                        maxWidth: '700px', 
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                      }}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: 'var(--spacing-lg)'
                      }}>
                        <h2 style={{ fontFamily: 'var(--font-display)' }}>
                          Summary: {userSummary.username}
                        </h2>
                        <motion.button
                          onClick={() => {
                            setUserSummary(null);
                            setSelectedUser(null);
                          }}
                          className="btn btn-secondary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Close
                        </motion.button>
                      </div>
                      
                      <div style={{ 
                        marginBottom: 'var(--spacing-lg)', 
                        paddingBottom: 'var(--spacing-lg)', 
                        borderBottom: '1px solid var(--border-light)'
                      }}>
                        <p style={{ margin: 'var(--spacing-xs) 0' }}>
                          <strong>Date:</strong> {new Date(userSummary.date).toLocaleDateString()}
                        </p>
                        <p style={{ margin: 'var(--spacing-xs) 0' }}>
                          <strong>Posts Today:</strong> {userSummary.posts_count}
                        </p>
                        {userSummary.messages_with_you && (
                          <p style={{ margin: 'var(--spacing-xs) 0' }}>
                            <strong>Messages with You:</strong> {userSummary.messages_with_you.count}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                          Post Summary
                        </h3>
                        <p style={{ lineHeight: 1.7, color: 'var(--text-primary)' }}>
                          {userSummary.post_summary}
                        </p>
                      </div>
                      
                      <div style={{ 
                        marginBottom: 'var(--spacing-lg)', 
                        padding: 'var(--spacing-lg)', 
                        backgroundColor: '#F0F7FF', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--info)'
                      }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                          Today's Sentiment
                        </h3>
                        <p style={{ lineHeight: 1.7, margin: 0, color: 'var(--text-primary)' }}>
                          {userSummary.sentiment}
                        </p>
                      </div>
                      
                      {userSummary.messages_with_you && (
                        <div style={{ 
                          padding: 'var(--spacing-lg)', 
                          backgroundColor: 'var(--bg-tertiary)', 
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <h3 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                            Your Conversations
                          </h3>
                          <p style={{ lineHeight: 1.7, margin: 0, color: 'var(--text-primary)' }}>
                            {userSummary.messages_with_you.summary}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Create Family Modal */}
          <AnimatePresence>
            {showCreateFamily && (
              <motion.div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000,
                  padding: 'var(--spacing-lg)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowCreateFamily(false);
                  setNewFamilyName('');
                }}
              >
                <motion.div
                  className="card"
                  style={{ maxWidth: '500px', width: '100%' }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-lg)'
                  }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
                      Create New Family
                    </h2>
                    <motion.button
                      onClick={() => {
                        setShowCreateFamily(false);
                        setNewFamilyName('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                      }}
                      whileHover={{ backgroundColor: 'var(--bg-tertiary)', scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </div>
                  
                  <form onSubmit={handleCreateFamily}>
                    <div className="form-group">
                      <label>Family Name</label>
                      <input
                        type="text"
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        placeholder="Enter family name"
                        required
                        autoFocus
                      />
                      <small style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', display: 'block', marginTop: 'var(--spacing-xs)' }}>
                        If the family doesn't exist, it will be created automatically.
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateFamily(false);
                          setNewFamilyName('');
                        }}
                        className="btn btn-secondary"
                        disabled={creatingFamily}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={creatingFamily || !newFamilyName.trim()}
                      >
                        {creatingFamily ? 'Creating...' : 'Create Family'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default Family;
