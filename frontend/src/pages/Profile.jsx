import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Post from '../components/Post/Post';
import Navigation from '../components/Navigation/Navigation';
import { motion } from 'framer-motion';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', bio: '' });

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = targetUserId === currentUser?.id;

  useEffect(() => {
    loadProfile();
  }, [targetUserId]);

  const loadProfile = async () => {
    try {
      const userResponse = await usersAPI.getUser(targetUserId);
      setProfileUser(userResponse.data);
      setEditData({
        full_name: userResponse.data.full_name || '',
        bio: userResponse.data.bio || '',
      });

      const postsResponse = await usersAPI.getUserPosts(targetUserId);
      setPosts(postsResponse.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await usersAPI.updateProfile(editData);
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    await loadProfile();
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
          <div className="loading">Loading profile...</div>
        </div>
      </>
    );
  }

  if (!profileUser) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
          <div className="card">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              User not found
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header Card */}
          <motion.div
            className="card"
            style={{ marginBottom: 'var(--spacing-lg)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '2.5rem',
                boxShadow: 'var(--shadow-lg)',
                flexShrink: 0
              }}>
                {(profileUser.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ 
                  marginBottom: 'var(--spacing-xs)',
                  fontFamily: 'var(--font-display)'
                }}>
                  {profileUser.username}
                </h1>
                {profileUser.full_name && (
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '1.125rem',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    {profileUser.full_name}
                  </p>
                )}
                <p style={{ 
                  color: 'var(--text-tertiary)', 
                  fontSize: '0.875rem'
                }}>
                  Member since {new Date(profileUser.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {profileUser.bio && !isEditing && (
              <div style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--spacing-md)'
              }}>
                <p style={{ 
                  margin: 0,
                  lineHeight: 1.7,
                  color: 'var(--text-primary)'
                }}>
                  {profileUser.bio}
                </p>
              </div>
            )}

            {isOwnProfile && (
              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                {!isEditing ? (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit Profile
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editData.full_name}
                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        maxLength={500}
                        rows="4"
                      />
                      <small style={{ color: 'var(--text-tertiary)' }}>
                        {editData.bio.length}/500 characters
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                      <button 
                        onClick={handleUpdateProfile} 
                        className="btn btn-primary"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)} 
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* Posts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 style={{ 
              marginBottom: 'var(--spacing-lg)',
              fontFamily: 'var(--font-display)'
            }}>
              Posts ({posts.length})
            </h2>
            {posts.length === 0 ? (
              <motion.div
                className="card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p style={{ 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)'
                }}>
                  No posts yet.
                </p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Post
                      post={post}
                      onUpdate={loadProfile}
                      onDelete={handleDeletePost}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Profile;
