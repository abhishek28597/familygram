import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Navigation = () => {
  const { user, logout, activeFamily } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <motion.nav 
      className="nav-header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="nav-content">
        <motion.a
          href="/"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Family Gram
        </motion.a>
        
        <div className="nav-actions">
          <div className="nav-user-info">
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
              {user.username}
            </span>
            {activeFamily && (
              <span className="family-badge">
                {activeFamily.name}
              </span>
            )}
          </div>
          
          <motion.button
            onClick={() => navigate(`/profile/${user.id}`)}
            className="btn btn-secondary btn-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Profile
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/inbox')}
            className="btn btn-secondary btn-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Inbox
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/family')}
            className="btn btn-secondary btn-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Family
          </motion.button>
          
          <motion.button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;

