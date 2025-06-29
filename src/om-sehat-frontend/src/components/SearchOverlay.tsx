import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../utils/validation';
import { useFocusTrap, ariaLabels, announceToScreenReader } from '../utils/accessibility';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const navigate = useNavigate();
  const focusTrapRef = useFocusTrap(isOpen);

  const debouncedSearch = useCallback(
    (term: string) => {
      const handler = debounce((...args: unknown[]) => {
        const searchValue = args[0] as string;
        setDebouncedSearchTerm(searchValue);
        if (searchValue) {
          announceToScreenReader(`Mencari ${searchValue}`);
        }
      }, 300);
      handler(term);
    },
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Handle escape key
  useEffect(() => {
    const currentRef = focusTrapRef.current;
    const handleEscape = () => {
      onClose();
    };

    if (isOpen && currentRef) {
      currentRef.addEventListener('modal-escape', handleEscape);
      return () => {
        currentRef.removeEventListener('modal-escape', handleEscape);
      };
    }
  }, [isOpen, onClose, focusTrapRef]);

  const searchResults = [
    { title: 'Om Sapa', description: 'Berobat dan bertemu tenaga kesehatan dengan mudah', path: '/om-sapa', keywords: ['komunikasi', 'dokter', 'chat'] },
    { title: 'Om Pantau', description: 'Monitoring pasien terintegrasi', path: '/om-pantau', keywords: ['monitoring', 'pantau', 'tracking', 'kesehatan'] },
  ];

  const filteredResults = searchResults.filter(result =>
    result.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    result.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    result.keywords.some(keyword => keyword.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  );

  const handleResultClick = (path: string) => {
    navigate(path);
    onClose();
    setSearchTerm('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredResults.length > 0) {
      handleResultClick(filteredResults[0].path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`search-overlay-backdrop ${!isOpen ? 'hidden' : ''}`}>
      <div 
        ref={focusTrapRef}
        className={`search-overlay-panel ${!isOpen ? 'hidden' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabels.search}
      >
        <div className="search-overlay-header">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="search-input-wrapper">
              <Search className="search-icon-inner" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari bantuan kesehatan apa saja di Om Sehat!"
                className="search-overlay-input"
                autoFocus
                aria-label={ariaLabels.search}
                role="searchbox"
                aria-expanded={filteredResults.length > 0}
                aria-owns="search-results"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="search-close-button"
              aria-label={ariaLabels.closeButton}
            >
              <X className="search-close-icon" />
            </button>
          </form>
        </div>

        <div className="search-results-container" id="search-results" role="listbox">
          {debouncedSearchTerm === '' ? (
            <div className="search-section">
              <h3 className="search-section-title">Layanan Populer</h3>
              {searchResults.slice(0, 4).map((result, index) => (
                <button
                  key={result.path}
                  onClick={() => handleResultClick(result.path)}
                  className="search-result-item animate-slideInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="option"
                  aria-label={`Buka ${result.title}: ${result.description}`}
                >
                  <div className="search-result-title">{result.title}</div>
                  <div className="search-result-description">{result.description}</div>
                </button>
              ))}
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="search-section">
              <h3 className="search-section-title">
                Hasil Pencarian ({filteredResults.length})
              </h3>
              {filteredResults.map((result, index) => (
                <button
                  key={result.path}
                  onClick={() => handleResultClick(result.path)}
                  className="search-result-item animate-slideInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="option"
                  aria-label={`Buka ${result.title}: ${result.description}`}
                >
                  <div className="search-result-title">{result.title}</div>
                  <div className="search-result-description">{result.description}</div>
                </button>
              ))}
            </div>
          ) : debouncedSearchTerm !== '' ? (
            <div className="search-no-results animate-fadeIn" role="status" aria-live="polite">
              <div className="search-no-results-icon">🔍</div>
              <div className="search-no-results-message">Tidak ada hasil untuk "{debouncedSearchTerm}"</div>
              <div className="search-no-results-hint">Coba kata kunci lain</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
