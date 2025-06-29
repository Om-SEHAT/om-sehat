import { useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import SearchOverlay from "../components/SearchOverlay";

const Header = () => {
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchClick = () => {
    setShowSearch(true);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Logo (Enlarged) */}
          <div className="header-logo">
            <Link to="/">
              <img 
                src="/header-logo.png" 
                alt="Om SEHAT" 
                className="logo-image"
              />
            </Link>
          </div>

          {/* Search and Actions */}
          <div className="header-actions">
            {/* Search Input (Widened) */}
            <div className="header-search">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Cari bantuan kesehatan apa saja di Om Sehat!"
                className="form-input search-input"
                onClick={handleSearchClick}
                readOnly
                aria-label="Cari bantuan kesehatan"
              />
            </div>

            <a 
              href="https://api.whatsapp.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary help-btn"
            >
              Bantuan
            </a>
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Header;
