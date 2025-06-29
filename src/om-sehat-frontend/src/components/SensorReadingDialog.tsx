import React, { useEffect, useState } from 'react';
import '../styles/sensor-dialog.css';
// Types MaxSensorData and MlxSensorData are not directly used here,
// but it's fine to keep them if other parts of the project expect them
// or if you plan to extend this dialog's functionality.
// import type { MaxSensorData, MlxSensorData } from '../utils/mqtt';

interface SensorReadingDialogProps {
  isOpen: boolean;
  sensorType: 'heartRate' | 'bodyTemperature' | null;
  onCancel: () => void;
  onComplete: (value: number) => void; // This prop is not strictly used by PatientForm anymore for value passing
  error: string | null;
}

const SensorReadingDialog: React.FC<SensorReadingDialogProps> = ({
  isOpen,
  sensorType,
  onCancel,
  error,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(60); // 60 seconds timeout

  // Timer effect for timeout
  useEffect(() => {
    if (!isOpen || error) { // Pause timer if there's an error displayed
      if (error && timeLeft !== 60) { // If an error appears, reset timer visually, but onCancel handles actual close
         // No need to auto-close on error immediately, let user click "Tutup"
      }
      return;
    }

    // Reset timeLeft when the dialog is opened for a new sensor type or after an error is cleared
    setTimeLeft(60);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onCancel(); // Trigger cancellation (timeout)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      // setTimeLeft(60); // Resetting here is fine, or reset when it opens
    };
  }, [isOpen, onCancel, error, sensorType]); // Added error and sensorType to reset timer correctly

  if (!isOpen) return null;

  const sensorLabel = sensorType === 'heartRate' ? 'Detak Jantung' : 'Suhu Badan';

  return (
    <div className="sensor-dialog-overlay">
      <div className="sensor-dialog-container">
        <div className="sensor-dialog-content">
          {error ? (
            <>
              <div className="sensor-dialog-header">
                <h3 className="sensor-dialog-title">Gagal Membaca Sensor</h3>
              </div>
              <div className="sensor-dialog-body">
                <p className="sensor-dialog-error">{error}</p>
              </div>
              <div className="sensor-dialog-footer">
                <button className="btn btn-primary" onClick={onCancel}>
                  Tutup
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="sensor-dialog-header">
                <h3 className="sensor-dialog-title">Membaca {sensorLabel} Dari Sensor</h3>
              </div>
              <div className="sensor-dialog-body">
                <div className="sensor-loading-spinner">
                  <svg className="sensor-spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                </div>
                <p className="sensor-loading-text">Menunggu data dari sensor...</p>
                <p className="sensor-timeout-text">Waktu tersisa: {timeLeft} detik</p>
                <p className="sensor-help-text">
                  Pastikan sensor terhubung. Jika tidak ada data, Anda dapat input manual.
                </p>
              </div>
              <div className="sensor-dialog-footer">
                <button className="btn btn-secondary" onClick={onCancel}>
                  Input Manual
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorReadingDialog;