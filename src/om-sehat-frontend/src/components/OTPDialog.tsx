import { useState, useRef, useEffect } from 'react';
import '../styles/otp-dialog.css';

interface OTPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  email: string;
  isLoading: boolean;
  error: string | null;
}

const OTPDialog = ({ isOpen, onClose, onSubmit, email, isLoading, error }: OTPDialogProps) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle focus trap within the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        const focusableElements = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first input when dialog opens
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle OTP input changes
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasted, distribute characters across inputs
      const pastedValue = value.split('').slice(0, 6);
      
      const newOtp = [...otp];
      pastedValue.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      
      setOtp(newOtp);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + pastedValue.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else {
      // Single character input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle keydown events (backspace, arrow keys)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP submission
  const handleSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      await onSubmit(otpValue);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="otp-dialog-overlay" onClick={onClose}>
      <div 
        className="otp-dialog-container" 
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-labelledby="otp-dialog-title"
        aria-describedby="otp-dialog-description"
      >
        <div className="otp-dialog-header">
          <h2 id="otp-dialog-title" className="otp-dialog-title">Verifikasi OTP</h2>
          <button className="otp-close-button" onClick={onClose} aria-label="Close dialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="otp-dialog-content">
          <p id="otp-dialog-description" className="otp-description">
            Masukkan kode OTP yang telah dikirimkan ke email <strong>{email}</strong>
          </p>
          
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className="otp-input"
                aria-label={`OTP digit ${index + 1}`}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
              />
            ))}
          </div>
          
          {error && (
            <div className="otp-error-message">
              <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="otp-actions">
            <button 
              className="otp-resend-button" 
              type="button" 
              onClick={() => alert('Fitur resend OTP belum tersedia')}
            >
              Kirim Ulang OTP
            </button>
            
            <button 
              className="otp-submit-button" 
              type="button"
              onClick={handleSubmit}
              disabled={otp.join('').length !== 6 || isLoading}
            >
              {isLoading ? (
                <span className="button-content-with-loader">
                  <svg className="spinner-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" stroke="currentColor" strokeDasharray="30" strokeDashoffset="10" />
                  </svg>
                  <span>Verifikasi...</span>
                </span>
              ) : 'Verifikasi OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPDialog;
