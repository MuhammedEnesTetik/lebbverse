// src/components/Preprocessing.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import ModulNavigation from "./ModulNavigation";
import "../style.css";

function Preprocessing({
  selectedOptions,
  handleOptionChange,
  preprocessTarget,
  setPreprocessTarget,
  preview,                 
  handlePreprocess,        
  downloadName,
  handleDownload,
  log = [],
  processedPreview = null, 
}) {
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [beforeSnapshot, setBeforeSnapshot] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tab, setTab] = useState("before"); 
  const [showOptions, setShowOptions] = useState(false);
  const [density, setDensity] = useState("comfortable"); 


  const hasPreview = Array.isArray(preview) && preview.length > 0;
  const headLimit = 30;

  const previewRef = useRef(preview);
  useEffect(() => { previewRef.current = preview; }, [preview]);

  const deepCopy = (x) => JSON.parse(JSON.stringify(x));

  // içerik karşılaştır
  function isDifferent(a, b, sampleRows = 20) {
    if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) return false;
    const ka = Object.keys(a[0] || {}), kb = Object.keys(b[0] || {});
    if (ka.length !== kb.length) return true;
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return true;
    const n = Math.min(sampleRows, a.length, b.length);
    for (let i = 0; i < n; i++) for (const k of ka) {
      const va = a[i]?.[k], vb = b[i]?.[k];
      const nanA = typeof va === "number" && Number.isNaN(va);
      const nanB = typeof vb === "number" && Number.isNaN(vb);
      if (!(nanA && nanB) && va !== vb) return true;
    }
    return false;
  }

  // Kolon sayısal mı? (sade kontrol)
  const isNumericCol = (rows, col) => {
    if (!rows || !rows.length) return false;
    const v = rows[0]?.[col];
    return typeof v === "number";
  };

  // Satır i, kolon adı col özelinde hücre farkı var mı?
  const cellDifferent = (i, col) => {
    const a = beforeSource?.[i]?.[col];
    const b = afterPreview?.[i]?.[col];
    const nanA = typeof a === "number" && Number.isNaN(a);
    const nanB = typeof b === "number" && Number.isNaN(b);
    if (nanA && nanB) return false;
    return a !== b;
  };

  // kaynaklar
  const beforeSource = beforeSnapshot && beforeSnapshot.length ? beforeSnapshot : (hasPreview ? preview : []);

  const beforeCols = useMemo(
    () => (beforeSource.length ? Object.keys(beforeSource[0]) : []),
    [beforeSource]
  );
  const beforeHead = useMemo(
    () => beforeSource.slice(0, headLimit).map(r => beforeCols.map(c => r[c])),
    [beforeSource, beforeCols]
  );

  const afterCols = useMemo(
    () => (afterPreview && afterPreview.length ? Object.keys(afterPreview[0]) : []),
    [afterPreview]
  );
  const afterHead = useMemo(
    () => (afterPreview ? afterPreview.slice(0, headLimit).map(r => afterCols.map(c => r[c])) : []),
    [afterPreview, afterCols]
  );

  // özetler
  const countMissing = (rows) => {
    if (!Array.isArray(rows) || !rows.length) return 0;
    let miss = 0;
    for (const r of rows) for (const v of Object.values(r)) {
      if (v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v))) miss++;
    }
    return miss;
  };

  const summaryBefore = useMemo(() => {
    if (!beforeSource.length) return { rows:0, cols:0, missing:0, cat:0 };
    return {
      rows: beforeSource.length,
      cols: beforeCols.length,
      missing: countMissing(beforeSource),
      cat: beforeCols.filter(c => typeof beforeSource[0]?.[c] === "string").length,
    };
  }, [beforeSource, beforeCols]);

  const summaryAfter = useMemo(() => {
    if (!afterPreview || !afterPreview.length) return null;
    const cols = Object.keys(afterPreview[0]);
    return {
      rows: afterPreview.length,
      cols: cols.length,
      missing: countMissing(afterPreview),
      cat: cols.filter(c => typeof afterPreview[0]?.[c] === "string").length,
    };
  }, [afterPreview]);

  const deltas = useMemo(() => {
    if (!summaryAfter) return null;
    return {
      cols: { from: summaryBefore.cols, to: summaryAfter.cols },
      missing: { from: summaryBefore.missing, to: summaryAfter.missing },
    };
  }, [summaryBefore, summaryAfter]);

  // APPLY
  async function onApply(){
    setErrorMsg(null);
    if (hasPreview) setBeforeSnapshot(deepCopy(previewRef.current));

    try {
      const ret = await Promise.resolve(handlePreprocess?.());

      // 1) Dönüşte veri geldiyse
      if (ret && Array.isArray(ret.preview)) {
        setAfterPreview(ret.preview);
        setTab("compare");
        return;
      }
      // 2) Prop ile doğrudan geldiyse
      if (processedPreview && Array.isArray(processedPreview)) {
        setAfterPreview(processedPreview);
        setTab("compare");
        return;
      }
      // 3) Parent preview’i yerinde güncellediyse: ref üzerinden izle
      const original = deepCopy(beforeSnapshot ?? previewRef.current);
      const start = Date.now();

      const tick = () => {
        const current = previewRef.current;
        if (Array.isArray(current) && isDifferent(current, original)) {
          setAfterPreview(deepCopy(current));
          setTab("compare");
          return;
        }
        if (Date.now() - start > 2000) return;
        setTimeout(tick, 120);
      };
      setTimeout(tick, 120);
    } catch (e) {
      setAfterPreview(null);
      setTab("before");
      setErrorMsg("Sunucuya erişim hatası. Backend (localhost:5000) çalışmalı.");
    }
  }

  // processedPreview prop’u sonradan dolarsa yakala
  useEffect(() => {
    if (processedPreview && Array.isArray(processedPreview)) {
      setAfterPreview(processedPreview);
    }
  }, [processedPreview]);

  function handleFormatDownload() {
    if (!downloadName) { alert("Önce veri dosyasını oluşturun."); return; }
    window.location.href = `http://localhost:5000/download?filename=${downloadName}&format=${downloadFormat}`;
  }

  return (
    <div className="preprocessing-layout container">
      <aside className="sticky-summary card">
        <h4 className="section-title">Özet</h4>
        <ul className="mini-list">
          <li><strong>Satır:</strong> {summaryBefore.rows}</li>
          <li><strong>Sütun:</strong> {summaryBefore.cols}</li>
          <li><strong>Eksik:</strong> {summaryBefore.missing}</li>
          <li><strong>Hedef:</strong> {preprocessTarget || "-"}</li>
        </ul>

        {summaryAfter && (
          <>
            <h4 className="section-subtitle">Sonrası</h4>
            <ul className="mini-list">
              <li><strong>Satır:</strong> {summaryAfter.rows}</li>
              <li><strong>Sütun:</strong> {summaryAfter.cols}</li>
              <li><strong>Eksik:</strong> {summaryAfter.missing}</li>
            </ul>
          </>
        )}

        {downloadName && (
          <>
            <div className="download-controls">
              <label>İndirme Formatı:</label>
              <select
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value)}
                className="format-select"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <button onClick={handleFormatDownload} className="download-button" style={{ marginTop: 8 }}>
              Veriyi İndir
            </button>
          </>
        )}
      </aside>

      <div className="preprocessing-container">
        <div className="section-title">
          <span>Veri Ön İşleme</span>
          <div className="module-nav-buttons">
            <button onClick={() => window.location.href='/visualization'}>Veri Görselleştirme</button>
            <button onClick={() => window.location.href='/modeling'}>Veri Modellemesi</button>
          </div>
        </div>

        {errorMsg && (
          <div className="results-pre" style={{ marginTop:8, borderColor:"#ef4444", color:"#fecaca" }}>
            {errorMsg}
          </div>
        )}

        {!hasPreview ? (
          <div className="compare-card" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, color: "#9fb0cc" }}>Önizleme bulunamadı. Lütfen bir dosya yükleyin.</p>
          </div>
        ) : (
          <>
            <section className="summary-and-compare">
              <div className="summary-cards">
                <div className="summary-card"><div className="kpi-top">{summaryBefore.rows}</div><div className="kpi-bottom">Satır</div></div>
                <div className="summary-card"><div className="kpi-top">{summaryBefore.cols}</div><div className="kpi-bottom">Sütun</div></div>
                <div className="summary-card"><div className="kpi-top">{summaryBefore.missing}</div><div className="kpi-bottom">Eksik</div></div>
                <div className="summary-card"><div className="kpi-top">{summaryAfter ? summaryAfter.cols : "-"}</div><div className="kpi-bottom">Sütun (Sonrası)</div></div>
              </div>

              {/* Karşılaştırma kartı */}
              <div className={`compare-card ${density === "compact" ? "table-density-compact" : ""}`}>
                <div className="compare-header">
                  <div className="tabs">
                    <button className={`tab ${tab==="before"?"is-active":""}`} onClick={()=>setTab("before")}>Öncesi</button>
                    <button className={`tab ${tab==="after" ?"is-active":""}`}  onClick={()=>setTab("after")} disabled={!afterPreview}>Sonrası</button>
                    <button className={`tab ${tab==="compare"?"is-active":""}`} onClick={()=>setTab("compare")} disabled={!afterPreview}>Karşılaştır</button>
                  </div>

                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    {deltas && (
                      <div className="deltas">
                        <span className="delta-badge">Sütun: {deltas.cols.from} → {deltas.cols.to}</span>
                        <span className="delta-badge">Eksik: {deltas.missing.from} → {deltas.missing.to}</span>
                      </div>
                    )}

                    {/* Yoğunluk anahtarı */}
                    <div className="density-toggle" role="group" aria-label="Tablo yoğunluğu">
                      <button
                        type="button"
                        className={`chip ${density === "comfortable" ? "is-active" : ""}`}
                        onClick={() => setDensity("comfortable")}
                      >
                        Rahat
                      </button>
                      <button
                        type="button"
                        className={`chip ${density === "compact" ? "is-active" : ""}`}
                        onClick={() => setDensity("compact")}
                      >
                        Sıkı
                      </button>
                    </div>
                  </div>
                </div>

                {/* ÖNCESİ */}
                {tab==="before" && (
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>{beforeCols.map(c => <th key={c}>{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {beforeHead.map((row,i) => (
                          <tr key={i}>
                            {row.map((v,j) => <td key={j}>{String(v)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SONRASI */}
                {tab==="after" && afterPreview && (
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>{afterCols.map(c => <th key={c}>{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {afterHead.map((row, i) => (
                          <tr key={i}>
                            {row.map((v, j) => {
                              const col = afterCols[j];
                              const numeric = isNumericCol(afterPreview, col);
                              const diff = beforeSource && cellDifferent(i, col);
                              const beforeVal = beforeSource?.[i]?.[col];
                              const titleText = diff ? `${String(beforeVal)} → ${String(v)}` : "";
                              return (
                                <td
                                  key={j}
                                  className={`${numeric ? "is-num" : ""} ${diff ? "changed" : ""}`}
                                  title={titleText}
                                >
                                  {String(v)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>
                )}

                {/* KARŞILAŞTIR — ALT ALTA */}
                {tab==="compare" && afterPreview && (
                  <div className="compare-stack" style={{display:"grid", gap:12}}>
                    <div>
                      <div className="table-label">Öncesi</div>
                      <div className="preview-table-container">
                        <table className="preview-table">
                          <thead>
                            <tr>{beforeCols.map(c => <th key={c}>{c}</th>)}</tr>
                          </thead>
                          <tbody>
                            {beforeHead.map((r, i) => (
                              <tr key={i}>
                                {r.map((v, j) => {
                                  const col = beforeCols[j];
                                  const numeric = isNumericCol(beforeSource, col);
                                  const diff = afterPreview && cellDifferent(i, col);
                                  const afterVal = afterPreview?.[i]?.[col];
                                  const titleText = diff ? `${String(v)} → ${String(afterVal)}` : "";
                                  return (
                                    <td
                                      key={j}
                                      className={`${numeric ? "is-num" : ""} ${diff ? "changed" : ""}`}
                                      title={titleText}
                                    >
                                      {String(v)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>

                        </table>
                      </div>
                    </div>

                    <div>
                      <div className="table-label">Sonrası</div>
                      <div className="preview-table-container">
                        <table className="preview-table">
                          <thead>
                            <tr>{afterCols.map(c => <th key={c}>{c}</th>)}</tr>
                          </thead>
                          <tbody>
                            {afterHead.map((r, i) => (
                              <tr key={i}>
                                {r.map((v, j) => {
                                  const col = afterCols[j];
                                  const numeric = isNumericCol(afterPreview, col);
                                  const diff = beforeSource && cellDifferent(i, col);
                                  const beforeVal = beforeSource?.[i]?.[col];
                                  const titleText = diff ? `${String(beforeVal)} → ${String(v)}` : "";
                                  return (
                                    <td
                                      key={j}
                                      className={`${numeric ? "is-num" : ""} ${diff ? "changed" : ""}`}
                                      title={titleText}
                                    >
                                      {String(v)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>

                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* İşlem seçenekleri — katlanabilir */}
          <div className="section-accordion card">
            <button
              className={`section-accordion__header ${showOptions ? "is-open" : ""}`}
              onClick={() => setShowOptions(v => !v)}
              type="button"
            >
              <span className="section-accordion__title">⚙️ İşlem Seçenekleri</span>
              <span className="section-accordion__hint">
                {showOptions ? "Gizle" : "Göster"}
              </span>
            </button>

            {showOptions && (
              <div className="options-container section-accordion__body">
                {[
                  { key: "fillMissing", label: "Eksik Değerleri Doldur" },
                  { key: "encodeCategorical", label: "Kategorik Veriyi Sayısala Çevir" },
                  { key: "standardize", label: "Verileri Standartlaştır" },
                  { key: "normalize", label: "Verileri Normalleştir" },
                  { key: "removeOutliers", label: "Aykırı Değerleri Temizle" },
                  { key: "convertDtype", label: "Veri Tipini Dönüştür" },
                  { key: "labelEncode", label: "Label Encoding Uygula" },
                  { key: "oneHotEncode", label: "One-Hot Encoding Uygula" },
                ].map((opt) => (
                  <label key={opt.key} className="option-checkbox">
                    <input
                      type="checkbox"
                      name={opt.key}
                      checked={selectedOptions[opt.key] || false}
                      onChange={handleOptionChange}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>


            <div className="target-select-container">
              <h3 className="section-subtitle">🎯 Hedef Değişken (Scaler'dan Hariç Tutulacak)</h3>
              <select
                value={preprocessTarget}
                onChange={(e) => setPreprocessTarget(e.target.value)}
                className="target-select"
              >
                <option value="">Seçin</option>
                {beforeCols.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div className="preprocessing-buttons">
              <button onClick={onApply} className="preprocess-button">İşlemleri Uygula</button>
            </div>

            {log.length > 0 && (
              <div className="model-results" style={{ marginTop: 14 }}>
                <h3 className="section-subtitle"> İşlem Günlüğü</h3>
                <div className="results-pre">
                  <ul className="log-list">
                    {log.map((entry, index) => (<li key={index}>{entry}</li>))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Preprocessing;
