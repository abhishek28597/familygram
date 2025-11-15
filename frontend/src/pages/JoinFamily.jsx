import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI, authAPI } from '../services/api';
import Navigation from '../components/Navigation/Navigation';
import { motion, AnimatePresence } from 'framer-motion';

const JoinFamily = () => {
  const { user, families, activeFamily, selectFamily, refreshFamilies } = useAuth();
  const navigate = useNavigate();
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userFamilies, setUserFamilies] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFamilyName, setPendingFamilyName] = useState('');

  useEffect(() => {
    loadUserFamilies();
  }, []);

  const loadUserFamilies = async () => {
    try {
      const response = await familyAPI.getFamilies();
      setUserFamilies(response.data);
    } catch (error) {
      console.error('Failed to load families:', error);
    }
  };

  const handleJoinByName = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }

    const trimmedName = familyName.trim();
    
    setLoading(true);
    try {
      const checkResponse = await familyAPI.checkFamilyExists(trimmedName);
      
      if (!checkResponse.data.exists) {
        setPendingFamilyName(trimmedName);
        setShowConfirmDialog(true);
        setLoading(false);
        return;
      } else {
        await proceedWithJoin(trimmedName);
      }
    } catch (error) {
      setPendingFamilyName(trimmedName);
      setShowConfirmDialog(true);
      setLoading(false);
    }
  };

  const proceedWithJoin = async (nameToJoin) => {
    setLoading(true);
    setShowConfirmDialog(false);
    setError('');
    setSuccess('');
    
    try {
      const response = await familyAPI.joinFamilyByName(nameToJoin);
      setSuccess(`Successfully joined family: ${response.data.name}`);
      setFamilyName('');
      setPendingFamilyName('');
      await loadUserFamilies();
      if (refreshFamilies) {
        await refreshFamilies();
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCreate = () => {
    proceedWithJoin(pendingFamilyName);
  };

  const handleCancelCreate = () => {
    setShowConfirmDialog(false);
    setPendingFamilyName('');
  };

  const handleSwitchFamily = async (familyId) => {
    setLoading(true);
    setError('');
    try {
      const result = await selectFamily(familyId);
      if (result.success) {
        setSuccess('Family switched successfully! Redirecting...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to switch family');
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
                backgroundColor: '#F8D7DA',
                border: '2px solid var(--error)'
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p style={{ color: '#721C24', margin: 0 }}>{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="card"
              style={{ 
                marginBottom: 'var(--spacing-lg)', 
                backgroundColor: '#D4EDDA',
                border: '2px solid var(--success)'
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <p style={{ color: '#155724', margin: 0 }}>{success}</p>
            </motion.div>
          )}

          {/* Join Family Section */}
          <motion.div
            className="card"
            style={{ marginBottom: 'var(--spacing-lg)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
              Join a Family
            </h1>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Enter a family name to join. If the family doesn't exist, it will be created automatically.
            </p>
            <form onSubmit={handleJoinByName}>
              <div className="form-group">
                <label>Family Name</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter family name"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Family'}
              </button>
            </form>
          </motion.div>

          {/* Your Families Section */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
              Your Families
            </h2>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
              You are currently a member of {userFamilies.length} family/families.
              {activeFamily && (
                <span style={{ 
                  display: 'block', 
                  marginTop: 'var(--spacing-sm)', 
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  Active Family: <span style={{ color: 'var(--primary)' }}>{activeFamily.name}</span>
                </span>
              )}
            </p>
            
            {userFamilies.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                You are not a member of any families yet.
              </p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: 'var(--spacing-lg)', 
                marginTop: 'var(--spacing-lg)'
              }}>
                {userFamilies.map((family, index) => (
                  <motion.div
                    key={family.id}
                    className="card"
                    style={{ 
                      padding: 'var(--spacing-lg)',
                      backgroundColor: activeFamily?.id === family.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      border: activeFamily?.id === family.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      textAlign: 'center'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-xl)' }}
                  >
                    <h3 style={{ 
                      marginBottom: 'var(--spacing-md)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {family.name}
                    </h3>
                    {activeFamily?.id === family.id ? (
                      <p style={{ 
                        color: 'var(--primary)', 
                        fontWeight: 600, 
                        margin: 0,
                        padding: 'var(--spacing-sm)',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        Currently Active
                      </p>
                    ) : (
                      <motion.button
                        onClick={() => handleSwitchFamily(family.id)}
                        className="btn btn-primary"
                        style={{ marginTop: 'var(--spacing-md)', width: '100%' }}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Switching...' : 'Switch to This Family'}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirmDialog && (
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
              >
                <motion.div
                  className="card"
                  style={{ maxWidth: '500px', width: '100%' }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <h2 style={{ marginBottom: 'var(--spacing-md)', fontFamily: 'var(--font-display)' }}>
                    Create New Family?
                  </h2>
                  <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                    The family "<strong style={{ color: 'var(--text-primary)' }}>{pendingFamilyName}</strong>" doesn't exist.
                  </p>
                  <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                    Do you want to create this family and join it?
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleCancelCreate}
                      className="btn btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmCreate}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Yes, Create Family'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default JoinFamily;
