import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div>
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Halaman Tidak Ditemukan</h2>
          <p className="not-found-message">
            Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman tersebut telah dipindahkan atau tidak pernah ada.
          </p>
        </div>

        <div className="not-found-actions">
          <Link
            to="/"
            className="btn btn-primary"
          >
            Kembali ke Beranda
          </Link>
          <div className="not-found-links">
            <Link
              to="/om-sapa"
              className="not-found-link"
            >
              Om Sapa
            </Link>
          </div>
        </div>

        <div className="not-found-logo">
          <img
            src="/logo.png"
            alt="Om SEHAT"
            className="not-found-logo-img"
          />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
