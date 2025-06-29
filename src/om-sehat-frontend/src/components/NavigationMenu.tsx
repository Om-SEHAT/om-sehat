import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface NavigationMenuProps {
  mode?: 'desktop' | 'mobile';
}

const NavigationMenu = ({ mode = 'mobile' }: NavigationMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { title: "Beranda", path: "/" },
    { title: "Om Sapa", path: "/om-sapa" },
    { title: "Om Pantau", path: "/om-pantau" },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Only show the desktop navigation in desktop mode
  if (mode === 'desktop') {
    return (
      <nav className="nav-desktop">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="nav-link-desktop"
          >
            {item.title}
          </Link>
        ))}
      </nav>
    );
  }

  // Mobile navigation with toggle
  return (
    <div className="nav-mobile-container">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nav-toggle-button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="nav-icon" aria-hidden="true" />
        ) : (
          <Menu className="nav-icon" aria-hidden="true" />
        )}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="nav-mobile-dropdown">
          <div className="nav-mobile-menu">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className="nav-link-mobile"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationMenu;