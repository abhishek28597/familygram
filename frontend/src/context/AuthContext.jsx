import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, familyAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeFamily, setActiveFamily] = useState(null);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedFamily = localStorage.getItem('activeFamily');
    if (token) {
      authAPI.getMe()
        .then((response) => {
          setUser(response.data);
          // Load families
          familyAPI.getFamilies()
            .then((familiesResponse) => {
              setFamilies(familiesResponse.data);
              // Restore active family if stored
              if (storedFamily) {
                const family = familiesResponse.data.find(f => f.id === storedFamily);
                if (family) {
                  setActiveFamily(family);
                } else if (familiesResponse.data.length > 0) {
                  setActiveFamily(familiesResponse.data[0]);
                }
              } else if (familiesResponse.data.length > 0) {
                setActiveFamily(familiesResponse.data[0]);
              }
            })
            .catch(() => {
              // If getFamilies doesn't exist or fails, continue without it
            });
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('activeFamily');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, familyId = null) => {
    try {
      const response = await authAPI.login(username, password, familyId);
      const { access_token, families: userFamilies, selected_family } = response.data;
      localStorage.setItem('token', access_token);
      
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      // Set families and active family
      if (userFamilies) {
        setFamilies(userFamilies);
        if (selected_family) {
          setActiveFamily(selected_family);
          localStorage.setItem('activeFamily', selected_family.id);
        } else if (userFamilies.length > 0) {
          setActiveFamily(userFamilies[0]);
          localStorage.setItem('activeFamily', userFamilies[0].id);
        }
      }
      
      return { success: true, families: userFamilies, selectedFamily: selected_family };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      setUser(response.data);
      // Auto-login after signup
      const loginResponse = await authAPI.login(userData.username, userData.password);
      const { access_token, families: userFamilies, selected_family } = loginResponse.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Set families and active family
      if (userFamilies) {
        setFamilies(userFamilies);
        if (selected_family) {
          setActiveFamily(selected_family);
          localStorage.setItem('activeFamily', selected_family.id);
        } else if (userFamilies.length > 0) {
          setActiveFamily(userFamilies[0]);
          localStorage.setItem('activeFamily', userFamilies[0].id);
        }
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed',
      };
    }
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeFamily');
    
    // Clear user-specific API key if exists
    if (user?.id) {
      localStorage.removeItem(`groq_api_key_${user.id}`);
    }
    
    // Also clear any old non-user-specific API keys (migration cleanup)
    localStorage.removeItem('groq_api_key');
    
    setUser(null);
    setActiveFamily(null);
    setFamilies([]);
  };

  const selectFamily = async (familyId) => {
    try {
      const response = await authAPI.selectFamily(familyId);
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      const family = families.find(f => f.id === familyId);
      if (family) {
        setActiveFamily(family);
        localStorage.setItem('activeFamily', familyId);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to select family',
      };
    }
  };

  const refreshFamilies = async () => {
    try {
      const response = await familyAPI.getFamilies();
      setFamilies(response.data);
      // Update active family if it still exists
      const storedFamilyId = localStorage.getItem('activeFamily');
      if (storedFamilyId) {
        const family = response.data.find(f => f.id === storedFamilyId);
        if (family) {
          setActiveFamily(family);
        } else if (response.data.length > 0) {
          // If stored family no longer exists, select first one
          setActiveFamily(response.data[0]);
          localStorage.setItem('activeFamily', response.data[0].id);
        }
      } else if (response.data.length > 0) {
        setActiveFamily(response.data[0]);
        localStorage.setItem('activeFamily', response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to refresh families:', error);
    }
  };

  const value = {
    user,
    activeFamily,
    families,
    loading,
    login,
    signup,
    logout,
    selectFamily,
    refreshFamilies,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

