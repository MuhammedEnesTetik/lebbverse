import React from "react";
import { Link } from "react-router-dom";

export default function ModulesPage() {
  return (
    <div className="container modules-container">
      <h1 className="modules-title">Modüller</h1>

      <div className="module-grid">
        {/* Ön İşleme */}
        <div className="module-card preprocessing">
          <div className="module-card-inner">
            <div className="module-card-content">
              <div className="module-card-icon is-pre" aria-hidden>
                {/* filter/clean icon */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 21l6.75-6.75M14 10l7-7M12 8l4-4M16 12l4-4"
                        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <rect x="2" y="14" width="8" height="8" rx="2"
                        stroke="currentColor" strokeWidth="1.7"/>
                </svg>
              </div>

              <div className="module-card-title">Veri Ön İşleme</div>
              <div className="module-card-sub">Eksik değer • Encoding • Ölçekleme</div>

              <Link to="/preprocessing" className="enter-button" style={{marginTop: 10}}>
                İçeri Gir
              </Link>
            </div>
          </div>
        </div>

        {/* Görselleştirme */}
        <div className="module-card visualization">
          <div className="module-card-inner">
            <div className="module-card-content">
              <div className="module-card-icon is-vis" aria-hidden>
                {/* bars icon */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="11" width="3" height="10" rx="1.2"
                        stroke="currentColor" strokeWidth="1.7"/>
                  <rect x="9" y="7" width="3" height="14" rx="1.2"
                        stroke="currentColor" strokeWidth="1.7"/>
                  <rect x="15" y="3" width="3" height="18" rx="1.2"
                        stroke="currentColor" strokeWidth="1.7"/>
                </svg>
              </div>

              <div className="module-card-title">Veri Görselleştirme</div>
              <div className="module-card-sub">Histogram • Dağılım • Isı haritası</div>

              <Link to="/visualization" className="enter-button" style={{marginTop: 10}}>
                İçeri Gir
              </Link>
            </div>
          </div>
        </div>

        {/* Modellemesi */}
        <div className="module-card modeling">
          <div className="module-card-inner">
            <div className="module-card-content">
              <div className="module-card-icon is-ml" aria-hidden>
                {/* ml graph icon */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.7"/>
                  <circle cx="18" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.7"/>
                  <circle cx="12" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M8 7.5l3 8M16 7.5l-3 8M8.2 6h7.6"
                        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>

              <div className="module-card-title">Veri Modellemesi</div>
              <div className="module-card-sub">Sınıflandırma • Regresyon • CV</div>

              <Link to="/modeling" className="enter-button" style={{marginTop: 10}}>
                İçeri Gir
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
