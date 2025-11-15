import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import Navigation from '../components/Navigation/Navigation';
import { motion, AnimatePresence } from 'framer-motion';

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const response = await usersAPI.getAllUsers();
      setAllUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  const loadConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      const conversations = response.data;
      
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (msg) => {
          const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          try {
            const userResponse = await usersAPI.getUser(otherUserId);
            return { ...msg, otherUser: userResponse.data };
          } catch (error) {
            return { ...msg, otherUser: { id: otherUserId, username: 'Unknown' } };
          }
        })
      );
      
      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await messagesAPI.getConversation(userId);
      setMessages(response.data || []);
      if (response.data && response.data.length > 0) {
        const unreadMessages = response.data.filter(
          (msg) => !msg.is_read && msg.recipient_id === user.id
        );
        for (const msg of unreadMessages) {
          await messagesAPI.markAsRead(msg.id);
        }
        await loadUnreadCount();
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        setMessages([]);
      } else {
        console.error('Failed to load messages:', error);
        setMessages([]);
      }
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await messagesAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    try {
      await messagesAPI.sendMessage({
        recipient_id: selectedUser.id,
        content: newMessage,
      });
      setNewMessage('');
      await loadMessages(selectedUser.id);
      await loadConversations();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = (message) => {
    if (message.otherUser) {
      return message.otherUser;
    }
    if (message.sender_id === user.id) {
      return message.sender || { id: message.recipient_id, username: 'Unknown' };
    } else {
      return message.sender || { id: message.sender_id, username: 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleStartNewConversation = async (targetUser) => {
    setSelectedUser(targetUser);
    setShowNewMessage(false);
    setSearchQuery('');
    await loadMessages(targetUser.id);
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== user.id && (
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
          <div className="loading">Loading conversations...</div>
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
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '350px 1fr',
            gap: 'var(--spacing-lg)',
            height: 'calc(100vh - 150px)',
            minHeight: '600px'
          }}>
            {/* Conversations Sidebar */}
            <motion.div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div style={{ 
                padding: 'var(--spacing-lg)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
                  Conversations {unreadCount > 0 && (
                    <span style={{
                      marginLeft: 'var(--spacing-sm)',
                      padding: '0.125rem 0.5rem',
                      background: 'var(--error)',
                      color: 'white',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <motion.button
                  onClick={() => {
                    setShowNewMessage(!showNewMessage);
                    if (!showNewMessage) {
                      setSelectedUser(null);
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showNewMessage ? 'Cancel' : '+ New'}
                </motion.button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
                <AnimatePresence>
                  {showNewMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginBottom: 'var(--spacing-md)', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--border-light)' }}
                    >
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          border: '2px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--spacing-md)',
                          fontFamily: 'var(--font-body)'
                        }}
                      />
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center' }}>
                            No users found
                          </p>
                        ) : (
                          filteredUsers.map((u) => (
                            <motion.div
                              key={u.id}
                              onClick={() => handleStartNewConversation(u)}
                              style={{
                                padding: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-sm)',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)',
                              }}
                              whileHover={{ backgroundColor: 'var(--bg-secondary)', scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{u.username}</div>
                              {u.full_name && (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                  {u.full_name}
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showNewMessage && (
                  <>
                    {conversations.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        No conversations yet.
                      </p>
                    ) : (
                      conversations.map((msg, index) => {
                        const otherUser = getOtherUser(msg);
                        return (
                          <motion.div
                            key={msg.id}
                            onClick={async () => {
                              if (!otherUser.username || otherUser.username === 'Unknown') {
                                try {
                                  const userResponse = await usersAPI.getUser(otherUser.id);
                                  setSelectedUser(userResponse.data);
                                } catch (error) {
                                  setSelectedUser(otherUser);
                                }
                              } else {
                                setSelectedUser(otherUser);
                              }
                            }}
                            style={{
                              padding: 'var(--spacing-md)',
                              marginBottom: 'var(--spacing-sm)',
                              backgroundColor: selectedUser?.id === otherUser.id ? 'var(--bg-tertiary)' : 'transparent',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              border: selectedUser?.id === otherUser.id ? '2px solid var(--primary)' : '1px solid transparent',
                              transition: 'all var(--transition-base)',
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                              {otherUser.username}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              {msg.content.substring(0, 50)}...
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              {formatDate(msg.created_at)}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            </motion.div>

            {/* Messages Area */}
            <motion.div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden'
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {selectedUser ? (
                <>
                  <div style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.25rem'
                      }}>
                        {(selectedUser.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
                          {selectedUser.username}
                        </h3>
                        {selectedUser.full_name && (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {selectedUser.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-lg)',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: 'var(--text-secondary)', 
                        marginTop: '50%',
                        transform: 'translateY(-50%)'
                      }}>
                        <p style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-sm)' }}>
                          No messages yet.
                        </p>
                        <p style={{ color: 'var(--text-tertiary)' }}>
                          Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div style={{
                            maxWidth: '70%',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-lg)',
                            background: msg.sender_id === user.id 
                              ? 'var(--primary)'
                              : 'var(--bg-secondary)',
                            color: msg.sender_id === user.id ? 'white' : 'var(--text-primary)',
                            boxShadow: 'var(--shadow-md)',
                            border: msg.sender_id === user.id ? 'none' : '1px solid var(--border-light)'
                          }}>
                            <p style={{ 
                              margin: 0, 
                              marginBottom: 'var(--spacing-xs)', 
                              lineHeight: 1.6,
                              color: msg.sender_id === user.id ? 'white' : 'var(--text-primary)'
                            }}>
                              {msg.content}
                            </p>
                            <div style={{
                              fontSize: '0.75rem',
                              opacity: 0.8,
                              textAlign: 'right',
                              color: msg.sender_id === user.id ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-tertiary)'
                            }}>
                              {formatDate(msg.created_at)}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} style={{
                    padding: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    alignItems: 'flex-end'
                  }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows="2"
                        maxLength={5000}
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={sending}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)', 
                  marginTop: '50%',
                  transform: 'translateY(-50%)'
                }}>
                  <p style={{ fontSize: '1.25rem' }}>
                    Select a conversation to start messaging
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Inbox;
