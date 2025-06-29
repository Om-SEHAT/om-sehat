import React from 'react';
import '../styles/doctor-modal.css';

interface DoctorDetailProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DoctorDetailData {
  doctor: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    roomno: string;
  };
  appointment_count_daily: number;
  appointment_count_all_time: number;
  current_queue?: {
    id: string;
    doctor_id: string;
    number: number;
    session_id: string;
    session: {
      id: string;
      user_id: string;
      weight: number;
      height: number;
      heartrate: number;
      bodytemp: number;
      prediagnosis: string;
      doctor_diagnosis: string;
      created_at: string;
      updated_at: string;
      user: {
        id: string;
        name: string;
        email: string;
        nationality: string;
        dob: string;
        gender: string;
        created_at: string;
        updated_at: string;
      };
    };
    created_at: string;
    updated_at: string;
  };
}

interface PatientData {
  user: {
    id: string;
    name: string;
    email: string;
    gender: string;
    nationality: string;
    age: string;
  };
  current_session: {
    session_id: string;
    weight: number;
    height: number;
    heartrate: number;
    bodytemp: number;
    prediagnosis: string;
    doctor_diagnosis: string;
    created_at: string;
  };
  history_sessions: Array<{
    session_id: string;
    weight: number;
    height: number;
    heartrate: number;
    bodytemp: number;
    prediagnosis: string;
    doctor_diagnosis: string;
    created_at: string;
  }>;
}

const DoctorDetailModal: React.FC<DoctorDetailProps> = ({ id, isOpen, onClose }) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [doctorData, setDoctorData] = React.useState<DoctorDetailData | null>(null);
  const [patientData, setPatientData] = React.useState<PatientData | null>(null);
  const [processingQueue, setProcessingQueue] = React.useState<boolean>(false);
  const [, setPatientLoading] = React.useState<boolean>(false);
  const [, setPatientError] = React.useState<string | null>(null);
  const [diagnosis, setDiagnosis] = React.useState<string>('');
  const [savingDiagnosis, setSavingDiagnosis] = React.useState<boolean>(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Handle click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
      fetchDoctorDetails();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = ''; // Re-enable scrolling when modal is closed
    };
  }, [isOpen, id]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a small delay to show the loading spinner (better UX)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch(`https://api-omsehat.sportsnow.app/doctor/${id}`);
      
      if (!response.ok) {
        const errorCode = response.status;
        
        // Handle specific HTTP error codes
        if (errorCode === 404) {
          throw new Error('Data dokter tidak ditemukan');
        } else if (errorCode === 401 || errorCode === 403) {
          throw new Error('Tidak memiliki akses ke data dokter');
        } else if (errorCode >= 500) {
          throw new Error('Terjadi kesalahan pada server');
        } else {
          throw new Error(`Gagal memuat data dokter (${errorCode})`);
        }
      }
      
      const data = await response.json();
      console.log('Doctor data fetched:', data);
      setDoctorData(data);
      
      // If there's a current queue with a user, fetch the user data
      if (data.current_queue?.session?.user_id) {
        fetchPatientData(data.current_queue.session.user_id);
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data dokter. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (userId: string) => {
    try {
      setPatientLoading(true);
      setPatientError(null);
      
      const response = await fetch(`https://api-omsehat.sportsnow.app/user/${userId}`);
      
      if (!response.ok) {
        const errorCode = response.status;
        throw new Error(`Gagal memuat data pasien (${errorCode})`);
      }
      
      const data = await response.json();
      console.log('Patient data fetched:', data);
      setPatientData(data);
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setPatientError(err instanceof Error ? err.message : 'Gagal memuat data pasien.');
    } finally {
      setPatientLoading(false);
    }
  };

  const handleProcessQueue = async () => {
    if (!doctorData?.current_queue) {
      return;
    }
    
    try {
      setProcessingQueue(true);
      
      // Save diagnosis if available
      if (diagnosis.trim() && doctorData.current_queue.session_id) {
        setSavingDiagnosis(true);
        const diagnosisResponse = await fetch(`https://api-omsehat.sportsnow.app/session/${doctorData.current_queue.session_id}/diagnose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ diagnosis: diagnosis.trim() }),
        });
        
        if (!diagnosisResponse.ok) {
          throw new Error('Gagal menyimpan diagnosis');
        }
        
        const diagnosisResult = await diagnosisResponse.json();
        console.log('Diagnosis saved:', diagnosisResult);
        setSavingDiagnosis(false);
      }
      
      // Add a small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // After processing, refetch the doctor data to get the updated queue
      fetchDoctorDetails();
      
      // Reset diagnosis and patient data since we processed the queue
      setDiagnosis('');
      setPatientData(null);
    } catch (err) {
      console.error('Error processing queue:', err);
      alert('Gagal memproses antrian. Silakan coba lagi.');
    } finally {
      setProcessingQueue(false);
      setSavingDiagnosis(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="doctor-modal-overlay">
      <div 
        className="doctor-modal-container" 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-detail-title"
      >
        {/* Modal header with close button */}
        <div className="doctor-modal-header">
          <div className="doctor-modal-header-decor"></div>
          <div className="doctor-modal-header-decor-2"></div>
          <h2 id="doctor-detail-title" className="doctor-modal-title">
            Detail Dokter
          </h2>
          <button
            className="doctor-modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal content */}
        <div className="doctor-modal-content">
          {loading ? (
            <div className="doctor-modal-loading">
              <div className="doctor-modal-spinner">
                <div className="doctor-spinner-ring"></div>
                <div className="doctor-spinner-ring"></div>
                <div className="doctor-spinner-ring"></div>
              </div>
              <p className="animate-pulse">Memuat data dokter...</p>
              <span className="text-xs text-blue-400 mt-2">ID: {id}</span>
            </div>
          ) : error ? (
            <div className="doctor-modal-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>{error}</p>
              <button 
                className="doctor-modal-retry" 
                onClick={fetchDoctorDetails}
              >
                Coba Lagi
              </button>
            </div>
          ) : doctorData ? (
            <div className="doctor-detail-container">
              <div className="doctor-profile">
                <div className="doctor-avatar">
                  <span>{doctorData.doctor.name.charAt(0)}</span>
                </div>
                <div className="doctor-info">
                  <h3 className="doctor-name">{doctorData.doctor.name}</h3>
                  <div className="doctor-specialty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <span>{doctorData.doctor.specialty}</span>
                  </div>
                </div>
              </div>
              
              <div className="doctor-stats">
                <div className="stat-container">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Ruangan</div>
                      <div className="stat-value">{doctorData.doctor.roomno}</div>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Pasien Hari Ini</div>
                      <div className="stat-value">{doctorData.appointment_count_daily}</div>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Total Pasien</div>
                      <div className="stat-value">{doctorData.appointment_count_all_time}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="doctor-contact">
                <div className="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="contact-value">
                  <a href={`mailto:${doctorData.doctor.email}`}>{doctorData.doctor.email}</a>
                </div>
              </div>
              
              {doctorData.current_queue && (
                <div className="queue-info mb-4">
                  <div className="queue-label">Nomor Antrian Saat Ini</div>
                  <div className="queue-number animate-pulse-gentle">{doctorData.current_queue.number}</div>
                  <div className="queue-time-label mt-2 text-xs text-gray-600">
                    Diperbarui terakhir: 
                    <span className="ml-1 font-medium">{new Date().toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              )}
              
              {/* Process Queue button */}
              {doctorData.current_queue && (
                <div className="process-queue-container mt-4">
                  <button 
                    className="process-queue-button"
                    onClick={handleProcessQueue}
                    disabled={processingQueue || savingDiagnosis}
                  >
                    {processingQueue || savingDiagnosis ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {savingDiagnosis ? 'Menyimpan diagnosis...' : 'Memproses antrian...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {diagnosis.trim() ? 'Simpan & Proses Antrian' : 'Proses Antrian'}
                      </span>
                    )}
                  </button>
                </div>
              )}
              
              {/* Patient information section */}
              {patientData && (
                <div className="patient-info mt-6 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Data Pasien Saat Ini
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="patient-detail-item">
                      <div className="text-gray-500">Nama</div>
                      <div className="font-medium text-gray-800">{patientData.user.name}</div>
                    </div>
                    
                    <div className="patient-detail-item">
                      <div className="text-gray-500">Gender</div>
                      <div className="font-medium text-gray-800">{patientData.user.gender}</div>
                    </div>
                    
                    <div className="patient-detail-item">
                      <div className="text-gray-500">Usia</div>
                      <div className="font-medium text-gray-800">{patientData.user.age}</div>
                    </div>
                    
                    <div className="patient-detail-item">
                      <div className="text-gray-500">Nationality</div>
                      <div className="font-medium text-gray-800">{patientData.user.nationality}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-base font-medium text-gray-700 mb-2">Vital Signs</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="patient-vital-item">
                        <div className="text-gray-500">Berat Badan</div>
                        <div className="font-medium text-gray-800">{patientData.current_session.weight} kg</div>
                      </div>
                      
                      <div className="patient-vital-item">
                        <div className="text-gray-500">Tinggi Badan</div>
                        <div className="font-medium text-gray-800">{patientData.current_session.height} cm</div>
                      </div>
                      
                      <div className="patient-vital-item">
                        <div className="text-gray-500">Detak Jantung</div>
                        <div className="font-medium text-gray-800">{patientData.current_session.heartrate} bpm</div>
                      </div>
                      
                      <div className="patient-vital-item">
                        <div className="text-gray-500">Suhu Tubuh</div>
                        <div className="font-medium text-gray-800">{patientData.current_session.bodytemp}°C</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-base font-medium text-gray-700 mb-2">Pre-Diagnosis</h5>
                    <div className="bg-gray-50 p-3 rounded text-gray-800 text-sm border border-gray-100">
                      {patientData.current_session.prediagnosis || "Tidak ada pre-diagnosis"}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-base font-medium text-gray-700 mb-2">Diagnosis Dokter</h5>
                    <div className="diagnosis-input-container">
                      <textarea
                        className="diagnosis-input w-full p-3 rounded bg-white text-gray-800 text-sm border border-blue-200"
                        placeholder="Masukkan diagnosis untuk pasien ini..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="doctor-modal-error">
              <p>Tidak ada data yang tersedia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailModal;
