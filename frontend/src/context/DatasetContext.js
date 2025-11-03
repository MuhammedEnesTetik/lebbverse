import React, { createContext, useContext, useState } from "react";

// 1. Context oluştur
const DatasetContext = createContext();

// 2. Provider bileşeni
export const DatasetProvider = ({ children }) => {
  const [datasetState, setDatasetState] = useState({
    filename: "",
    preview: [],
    insights: null,
    downloadName: "",
    log: [],
    fullData: [],
    selectedOptions: {},
    preprocessTarget: "",

    // görselleştirme
    graphList: [],

    // modelleme
    modelType: "",
    target: "",
    selectedAlgorithms: [],
    allParams: {},
    cvEnabled: false,
    cvFolds: 5,
    modelResultsList: [],
    comparisonPlot: null,
    metricsTable: null,
  });

  const resetDataset = () => {
    setDatasetState({
      filename: "",
      preview: [],
      insights: null,
      downloadName: "",
      log: [],
      fullData: [],
      selectedOptions: {},
      preprocessTarget: "",
      graphList: [],
      modelType: "",
      target: "",
      selectedAlgorithms: [],
      allParams: {},
      cvEnabled: false,
      cvFolds: 5,
      modelResultsList: [],
      comparisonPlot: null,
      metricsTable: null,
    });
  };

  return (
    <DatasetContext.Provider value={{ datasetState, setDatasetState, resetDataset }}>
      {children}
    </DatasetContext.Provider>
  );
};

// 3. Custom hook
export const useDataset = () => useContext(DatasetContext);
