import React from "react";
import { Link } from "react-router-dom";
import "../style.css";

<img
  src="/images/top-wave.png"
  alt="Wave Decoration"
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "200px",
    objectFit: "cover",
    zIndex: 0,
  }}
/>


function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-content animate-fade-in">
        <h1 className="landing-title">Verinizi Yükleyin, Anlamlandırın ve Modelleyin!</h1>
        <p className="landing-subtitle">
          Lebbverse veri analiz platformu ile tek bir adımda verinizi inceleyin,
          önişleyin, görselleştirin ve modelleyin.
        </p>
        <Link to="/modules" className="landing-button">
          Hemen Başla
        </Link>
      </div>

      <div className="landing-steps">
        <div className="step-card">
          <img src="/images/upload.png" alt="Upload" className="step-icon" />
          <h3 className="step-title">1. Veri Yükle</h3>
          <p className="step-text">CSV formatındaki verinizi kolayca yükleyin.</p>
        </div>
        <div className="step-card">
          <img src="/images/analyze.png" alt="Analyze" className="step-icon" />
          <h3 className="step-title">2. Analiz Et</h3>
          <p className="step-text">Veri üzerinde istatistiksel özellikleri inceleyin.</p>
        </div>
        <div className="step-card">
          <img src="\images\model.png" alt="Model" className="step-icon" />
          <h3 className="step-title">3. Model Oluştur</h3>
          <p className="step-text">Tahminleme ve sınıflandırma modelleri ile sonuca ulaşın.</p>
        </div>
      </div>

      <div className="scroll-indicator">
        <span className="scroll-text">Aşağı Kaydır</span>
        <div className="scroll-arrow"></div>
      </div>
    </div>
  );
}

export default LandingPage;
