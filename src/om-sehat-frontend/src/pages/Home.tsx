import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmationModal from "../components/ConfirmationModal";

const Home = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  
  const features = [
    {
      id: 2,
      image: "/feature-2.png",
      title: "Om Sapa",
      description: "Berobat dan bertemu tenaga kesehatan dengan mudah",
      link: "/om-sapa"
    },
    {
      id: 6,
      image: "/feature-6.png",
      title: "Om Pantau",
      description: "Monitoring pasien terintegrasi",
      link: "/om-pantau"
    }
  ];

  // Set document title when component mounts
  useEffect(() => {
    document.title = "Om SEHAT - Hadirkan Kesehatan Cerdas ke Pelosok Indonesia";
  }, []);

  // Handle feature click
  const handleFeatureClick = (feature: typeof features[0], e: React.MouseEvent) => {
    if (feature.title === "Om Pantau") {
      e.preventDefault();
      setSelectedFeature(feature.title);
      setShowModal(true);
    }
    // For other features, the Link component will handle navigation
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (selectedFeature) {
      const feature = features.find(f => f.title === selectedFeature);
      if (feature) {
        navigate(feature.link);
      }
    }
    setShowModal(false);
  };

  return (
    <main className="page-container">
      {/* Hero Section */}
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">
            Selamat Datang di Om SEHAT
          </h1>
          <p className="page-subtitle">
            Hadirkan Kesehatan Cerdas ke Pelosok Indonesia
          </p>
          <p className="page-tagline">
            Om Tolong Om! Om Siap Menolong!
          </p>
        </div>

        {/* Features Section - Desktop Layout (Horizontal Cards) */}
        <div className="features-grid-desktop" role="region" aria-label="Fitur Om SEHAT">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.link}
              className="feature-card-horizontal"
              onClick={(e) => handleFeatureClick(feature, e)}
              aria-label={`${feature.title} - ${feature.description}`}
            >
              <div className="feature-card-container">
                <div className="feature-card-image-wrapper">
                  <img
                    src={feature.image}
                    alt={`Ilustrasi ${feature.title}`}
                    className="feature-card-image"
                    loading="lazy"
                  />
                </div>
                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Features Section - Mobile/Tablet Layout */}
        <div className="features-grid-mobile" role="region" aria-label="Fitur Om SEHAT">
          {features.map((feature) => (
            <Link
              key={feature.id}
              to={feature.link}
              className="feature-card-horizontal-mobile"
              onClick={(e) => handleFeatureClick(feature, e)}
              aria-label={`${feature.title} - ${feature.description}`}
            >
              <div className="feature-card-container-mobile">
                <div className="feature-card-image-wrapper">
                  <img
                    src={feature.image}
                    alt={`Ilustrasi ${feature.title}`}
                    className="feature-card-image"
                    loading="lazy"
                  />
                </div>
                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        title={`${selectedFeature} - Konfirmasi Akses`}
        message={`${selectedFeature} hanya tersedia untuk pengguna instansi/bisnis. Apakah Anda ingin melanjutkan?`}
        confirmLabel="Lanjutkan"
        cancelLabel="Kembali"
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    </main>
  );
};

export default Home;
