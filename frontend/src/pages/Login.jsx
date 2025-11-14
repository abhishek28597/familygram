import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      // Always show family selection if user has families (even if just one, so they can see which family)
      if (result.families && result.families.length > 0) {
        // If multiple families, show selection
        if (result.families.length > 1) {
          setFamilies(result.families);
          setShowFamilySelection(true);
          setLoading(false);
        } else {
          // Single family - proceed directly (auto-selected)
          navigate('/');
        }
      } else {
        // No families - proceed directly
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
      <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
        <div className="card">
          <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Select Family</h1>
          <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
            Please select which family space you want to enter:
          </p>
          {families.map((family) => (
            <button
              key={family.id}
              onClick={() => handleFamilySelect(family.id)}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '10px' }}
              disabled={loading}
            >
              {family.name}
            </button>
          ))}
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

