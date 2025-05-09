import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Login.css';
import logo from '../image/logo.png';

function LiveChat() {
  const [messages, setMessages] = useState(() => {
    // Load messages from sessionStorage if available
    const saved = sessionStorage.getItem('livechat-messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const chatEndRef = useRef(null);
  const ws = useRef(null);

  // On mount, fetch username from backend using nirapod_identifier
  useEffect(() => {
    const fetchUserName = async () => {
      const identifier = localStorage.getItem('nirapod_identifier');
      if (!identifier) return;
      try {
        const res = await axios.get(`/api/user/by-identifier?value=${identifier}`);
        if (res.data && res.data.name) {
          setUsername(res.data.name);
          setJoined(true);
        }
      } catch (err) {
        // Optionally show error
        setUsername('');
        setJoined(false);
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    // Save messages to sessionStorage whenever they change
    sessionStorage.setItem('livechat-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Save username and joined state
    if (joined) {
      sessionStorage.setItem('livechat-username', username);
      sessionStorage.setItem('livechat-joined', '1');
    } else {
      sessionStorage.removeItem('livechat-joined');
    }
  }, [joined, username]);

  useEffect(() => {
    if (joined) {
      ws.current = new window.WebSocket('ws://localhost:8081');
      ws.current.onopen = () => {
        console.log('WebSocket connection opened');
      };
      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
      ws.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
          event.data.text().then(text => {
            console.log('WebSocket message received (from Blob):', text);
            try {
              const msg = JSON.parse(text);
              setMessages((msgs) => [...msgs, msg]);
            } catch (e) {
              // Ignore non-JSON messages
            }
          });
        } else {
          console.log('WebSocket message received:', event.data);
          try {
            const msg = JSON.parse(event.data);
            setMessages((msgs) => [...msgs, msg]);
          } catch (e) {
            // Ignore non-JSON messages
          }
        }
      };
      return () => ws.current && ws.current.close();
    }
  }, [joined]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // On logout or window close, clear chat and session
    const handleLogout = () => {
      sessionStorage.removeItem('livechat-messages');
      sessionStorage.removeItem('livechat-username');
      sessionStorage.removeItem('livechat-joined');
      setMessages([]);
      setUsername('');
      setJoined(false);
    };
    window.addEventListener('beforeunload', handleLogout);
    return () => window.removeEventListener('beforeunload', handleLogout);
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { user: username, text: input, time: new Date().toLocaleTimeString() };
    ws.current.send(JSON.stringify(msg));
    setInput('');
  };

  const handleLogoutClick = () => {
    sessionStorage.removeItem('livechat-messages');
    sessionStorage.removeItem('livechat-username');
    sessionStorage.removeItem('livechat-joined');
    setMessages([]);
    setUsername('');
    setJoined(false);
    if (ws.current) ws.current.close();
  };

  return (
    <div className="login-bg">
      <div className="login-split">
        <div className="login-left">
          <img src={logo} alt="Nirapod Logo" className="login-logo-img" />
          <div className="login-logo">Nirapod</div>
          <div className="login-tagline">Global Live Chat</div>
        </div>
        <div className="login-right">
          <div className="login-form-box" style={{ minHeight: 420, maxWidth: 420 }}>
            <h2>Live Chat</h2>
            {!joined ? (
              <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>
                Loading chat...
              </div>
            ) : (
              <>
                <div style={{ background: '#1e2233', borderRadius: 12, padding: 12, height: 260, overflowY: 'auto', marginBottom: 16, color: '#fff', fontSize: 15 }}>
                  {messages.length === 0 && <div style={{ color: '#aaa', textAlign: 'center' }}>No messages yet. Say hi!</div>}
                  {messages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 8, wordBreak: 'break-word' }}>
                      <span style={{ color: '#60a5fa', fontWeight: 600 }}>{msg.user}</span>
                      <span style={{ color: '#aaa', fontSize: 12, marginLeft: 8 }}>{msg.time}</span>
                      <div style={{ marginLeft: 8 }}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button className="login-btn" type="submit" style={{ minWidth: 80 }}>Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <footer className="login-footer">
        <a href="/faq" className="footer-link">FAQ</a>
        <a href="/ReachOut" className="footer-link">Reach out</a>
        <a href="/contact" className="footer-link">Contact</a>
      </footer>
    </div>
  );
}

export default LiveChat;
