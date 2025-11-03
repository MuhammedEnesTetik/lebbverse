import React from "react";

function DataPreview({ insights, preview }) {
  if (!insights || !preview || preview.length === 0) {
    return null; // Eğer veri yoksa hiçbir şey gösterme
  }

  return (
    <div className="data-preview-container">
      <h2 className="section-title">📄 Veri Özeti</h2>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Satır Sayısı</h3>
          <p>{insights.row_count}</p>
        </div>
        <div className="summary-card">
          <h3>Sütun Sayısı</h3>
          <p>{insights.column_count}</p>
        </div>
        <div className="summary-card">
          <h3>Eksik Değerler</h3>
          <p>{insights.missing_values}</p>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="preview-table-container">
          <h3 className="section-subtitle">Veri Önizleme</h3>
          <table className="preview-table">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((col, index) => (
                  <th key={index}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DataPreview;