import { useState } from 'react';
import { Send } from 'lucide-react';
import { validateForm, type ValidationRule } from '../utils/validation';

interface ContactFormProps {
  title?: string;
  subtitle?: string;
  onSubmit?: (data: ContactFormData) => Promise<void>;
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const ContactForm = ({ 
  title = "Hubungi Kami", 
  subtitle = "Kami siap membantu Anda 24/7",
  onSubmit,
  className = ""
}: ContactFormProps) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validationRules: Record<string, ValidationRule> = {
    name: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, email: true },
    phone: { required: true, phone: true },
    message: { required: true, minLength: 10, maxLength: 500 }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(formData as unknown as Record<string, string>, validationRules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default behavior - simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrors({ submit: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle">{subtitle}</p>
      </div>

      {submitSuccess && (
        <div className="notification success animate-slideInDown" style={{ marginBottom: '1.5rem' }}>
          <div className="notification-content">
            <div className="notification-title">✅ Pesan Anda berhasil dikirim!</div>
            <div className="notification-message">Kami akan segera menghubungi Anda.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nama Lengkap *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Masukkan nama lengkap Anda"
          />
          {errors.name && (
            <span className="form-error animate-slideInDown">{errors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="contoh@email.com"
          />
          {errors.email && (
            <span className="form-error animate-slideInDown">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Nomor Telepon *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="0812-3456-7890"
          />
          {errors.phone && (
            <span className="form-error animate-slideInDown">{errors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="message" className="form-label">
            Pesan *
          </label>
          <textarea
            id="message"
            rows={4}
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            className={`form-input form-textarea ${errors.message ? 'error' : ''}`}
            placeholder="Ceritakan kebutuhan atau pertanyaan Anda..."
          />
          {errors.message && (
            <span className="form-error animate-slideInDown">{errors.message}</span>
          )}
        </div>

        {errors.submit && (
          <div className="notification error animate-slideInDown">
            <div className="notification-content">
              <div className="notification-message">{errors.submit}</div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {isSubmitting ? (
            <>
              <span className="spinner sm"></span>
              Mengirim...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Kirim Pesan
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
