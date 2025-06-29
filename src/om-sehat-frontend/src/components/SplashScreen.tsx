import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isClicked, setIsClicked] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Track window size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div 
      className="splash-screen"
      style={{
        opacity: isClicked ? 0 : 1
      }}
      onClick={handleClick}
      aria-label="Splash Screen, click to enter the application"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Logo */}
      <div className="splash-content">
        <img 
          src="/splash-logo.png" 
          alt="Om SEHAT" 
          className="splash-logo"
          style={{
            width: windowSize.width < 768 ? '300px' : windowSize.width < 1024 ? '600px' : '975px',
            maxHeight: windowSize.width < 768 ? '200px' : '284px',
            marginBottom: windowSize.width < 768 ? '32px' : '139px'
          }}
        />
        
        {/* Call to action text */}
        <p className="splash-cta" style={{ fontSize: windowSize.width < 768 ? '14px' : '16px' }}>
          Press anywhere to start!
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
