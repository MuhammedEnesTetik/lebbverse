import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import FileUpload from "./components/FileUpload";
import DataPreview from "./components/DataPreview";
import Preprocessing from "./components/Preprocessing";
import Visualization from "./components/Visualization";
import Modeling from "./components/Modeling";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ModulesPage from "./components/ModulesPage";
import About from "./components/About";

import { DatasetProvider } from "./context/DatasetContext";

function AppWrapper() {
  const location = useLocation();

  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState([]);
  const [downloadName, setDownloadName] = useState("");
  const [graph, setGraph] = useState(null);
  const [graphList, setGraphList] = useState([]);

  const [selectedAlgorithms, setSelectedAlgorithms] = useState([]);
  const [allParams, setAllParams] = useState({});
  const [cvEnabled, setCvEnabled] = useState(false);
  const [cvFolds, setCvFolds] = useState(5);
  const [modelResultsList, setModelResultsList] = useState([]);

  const [comparisonPlot, setComparisonPlot] = useState(null);
  const [metricsTable, setMetricsTable] = useState(null);

  const [selectedOptions, setSelectedOptions] = useState({
    fillMissing: false,
    encodeCategorical: false,
    scaleNumerical: false,
    outlierRemoval: false,
    minMaxScaler: false,
  });

  const [preprocessTarget, setPreprocessTarget] = useState("");
  const [modelType, setModelType] = useState("");
  const [target, setTarget] = useState("");
  const [modelResult, setModelResult] = useState(null);
  const [modelFilename, setModelFilename] = useState("");
  const [importancePlot, setImportancePlot] = useState(null);
  const [modelPlots, setModelPlots] = useState({});
  const [fullData, setFullData] = useState([]);
  const [testSize, setTestSize] = useState(0.2);
  const [scoreData, setScoreData] = useState(null);

  const [graphType, setGraphType] = useState("");
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");

  useEffect(() => {
    if (["/preprocessing", "/visualization", "/modeling"].includes(location.pathname)) {
      setFile(null);
      setFilename("");
      setPreview([]);
      setInsights(null);
      setDownloadName("");
      setGraph(null);
      setModelResult(null);
      setModelFilename("");
      setImportancePlot(null);
      setModelPlots({});
      setFullData([]);
      setTarget("");
      setPreprocessTarget("");
      setModelType("");
      setScoreData(null);
    }
  }, [location.pathname]);

  const handleOptionChange = (e) => {
    const { name, checked } = e.target;
    setSelectedOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFilename("");
    setPreview([]);
    setInsights(null);
    setError("");
    setLog([]);
    setDownloadName("");
    setGraph(null);
    setModelResult(null);
    setModelFilename("");
    setImportancePlot(null);
  };

  const handleAnalyze = () => {
    const formData = new FormData();
    formData.append("file", file);

    fetch("http://localhost:5000/analyze", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFilename(data.filename);
          setPreview(data.preview);
          setInsights(data.insights);
          setFullData(data.full_data || []);
          setSelectedOptions(data.insights.suggestions);
          setDownloadName(data.filename);
        }
      })
      .catch(() => setError("Sunucuya bağlanılamadı."));
  };

  const handlePreprocess = () => {
    fetch("http://localhost:5000/preprocess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: filename,
        options: selectedOptions,
        target_column: preprocessTarget,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPreview(data.preview);
          setLog(data.log);
          setDownloadName(data.download_name);
        }
      });
  };

  const handleDownload = () => {
    window.location.href = `http://localhost:5000/download?filename=${downloadName}`;
  };

  const handleVisualize = (chartPayloadArray) => {
    if (!downloadName) {
      setError("Lütfen önce bir veri seti yükleyin.");
      return;
    }

    fetch(`http://localhost:5000/visualize?filename=${downloadName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chartPayloadArray),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Sunucu hatası");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setGraphList(data);
          setError(null);
        } else {
          setError("Grafikler alınamadı.");
        }
      })
      .catch(() => setError("Görselleştirme sırasında hata oluştu."));
  };

  const handleModelTrain = () => {
    if (!downloadName || !modelType || selectedAlgorithms.length === 0) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    if ((modelType === "classification" || modelType === "regression") && !target) {
      alert("Lütfen bağımlı değişkeni seçin.");
      return;
    }

    const normalizedParams = {};
    for (const algo in allParams) {
      normalizedParams[algo] = {};
      for (const param in allParams[algo]) {
        let value = allParams[algo][param];
        if (typeof value === "string") {
          value = value.replace(",", ".");
          if (!isNaN(value)) value = parseFloat(value);
        }
        normalizedParams[algo][param] = value;
      }
    }

    const payload = {
      filename: downloadName,
      modelType,
      algorithms: selectedAlgorithms,
      params: normalizedParams,
      target,
      testSize,
      cvEnabled: cvEnabled,
      cvFolds: cvFolds,
    };

    fetch("http://localhost:5000/train-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Sunucu hatası");
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          alert("Modelleme başarısız: " + data.error);
          return;
        }
        if (data.results) {
          setModelResultsList(data.results);
          setComparisonPlot(data.comparison_plot || null);
          setMetricsTable(data.metrics_table || null);
        } else {
          alert("Modelleme başarısız. Sunucudan geçerli veri alınamadı.");
        }
      })
      .catch(() => {
        alert("Modelleme sırasında hata oluştu.");
      });
  };

  return (
    <DatasetProvider>
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/about" element={<About />} />

          <Route
            path="/preprocessing"
            element={
              <div className="container">
                <h1 className="main-title">📊 Veri Ön İşleme Modülü</h1>
                <FileUpload handleFileChange={handleFileChange} handleAnalyze={handleAnalyze} />
                <DataPreview insights={insights} preview={preview} />
                <Preprocessing
                  selectedOptions={selectedOptions}
                  handleOptionChange={handleOptionChange}
                  preprocessTarget={preprocessTarget}
                  setPreprocessTarget={setPreprocessTarget}
                  preview={preview}
                  handlePreprocess={handlePreprocess}
                  downloadName={downloadName}
                  handleDownload={handleDownload}
                  log={log}
                />
              </div>
            }
          />

          <Route
            path="/visualization"
            element={
              <div className="container">
                <h1 className="main-title">📈 Veri Görselleştirme Modülü</h1>
                <FileUpload handleFileChange={handleFileChange} handleAnalyze={handleAnalyze} />
                <DataPreview insights={insights} preview={preview} />
                <Visualization
                  downloadName={downloadName}
                  preview={preview}
                  graphType={graphType}
                  setGraphType={setGraphType}
                  xColumn={xColumn}
                  setXColumn={setXColumn}
                  yColumn={yColumn}
                  setYColumn={setYColumn}
                  handleVisualize={handleVisualize}
                  graphList={graphList}
                />
              </div>
            }
          />

          <Route
            path="/modeling"
            element={
              <div className="container">
                <h1 className="main-title">🤖 Veri Modellemesi Modülü</h1>
                <FileUpload handleFileChange={handleFileChange} handleAnalyze={handleAnalyze} />
                <DataPreview insights={insights} preview={preview} />
                <Modeling
                  downloadName={downloadName}
                  preview={preview}
                  modelType={modelType}
                  setModelType={setModelType}
                  selectedAlgorithms={selectedAlgorithms}
                  setSelectedAlgorithms={setSelectedAlgorithms}
                  allParams={allParams}
                  setAllParams={setAllParams}
                  target={target}
                  setTarget={setTarget}
                  testSize={testSize}
                  setTestSize={setTestSize}
                  cvEnabled={cvEnabled}
                  setCvEnabled={setCvEnabled}
                  cvFolds={cvFolds}
                  setCvFolds={setCvFolds}
                  comparisonPlot={comparisonPlot}
                  metricsTable={metricsTable}
                  handleModelTrain={handleModelTrain}
                  modelResultsList={modelResultsList}
                />
              </div>
            }
          />
        </Routes>
        <Footer />
      </>
    </DatasetProvider>
  );
}

export default AppWrapper;
