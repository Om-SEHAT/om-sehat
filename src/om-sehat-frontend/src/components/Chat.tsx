import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import '../styles/chat-enhanced-v2.css'; // Updated to use the new enhanced styles
import { API_ENDPOINTS, getAuthHeaders } from '../utils/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState('Ketik pesan Anda... (Ctrl+Enter untuk mengirim)');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus textarea when component mounts
  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 500);
  }, []);

  // Handle scroll position in messages container
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Create placeholders that change periodically
  useEffect(() => {
    const placeholders = [
      'Ketik pesan Anda... (Ctrl+Enter untuk mengirim)',
      'Tanyakan tentang gejala Anda...',
      'Bagaimana perasaan Anda hari ini?',
      'Ada pertanyaan kesehatan?'
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setPlaceholder(placeholders[index]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Initialize chat with welcome message when component mounts
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Fetch initial message or use a default welcome
    setIsLoading(true);

    fetch(API_ENDPOINTS.SESSION.GET(sessionId), {
      method: 'GET',
      headers: getAuthHeaders()
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to initialize chat');
        }
        return response.json();
      })
      .then(data => {
        // Add welcome message
        if (data.reply) {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: data.reply,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        } else {
          // Fallback welcome message
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: "Halo! Selamat datang di Om Sapa. Silakan pilih bahasa yang Anda inginkan:\na. Bahasa Indonesia\nb. English",
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      })
      .catch(error => {
        console.error('Error initializing chat:', error);
        // Add fallback message
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "Terjadi kesalahan saat memulai percakapan. Silakan coba lagi nanti.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId, navigate]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Send message to API
      const response = await fetch(API_ENDPOINTS.SESSION.UPDATE(sessionId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ new_message: newMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add bot response to chat with slight delay for better UX
      if (data.reply) {
        // Show typing indicator
        setIsTyping(true);

        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.reply,
            sender: 'bot',
            timestamp: new Date()
          };

          setMessages(prevMessages => [...prevMessages, botMessage]);
          setIsTyping(false);
        }, 1000); // Delay response for more natural conversation feel
      }

      // Handle special next_action if needed
      if (data.next_action && data.next_action !== "CONTINUE_CHAT") {
        // Handle different next actions as needed
        console.log('Next action:', data.next_action);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle textarea input and auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Handle key presses in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Om SAPA</h2>
        <p>AI Asisten Kesehatan Profesional</p>
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map(message => (
          <ChatMessage
            key={message.id}
            message={message.text}
            isUser={message.sender === 'user'}
            timestamp={message.timestamp}
          />
        ))}
        {(isLoading || isTyping) && (
          <div className="message bot-message">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {showScrollButton && (
          <button
            className="scroll-to-bottom"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      <div className="message-input-container">
        <div className="message-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="message-textarea"
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
          />
        </div>
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isLoading}
          title="Kirim pesan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;