import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Post from '../components/Post/Post';

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
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    // This will be handled by the Post component's onDelete callback
    await loadProfile();
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!profileUser) {
    return <div className="container">User not found</div>;
  }

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
        <h1>Profile</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Home
          </button>
          {isOwnProfile && (
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <h2>{profileUser.username}</h2>
          {profileUser.full_name && <p style={{ color: '#666' }}>{profileUser.full_name}</p>}
          {profileUser.bio && <p style={{ marginTop: '10px' }}>{profileUser.bio}</p>}
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            Member since {new Date(profileUser.created_at).toLocaleDateString()}
          </p>
        </div>

        {isOwnProfile && (
          <div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            ) : (
              <div>
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
                </div>
                <button onClick={handleUpdateProfile} className="btn btn-primary" style={{ marginRight: '10px' }}>
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <div className="card">
            <p>No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onUpdate={loadProfile}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;

