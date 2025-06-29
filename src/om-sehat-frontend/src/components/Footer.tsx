import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer-main" role="contentinfo" aria-label="Site footer" style={{ zIndex: 1 }}>
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo and Description */}
          <div className="footer-brand">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="Om SEHAT" 
                className="footer-logo"
              />
            </Link>
            <p className="footer-description">
              Hadirkan Kesehatan Cerdas ke Pelosok Indonesia.<br />
            </p>
          </div>

          {/* Footer Links */}
          <div className="footer-links">
            {/* Pasien Links */}
            <div className="footer-section">
              <h3 id="footer-pasien-heading">Pasien</h3>
              <nav className="footer-nav" aria-labelledby="footer-pasien-heading">
                <Link to="/om-sapa" className="footer-link">Om Sapa</Link>
              </nav>
            </div>

            {/* Instansi Links */}
            <div className="footer-section">
              <h3 id="footer-instansi-heading">Instansi</h3>
              <nav className="footer-nav" aria-labelledby="footer-instansi-heading">
                <Link to="/om-sapa" className="footer-link">Om Sapa</Link>
                <Link to="/om-pantau" className="footer-link">Om Pantau</Link>
              </nav>
            </div>

            {/* Media Sosial Links */}
            <div className="footer-section">
              <h3 id="footer-social-heading">Media Sosial</h3>
              <nav className="footer-nav" aria-labelledby="footer-social-heading">
                <a href="https://t.me/omsehat" target="_blank" rel="noopener noreferrer" className="footer-link">Telegram</a>
                <a href="https://x.com/omsehat" target="_blank" rel="noopener noreferrer" className="footer-link">X (formerly Twitter)</a>
                <a href="https://tiktok.com/@omsehat" target="_blank" rel="noopener noreferrer" className="footer-link">TikTok</a>
              </nav>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 Om Sehat. Hak cipta dilindungi undang-undang.
          </p>
          
          {/* Social Icons */}
          <div className="footer-social" aria-label="Social Media Links">
            <a href="https://t.me/omsehat" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Telegram">
              <svg className="social-svg telegram" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M20.5022 3.4855C18.1536 4.45483 4.69818 9.88767 2.03503 10.9555C0.897449 11.3582 -0.00455856 12.186 0.000105795 13.2147C0.00477015 14.2433 0.960927 15.0608 2.09851 15.433L6.15644 16.6838C6.71959 18.7654 7.81894 21.8554 8.16919 22.8184C8.34494 23.3048 8.94528 24 9.57087 24C10.0221 24 10.4214 23.7543 10.7566 23.3469L13.6657 19.86L17.9054 23.0679C18.3534 23.4307 18.9117 23.6284 19.4943 23.6284C20.081 23.6284 20.645 23.4307 21.0913 23.0592C21.5376 22.6878 21.8543 22.1645 21.9641 21.5813L23.9613 5.34953C24.0774 4.72191 23.9319 4.11466 23.5558 3.66291C23.1797 3.21116 22.6121 2.9585 22.006 2.9585C21.4882 2.9585 20.9897 3.15164 20.5022 3.4855ZM10.6859 16.8407L9.05783 21.188L7.8122 15.9644L18.3218 8.99398L10.6859 16.8407Z"/>
              </svg>
            </a>
            <a href="https://x.com/omsehat" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="X (formerly Twitter)">
              <svg className="social-svg x-twitter" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M13.6698 10.0735L21.1228 1.5H19.5151L13.017 8.98936L7.82468 1.5H1.5L9.36531 12.8642L1.5 21.8927H3.10768L9.96914 14.0069L15.4834 21.8927H21.8081L13.6693 10.0735H13.6698ZM10.7373 12.9897L9.9368 11.884L4.04108 3.30566H6.76968L11.5649 10.2785L12.3649 11.384L18.5641 20.3721H15.8355L10.7373 12.9902V12.9897Z"/>
              </svg>
            </a>
            <a href="https://tiktok.com/@omsehat" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="TikTok">
              <svg className="social-svg tiktok" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12.5027 0.215089C13.7696 0.17979 15.0354 0.183305 16.2969 0.227805C16.5627 1.57392 17.1814 2.85735 18.0951 3.83589C19.0085 4.81589 20.1903 5.48569 21.5 5.80473V9.55511C20.2848 9.54746 19.0728 9.30226 17.9449 8.83238C17.5096 8.65354 17.0929 8.44123 16.6886 8.20011V16.334C16.6886 17.1642 16.5254 17.9856 16.2093 18.7497C15.8933 19.5137 15.4306 20.206 14.8494 20.7868C14.2683 21.3675 13.5779 21.8308 12.8159 22.1476C12.0538 22.4644 11.2346 22.6284 10.4066 22.6293C8.73651 22.6315 7.12563 21.9982 5.92114 20.8605C4.71664 19.7229 4.03016 18.1457 4.02832 16.4774C4.02832 14.8092 4.71465 13.2321 5.91894 12.0944C7.12324 10.9568 8.73387 10.3235 10.4037 10.3254C10.7571 10.3254 11.109 10.3592 11.456 10.4254V14.2438C11.14 14.1416 10.8062 14.0895 10.4699 14.0904C9.59733 14.0904 8.76016 14.4403 8.14237 15.0615C7.52457 15.6826 7.17568 16.5221 7.17458 17.3964C7.17458 18.2707 7.52347 19.1102 8.14126 19.7313C8.75906 20.3525 9.59623 20.7024 10.4686 20.7015C11.3428 20.7015 12.1818 20.3515 12.8005 19.7303C13.4192 19.1091 13.7691 18.2696 13.7691 17.3954L13.7968 0H17.5269C17.5243 0.0723333 17.5243 0.144833 17.5269 0.217167"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
