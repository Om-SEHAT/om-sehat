import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import PatientForm from '../components/PatientForm';
import Chat from '../components/Chat';
import '../styles/vital-signs.css';
import '../styles/feature-redesign.css';
import type { PatientFormData } from '../components/PatientForm';

const OmSapaHome = () => {
  const [showForm, setShowForm] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleFormSubmit = (data: PatientFormData) => {
    console.log('Form submitted:', data);
    setSubmissionSuccess(true);
  };

  return (
    <div className="feature-page-container">
      <div className="feature-page-content">
        <div className="feature-page-header">
          <h1 className="feature-page-title">Om Sapa</h1>
          <p className="feature-page-subtitle">
            Berobat dan bertemu tenaga kesehatan dengan mudah
          </p>
        </div>

        {!showForm && !submissionSuccess && (
          <>
            <div className="feature-section">
              <h2 className="feature-section-title">Fitur Utama</h2>
              <div className="modern-features-grid">
                <div className="modern-feature-card">
                  <div className="modern-feature-header">
                    <div className="modern-feature-number">1</div>
                    <h3 className="modern-feature-title">Front-desk Operations</h3>
                  </div>
                  <div className="modern-feature-content">
                    <p className="modern-feature-description">
                      Pendaftaran digital dengan komputer dan sensor IoT untuk proses check-in yang cepat dan efisien.
                    </p>
                  </div>
                </div>

                <div className="modern-feature-card">
                  <div className="modern-feature-header">
                    <div className="modern-feature-number">2</div>
                    <h3 className="modern-feature-title">Streamline AI Diagnosis</h3>
                  </div>
                  <div className="modern-feature-content">
                    <p className="modern-feature-description">
                      Chatbot AI menganalisis gejala dan data kesehatan untuk membantu diagnosis awal yang akurat.
                    </p>
                  </div>
                </div>

                <div className="modern-feature-card">
                  <div className="modern-feature-header">
                    <div className="modern-feature-number">3</div>
                    <h3 className="modern-feature-title">Specialist Assignment</h3>
                  </div>
                  <div className="modern-feature-content">
                    <p className="modern-feature-description">
                      Merujuk secara otomatis ke dokter yang tepat beserta informasi antrean dan kamar untuk pengalaman perawatan yang lebih baik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modern-cta">
              <button
                className="modern-cta-button pulse-animation"
                onClick={() => setShowForm(true)}
              >
                Mulai Konsultasi Sekarang
              </button>
            </div>
          </>
        )}

        {showForm && !submissionSuccess && (
          <div className="patient-registration-section">
            <div className="section-header">
              <h2 className="section-title" id="form-title">Selamat Datang di Om Sapa</h2>
              <p className="section-description">Mohon isi data diri Anda</p>
            </div>
            <PatientForm
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {submissionSuccess && (
          <div className="success-message-container">
            <div className="success-message">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 className="success-title">Pendaftaran Berhasil</h2>
              <p className="success-text">
                Terima kasih telah mendaftar. Data Anda telah kami terima dan proses verifikasi OTP sedang berlangsung.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main OmSapa component with routing
const OmSapa = () => {
  return (
    <Routes>
      <Route path="/" element={<OmSapaHome />} />
      <Route path="/chat/:sessionId" element={<Chat />} />
    </Routes>
  );
};

export default OmSapa;
