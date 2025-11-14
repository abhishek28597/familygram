import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    
    // Check which families don't exist
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
        // If check fails, assume family doesn't exist (will be created)
        familiesToCheck.push(familyName);
      }
    }
    
    setLoading(false);
    
    // If there are families to create, show confirmation
    if (familiesToCheck.length > 0) {
      setFamiliesToCreate(familiesToCheck);
      setPendingFormData(formData);
      setShowConfirmDialog(true);
    } else {
      // All families exist, proceed with signup
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
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Sign Up</h1>
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
            />
          </div>
          <div className="form-group">
            <label>Family Names *</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                style={{ padding: '8px 16px' }}
              >
                Add
              </button>
            </div>
            {formData.family_names.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.family_names.map((name, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '16px',
                      fontSize: '14px',
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveFamily(name)}
                      style={{
                        marginLeft: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#666',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              Add at least one family name. Families will be created if they don't exist.
            </small>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Checking...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Create New Families?</h2>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              The following family/families don't exist and will be created:
            </p>
            <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
              {familiesToCreate.map((name, index) => (
                <li key={index} style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                  "{name}"
                </li>
              ))}
            </ul>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
              Do you want to proceed with creating these families?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;

