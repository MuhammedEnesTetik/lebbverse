import React from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";

const ModulNavigation = ({ current }) => {
  const navigate = useNavigate();

  const modules = [
    { key: "preprocessing", label: "Veri Ön İşleme", path: "/preprocessing" },
    { key: "visualization", label: "Veri Görselleştirme", path: "/visualization" },
    { key: "modeling", label: "Veri Modellemesi", path: "/modeling" },
  ];

  const handleNavigate = (path) => {
    // Sayfa geçişinde state'leri sıfırlamak için tam yenileme
    window.location.href = path;
  };

  return (
    <div className="module-nav-container">
      {modules
        .filter((mod) => mod.key !== current)
        .map((mod) => (
          <button
            key={mod.key}
            className="module-nav-button"
            onClick={() => handleNavigate(mod.path)}
          >
            {mod.label}
          </button>
        ))}
    </div>
  );
};

export default ModulNavigation;
