// src/components/Modeling.js
import React from "react";
import ModulNavigation from "./ModulNavigation";

const BACKEND_URL = "http://localhost:5000";

function downloadTrainedModel(algo, modelType) {
  const url = `${BACKEND_URL}/download-model?algo=${algo}&model_type=${modelType}`;
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${algo}_${modelType}.pkl`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function Modeling({
  preview,
  modelType,
  setModelType,
  selectedAlgorithms,
  setSelectedAlgorithms,
  allParams,
  setAllParams,
  target,
  setTarget,
  testSize,
  setTestSize,
  cvEnabled,
  setCvEnabled,
  cvFolds,
  setCvFolds,
  handleModelTrain,
  modelResultsList,
  comparisonPlot,
  metricsTable,
}) {
  if (!preview || preview.length === 0) {
    return <p className="warning-text">Lütfen önce veri yükleyin ve işleyin.</p>;
  }

  // ===== Helpers ============================================================
  const pct = (v) => (v == null ? "-" : `${(v * 100).toFixed(1)}%`);

  function ClassificationKPIs({ metrics }) {
    const m = metrics || {};
    return (
      <div className="kpi-row centered">
        <div className="kpi-box kpi-glow">
          <div className="kpi-value">{pct(m.accuracy)}</div>
          <div className="kpi-label">Doğruluk</div>
        </div>
        <div className="kpi-box kpi-glow">
          <div className="kpi-value">{pct(m.precision)}</div>
          <div className="kpi-label">Kesinlik</div>
        </div>
        <div className="kpi-box kpi-glow">
          <div className="kpi-value">{pct(m.recall)}</div>
          <div className="kpi-label">Duyarlılık</div>
        </div>
        <div className="kpi-box kpi-glow">
          <div className="kpi-value">{pct(m.f1)}</div>
          <div className="kpi-label">F1</div>
        </div>
      </div>
    );
  }

  function RegressionMetrics({ metrics }) {
    const m = metrics || {};
    const fmt = (x) => (typeof x === "number" ? x.toFixed(4) : "-");
    return (
      <div className="metrics-pretty card">
        <div className="metrics-grid">
          {[
            { k: "R²", v: m.r2 },
            { k: "MSE", v: m.mse },
            { k: "RMSE", v: m.rmse },
          ].map(({ k, v }) => (
            <div key={k} className="metric-item">
              <div className="metric-key">{k}</div>
              <div className="metric-val">{fmt(v)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function ClusteringMetrics({ metrics }) {
    const m = metrics || {};
    const fmt = (x) => (typeof x === "number" ? x.toFixed(4) : "-");
    const rows = [
      m.n_clusters != null ? { k: "Küme Sayısı", v: m.n_clusters } : null,
      m.silhouette != null ? { k: "Silhouette", v: m.silhouette } : null,
      m.calinski_harabasz != null
        ? { k: "Calinski-Harabasz", v: m.calinski_harabasz }
        : null,
      m.davies_bouldin != null
        ? { k: "Davies-Bouldin", v: m.davies_bouldin }
        : null,
      m.info ? { k: "Bilgi", v: m.info } : null,
    ].filter(Boolean);

    return (
      <div className="metrics-pretty card">
        <div className="metrics-grid">
          {rows.map(({ k, v }) => (
            <div key={k} className="metric-item">
              <div className="metric-key">{k}</div>
              <div className="metric-val">
                {typeof v === "number" ? fmt(v) : String(v)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function DownloadLink({ b64, name, children }) {
    if (!b64) return null;
    return (
      <a
        className="download-link"
        href={`data:image/png;base64,${b64}`}
        download={name}
      >
        {children || "Görseli İndir"}
      </a>
    );
  }
  // ========================================================================

  const availableAlgorithms = {
    classification: [
      { value: "RandomForest", label: "Random Forest" },
      { value: "LogisticRegression", label: "Logistic Regression" },
      { value: "DecisionTree", label: "Decision Tree" },
      { value: "KNN", label: "KNN" },
      { value: "SVM", label: "SVM" },
      { value: "NaiveBayes", label: "Naive Bayes" },
      { value: "GradientBoosting", label: "Gradient Boosting" },
    ],
    regression: [
      { value: "LinearRegression", label: "Linear Regression" },
      { value: "RandomForest", label: "Random Forest" },
      { value: "DecisionTree", label: "Decision Tree" },
      { value: "KNN", label: "KNN" },
      { value: "SVR", label: "SVR" },
      { value: "Ridge", label: "Ridge Regression" },
      { value: "Lasso", label: "Lasso Regression" },
      { value: "GradientBoosting", label: "Gradient Boosting" },
    ],
    clustering: [
      { value: "KMeans", label: "KMeans" },
      { value: "DBSCAN", label: "DBSCAN" },
      { value: "AgglomerativeClustering", label: "Agglomerative Clustering" },
    ],
  };

  const toggleAlgo = (algo) => {
    if (selectedAlgorithms.includes(algo)) {
      setSelectedAlgorithms(selectedAlgorithms.filter((a) => a !== algo));
    } else {
      setSelectedAlgorithms([...selectedAlgorithms, algo]);
    }
  };

  const handleParamChange = (algo, param, value) => {
    setAllParams((prev) => ({
      ...prev,
      [algo]: { ...(prev[algo] || {}), [param]: value },
    }));
  };

  const renderParamFields = (algo) => {
    const p = allParams[algo] || {};
    switch (algo) {
      case "RandomForest":
      case "GradientBoosting":
        return (
          <>
            <label className="control-label">n_estimators</label>
            <input
              type="number"
              className="control-input"
              value={p.n_estimators ?? 100}
              onChange={(e) =>
                handleParamChange(algo, "n_estimators", parseInt(e.target.value))
              }
            />
            <label className="control-label">random_state</label>
            <input
              type="number"
              className="control-input"
              value={p.random_state ?? 42}
              onChange={(e) =>
                handleParamChange(algo, "random_state", parseInt(e.target.value))
              }
            />
            {algo === "GradientBoosting" && (
              <>
                <label className="control-label">learning_rate</label>
                <input
                  type="number"
                  step="0.01"
                  className="control-input"
                  value={p.learning_rate ?? 0.1}
                  onChange={(e) =>
                    handleParamChange(
                      algo,
                      "learning_rate",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </>
            )}
          </>
        );
      case "LogisticRegression":
        return (
          <>
            <label className="control-label">max_iter</label>
            <input
              type="number"
              className="control-input"
              value={p.max_iter ?? 1000}
              onChange={(e) =>
                handleParamChange(algo, "max_iter", parseInt(e.target.value))
              }
            />
          </>
        );
      case "DecisionTree":
        return (
          <>
            <label className="control-label">max_depth</label>
            <input
              type="number"
              className="control-input"
              value={p.max_depth ?? 5}
              onChange={(e) =>
                handleParamChange(algo, "max_depth", parseInt(e.target.value))
              }
            />
          </>
        );
      case "KNN":
        return (
          <>
            <label className="control-label">n_neighbors</label>
            <input
              type="number"
              className="control-input"
              value={p.n_neighbors ?? 5}
              onChange={(e) =>
                handleParamChange(algo, "n_neighbors", parseInt(e.target.value))
              }
            />
          </>
        );
      case "SVM":
      case "SVR":
        return (
          <>
            <label className="control-label">kernel</label>
            <input
              type="text"
              className="control-input"
              value={p.kernel ?? "rbf"}
              onChange={(e) => handleParamChange(algo, "kernel", e.target.value)}
            />
            <label className="control-label">C</label>
            <input
              type="number"
              className="control-input"
              value={p.C ?? 1}
              onChange={(e) =>
                handleParamChange(algo, "C", parseFloat(e.target.value))
              }
            />
          </>
        );
      case "Ridge":
      case "Lasso":
        return (
          <>
            <label className="control-label">alpha</label>
            <input
              type="number"
              className="control-input"
              value={p.alpha ?? 1}
              onChange={(e) =>
                handleParamChange(algo, "alpha", parseFloat(e.target.value))
              }
            />
          </>
        );
      case "KMeans":
        return (
          <>
            <label className="control-label">n_clusters</label>
            <input
              type="number"
              className="control-input"
              value={p.n_clusters ?? 8}
              onChange={(e) =>
                handleParamChange(algo, "n_clusters", parseInt(e.target.value))
              }
            />
            <label className="control-label">random_state</label>
            <input
              type="number"
              className="control-input"
              value={p.random_state ?? 42}
              onChange={(e) =>
                handleParamChange(algo, "random_state", parseInt(e.target.value))
              }
            />
          </>
        );
      case "DBSCAN":
        return (
          <>
            <label className="control-label">eps</label>
            <input
              type="number"
              step="0.1"
              className="control-input"
              value={p.eps ?? 0.5}
              onChange={(e) =>
                handleParamChange(algo, "eps", parseFloat(e.target.value))
              }
            />
          </>
        );
      case "AgglomerativeClustering":
        return (
          <>
            <label className="control-label">n_clusters</label>
            <input
              type="number"
              className="control-input"
              value={p.n_clusters ?? 2}
              onChange={(e) =>
                handleParamChange(algo, "n_clusters", parseInt(e.target.value))
              }
            />
          </>
        );
      default:
        return <p>Bu algoritma için özel parametre bulunmuyor.</p>;
    }
  };

  const columnNames = Object.keys(preview[0] || {});
  const algoList = modelType ? availableAlgorithms[modelType] : [];

  return (
    <div className="modeling-container">
      <div className="section-title model-title-row">
        <span>Veri Modellemesi</span>
        <div className="module-nav-buttons">
          <button onClick={() => (window.location.href = "/preprocessing")}>
            Veri Ön İşleme
          </button>
          <button onClick={() => (window.location.href = "/visualization")}>
            Veri Görselleştirme
          </button>
        </div>
      </div>

      {/* Panel 1: Model Seçimi */}
      <div className="panel">
        <div className="panel-header">Model Seçimi</div>
        <div className="panel-body grid-3">
          <div className="control-group">
            <label className="control-label">Model Türü</label>
            <select
              className="control-select"
              value={modelType}
              onChange={(e) => {
                setModelType(e.target.value);
                setSelectedAlgorithms([]);
                setAllParams({});
                setTarget("");
              }}
            >
              <option value="">Seçin</option>
              <option value="classification">Sınıflandırma</option>
              <option value="regression">Regresyon</option>
              <option value="clustering">Kümeleme</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Test Verisi Oranı (%)</label>
            <input
              type="number"
              className="control-input"
              min="0.05"
              max="0.95"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              disabled={modelType === "clustering" || !modelType}
            />
          </div>

          {(modelType === "classification" || modelType === "regression") && (
            <div className="control-group">
              <label className="control-label">Bağımlı Değişken</label>
              <select
                className="control-select"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Seçin</option>
                {columnNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Panel 2: Algoritmalar */}
      <div className="panel">
        <div className="panel-header">
          Algoritmalar <span className="badge">Seçili: {selectedAlgorithms.length}</span>
        </div>
        <div className="panel-body">
          {algoList.length === 0 ? (
            <p className="muted">Önce model türünü seçin.</p>
          ) : (
            <div className="chips">
              {algoList.map((a) => (
                <label key={a.value} className="chip-check">
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.includes(a.value)}
                    onChange={() => toggleAlgo(a.value)}
                  />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel 3: Doğrulama */}
      {(modelType === "classification" || modelType === "regression") && (
        <div className="panel">
          <div className="panel-header">Doğrulama Ayarları</div>
          <div className="panel-body grid-2">
            <div className="control-group">
              <label className="control-label">Cross-Validation Uygula</label>
              <label>
                <input
                  type="checkbox"
                  checked={cvEnabled}
                  onChange={(e) => setCvEnabled(e.target.checked)}
                />{" "}
                Etkin
              </label>
            </div>
            {cvEnabled && (
              <div className="control-group">
                <label className="control-label">CV Kat Sayısı</label>
                <input
                  type="number"
                  className="control-input"
                  min={2}
                  max={10}
                  value={cvFolds}
                  onChange={(e) => setCvFolds(parseInt(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel 4: Parametreler */}
      {selectedAlgorithms.length > 0 && (
        <div className="panel">
          <div className="panel-header">Parametreler</div>
          <div className="panel-body">
            {selectedAlgorithms.map((algo) => (
              <div key={algo} className="parameters-container">
                <h3 className="section-subtitle">🔧 {algo} Parametreleri</h3>
                {renderParamFields(algo)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="action-bar">
        <button onClick={handleModelTrain} className="train-button">
          Seçilen Algoritmalarla Model Eğit
        </button>
      </div>

      {/* SONUÇLAR */}
      {Array.isArray(modelResultsList) && modelResultsList.length > 0 && (
        <div className="model-results-list">
          {modelResultsList.map((res, i) => {
            if (modelType === "classification") {
              const cm = res.plots?.[0];
              const roc = res.plots?.[1];
              const imp = res.importancePlot;
              return (
                <section key={i} className="result-section card">
                  <h3 className="section-subtitle with-icons">📄 🧠 {res.algorithm} Sonuçları</h3>
                  <ClassificationKPIs metrics={res.metrics} />

                  <div className="graphs-3">
                    <div className="graph-card">
                      <div className="graph-title">Confusion Matrix</div>
                      {cm && (
                        <img
                          className="graph-image"
                          src={`data:image/png;base64,${cm}`}
                          alt="Confusion Matrix"
                        />
                      )}
                      <DownloadLink b64={cm} name={`${res.algorithm}_confusion.png`} />
                    </div>

                    <div className="graph-card">
                      <div className="graph-title">ROC Curve</div>
                      {roc && (
                        <img
                          className="graph-image"
                          src={`data:image/png;base64,${roc}`}
                          alt="ROC Curve"
                        />
                      )}
                      <DownloadLink b64={roc} name={`${res.algorithm}_roc.png`} />
                    </div>

                    <div className="graph-card">
                      <div className="graph-title">Özellik Önemi</div>
                      {imp && (
                        <img
                          className="graph-image"
                          src={`data:image/png;base64,${imp}`}
                          alt="Feature Importance"
                        />
                      )}
                      <DownloadLink b64={imp} name={`${res.algorithm}_importance.png`} />
                    </div>
                  </div>

                  <div className="result-actions right">
                    <button
                      className="download-model-btn"
                      onClick={() => downloadTrainedModel(res.algorithm, modelType)}
                    >
                      Modeli İndir
                    </button>
                  </div>
                </section>
              );
            }

            if (modelType === "regression") {
              const scatter = res.plots?.[0];
              const imp = res.importancePlot;
              return (
                <section key={i} className="result-section card">
                  <h3 className="section-subtitle with-icons">📄 📈 {res.algorithm} Sonuçları</h3>
                  <RegressionMetrics metrics={res.metrics} />

                  <div className="graphs-3">
                    <div className="graph-card">
                      <div className="graph-title">Gerçek vs Tahmin</div>
                      {scatter && (
                        <img
                          className="graph-image"
                          src={`data:image/png;base64,${scatter}`}
                          alt="Gerçek vs Tahmin"
                        />
                      )}
                      <DownloadLink b64={scatter} name={`${res.algorithm}_scatter.png`} />
                    </div>

                    <div className="graph-card">
                      <div className="graph-title">Özellik Önemi</div>
                      {imp && (
                        <img
                          className="graph-image"
                          src={`data:image/png;base64,${imp}`}
                          alt="Feature Importance"
                        />
                      )}
                      <DownloadLink b64={imp} name={`${res.algorithm}_importance.png`} />
                    </div>
                  </div>

                  <div className="result-actions right">
                    <button
                      className="download-model-btn"
                      onClick={() => downloadTrainedModel(res.algorithm, modelType)}
                    >
                      Modeli İndir
                    </button>
                  </div>
                </section>
              );
            }

            // clustering
            const clusterPlot = res.plots?.[0];
            return (
              <section key={i} className="result-section card">
                <h3 className="section-subtitle with-icons">📄 🧩 {res.algorithm} Sonuçları</h3>
                <ClusteringMetrics metrics={res.metrics} />

                <div className="graphs-3">
                  <div className="graph-card">
                    <div className="graph-title">Küme Dağılımı</div>
                    {clusterPlot && (
                      <img
                        className="graph-image"
                        src={`data:image/png;base64,${clusterPlot}`}
                        alt="Küme Dağılımı"
                      />
                    )}
                    <DownloadLink b64={clusterPlot} name={`${res.algorithm}_clusters.png`} />
                  </div>
                </div>

                <div className="result-actions right">
                  <button
                    className="download-model-btn"
                    onClick={() => downloadTrainedModel(res.algorithm, modelType)}
                  >
                    Modeli İndir
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selectedAlgorithms.length > 1 && modelType !== "clustering" && comparisonPlot && (
        <div className="comparison-plot">
          <h3 className="section-subtitle">📊 Algoritmaların Başarı Karşılaştırması</h3>
          <img
            src={`data:image/png;base64,${comparisonPlot}`}
            alt="başarı-karşılaştırma"
            className="graph-image"
          />
        </div>
      )}

      {selectedAlgorithms.length > 1 && modelType !== "clustering" && metricsTable && (
        <div className="metrics-table">
          <h3 className="section-subtitle">📋 Metrik Karşılaştırma Tablosu</h3>
          <img
            src={`data:image/png;base64,${metricsTable}`}
            alt="metrik-tablosu"
            className="graph-image"
          />
        </div>
      )}
    </div>
  );
}

export default Modeling;
