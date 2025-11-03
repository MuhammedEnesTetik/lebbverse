# backend/app.py
import matplotlib
matplotlib.use('Agg')

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler, LabelEncoder
import numpy as np
import io
import base64
from sklearn.model_selection import train_test_split, cross_val_predict, cross_validate

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, mean_squared_error, r2_score
)
# Kümeleme metrikleri
from sklearn.metrics import (
    silhouette_score, calinski_harabasz_score, davies_bouldin_score
)

from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
)
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC, SVR
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering

import joblib

# ----------------------------
# Flask config
# ----------------------------
app = Flask(__name__)
CORS(app, supports_credentials=False, resources={r"/*": {"origins": "http://localhost:3000"}})

# Depo klasörleri
BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
PROCESSED_FOLDER = os.path.join(BASE_DIR, "processed")
MODEL_FOLDER = os.path.join(BASE_DIR, "models")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(MODEL_FOLDER, exist_ok=True)

def log_user_action(*args, **kwargs):
    return

# ----------------------------
# Yardımcılar
# ----------------------------
def plot_to_base64():
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
    plt.close()
    return img

def generate_classification_plots(y_true, y_pred, y_prob=None):
    plots = {}

    # Confusion Matrix
    plt.figure(figsize=(5, 4))
    cm = confusion_matrix(y_true, y_pred)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title("Confusion Matrix")
    plots["confusion_matrix"] = plot_to_base64()

    # ROC (binary ise)
    if y_prob is not None and len(np.unique(y_true)) == 2:
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        roc_auc = auc(fpr, tpr)
        plt.figure(figsize=(5, 4))
        plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.2f}")
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("ROC Curve")
        plt.legend(loc="lower right")
        plots["roc_curve"] = plot_to_base64()

    return plots

def generate_regression_scatter(y_true, y_pred):
    plt.figure(figsize=(5, 4))
    sns.scatterplot(x=y_true, y=y_pred)
    plt.xlabel("Gerçek Değerler")
    plt.ylabel("Tahmin Edilen Değerler")
    plt.title("Gerçek vs Tahmin")
    return plot_to_base64()

def save_model(algo, model_type, model):
    try:
        path = os.path.join(MODEL_FOLDER, f"{algo}_{model_type}.pkl")
        joblib.dump(model, path)
    except Exception:
        pass

# ----------------------------
# Sağlık ucu
# ----------------------------
@app.route("/")
def home():
    return jsonify({"message": "Flask backend (demo) çalışıyor."})

# ----------------------------
# 1) ANALYZE
# ----------------------------
@app.route("/analyze", methods=["POST"])
def analyze_file():
    if 'file' not in request.files:
        return jsonify({"error": "Dosya bulunamadı."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Dosya adı boş."}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        df = pd.read_csv(filepath)
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        preview = df.head().to_dict(orient="records")

        boolean_cols = df.select_dtypes(include=["bool"]).columns.tolist()
        numerical_cols = df.select_dtypes(include=["number"]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        for col in numerical_cols.copy():
            s = df[col].dropna()
            if len(s) > 0 and s.isin([0, 1]).all():
                boolean_cols.append(col)
                numerical_cols.remove(col)

        column_types = {
            "Numerical": numerical_cols,
            "Categorical": categorical_cols,
            "Boolean": boolean_cols
        }

        has_missing = df.isnull().sum().sum() > 0

        desc = df[numerical_cols].describe().transpose().round(2).reset_index() if numerical_cols else pd.DataFrame(columns=[
            "Feature","count","mean","std","min","25%","50%","75%","max"
        ])
        desc = desc.rename(columns={
            "index": "Feature",
            "mean": "Mean",
            "std": "Std Dev",
            "min": "Min",
            "25%": "Q1 (25%)",
            "50%": "Median (50%)",
            "75%": "Q3 (75%)",
            "max": "Max"
        })
        descriptive_stats = desc.to_dict(orient="records")

        missing_info = (df.isnull().sum() / len(df) * 100).round(2)
        missing_info = missing_info[missing_info > 0].reset_index()
        missing_info.columns = ["Feature", "MissingPercentage"]
        missing_info = missing_info.to_dict(orient="records")

        suggestions = {
            "fillMissing": bool(has_missing),
            "encodeCategorical": bool(len(categorical_cols) > 0),
            "scaleNumerical": bool(len(numerical_cols) > 0)
        }

        insights = {
            "row_count": int(len(df)),
            "column_count": int(len(df.columns)),
            "missing_values": int(df.isnull().sum().sum()),
            "missing_info": missing_info,
            "numerical_columns": numerical_cols,
            "categorical_columns": categorical_cols,
            "suggestions": suggestions,
            "descriptive_stats": descriptive_stats,
            "column_types": column_types
        }

        return jsonify({
            "preview": preview,
            "insights": insights,
            "filename": file.filename,
            "full_data": df.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------
# 2) PREPROCESS
# ----------------------------
@app.route("/preprocess", methods=["POST"])
def preprocess():
    try:
        data = request.get_json()
        filename = data.get("filename")
        options = data.get("options", {})
        target_column = data.get("target_column")

        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({"error": "Dosya bulunamadı."}), 404

        df = pd.read_csv(filepath)
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        log = []

        if options.get("fillMissing"):
            df.fillna(df.mean(numeric_only=True), inplace=True)
            log.append("Eksik değerler ortalama ile dolduruldu.")

        if options.get("encodeCategorical"):
            cat_cols = df.select_dtypes(include=["object", "category"]).columns
            for col in cat_cols:
                try:
                    df[col] = LabelEncoder().fit_transform(df[col].astype(str))
                    log.append(f"{col} sütunu LabelEncoder ile sayısala çevrildi.")
                except Exception:
                    log.append(f"{col} sütunu encode edilemedi.")

        if options.get("standardize"):
            numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
            if target_column in numeric_cols:
                numeric_cols.remove(target_column)
            if numeric_cols:
                scaler = StandardScaler()
                df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
                log.append("Veriler StandardScaler ile standartlaştırıldı.")

        if options.get("normalize"):
            from sklearn.preprocessing import MinMaxScaler
            numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
            if target_column in numeric_cols:
                numeric_cols.remove(target_column)
            if numeric_cols:
                scaler = MinMaxScaler()
                df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
                log.append("Veriler MinMaxScaler ile normalize edildi.")

        if options.get("removeOutliers"):
            numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
            if target_column in numeric_cols:
                numeric_cols.remove(target_column)
            for col in numeric_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                before = len(df)
                df = df[(df[col] >= Q1 - 1.5 * IQR) & (df[col] <= Q3 + 1.5 * IQR)]
                after = len(df)
                log.append(f"{col} sütununda {before - after} aykırı değer çıkarıldı.")

        if options.get("convertDtype"):
            for col in df.columns:
                try:
                    df[col] = pd.to_numeric(df[col], errors="ignore")
                except Exception:
                    continue
            log.append("Veri tipleri dönüştürülmeye çalışıldı.")

        if options.get("selectColumns"):
            selected = data.get("params", {}).get("selected_columns", [])
            if selected:
                existing = [col for col in selected if col in df.columns]
                df = df[existing]
                log.append(f"Sadece seçilen {len(existing)} kolon tutuldu.")
            else:
                log.append("Seçilen kolonlar parametresi boş.")

        if options.get("labelEncode"):
            for col in df.columns:
                if df[col].dtype == object:
                    try:
                        df[col] = LabelEncoder().fit_transform(df[col].astype(str))
                        log.append(f"{col} sütunu LabelEncoder ile encode edildi.")
                    except Exception:
                        log.append(f"{col} sütunu encode edilemedi.")

        if options.get("oneHotEncode"):
            cat_cols = df.select_dtypes(include=["object", "category"]).columns
            if len(cat_cols) > 0:
                df = pd.get_dummies(df, columns=cat_cols)
                log.append("One-Hot Encoding uygulandı.")

        if options.get("renameColumns"):
            rename_map = data.get("params", {}).get("rename_map", {})
            df.rename(columns=rename_map, inplace=True)
            log.append("Kolon adları yeniden adlandırıldı.")

        processed_filename = f"processed_{filename}"
        processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
        df.to_csv(processed_path, index=False)

        log_user_action("demo", "Preprocess", filename, str(options))

        preview = df.head().to_dict(orient="records")
        return jsonify({
            "preview": preview,
            "log": log,
            "download_name": processed_filename
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------
# 3) VISUALIZE
# ----------------------------
@app.route("/visualize", methods=["POST"])
def visualize():
    try:
        payload = request.get_json()
        filename = request.args.get("filename")
        if not filename:
            return jsonify({"error": "Dosya adı eksik."}), 400

        processed_path = os.path.join(PROCESSED_FOLDER, filename)
        uploads_path = os.path.join(UPLOAD_FOLDER, filename)
        filepath = processed_path if os.path.exists(processed_path) else uploads_path

        if not os.path.exists(filepath):
            return jsonify({"error": "Veri dosyası bulunamadı."}), 404

        df = pd.read_csv(filepath)
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        results = []

        for item in payload:
            chart_type = item.get("chartType")
            x_col = item.get("xColumn")
            y_col = item.get("yColumn", None)

            if x_col not in df.columns or (y_col and y_col not in df.columns):
                continue

            plt.figure(figsize=(7, 5))

            try:
                if chart_type == "histogram":
                    sns.histplot(df[x_col].dropna(), kde=True)

                elif chart_type == "bar":
                    sns.countplot(x=df[x_col])

                elif chart_type == "scatter" and y_col:
                    sns.scatterplot(x=df[x_col], y=df[y_col])

                elif chart_type == "box" and y_col:
                    sns.boxplot(x=df[x_col], y=df[y_col])

                elif chart_type == "pie":
                    counts = df[x_col].value_counts()
                    plt.pie(counts, labels=counts.index, autopct="%1.1f%%")
                    plt.axis("equal")

                elif chart_type == "line" and y_col:
                    sns.lineplot(x=df[x_col], y=df[y_col])

                elif chart_type == "heatmap":
                    sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")

                elif chart_type == "violin" and y_col:
                    sns.violinplot(x=df[x_col], y=df[y_col])

                elif chart_type == "count":
                    sns.countplot(x=df[x_col])

                elif chart_type == "kde":
                    sns.kdeplot(data=df[x_col].dropna(), fill=True)

                else:
                    continue

                buf = io.BytesIO()
                plt.tight_layout()
                plt.savefig(buf, format="png")
                buf.seek(0)
                image_base64 = base64.b64encode(buf.read()).decode("utf-8")
                buf.close()
                plt.close()

                results.append({
                    "chartType": chart_type,
                    "image": image_base64
                })

            except Exception as e:
                print(f"{chart_type} grafik hatası:", e)
                plt.close()
                continue

        log_user_action("demo", "Visualize", filename, str(payload))
        return jsonify(results)

    except Exception as e:
        print("🎨 Görselleştirme hatası:", e)
        return jsonify({"error": f"Görselleştirme hatası: {str(e)}"}), 500

# ----------------------------
# 4) TRAIN MODELS
# ----------------------------
@app.route("/train-models", methods=["POST"])
def train_models():
    try:
        data = request.get_json()
        filename = data.get("filename")
        model_type = data.get("modelType")
        algorithms = data.get("algorithms", [])
        all_params = data.get("params", {})
        target = data.get("target")
        test_size = float(data.get("testSize", 0.2))
        cv_enabled = data.get("cvEnabled", False)
        cv_folds = int(data.get("cvFolds", 5))

        filepath = os.path.join(PROCESSED_FOLDER, filename)
        if not os.path.exists(filepath):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({"error": "Dosya bulunamadı."}), 404

        df = pd.read_csv(filepath)
        model_results = []
        summary_metrics = {}

        # X, y (clustering hariç)
        if model_type in ["classification", "regression"]:
            if target not in df.columns:
                return jsonify({"error": "Hedef kolon bulunamadı."}), 400
            X = df.drop(columns=[target])
            y = df[target]

        clf_map = {
            "classification": {
                "RandomForest": RandomForestClassifier,
                "LogisticRegression": LogisticRegression,
                "DecisionTree": DecisionTreeClassifier,
                "KNN": KNeighborsClassifier,
                "SVM": SVC,
                "NaiveBayes": GaussianNB,
                "GradientBoosting": GradientBoostingClassifier,
            },
            "regression": {
                "LinearRegression": LinearRegression,
                "RandomForest": RandomForestRegressor,
                "DecisionTree": DecisionTreeRegressor,
                "KNN": KNeighborsRegressor,
                "SVR": SVR,
                "Ridge": Ridge,
                "Lasso": Lasso,
                "GradientBoosting": GradientBoostingRegressor,
            },
            "clustering": {
                "KMeans": KMeans,
                "DBSCAN": DBSCAN,
                "AgglomerativeClustering": AgglomerativeClustering,
            }
        }

        for algo in algorithms:
            metrics = {}
            plots = []
            importance_plot = None
            params = dict(all_params.get(algo, {}))

            ModelClass = clf_map.get(model_type, {}).get(algo)
            if not ModelClass:
                continue

            # Varsayılan parametreler
            if algo in ["RandomForest", "GradientBoosting"]:
                params.setdefault("n_estimators", 100)
                params.setdefault("random_state", 42)
            if algo == "LogisticRegression":
                params.setdefault("max_iter", 1000)
                params.setdefault("solver", "lbfgs")
            if algo == "DecisionTree":
                params.setdefault("max_depth", 5)
            if algo == "KNN":
                params.setdefault("n_neighbors", 5)
            if algo in ["SVM", "SVR"]:
                params.setdefault("kernel", "rbf")
                params.setdefault("C", 1)
            if algo in ["Ridge", "Lasso"]:
                params.setdefault("alpha", 1)
            if algo == "KMeans":
                params.setdefault("n_clusters", 4)  # daha güvenli başlangıç
                params.setdefault("random_state", 42)
            if algo == "DBSCAN":
                params.setdefault("eps", 0.5)
            if algo == "AgglomerativeClustering":
                params.setdefault("n_clusters", 2)

            model = ModelClass(**params)

            # -------- Classification --------
            if model_type == "classification":
                if cv_enabled:
                    scoring = {
                        "accuracy": "accuracy",
                        "precision": "precision_weighted",
                        "recall": "recall_weighted",
                        "f1": "f1_weighted"
                    }
                    scores = cross_validate(model, X, y, cv=cv_folds, scoring=scoring)
                    metrics = {k: round(np.mean(v), 4) for k, v in {
                        "accuracy": scores["test_accuracy"],
                        "precision": scores["test_precision"],
                        "recall": scores["test_recall"],
                        "f1": scores["test_f1"]
                    }.items()}

                    model.fit(X, y)
                    save_model(algo, model_type, model)
                    y_pred = model.predict(X)
                    y_prob = model.predict_proba(X)[:, 1] if hasattr(model, "predict_proba") else None
                    plots_dict = generate_classification_plots(y, y_pred, y_prob)
                    plots = list(plots_dict.values())

                    if hasattr(model, "feature_importances_"):
                        plt.figure()
                        sns.barplot(x=model.feature_importances_, y=X.columns)
                        plt.title("Özellik Önemi")
                        importance_plot = plot_to_base64()

                else:
                    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
                    model.fit(X_train, y_train)
                    save_model(algo, model_type, model)
                    y_pred = model.predict(X_test)
                    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None

                    metrics = {
                        "accuracy": round(accuracy_score(y_test, y_pred), 4),
                        "precision": round(precision_score(y_test, y_pred, average="weighted", zero_division=0), 4),
                        "recall": round(recall_score(y_test, y_pred, average="weighted", zero_division=0), 4),
                        "f1": round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4)
                    }

                    plots_dict = generate_classification_plots(y_test, y_pred, y_prob)
                    plots = list(plots_dict.values())

                    if hasattr(model, "feature_importances_"):
                        plt.figure()
                        sns.barplot(x=model.feature_importances_, y=X.columns)
                        plt.title("Özellik Önemi")
                        importance_plot = plot_to_base64()

            # -------- Regression --------
            elif model_type == "regression":
                if cv_enabled:
                    y_pred = cross_val_predict(model, X, y, cv=cv_folds)
                    metrics = {
                        "r2": round(r2_score(y, y_pred), 4),
                        "mse": round(mean_squared_error(y, y_pred), 4),
                        "rmse": round(np.sqrt(mean_squared_error(y, y_pred)), 4)
                    }
                    scatter = generate_regression_scatter(y, y_pred)
                    plots = [scatter]

                    try:
                        model.fit(X, y)
                        save_model(algo, model_type, model)
                    except Exception:
                        pass

                else:
                    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
                    model.fit(X_train, y_train)
                    save_model(algo, model_type, model)
                    y_pred = model.predict(X_test)
                    metrics = {
                        "r2": round(r2_score(y_test, y_pred), 4),
                        "mse": round(mean_squared_error(y_test, y_pred), 4),
                        "rmse": round(np.sqrt(mean_squared_error(y_test, y_pred)), 4)
                    }
                    scatter = generate_regression_scatter(y_test, y_pred)
                    plots = [scatter]

                if hasattr(model, "feature_importances_"):
                    plt.figure()
                    sns.barplot(x=model.feature_importances_, y=X.columns)
                    plt.title("Özellik Önemi")
                    importance_plot = plot_to_base64()

            # -------- Clustering --------
            elif model_type == "clustering":
                # Sayısal kolonlar
                X_all = df.select_dtypes(include=["number"]).fillna(0)
                if X_all.shape[1] == 0:
                    return jsonify({"error": "Kümeleme için sayısal kolon bulunamadı."}), 400

                model.fit(X_all)
                save_model(algo, model_type, model)

                labels = getattr(model, "labels_", None)
                if labels is None and hasattr(model, "predict"):
                    try:
                        labels = model.predict(X_all)
                    except Exception:
                        labels = None

                n_clusters = None
                if labels is not None:
                    unique_labels = set(labels)
                    n_clusters = len(unique_labels - {-1}) if -1 in unique_labels else len(unique_labels)

                # Gürültüyü (-1) at
                if labels is not None:
                    labels_np = np.asarray(labels)
                    valid_mask = labels_np != -1
                    Xv = X_all[valid_mask]
                    yv = labels_np[valid_mask]
                else:
                    Xv, yv = None, None

                metrics = {
                    "n_clusters": int(n_clusters) if n_clusters is not None else None,
                    "silhouette": None,
                    "calinski_harabasz": None,
                    "davies_bouldin": None,
                    "info": f"{algo} kümeleme tamamlandı." if (n_clusters and n_clusters >= 2) else f"{algo} ile kümeleme yapıldı; anlamlı metrikler için en az 2 küme gerekir.",
                }

                reasons = []

                def safe_metric(fn, name):
                    try:
                        val = fn()
                        return round(float(val), 4)
                    except Exception as e:
                        reasons.append(f"{name}: {type(e).__name__}")
                        return None

                if yv is None or Xv.shape[0] < 2 or len(np.unique(yv)) < 2:
                    reasons.append("yetersiz_kume_sayisi_veya_ornek")
                else:
                    metrics["silhouette"] = safe_metric(lambda: silhouette_score(Xv, yv), "silhouette")
                    metrics["calinski_harabasz"] = safe_metric(lambda: calinski_harabasz_score(Xv, yv), "calinski")
                    metrics["davies_bouldin"] = safe_metric(lambda: davies_bouldin_score(Xv, yv), "davies")

                if labels is not None:
                    tmp = pd.DataFrame({"cluster": labels})
                    plt.figure(figsize=(6, 5))
                    sns.countplot(x="cluster", data=tmp)
                    plt.title("Küme Dağılımı")
                    plots = [plot_to_base64()]
                else:
                    plots = []

                if reasons:
                    metrics["reason"] = ", ".join(reasons)

            # Sonuç kaydı
            model_results.append({
                "algorithm": algo,
                "metrics": metrics,
                "importancePlot": importance_plot,
                "plots": plots
            })
            summary_metrics[algo] = metrics

        # Karşılaştırmalar
        comparison_plot, metrics_table = None, None
        if model_type in ["classification", "regression"] and len(summary_metrics) > 1:
            df_metric = pd.DataFrame(summary_metrics).T
            numeric_cols = df_metric.select_dtypes(include=["number"]).columns
            if len(numeric_cols) > 0:
                df_metric_num = df_metric[numeric_cols]

                plt.figure(figsize=(10, 5))
                df_sorted = df_metric_num.sort_values(by=numeric_cols[0], ascending=False)
                sns.barplot(x=df_sorted.index, y=df_sorted[numeric_cols[0]])
                plt.title("Model Başarı Karşılaştırması")
                comparison_plot = plot_to_base64()

                fig, ax = plt.subplots(figsize=(10, 4))
                ax.axis("off")
                tbl = ax.table(
                    cellText=(df_metric_num * 100).round(2).values,
                    colLabels=df_metric_num.columns,
                    rowLabels=df_metric_num.index,
                    cellLoc='center',
                    loc='center'
                )
                tbl.scale(1, 2)
                buf = io.BytesIO()
                plt.savefig(buf, format="png", bbox_inches='tight')
                buf.seek(0)
                metrics_table = base64.b64encode(buf.read()).decode("utf-8")
                buf.close()
                plt.close(fig)

        log_user_action("demo", "TrainModel", filename, str(data))

        return jsonify({
            "results": model_results,
            "comparison_plot": comparison_plot,
            "metrics_table": metrics_table
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------
# 5) DOWNLOAD
# ----------------------------
@app.route("/download")
def download_file_by_format():
    filename = request.args.get("filename")
    file_format = request.args.get("format", "csv")
    path = os.path.join(PROCESSED_FOLDER, filename) if filename else None

    if not filename or not os.path.exists(path):
        return jsonify({"error": "Dosya bulunamadı."}), 404

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(path)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(path)
        else:
            return jsonify({"error": "Desteklenmeyen dosya uzantısı."}), 400
    except Exception as e:
        return jsonify({"error": f"Dosya okunamadı: {str(e)}"}), 500

    buffer = io.BytesIO()

    if file_format == "csv":
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{os.path.splitext(filename)[0]}.csv",
            mimetype="text/csv"
        )

    elif file_format == "xlsx":
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False)
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{os.path.splitext(filename)[0]}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    elif file_format == "json":
        json_str = df.to_json(orient="records", force_ascii=False)
        return send_file(
            io.BytesIO(json_str.encode("utf-8")),
            as_attachment=True,
            download_name=f"{os.path.splitext(filename)[0]}.json",
            mimetype="application/json"
        )

    else:
        return jsonify({"error": "Desteklenmeyen format türü."}), 400

# ----------------------------
# MODEL DOWNLOAD
# ----------------------------
@app.route("/download-model", methods=["GET"])
def download_model():
    algo = request.args.get("algo")
    model_type = request.args.get("model_type")
    if not algo or not model_type:
        return jsonify({"error": "Parametre eksik. ?algo=...&model_type=..."}), 400

    filename = f"{algo}_{model_type}.pkl"
    path = os.path.join(MODEL_FOLDER, filename)
    if not os.path.exists(path):
        return jsonify({"error": "Model bulunamadı."}), 404

    return send_file(
        path,
        as_attachment=True,
        download_name=filename,
        mimetype="application/octet-stream"
    )

# ----------------------------
# Çalıştır
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
