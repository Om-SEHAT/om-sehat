import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import DoctorDetailModal from '../components/DoctorDetailModal';
import { Route, Routes } from 'react-router-dom';
import ChatPantau from '../components/ChatPantau';

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  roomno: string;
}

const fetchDoctors = async (): Promise<Doctor[]> => {
  const res = await fetch('https://api-omsehat.sportsnow.app/doctors');
  if (!res.ok) throw new Error('Gagal memuat daftar dokter');
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.doctors)) return data.doctors;
  return [];
};

const OmPantauMainPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDoctors();
      setDoctors(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };

  const filteredDoctors = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    d.roomno.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen  px-4 py-8">
      {/* <div className="min-h-screen bg-gradient-to-br from-[var(--om-blue-light)] to-[var(--om-blue-dark)] px-4 py-8"> */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[var(--om-blue-dark)] via-[var(--om-blue)] to-[var(--om-blue-dark)] bg-clip-text text-transparent animate-gradient [text-wrap:balance]">
          Om Pantau - Monitoring Dokter
        </h1>
        <p className="mt-2 text-gray-500 text-lg">Pantau aktivitas dan antrian dokter secara real-time</p>
      </header>

      <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
        <div className="justify-center flex-1">
          <Input
            className="px-6 py-4 text-gray-700 bg-white/90 rounded-2xl shadow-lg border-2 border-transparent focus:border-[var(--om-blue)] focus:ring-4 focus:ring-[var(--om-blue-light)] focus:ring-opacity-30 transition-all placeholder:text-gray-400"
            placeholder="Cari nama, spesialis, atau ruangan..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--om-blue)] to-[var(--om-blue-dark)] text-white rounded-full font-semibold shadow-md transition-all hover:from-[var(--om-blue-dark)] hover:to-[var(--om-blue)] focus:ring-4 focus:ring-[var(--om-blue-light)] disabled:bg-[var(--om-blue-light)] disabled:cursor-not-allowed"
        >
          <svg className={`transition-transform ${refreshing ? 'animate-spin' : ''}`} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4.05 11a9 9 0 1 1 2.13 5.66" />
            <path d="M4 4v7h7" />
          </svg>
          {refreshing ? 'Memuat...' : 'Perbarui Data'}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--om-blue-light)] border-t-[var(--om-blue)] animate-spin"></div>
          </div>
          <div className="mt-4 text-gray-500 text-lg">Memuat daftar dokter...</div>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 rounded-xl max-w-lg mx-auto shadow">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="mb-4 text-red-700 font-semibold">{error}</div>
          <Button onClick={handleRefresh} className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600">Coba Lagi</Button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center p-8 bg-white/80 rounded-xl max-w-lg mx-auto shadow">
          <div className="text-5xl mb-2 text-[var(--om-blue)]">🩺</div>
          <div className="mb-2 text-gray-500 text-lg">Tidak ada dokter ditemukan.</div>
        </div>
      ) : (
        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 hover:border-[var(--om-blue)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => setSelectedDoctor(doctor)}
                tabIndex={0}
                role="button"
                aria-label={`Lihat detail ${doctor.name}`}
              >
                <div className="flex items-center gap-4 p-6">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-[var(--om-blue)] via-[var(--om-blue-dark)] to-[var(--gray-700)] shadow-md">
                    {doctor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-gray-900 truncate group-hover:text-[var(--om-blue)] flex items-center gap-2">
                      {doctor.name}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--om-blue-light)] via-[var(--om-blue-light)] to-[var(--om-blue-light)] text-[var(--om-blue)] border border-[var(--om-blue-light)] group-hover:from-[var(--om-blue-light)] group-hover:via-[var(--om-blue-light)] group-hover:to-[var(--om-blue-light)]">
                      {doctor.specialty}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex items-center">
                      <span className="font-medium text-gray-900 ml-1.5">Ruangan {doctor.roomno}</span>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="w-full rounded-b-2xl py-3 font-semibold text-[var(--om-blue)] bg-[var(--om-blue-light)] hover:bg-[var(--om-blue)] hover:text-white border-t border-[var(--om-blue-light)] transition-all">Lihat Detail</Button>
              </div>
            ))}
          </div>
        </main>
      )}

      {selectedDoctor && (
        <DoctorDetailModal
          id={selectedDoctor.id}
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );

};

const OmPantau: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<OmPantauMainPage />} />
      <Route path="/chat/:sessionId" element={<ChatPantau />} />
    </Routes>
  )
}
export default OmPantau;
