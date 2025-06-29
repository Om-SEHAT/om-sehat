import React, { useState, useEffect } from 'react';
import TypingEffect from './TypingEffect';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string; // optional image for multimodal
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp, imageUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTypingEffect, setShowTypingEffect] = useState(!isUser);
  const [typingComplete, setTypingComplete] = useState(isUser);

  useEffect(() => {
    // Add a small delay before showing the message for a staggered effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleTypingComplete = () => {
    setTypingComplete(true);
    setShowTypingEffect(false);
  };

  return (
    <div
      className={`message ${isUser ? 'user-message' : 'bot-message'} ${isVisible ? 'visible' : ''}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="message-bubble">
        <div className="message-content">
          {/* If image is present, show it above the text */}
          {imageUrl && (
            <div className="flex justify-center mb-2">
              <img
                src={imageUrl}
                alt="uploaded"
                className="max-w-[220px] max-h-40 rounded-lg border border-gray-200 shadow-sm object-cover"
                style={{ background: '#f8fafc', padding: 4 }}
              />
            </div>
          )}
          {isUser ? (
            // User messages are displayed directly
            message.split('\n').map((line, index) => (
              <p key={index}>{line || ' '}</p>
            ))
          ) : (
            // Bot messages show typing effect
            showTypingEffect ? (
              <TypingEffect
                text={message}
                typingSpeed={20}
                onComplete={handleTypingComplete}
              />
            ) : (
              // After typing is complete, show the full message
              message.split('\n').map((line, index) => (
                <p key={index}>{line || ' '}</p>
              ))
            )
          )}
        </div>
      </div>
      <div className="message-meta">
        <span className="message-time" title={formatDate(timestamp)}>
          {formatTime(timestamp)}
        </span>
        {isUser && typingComplete && (
          <span className="message-status">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
