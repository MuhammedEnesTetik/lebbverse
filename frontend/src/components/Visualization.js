import React, { useState } from "react";
import ModulNavigation from "./ModulNavigation";
import "../style.css";

function Visualization({ preview, handleVisualize, graphList }) {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [chartParams, setChartParams] = useState({});
  const selectAll = () => setSelectedCharts(chartTypes.map(c => c.key));
  const clearAll  = () => setSelectedCharts([]);

  if (!preview || preview.length === 0) return null;

  const columns = Object.keys(preview[0]);

  const chartTypes = [
    { key: "histogram", label: "Histogram" },
    { key: "bar", label: "Bar Grafiği" },
    { key: "scatter", label: "Scatter Plot" },
    { key: "box", label: "Box Plot" },
    { key: "pie", label: "Pie Chart" },
    { key: "line", label: "Line Plot" },
    { key: "heatmap", label: "Isı Haritası (Heatmap)" },
    { key: "violin", label: "Violin Plot" },
    { key: "count", label: "Count Plot" },
    { key: "kde", label: "KDE Plot" },
  ];

  const toggleChartSelection = (type) => {
    setSelectedCharts((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleParamChange = (chart, axis, value) => {
    setChartParams((prev) => ({
      ...prev,
      [chart]: {
        ...prev[chart],
        [axis]: value,
      },
    }));
  };

  const handleSubmit = () => {
    const payload = selectedCharts.map((chart) => ({
      chartType: chart,
      xColumn: chartParams[chart]?.x || "",
      yColumn: chartParams[chart]?.y || "",
    }));
    handleVisualize(payload);
  };

  return (
    <div className="visualization-container">
      <div className="section-title viz-title-row">
        <span>Veri Görselleştirme</span>
        <div className="module-nav-buttons">
          <button onClick={() => window.location.href='/preprocessing'}>Veri Ön İşleme</button>
          <button onClick={() => window.location.href='/modeling'}>Veri Modellemesi</button>
        </div>
      </div>

      <div className="viz-toolbar">
        <div className="viz-badge">Seçili: {selectedCharts.length}</div>
        <div className="viz-toolbar-right">
          <button className="chip" onClick={selectAll}>Hepsini Seç</button>
          <button className="chip is-ghost" onClick={clearAll}>Temizle</button>
        </div>
      </div>

      <div className="chart-selection-container">
        {chartTypes.map(({ key, label }) => (
          <div key={key} className="chart-option">
            <label>
              <input
                type="checkbox"
                checked={selectedCharts.includes(key)}
                onChange={() => toggleChartSelection(key)}
              />
              {label}
            </label>

            {selectedCharts.includes(key) && (
              <div className="axis-selection">
                <div>
                  <label>X Ekseni: </label>
                  <select
                    value={chartParams[key]?.x || ""}
                    onChange={(e) => handleParamChange(key, "x", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {["scatter", "line", "box", "violin", "kde"].includes(key) && (
                  <div>
                    <label>Y Ekseni: </label>
                    <select
                      value={chartParams[key]?.y || ""}
                      onChange={(e) => handleParamChange(key, "y", e.target.value)}
                    >
                      <option value="">Seçin</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="visualization-actions">
        <button onClick={handleSubmit} className="visualize-button">
          Grafikleri Oluştur
        </button>
      </div>


      {Array.isArray(graphList) && graphList.length > 0 && (
        <div className="graph-list">
          {graphList.map((item, index) => (
            <div key={index} className="graph-preview">
              <img
                src={`data:image/png;base64,${item.image}`}
                alt={`Grafik - ${item.chartType}`}
                className="graph-image"
              />
              <div className="graph-footer">
                <span className="graph-title">
                  {chartTypes.find((c) => c.key === item.chartType)?.label || item.chartType}
                </span>

                <a
                  href={`data:image/png;base64,${item.image}`}
                  download={`${item.chartType}_${index + 1}.png`}
                  className="download-link"
                >
                  Görseli İndir
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Visualization;