import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';

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
      
      // Fetch user info for each conversation
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
      // Mark messages as read
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
      // If no conversation exists yet, set empty messages
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
    // Load messages if they exist, otherwise show empty conversation
    await loadMessages(targetUser.id);
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="container">Loading...</div>;
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
        <h1>Inbox {unreadCount > 0 && `(${unreadCount})`}</h1>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Home
        </button>
      </header>

      <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
        <div style={{
          width: '300px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '15px',
          overflowY: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>Conversations</h2>
            <button
              onClick={() => {
                setShowNewMessage(!showNewMessage);
                if (!showNewMessage) {
                  setSelectedUser(null);
                }
              }}
              className="btn btn-primary"
              style={{ padding: '5px 10px', fontSize: '14px' }}
            >
              {showNewMessage ? 'Cancel' : '+ New'}
            </button>
          </div>

          {showNewMessage && (
            <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '10px',
                }}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>No users found</p>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleStartNewConversation(u)}
                      style={{
                        padding: '8px',
                        marginBottom: '5px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{u.username}</div>
                      {u.full_name && (
                        <div style={{ fontSize: '12px', color: '#666' }}>{u.full_name}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {!showNewMessage && (
            <>
              {conversations.length === 0 ? (
                <p style={{ color: '#666' }}>No conversations yet.</p>
              ) : (
            conversations.map((msg) => {
              const otherUser = getOtherUser(msg);
              return (
                <div
                  key={msg.id}
                  onClick={async () => {
                    // Fetch full user info if not already available
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
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: selectedUser?.id === otherUser.id ? '#f0f0f0' : 'transparent',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{otherUser.username}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {msg.content.substring(0, 50)}...
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                    {formatDate(msg.created_at)}
                  </div>
                </div>
              );
            })
              )}
            </>
          )}
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          {selectedUser ? (
            <>
              <div style={{
                borderBottom: '1px solid #eee',
                paddingBottom: '15px',
                marginBottom: '15px',
              }}>
                <h2>{selectedUser.username}</h2>
                {selectedUser.full_name && <p style={{ color: '#666' }}>{selectedUser.full_name}</p>}
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '5px',
                minHeight: '200px',
              }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '15px',
                      textAlign: msg.sender_id === user.id ? 'right' : 'left',
                    }}
                  >
                    <div style={{
                      display: 'inline-block',
                      maxWidth: '70%',
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: msg.sender_id === user.id ? '#007bff' : '#e9ecef',
                      color: msg.sender_id === user.id ? 'white' : 'black',
                    }}>
                      <p style={{ margin: 0 }}>{msg.content}</p>
                      <div style={{
                        fontSize: '11px',
                        marginTop: '5px',
                        opacity: 0.7,
                      }}>
                        {formatDate(msg.created_at)}
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    rows="2"
                    maxLength={5000}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '50%' }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;

