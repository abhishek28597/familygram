import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getMe: () => api.get('/api/auth/me'),
};

// Users API
export const usersAPI = {
  getAllUsers: () => api.get('/api/users'),
  getUser: (userId) => api.get(`/api/users/${userId}`),
  getUserPosts: (userId) => api.get(`/api/users/${userId}/posts`),
  updateProfile: (data) => api.put('/api/users/me', data),
};

// Posts API
export const postsAPI = {
  getPosts: (skip = 0, limit = 50) => api.get(`/api/posts?skip=${skip}&limit=${limit}`),
  getPost: (postId) => api.get(`/api/posts/${postId}`),
  createPost: (data) => api.post('/api/posts', data),
  updatePost: (postId, data) => api.put(`/api/posts/${postId}`, data),
  deletePost: (postId) => api.delete(`/api/posts/${postId}`),
  likePost: (postId) => api.post(`/api/posts/${postId}/like`),
  dislikePost: (postId) => api.post(`/api/posts/${postId}/dislike`),
  removeReaction: (postId) => api.delete(`/api/posts/${postId}/reaction`),
};

// Comments API
export const commentsAPI = {
  getComments: (postId) => api.get(`/api/posts/${postId}/comments`),
  createComment: (postId, data) => api.post(`/api/posts/${postId}/comments`, data),
  updateComment: (commentId, data) => api.put(`/api/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/api/comments/${commentId}`),
};

// Search API
export const searchAPI = {
  search: (query, skip = 0, limit = 50) => api.get(`/api/search?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`),
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/api/messages'),
  getConversation: (userId) => api.get(`/api/messages/${userId}`),
  sendMessage: (data) => api.post('/api/messages', data),
  markAsRead: (messageId) => api.put(`/api/messages/${messageId}/read`),
  getUnreadCount: () => api.get('/api/messages/unread-count'),
};

// Family API
export const familyAPI = {
  getFamilySummary: (groqApiKey, date = null) => {
    const body = { groq_api_key: groqApiKey };
    if (date) body.date = date;
    return api.post('/api/family/summary', body);
  },
  getUserSummary: (userId, groqApiKey, date = null) => {
    const body = { groq_api_key: groqApiKey };
    if (date) body.date = date;
    return api.post(`/api/family/users/${userId}/summary`, body);
  },
};

export default api;

