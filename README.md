![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML%20Pipeline-F7931E?style=flat-square&logo=scikitlearn)
![XGBoost](https://img.shields.io/badge/XGBoost-Gradient%20Boosting-EC0000?style=flat-square)
![SHAP](https://img.shields.io/badge/SHAP-Explainability-8A2BE2?style=flat-square)
![Blockchain](https://img.shields.io/badge/Blockchain-SHA--256%20Chain-222222?style=flat-square)
![AES](https://img.shields.io/badge/Encryption-AES--256--CBC-darkgreen?style=flat-square)
![ROC-AUC](https://img.shields.io/badge/ROC--AUC-~0.99-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-Educational-blue?style=flat-square)

# 💳 Credit Card Fraud Detection System

> An end-to-end AI-powered fraud detection system with a blockchain-backed audit ledger, AES-256 encryption, and a real-time web dashboard.

---
 
## 📌 Overview

This system detects fraudulent credit card transactions using an ensemble machine learning model. Every prediction is encrypted with AES-256, hashed with SHA-256, and permanently recorded on an immutable blockchain ledger — ensuring full auditability and tamper-proof traceability.

| Property | Detail |
|---|---|
| **Problem Type** | Binary Classification |
| **Class 0** | Legitimate Transaction |
| **Class 1** | Fraudulent Transaction |
| **Key Challenge** | Highly imbalanced dataset — fraud is extremely rare |
| **Primary Metrics** | Recall · ROC-AUC · Confusion Matrix |

> Raw accuracy is a misleading metric on imbalanced data. A model that predicts "legitimate" for every transaction achieves ~99% accuracy while catching zero fraud. This project prioritizes **Recall** and **ROC-AUC** instead.

---

## ✨ Key Highlights

| Feature | Implementation |
|---|---|
| 🤖 **Ensemble ML** | Voting Classifier — Random Forest + Logistic Regression + XGBoost |
| ⚖️ **Imbalance Handling** | SMOTE on training set — no data leakage |
| 🔍 **Explainability** | SHAP TreeExplainer for global feature importance |
| 🔗 **Blockchain Ledger** | Custom SHA-256 chain — every prediction is immutable |
| 🔐 **Encryption** | AES-256-CBC on all transaction payloads |
| ⚡ **Fallback Mode** | Frontend heuristic model when backend is unavailable |

---

## 🗂️ Project Structure

```
credit-card-fraud-detection/
│
├── app/
│   ├── services/
│   │   ├── blockchain_service.py   # Block & Blockchain classes (SHA-256 chaining)
│   │   └── model_service.py        # Model loading & prediction wrapper
│   └── utils/
│       └── preprocess.py           # Feature scaling & input validation
│
├── data/
│   └── creditcard.csv              # Raw dataset (not included — see Getting Started)
│
├── frontend/
│   └── index.html                  # FraudShield AI — real-time dashboard
│
├── model/
│   └── fraud_model.pkl             # Serialized VotingClassifier + StandardScaler
│
├── notebook/
│   └── Credit_Card_Fraud_Detection.ipynb  # Full ML pipeline & experiments
│
├── main.py                         # FastAPI app entry point
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| ML Framework | scikit-learn, XGBoost, imbalanced-learn | Model training, SMOTE, ensemble |
| Explainability | SHAP | Feature importance, model transparency |
| API Backend | FastAPI + Uvicorn | Prediction endpoint, blockchain access |
| Blockchain | Custom Python (SHA-256) | Immutable audit trail |
| Encryption | AES-256-CBC (CryptoJS) | Payload security on frontend |
| Frontend | Vanilla HTML/CSS/JS | Real-time dashboard, no framework overhead |
| Model Storage | Pickle `.pkl` | Serialized pipeline (model + scaler together) |

---

## 🤖 Machine Learning Pipeline

### 1 — Data Preprocessing

- **Dataset:** Anonymized credit card transactions from ULB — PCA-transformed features `V1–V28`, plus `Time` and `Amount`
- 80/20 stratified train-test split (preserves class ratio in both sets)
- `StandardScaler` applied to `Time` and `Amount` — PCA features are already scaled

### 2 — Handling Class Imbalance

SMOTE (Synthetic Minority Oversampling Technique) is applied **only on the training set** to synthetically generate fraud samples and balance the class distribution. The test set remains untouched to preserve realistic evaluation.

```
Before SMOTE:  Legitimate ████████████████████░  Fraud ░
After SMOTE:   Legitimate ██████████  Fraud ██████████
```

### 3 — Models Trained

| Model | Configuration | Role |
|---|---|---|
| Logistic Regression | With & without SMOTE | Baseline |
| Random Forest | With & without SMOTE | Ensemble tree model |
| XGBoost | Hyperparameter-tuned | Gradient boosting |
| **Voting Classifier** | Soft voting — all three above | **Final deployed model** |

### 4 — Hyperparameter Tuning

`RandomizedSearchCV` with 5-fold `StratifiedKFold` cross-validation on XGBoost.

| Parameter | Search Space |
|---|---|
| `n_estimators` | 100–500 |
| `max_depth` | 3–10 |
| `learning_rate` | 0.01–0.3 |
| `subsample` | 0.6–1.0 |
| `colsample_bytree` | 0.6–1.0 |

### 5 — Explainability

SHAP `TreeExplainer` generates global feature importance plots for the tuned XGBoost model — making predictions interpretable and production-auditable.

### 6 — Model Serialization

The final `VotingClassifier` and `StandardScaler` are saved **together** in `fraud_model.pkl` — a single load call returns the full prediction-ready pipeline.

---

## 🔗 Blockchain Architecture

Each prediction is stored as an immutable **Block** on a custom SHA-256 blockchain:

```
Genesis Block
  └── Block #1
        ├── index          → 1
        ├── timestamp      → Unix time of prediction
        ├── data           → { input features, prediction, probability }
        ├── previous_hash  → SHA-256 hash of Genesis Block
        └── hash           → SHA-256( index + timestamp + data + previous_hash )
              └── Block #2
                    ├── previous_hash  → hash of Block #1
                    └── hash           → SHA-256( ... )
                          └── Block #N ...
```

- Chain initialized with a **Genesis Block** (`previous_hash = "0"`)
- Every new block cryptographically links to its predecessor
- Integrity verified anytime by recomputing and comparing all hashes
- Tampering with any block invalidates the entire chain from that point forward

---

## 🔐 Security Layer

| Mechanism | Implementation | Guarantee |
|---|---|---|
| **AES-256-CBC** | Transaction payload encrypted before storage | Confidentiality |
| **SHA-256 Hashing** | Every block hashed; chain integrity continuously verifiable | Tamper detection |
| **Decryption Verification** | Frontend decrypts and confirms ciphertext matches original | End-to-end integrity |

---

## 📊 Model Performance

| Model | ROC-AUC | Notes |
|---|---|---|
| Logistic Regression (baseline) | ~0.97 | Without SMOTE |
| Random Forest + SMOTE | ~0.99 | Significant improvement |
| Tuned XGBoost | ~0.99 | Hyperparameter-optimized |
| **Voting Classifier (Final)** | **~0.99** | Soft voting — most robust |

> Exact values depend on your dataset split and SMOTE random seed. Run the notebook to generate metrics for your environment.

**Why Recall over Accuracy?**  
On a dataset where 99.8% of transactions are legitimate, predicting "safe" on everything gives 99.8% accuracy — and catches zero fraud. **Recall** (what fraction of actual fraud was caught) is the metric that actually matters.

---

## 🚀 Getting Started

### Prerequisites

```bash
Python 3.10+
```

```bash
pip install fastapi uvicorn scikit-learn xgboost imbalanced-learn shap pandas numpy pickle5
```

### 1 — Get the Dataset

The dataset is not included due to size. Download it from Kaggle:

📥 [ULB Credit Card Fraud Detection Dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)

Place it at:
```
data/creditcard.csv
```

### 2 — Train the Model

Open and run all cells in:
```
notebook/Credit_Card_Fraud_Detection.ipynb
```

This generates `model/fraud_model.pkl` — the serialized VotingClassifier + StandardScaler pipeline.

### 3 — Start the API Server

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API is now live at `http://127.0.0.1:8000`

### 4 — Open the Dashboard

Open `frontend/index.html` in any modern browser.

> If the backend is unavailable, the dashboard automatically falls back to a client-side heuristic model based on amount, hour, location risk, and transaction type.

---

## 📡 API Reference

### `POST /predict`

Analyze a transaction and record it immutably on the blockchain.

**Request Body:**
```json
{
  "features": [0.0, -1.35, -0.07, 2.53, 1.37, -0.33, 0.46, 0.23, 0.09, 0.36,
               0.09, -0.55, -0.61, -0.99, -0.31, 1.47, -0.47, 0.20, 0.02, 0.40,
               0.25, -0.01, 0.27, -0.11, 0.06, -0.20, -0.50, -0.06, -0.44, 149.62]
}
```

> Exactly **30 features** required in order: `Time, V1–V28, Amount`

**Response:**
```json
{
  "prediction": 0,
  "fraud_probability": 0.0312,
  "risk_level": "Low Risk"
}
```

| Risk Level | Fraud Probability Threshold |
|---|---|
| ✅ Low Risk | < 0.3 |
| ⚠️ Medium Risk | 0.3 – 0.7 |
| 🚨 High Risk | > 0.7 |

---

### `GET /blocks`

Retrieve the full blockchain audit ledger.

**Response:**
```json
{
  "chain": [
    {
      "index": 0,
      "timestamp": 1714230000.0,
      "data": { "message": "Genesis Block" },
      "hash": "000abc...",
      "previous_hash": "0"
    },
    {
      "index": 1,
      "timestamp": 1714230042.7,
      "data": { "prediction": 0, "fraud_probability": 0.03 },
      "hash": "a1b2c3...",
      "previous_hash": "000abc..."
    }
  ]
}
```

---

## 🖥️ Dashboard — FraudShield AI

The `frontend/index.html` dashboard provides three tabs:

### ⚡ Analyze Tab
- Input transaction fields (amount, hour, location risk, device, transaction type)
- Real-time AI verdict with fraud probability and risk level
- AES-256 encryption/decryption display
- SHA-256 hash generation + integrity verification
- Block preview before chain insertion

### ⛓️ Blockchain Tab
- Full immutable ledger view
- Per-block hash recomputation and integrity status
- Live counters: total blocks · fraud blocks · safe blocks

### 📊 Performance Tab
- Average AES and SHA operation times (ms)
- Throughput (ops/sec)
- Algorithm comparison table: AES-256, SHA-256, HMAC-SHA256, MD5, AES-128
- Speed comparison bar chart

---

## 📄 License

This project is for educational and research purposes.  
Dataset sourced from the [ULB Machine Learning Group](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud).

---

> Built by **Sarthak** — MCA Student, Amity University Noida
