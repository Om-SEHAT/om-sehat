import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useFocusTrap from '../hooks/useFocusTrap';
import { countries, regions, getCountryFlag } from '../utils/countries';
import OTPDialog from './OTPDialog';
import SensorReadingDialog from './SensorReadingDialog';
import { API_ENDPOINTS, getAuthHeaders } from '../utils/api';
import { useMqtt, MQTT_TOPICS } from '../utils/mqtt';
import type { MaxSensorData, MlxSensorData } from '../utils/mqtt';
import '../styles/sensor-dialog.css';

export interface PatientFormData {
  fullName: string;
  email: string;
  weight: string;
  height: string;
  dateOfBirth: string;
  nationality: string;
  heartRate: string;
  bodyTemperature: string;
  sex: string;
}

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  initialData?: Partial<PatientFormData>;
  onCancel?: () => void;
}

const PatientForm = ({ onSubmit, initialData = {}, onCancel }: PatientFormProps) => {
  const [formData, setFormData] = useState<PatientFormData>({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    weight: initialData.weight || '',
    height: initialData.height || '',
    dateOfBirth: initialData.dateOfBirth || '',
    nationality: initialData.nationality || '',
    heartRate: initialData.heartRate || '',
    bodyTemperature: initialData.bodyTemperature || '',
    sex: initialData.sex || '',
  });

  const [errors, setErrors] = useState<Partial<PatientFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<unknown>(null);
  
  const [showSensorDialog, setShowSensorDialog] = useState(false);
  const [activeSensorType, setActiveSensorType] = useState<'heartRate' | 'bodyTemperature' | null>(null);
  const [sensorError, setSensorError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const formContainerRef = useFocusTrap();
  const mqtt = useMqtt();
  const heartRateListenerRef = useRef<((data: any) => void) | null>(null);
  const tempListenerRef = useRef<((data: any) => void) | null>(null);

  const resetForm = () => {
    setFormData({
      fullName: '', email: '', weight: '', height: '',
      dateOfBirth: '', nationality: '', heartRate: '',
      bodyTemperature: '', sex: '',
    });
    setErrors({});
    setApiError(null);
    setOtpError(null);
    setShowOtpDialog(false);
    setShowSensorDialog(false);
    setSensorError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};
    
    if (!formData.fullName) newErrors.fullName = "Nama lengkap wajib diisi";
    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.weight) {
      newErrors.weight = "Berat badan wajib diisi";
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      newErrors.weight = "Berat badan harus berupa angka positif";
    } else if (Number(formData.weight) > 300) {
      newErrors.weight = "Berat badan tidak valid";
    }
    
    if (!formData.height) {
      newErrors.height = "Tinggi badan wajib diisi";
    } else if (isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
      newErrors.height = "Tinggi badan harus berupa angka positif";
    } else if (Number(formData.height) > 300) {
      newErrors.height = "Tinggi badan tidak valid";
    }
    
    if (!formData.heartRate) {
      newErrors.heartRate = "Detak jantung wajib diisi";
    } else if (isNaN(Number(formData.heartRate)) || Number(formData.heartRate) <= 0) {
      newErrors.heartRate = "Detak jantung harus berupa angka positif";
    } else if (Number(formData.heartRate) < 40 || Number(formData.heartRate) > 200) {
      newErrors.heartRate = "Detak jantung tidak dalam rentang normal";
    }
    
    if (!formData.bodyTemperature) {
      newErrors.bodyTemperature = "Suhu badan wajib diisi";
    } else if (isNaN(Number(formData.bodyTemperature)) || Number(formData.bodyTemperature) <= 0) {
      newErrors.bodyTemperature = "Suhu badan harus berupa angka positif";
    } else if (Number(formData.bodyTemperature) < 20 || Number(formData.bodyTemperature) > 50) {
      newErrors.bodyTemperature = "Suhu badan tidak dalam rentang normal";
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Tanggal lahir wajib diisi";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      if (birthDate > today) {
        newErrors.dateOfBirth = "Tanggal lahir tidak boleh di masa depan";
      } else if (today.getFullYear() - birthDate.getFullYear() > 120) {
        newErrors.dateOfBirth = "Tanggal lahir tidak valid";
      }
    }
    if (!formData.nationality) newErrors.nationality = "Kewarganegaraan wajib diisi";
    if (!formData.sex) newErrors.sex = "Jenis kelamin wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear any previous API errors
    setApiError(null);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Format the data according to the API requirements
        const formattedData = {
          name: formData.fullName,
          email: formData.email,
          weight: Number(formData.weight),
          height: Number(formData.height),
          gender: formData.sex,
          heartrate: Number(formData.heartRate),
          bodytemp: Number(formData.bodyTemperature),
          nationality: countries.find(c => c.code === formData.nationality)?.name || "",
          dob: new Date(formData.dateOfBirth).toISOString(),
          otp: null
        };
        setRegistrationData(formattedData);
        const response = await fetch(API_ENDPOINTS.USER.REGISTER, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formattedData)
        });
        const data = await response.json();
        if (!response.ok) {
          const errorMessage = data.message || `Error: ${response.status} ${response.statusText}`;
          setApiError(errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log('Registration initiated successfully:', data);
        
        // Show OTP dialog for verification
        setShowOtpDialog(true);
      } catch (error) {
        console.error('Registration failed:', error);
        // If there's no API error set yet, set a generic error
        if (!apiError) {
          setApiError('Terjadi kesalahan saat mengirim data. Silakan coba lagi.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (otp: string) => {
    if (!registrationData) {
      setOtpError('Data registrasi tidak ditemukan. Silakan coba lagi.');
      return;
    }
    
    setIsOtpLoading(true);
    setOtpError(null);
    
    try {
      const verificationData = { ...registrationData as any, otp: otp };
      const response = await fetch(API_ENDPOINTS.USER.VERIFY_OTP, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(verificationData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || `Error: ${response.status} ${response.statusText}`;
        setOtpError(errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('OTP verification successful:', data);
      
      // Get session ID from response
      const sessionId = data.session?.id;
      if (!sessionId) {
        setOtpError('Tidak dapat menemukan session ID. Silakan coba lagi.');
        throw new Error('Session ID not found in response');
      }
      
      // Send initial chat message
      try {
        const chatResponse = await fetch(API_ENDPOINTS.SESSION.UPDATE(sessionId), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ new_message: "Hello!" })
        });
        
        const chatData = await chatResponse.json();
        console.log('Initial chat message sent:', chatData);
      } catch (chatError) {
        console.error('Failed to initialize chat:', chatError);
      }
      onSubmit(formData); // Notify parentAdd commentMore actions
      navigate(`/om-sapa/chat/${sessionId}`); // Navigate after onSubmit
    } catch (error) {
      console.error('OTP verification failed:', error);
      if (!otpError) { // Only set generic if a specific one isn't already set
        setOtpError('Verifikasi OTP gagal. Silakan coba lagi.');
      }
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    resetForm();
  };

  const calculatedAge = useMemo(() => {
    if (!formData.dateOfBirth) return null;
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  }, [formData.dateOfBirth]);

  // --- MQTT Sensor Integration ---

  // Generic function to clean up MQTT listeners and subscriptions for a sensor
  const cleanupMqttSensor = useCallback(async (sensorTypeToClean: 'heartRate' | 'bodyTemperature') => {
    if (sensorTypeToClean === 'heartRate') {
      if (heartRateListenerRef.current) {
        mqtt.removeListener(MQTT_TOPICS.MAX_DATA, heartRateListenerRef.current);
        heartRateListenerRef.current = null; // Clear the ref
      }
      try {
        await mqtt.unsubscribe(MQTT_TOPICS.MAX_DATA);
        console.log('Unsubscribed from MAX_DATA');
      } catch (e) {
        console.warn('Already unsubscribed or error unsubscribing from MAX_DATA:', e);
      }
    } else if (sensorTypeToClean === 'bodyTemperature') {
      if (tempListenerRef.current) {
        mqtt.removeListener(MQTT_TOPICS.MLX_DATA, tempListenerRef.current);
        tempListenerRef.current = null; // Clear the ref
      }
      try {
        await mqtt.unsubscribe(MQTT_TOPICS.MLX_DATA);
        console.log('Unsubscribed from MLX_DATA');
      } catch (e) {
        console.warn('Already unsubscribed or error unsubscribing from MLX_DATA:', e);
      }
    }
  }, [mqtt]);
  
  const handleHeartRateRead = async () => {
    setActiveSensorType('heartRate');
    setShowSensorDialog(true);
    setSensorError(null);

    await cleanupMqttSensor('heartRate'); // Clean up previous attempts

    try {
      await mqtt.connect();
      await mqtt.subscribe(MQTT_TOPICS.MAX_DATA);
      console.log('Subscribed to MAX_DATA');

      const listener = (data: unknown) => {
        try {
          const sensorData = data as MaxSensorData;
          if (sensorData && typeof sensorData.heartRate === 'number') {
            setFormData(prev => ({ ...prev, heartRate: sensorData.heartRate.toString() }));
            setShowSensorDialog(false);
          } else {
            console.warn('Received malformed heart rate data:', data);
            setSensorError('Data detak jantung tidak valid dari sensor.');
            // Keep dialog open to show this error, user can cancel.
          }
        } catch (e) {
          console.error('Error processing heart rate data:', e);
          setSensorError('Gagal memproses data detak jantung.');
        } finally {
          cleanupMqttSensor('heartRate'); // Clean up after processing or error
        }
      };
      heartRateListenerRef.current = listener;
      mqtt.addListener(MQTT_TOPICS.MAX_DATA, listener);
      await mqtt.requestSensorData("max");
    } catch (error) {
      console.error('Error setting up MQTT for heart rate:', error);
      setSensorError('Gagal terhubung ke sensor detak jantung. Silakan input manual.');
      await cleanupMqttSensor('heartRate'); // Cleanup on setup error
    }
  };

  const handleBodyTemperatureRead = async () => {
    setActiveSensorType('bodyTemperature');
    setShowSensorDialog(true);
    setSensorError(null);

    await cleanupMqttSensor('bodyTemperature'); // Clean up previous attempts

    try {
      await mqtt.connect();
      await mqtt.subscribe(MQTT_TOPICS.MLX_DATA);
      console.log('Subscribed to MLX_DATA');

      const listener = (data: unknown) => {
        try {
          const sensorData = data as MlxSensorData;
          if (sensorData && typeof sensorData.temp === 'number') {
            // Store as string for input, but keep float value for backend
            setFormData(prev => ({
              ...prev,
              bodyTemperature: sensorData.temp.toFixed(3) // show 2 decimals in input
            }));
            setShowSensorDialog(false);
          } else {
            console.warn('Received malformed temperature data:', data);
            setSensorError('Data suhu tubuh tidak valid dari sensor.');
          }
        } catch (e) {
          console.error('Error processing temperature data:', e);
          setSensorError('Gagal memproses data suhu tubuh.');
        } finally {
          cleanupMqttSensor('bodyTemperature'); // Clean up after processing or error
        }
      };
      tempListenerRef.current = listener;
      mqtt.addListener(MQTT_TOPICS.MLX_DATA, listener);
      await mqtt.requestSensorData("mlx");
    } catch (error) {
      console.error('Error setting up MQTT for temperature:', error);
      setSensorError('Gagal terhubung ke sensor suhu. Silakan input manual.');
      await cleanupMqttSensor('bodyTemperature'); // Cleanup on setup error
    }
  };

  const handleSensorCancel = async () => {
    setShowSensorDialog(false);
    if (activeSensorType) {
      await cleanupMqttSensor(activeSensorType);
    }
    setActiveSensorType(null);
  };

  useEffect(() => {
    return () => {
      if (activeSensorType) { // if a sensor reading was active
         cleanupMqttSensor(activeSensorType);
      } else { // if no specific sensor was active, try to clean both just in case
         cleanupMqttSensor('heartRate');
         cleanupMqttSensor('bodyTemperature');
      }
      mqtt.disconnect(); // Disconnect MQTT client
    };
  }, [mqtt, cleanupMqttSensor, activeSensorType]); 

  return (
    <div className="patient-form-container" ref={formContainerRef}>
      <form onSubmit={handleSubmit} className="patient-form" noValidate aria-labelledby="form-title">
        <div className="form-section">
          <h3 className="form-section-title">Informasi Pribadi</h3>
          
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Nama Lengkap <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`form-input with-icon ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input with-icon ${errors.email ? 'input-error' : ''}`}
                placeholder="Masukkan alamat email Anda"
              />
            </div>
            <small className="field-hint">Digunakan untuk konfirmasi dan komunikasi medis</small>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Informasi Fisik</h3>
          
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="weight" className="form-label">
                Berat Badan <span className="required">*</span>
              </label>
              <div className="input-with-suffix input-with-icon">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"/>
                  <path d="M9 22V12h6v10M2 10s2-2 5-2h10c3 0 5 2 5 2"/>
                </svg>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  step="0.1"
                  min="1"
                  max="300"
                  className={`form-input with-icon ${errors.weight ? 'input-error' : ''}`}
                  placeholder="70"
                  aria-describedby="weight-hint"
                />
                <span className="input-suffix">kg</span>
              </div>
              <small className="field-hint">Masukkan berat badan dalam kilogram</small>
              {errors.weight && <span className="error-message">{errors.weight}</span>}
            </div>

            <div className="form-group half-width">
              <label htmlFor="height" className="form-label">
                Tinggi Badan <span className="required">*</span>
              </label>
              <div className="input-with-suffix input-with-icon">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="3" x2="12" y2="21"></line>
                  <polyline points="8 8 12 4 16 8"></polyline>
                  <polyline points="8 16 12 20 16 16"></polyline>
                </svg>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  step="0.1"
                  min="1"
                  max="300"
                  className={`form-input with-icon ${errors.height ? 'input-error' : ''}`}
                  placeholder="175"
                  aria-describedby="height-hint"
                />
                <span className="input-suffix">cm</span>
              </div>
              <small className="field-hint">Masukkan tinggi badan dalam sentimeter</small>
              {errors.height && <span className="error-message">{errors.height}</span>}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="dateOfBirth" className="form-label">
              Tanggal Lahir <span className="required">*</span>
            </label>
            <div className="input-with-icon date-picker-container">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`form-input with-icon ${errors.dateOfBirth ? 'input-error' : ''}`}
                aria-describedby="dob-hint"
              />
              <div className="date-picker-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            <div className="dob-info">
              <small id="dob-hint" className="field-hint">Format: MM/DD/YYYY</small>
              {calculatedAge !== null && (
                <span className="age-display">
                  <svg className="age-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Usia: {calculatedAge} tahun
                </span>
              )}
            </div>
            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
          </div>

          <div className="form-group half-width">
            <label htmlFor="nationality" className="form-label">
              Kewarganegaraan <span className="required">*</span>
            </label>
            <div className={`select-with-icon ${formData.nationality ? 'has-value' : ''}`}>
              <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <select
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className={`form-select with-icon ${errors.nationality ? 'input-error' : ''}`}
                aria-describedby="nationality-hint"
              >
                <option value="">Pilih negara</option>
                {regions.map(region => (
                  <optgroup key={region} label={region}>
                    {countries
                      .filter(country => country.region === region)
                      .map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <div className="select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {formData.nationality && (
                <div className="selected-country">
                  <span className="country-flag">{getCountryFlag(formData.nationality)}</span>
                </div>
              )}
            </div>
            <small id="nationality-hint" className="field-hint">Pilih negara sesuai kewarganegaraan pada paspor atau KTP Anda</small>
            {errors.nationality && <span className="error-message">{errors.nationality}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="heartRate" className="form-label">
              Detak Jantung <span className="required">*</span>
            </label>
            <div className="input-with-controls">
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="heartRate"
                  name="heartRate"
                  value={formData.heartRate}
                  onChange={handleChange}
                  step="1"
                  min="40"
                  max="200"
                  className={`form-input ${errors.heartRate ? 'input-error' : ''}`}
                  placeholder="75"
                  aria-describedby="heartrate-hint"
                />
                <span className="input-suffix">bpm</span>
              </div>
              <button type="button" className="sensor-read-button" onClick={handleHeartRateRead} aria-label="Read heart rate from sensor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12h2l3.6-9 3.6 18 3.6-9 3.6 9h4.8"></path>
                </svg>
              </button>
            </div>
            <small className="field-hint">Masukkan rata-rata detak jantung per menit</small>
            {errors.heartRate && <span className="error-message">{errors.heartRate}</span>}
          </div>

          <div className="form-group half-width">
            <label htmlFor="bodyTemperature" className="form-label">
              Suhu Badan <span className="required">*</span>
            </label>
            <div className="input-with-controls">
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="bodyTemperature"
                  name="bodyTemperature"
                  value={formData.bodyTemperature}
                  onChange={handleChange}
                  step="0.1"
                  min="35"
                  max="42"
                  className={`form-input ${errors.bodyTemperature ? 'input-error' : ''}`}
                  placeholder="37.5"
                  aria-describedby="temperature-hint"
                />
                <span className="input-suffix">°C</span>
              </div>
              <button type="button" className="sensor-read-button" onClick={handleBodyTemperatureRead} aria-label="Read body temperature from sensor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a4 4 0 1 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <circle cx="12" cy="14" r="1"></circle>
                </svg>
              </button>
            </div>
            <small className="field-hint">Masukkan suhu badan dalam derajat Celsius</small>
            {errors.bodyTemperature && <span className="error-message">{errors.bodyTemperature}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Jenis Kelamin <span className="required">*</span>
          </label>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="male"
                name="sex"
                value="Male"
                checked={formData.sex === "Male"}
                onChange={handleChange}
                className="radio-input"
              />
              <label htmlFor="male" className="radio-label">Pria</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="female"
                name="sex"
                value="Female"
                checked={formData.sex === "Female"}
                onChange={handleChange}
                className="radio-input"
              />
              <label htmlFor="female" className="radio-label">Wanita</label>
            </div>
          </div>
          {errors.sex && <span className="error-message">{errors.sex}</span>}
        </div>

        <div className="form-actions">
          {apiError && (
            <div className="api-error-message">
              <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{apiError}</span>
            </div>
          )}
          <div className="form-buttons">
            <button 
              type="submit" 
              className="btn btn-primary submit-button" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="button-content-with-loader">
                  <svg className="spinner-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" stroke="currentColor" strokeDasharray="30" strokeDashoffset="10" />
                  </svg>
                  <span>Mengirim...</span>
                </span>
              ) : 'Kirim'}
            </button>
            <button 
              type="button" 
              onClick={resetForm} 
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Reset
            </button>
            {onCancel && (
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </form>
      
      {/* OTP Dialog */}
      <OTPDialog
        isOpen={showOtpDialog}
        onClose={() => setShowOtpDialog(false)}
        onSubmit={handleVerifyOtp}
        email={formData.email}
        isLoading={isOtpLoading}
        error={otpError}
      />
      <SensorReadingDialog
        isOpen={showSensorDialog}
        sensorType={activeSensorType}
        onCancel={handleSensorCancel} // This will now also trigger MQTT cleanup
        onComplete={() => { /* onComplete from dialog not strictly needed if data is set directly */ }}
        error={sensorError}
      />
    </div>
  );
};

export default PatientForm;
