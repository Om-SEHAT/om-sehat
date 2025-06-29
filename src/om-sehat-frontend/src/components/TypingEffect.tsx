import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  typingSpeed?: number;
  initialDelay?: number;
  onComplete?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ 
  text, 
  typingSpeed = 30, 
  initialDelay = 300,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex === 0) {
      // Initial delay before starting to type
      const startTimer = setTimeout(() => {
        setCurrentIndex(1);
      }, initialDelay);
      
      return () => clearTimeout(startTimer);
    }
    
    if (currentIndex > text.length) {
      setIsComplete(true);
      onComplete && onComplete();
      return;
    }
    
    // Calculate dynamic typing speed based on character
    const nextChar = text[currentIndex - 1];
    let speed = typingSpeed;
    
    // Slow down at punctuation
    if (['.', '!', '?', ',', ':'].includes(nextChar)) {
      speed = typingSpeed * 6;
    } else if (nextChar === ' ') {
      speed = typingSpeed * 0.5;
    }
    
    const timer = setTimeout(() => {
      setDisplayedText(text.substring(0, currentIndex));
      setCurrentIndex(prevIndex => prevIndex + 1);
    }, speed);
    
    return () => clearTimeout(timer);
  }, [currentIndex, text, typingSpeed, initialDelay, onComplete]);

  // Convert newlines to paragraphs for proper rendering
  const renderText = () => {
    if (!displayedText) return <p>&nbsp;</p>;
    
    return displayedText.split('\n').map((line, index) => (
      <p key={index}>{line || ' '}</p>
    ));
  };

  return (
    <div className={`typing-effect ${isComplete ? 'typing-complete' : ''}`}>
      {renderText()}
      {!isComplete && <span className="typing-cursor"></span>}
    </div>
  );
};

export default TypingEffect;
