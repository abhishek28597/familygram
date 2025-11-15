import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    bio: '',
    family_names: [],
  });
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [familiesToCreate, setFamiliesToCreate] = useState([]);
  const [pendingFormData, setPendingFormData] = useState(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddFamily = () => {
    const trimmed = familyNameInput.trim();
    if (trimmed && !formData.family_names.includes(trimmed)) {
      setFormData({
        ...formData,
        family_names: [...formData.family_names, trimmed],
      });
      setFamilyNameInput('');
    }
  };

  const handleRemoveFamily = (familyName) => {
    setFormData({
      ...formData,
      family_names: formData.family_names.filter(name => name !== familyName),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFamily();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.family_names.length === 0) {
      setError('Please add at least one family name');
      return;
    }
    
    setLoading(true);
    const { familyAPI } = await import('../services/api');
    const familiesToCheck = [];
    
    for (const familyName of formData.family_names) {
      try {
        const response = await familyAPI.checkFamilyExists(familyName);
        if (!response.data.exists) {
          familiesToCheck.push(familyName);
        }
      } catch (error) {
        familiesToCheck.push(familyName);
      }
    }
    
    setLoading(false);
    
    if (familiesToCheck.length > 0) {
      setFamiliesToCreate(familiesToCheck);
      setPendingFormData(formData);
      setShowConfirmDialog(true);
    } else {
      proceedWithSignup(formData);
    }
  };

  const proceedWithSignup = async (formDataToUse) => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    const result = await signup(formDataToUse);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleConfirmCreate = () => {
    proceedWithSignup(pendingFormData);
  };

  const handleCancelCreate = () => {
    setShowConfirmDialog(false);
    setFamiliesToCreate([]);
    setPendingFormData(null);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--spacing-lg)'
    }}>
      <motion.div
        className="card"
        style={{ maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 style={{ 
            marginBottom: 'var(--spacing-xl)', 
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)'
          }}>
            Sign Up
          </h1>
        </motion.div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={500}
              rows="3"
            />
            <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: 'var(--spacing-xs)' }}>
              {formData.bio.length}/500 characters
            </small>
          </div>
          <div className="form-group">
            <label>Family Names *</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
              <input
                type="text"
                value={familyNameInput}
                onChange={(e) => setFamilyNameInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter family name"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddFamily}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            {formData.family_names.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                {formData.family_names.map((name, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: 'var(--spacing-xs) var(--spacing-md)',
                      background: 'var(--accent-2)',
                      color: 'white',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveFamily(name)}
                      style={{
                        marginLeft: 'var(--spacing-sm)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.125rem',
                        color: 'white',
                        fontWeight: 'bold',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
            <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: 'var(--spacing-xs)' }}>
              Add at least one family name. Families will be created if they don't exist.
            </small>
          </div>
          {error && <div className="error">{error}</div>}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }} 
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Sign Up'}
          </button>
        </form>
        
        <p style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ 
              color: 'var(--primary)', 
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Login
          </Link>
        </p>
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
                Create New Families?
              </h2>
              <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                The following family/families don't exist and will be created:
              </p>
              <ul style={{ marginBottom: 'var(--spacing-lg)', paddingLeft: 'var(--spacing-lg)' }}>
                {familiesToCreate.map((name, index) => (
                  <motion.li
                    key={index}
                    style={{ marginBottom: 'var(--spacing-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    "{name}"
                  </motion.li>
                ))}
              </ul>
              <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Do you want to proceed with creating these families?
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
                  {loading ? 'Creating...' : 'Yes, Create Families'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;
