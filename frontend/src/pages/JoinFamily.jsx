import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { familyAPI, authAPI } from '../services/api';

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
    
    // Check if family exists
    setLoading(true);
    try {
      const checkResponse = await familyAPI.checkFamilyExists(trimmedName);
      
      if (!checkResponse.data.exists) {
        // Family doesn't exist, show confirmation
        setPendingFamilyName(trimmedName);
        setShowConfirmDialog(true);
        setLoading(false);
        return;
      } else {
        // Family exists, proceed with joining
        await proceedWithJoin(trimmedName);
      }
    } catch (error) {
      // If check fails, assume family doesn't exist and show confirmation
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
      // Reload families list
      await loadUserFamilies();
      // Refresh auth context families
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
        // Reload page to refresh data with new family context
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
        <h1>Join Family</h1>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Home
        </button>
      </header>

      {error && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>
          <p style={{ color: '#721c24', margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
          <p style={{ color: '#155724', margin: 0 }}>{success}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Join a Family</h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
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
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '15px' }}>Your Families</h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          You are currently a member of {userFamilies.length} family/families. 
          {activeFamily && (
            <span style={{ display: 'block', marginTop: '5px', fontWeight: 'bold' }}>
              Active Family: {activeFamily.name}
            </span>
          )}
        </p>
        
        {userFamilies.length === 0 ? (
          <p style={{ color: '#666' }}>You are not a member of any families yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {userFamilies.map((family) => (
              <div 
                key={family.id} 
                className="card"
                style={{ 
                  padding: '15px',
                  backgroundColor: activeFamily?.id === family.id ? '#e3f2fd' : 'white',
                  border: activeFamily?.id === family.id ? '2px solid #2196F3' : '1px solid #ddd',
                }}
              >
                <h3 style={{ marginBottom: '10px' }}>{family.name}</h3>
                {activeFamily?.id === family.id ? (
                  <p style={{ color: '#2196F3', fontWeight: 'bold', margin: 0 }}>Currently Active</p>
                ) : (
                  <button 
                    onClick={() => handleSwitchFamily(family.id)}
                    className="btn btn-primary"
                    style={{ marginTop: '10px', width: '100%' }}
                    disabled={loading}
                  >
                    {loading ? 'Switching...' : 'Switch to This Family'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
            <h2 style={{ marginBottom: '15px' }}>Create New Family?</h2>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              The family "<strong>{pendingFamilyName}</strong>" doesn't exist.
            </p>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Do you want to create this family and join it?
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
                {loading ? 'Creating...' : 'Yes, Create Family'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinFamily;

