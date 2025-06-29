export const API_BASE_URL = 'https://api-omsehat.sportsnow.app';

export const API_ENDPOINTS = {
  SESSION: {
    GET: (sessionId: string) => `${API_BASE_URL}/session/${sessionId}`,
    CREATE: `${API_BASE_URL}/session`,
    UPDATE: (sessionId: string) => `${API_BASE_URL}/session/${sessionId}`,
  },
  USER: {
    PROFILE: `${API_BASE_URL}/profile`,
    VERIFY_OTP: `${API_BASE_URL}/verify-otp`,
    REGISTER: `${API_BASE_URL}/register`,
  },
};

export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
