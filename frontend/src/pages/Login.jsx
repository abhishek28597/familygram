import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFamilySelection, setShowFamilySelection] = useState(false);
  const [families, setFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password, selectedFamilyId);
    
    if (result.success) {
      if (result.families && result.families.length > 0) {
        if (result.families.length > 1) {
          setFamilies(result.families);
          setShowFamilySelection(true);
          setLoading(false);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleFamilySelect = async (familyId) => {
    setLoading(true);
    const result = await login(username, password, familyId);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  if (showFamilySelection) {
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
          style={{ maxWidth: '450px', width: '100%' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h1 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
            Select Family
          </h1>
          <p style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Please select which family space you want to enter:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {families.map((family, index) => (
              <motion.button
                key={family.id}
                onClick={() => handleFamilySelect(family.id)}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {family.name}
              </motion.button>
            ))}
          </div>
          {error && <div className="error" style={{ marginTop: 'var(--spacing-md)' }}>{error}</div>}
        </motion.div>
      </div>
    );
  }

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
        style={{ maxWidth: '450px', width: '100%' }}
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
            Family Gram
          </h1>
        </motion.div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--spacing-md)' }} 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            style={{ 
              color: 'var(--primary)', 
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
