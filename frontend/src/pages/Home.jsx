import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI, searchAPI } from '../services/api';
import Post from '../components/Post/Post';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getPosts();
      setPosts(response.data);
      setSearchResults(null);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      await postsAPI.createPost({ content: newPost });
      setNewPost('');
      await loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.deletePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      loadPosts();
      return;
    }

    try {
      const response = await searchAPI.search(searchQuery);
      setSearchResults(response.data.posts);
    } catch (error) {
      console.error('Failed to search:', error);
    }
  };

  const displayPosts = searchResults !== null ? searchResults : posts;

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
        <h1>Family Gram</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Welcome, {user?.username}!</span>
          <button onClick={() => navigate(`/profile/${user?.id}`)} className="btn btn-secondary">
            Profile
          </button>
          <button onClick={() => navigate('/inbox')} className="btn btn-secondary">
            Inbox
          </button>
          <button onClick={() => navigate('/family')} className="btn btn-secondary">
            Family
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                loadPosts();
              }}
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Create Post</h2>
        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              rows="4"
              maxLength={5000}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={posting}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>

      {loading ? (
        <div>Loading posts...</div>
      ) : (
        <div>
          {searchResults !== null && (
            <h2 style={{ marginBottom: '15px' }}>Search Results</h2>
          )}
          {displayPosts.length === 0 ? (
            <div className="card">
              <p>No posts found.</p>
            </div>
          ) : (
            displayPosts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onUpdate={loadPosts}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Home;

