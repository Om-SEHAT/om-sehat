/**
 * This file provides country data with flag emoji for use in the PatientForm.
 */

interface CountryOption {
  code: string;
  name: string;
  flag: string;
  region: string;
}

export const countries: CountryOption[] = [
  // Asia Tenggara
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', region: 'Asia Tenggara' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', region: 'Asia Tenggara' },
  { code: 'SG', name: 'Singapura', flag: '🇸🇬', region: 'Asia Tenggara' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', region: 'Asia Tenggara' },
  { code: 'PH', name: 'Filipina', flag: '🇵🇭', region: 'Asia Tenggara' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', region: 'Asia Tenggara' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', region: 'Asia Tenggara' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', region: 'Asia Tenggara' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', region: 'Asia Tenggara' },
  { code: 'KH', name: 'Kamboja', flag: '🇰🇭', region: 'Asia Tenggara' },
  { code: 'TL', name: 'Timor Leste', flag: '🇹🇱', region: 'Asia Tenggara' },
  
  // Asia Lainnya
  { code: 'JP', name: 'Jepang', flag: '🇯🇵', region: 'Asia Lainnya' },
  { code: 'KR', name: 'Korea Selatan', flag: '🇰🇷', region: 'Asia Lainnya' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'Asia Lainnya' },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia Lainnya' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', region: 'Asia Lainnya' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', region: 'Asia Lainnya' },
  { code: 'SA', name: 'Arab Saudi', flag: '🇸🇦', region: 'Asia Lainnya' },
  { code: 'AE', name: 'Uni Emirat Arab', flag: '🇦🇪', region: 'Asia Lainnya' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', region: 'Asia Lainnya' },
  { code: 'TR', name: 'Turki', flag: '🇹🇷', region: 'Asia Lainnya' },
  
  // Eropa
  { code: 'GB', name: 'Inggris', flag: '🇬🇧', region: 'Eropa' },
  { code: 'DE', name: 'Jerman', flag: '🇩🇪', region: 'Eropa' },
  { code: 'FR', name: 'Prancis', flag: '🇫🇷', region: 'Eropa' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', region: 'Eropa' },
  { code: 'ES', name: 'Spanyol', flag: '🇪🇸', region: 'Eropa' },
  { code: 'NL', name: 'Belanda', flag: '🇳🇱', region: 'Eropa' },
  { code: 'CH', name: 'Swiss', flag: '🇨🇭', region: 'Eropa' },
  { code: 'SE', name: 'Swedia', flag: '🇸🇪', region: 'Eropa' },
  { code: 'NO', name: 'Norwegia', flag: '🇳🇴', region: 'Eropa' },
  
  // Amerika
  { code: 'US', name: 'Amerika Serikat', flag: '🇺🇸', region: 'Amerika' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦', region: 'Amerika' },
  { code: 'MX', name: 'Meksiko', flag: '🇲🇽', region: 'Amerika' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', region: 'Amerika' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'Amerika' },
  
  // Oseania
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oseania' },
  { code: 'NZ', name: 'Selandia Baru', flag: '🇳🇿', region: 'Oseania' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', region: 'Oseania' },
  
  // Afrika
  { code: 'ZA', name: 'Afrika Selatan', flag: '🇿🇦', region: 'Afrika' },
  { code: 'EG', name: 'Mesir', flag: '🇪🇬', region: 'Afrika' },
  { code: 'MA', name: 'Maroko', flag: '🇲🇦', region: 'Afrika' },
  
  // Lainnya
  { code: 'OT', name: 'Negara Lainnya', flag: '🌐', region: 'Lainnya' },
];

export const getCountryByCode = (code: string): CountryOption | undefined => {
  return countries.find(country => country.code === code);
};

export const getCountryName = (code: string): string => {
  const country = getCountryByCode(code);
  return country ? country.name : '';
};

export const getCountryFlag = (code: string): string => {
  const country = getCountryByCode(code);
  return country ? country.flag : '';
};

export const getCountriesByRegion = (region: string): CountryOption[] => {
  return countries.filter(country => country.region === region);
};

export const regions = ['Asia Tenggara', 'Asia Lainnya', 'Eropa', 'Amerika', 'Oseania', 'Afrika', 'Lainnya'];

export const filterCountries = (searchTerm: string): CountryOption[] => {
  if (!searchTerm) return countries;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  return countries.filter(country => 
    country.name.toLowerCase().includes(normalizedSearchTerm) || 
    country.code.toLowerCase().includes(normalizedSearchTerm)
  );
};
