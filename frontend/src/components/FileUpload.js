import React, { useState } from "react";

function FileUpload({ handleFileChange, handleAnalyze }) {
  const allowedExtensions = [".csv", ".xls", ".xlsx"];
  const [fileName, setFileName] = useState("");

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      alert("❌ Desteklenmeyen dosya türü. Lütfen .csv, .xls veya .xlsx uzantılı bir dosya yükleyin.");
      e.target.value = "";
      setFileName("");
      return;
    }

    setFileName(file.name);
    handleFileChange(e);
  };

  return (
    <div className="file-upload-container card">
      <h2 className="section-title">📁 Dosya Yükle</h2>

      {/* Özel dosya seç butonu */}
      <label className="custom-file-upload">
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={onFileChange}
        />
        Dosya Seç
      </label>

      {/* Seçilen dosya adı */}
      {fileName && <span className="file-name">{fileName}</span>}

      <button
        onClick={handleAnalyze}
        className="analyze-button"
        disabled={!fileName}
        title={!fileName ? "Önce bir dosya seçin" : "Yükle ve Analiz Et"}
        style={{ marginLeft: "auto" }}
      >
        Yükle ve Analiz Et
      </button>
    </div>
  );
}

export default FileUpload;
