# 💳 Credit Card Fraud Detection System

An end-to-end AI-powered fraud detection system with a blockchain-backed audit ledger, AES-256 encryption, and a real-time web dashboard.

---

## 🧠 Project Overview

This system detects fraudulent credit card transactions using an ensemble machine learning model. Every prediction is encrypted with AES-256, hashed with SHA-256, and permanently recorded on an immutable blockchain ledger — ensuring full auditability and tamper-proof traceability.

**Problem Type:** Binary Classification  
- `0` → Legitimate Transaction  
- `1` → Fraudulent Transaction  

> Since fraud cases are extremely rare, the dataset is **highly imbalanced**. Evaluation focuses on **Recall**, **ROC-AUC**, and **Confusion Matrix** rather than raw accuracy.

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
│   └── creditcard.csv              # Raw transaction dataset (not included in repo)
│
├── frontend/
│   └── index.html                  # FraudShield AI – real-time dashboard
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

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| ML Framework | scikit-learn, XGBoost, imbalanced-learn |
| Explainability | SHAP |
| API Backend | FastAPI (Python) |
| Blockchain | Custom SHA-256 chain (Python) |
| Encryption | AES-256-CBC (CryptoJS in frontend) |
| Frontend | Vanilla HTML/CSS/JS |
| Model Storage | Pickle (`.pkl`) |

---

## 🤖 Machine Learning Pipeline

### 1. Data Preprocessing
- Dataset: Anonymized credit card transactions with PCA-transformed features `V1–V28`, `Time`, and `Amount`
- 80/20 stratified train-test split
- Feature scaling via `StandardScaler`

### 2. Handling Class Imbalance
SMOTE (Synthetic Minority Oversampling Technique) is applied on the training set to synthetically balance fraud vs. legitimate transactions.

### 3. Models Trained

| Model | Notes |
|---|---|
| Logistic Regression | Baseline (with & without SMOTE) |
| Random Forest | Ensemble tree model (with & without SMOTE) |
| XGBoost | Gradient boosting with hyperparameter tuning |
| **Voting Classifier** | **Final model** — soft voting across all three |

### 4. Hyperparameter Tuning
`RandomizedSearchCV` with 5-fold `StratifiedKFold` cross-validation on the XGBoost model. Tuned parameters: `n_estimators`, `max_depth`, `learning_rate`, `subsample`, `colsample_bytree`.

### 5. Explainability
SHAP `TreeExplainer` is used to generate global feature importance plots for the tuned XGBoost model.

### 6. Model Serialization
The final `VotingClassifier` and `StandardScaler` are saved together in `model/fraud_model.pkl` via Pickle.

---

## 🔗 Blockchain Architecture

Each prediction is stored as an immutable **Block** on a custom blockchain:

```
Block {
  index          → Sequential block number
  timestamp      → Unix time of prediction
  data           → { input features, prediction, probability }
  previous_hash  → SHA-256 hash of the prior block
  hash           → SHA-256 hash of this block's contents
}
```

- The chain is initialized with a **Genesis Block**
- Every new block links to its predecessor via `previous_hash`
- Integrity is verified by recomputing and comparing hashes at any time

---

## 🔐 Security Layer

| Mechanism | Details |
|---|---|
| AES-256-CBC | Transaction payload is encrypted before storage |
| SHA-256 | Each block is hashed; chain integrity is continuously verifiable |
| Decryption Verification | Frontend decrypts and confirms ciphertext matches original payload |

---

## 🚀 Getting Started

### Prerequisites
```bash
Python 3.10+
pip install fastapi uvicorn scikit-learn xgboost imbalanced-learn shap pandas numpy pickle5
```

### 1. Train the Model
Open and run all cells in:
```
notebook/Credit_Card_Fraud_Detection.ipynb
```
This will generate `model/fraud_model.pkl`.

> ⚠️ The dataset (`data/creditcard.csv`) is not included in this repository due to size. Download it from [Kaggle – Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud).

### 2. Start the API Server
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Open the Dashboard
Open `frontend/index.html` in any modern browser.

---

## 📡 API Reference

### `POST /predict`
Analyze a transaction and record it on the blockchain.

**Request Body:**
```json
{
  "features": [0.0, -1.35, -0.07, 2.53, 1.37, -0.33, 0.46, 0.23, 0.09, 0.36,
               0.09, -0.55, -0.61, -0.99, -0.31, 1.47, -0.47, 0.20, 0.02, 0.40,
               0.25, -0.01, 0.27, -0.11, 0.06, -0.20, -0.50, -0.06, -0.44, 149.62]
}
```
> Exactly **30 features** required: `Time, V1–V28, Amount`

**Response:**
```json
{
  "prediction": 0,
  "fraud_probability": 0.0312,
  "risk_level": "Low Risk"
}
```

Risk levels: `Low Risk` (< 0.3) · `Medium Risk` (0.3–0.7) · `High Risk` (> 0.7)

---

### `GET /blocks`
Retrieve the full blockchain ledger.

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
    ...
  ]
}
```

---

## 🖥️ Dashboard — FraudShield AI

The frontend (`frontend/index.html`) provides three views:

**⚡ Analyze Tab**
- Input transaction fields (amount, hour, location risk, device, transaction type)
- Real-time AI verdict with fraud probability
- AES-256 encryption/decryption display
- SHA-256 hash + integrity verification
- Block preview before it's added to the chain

**⛓ Blockchain Tab**
- Full immutable ledger view
- Per-block integrity status (hash recomputation)
- Live counts: total blocks, fraud blocks, safe blocks

**📊 Performance Tab**
- Average AES and SHA operation times
- Throughput (ops/sec)
- Algorithm comparison table (AES-256, SHA-256, HMAC-SHA256, MD5, AES-128)
- Speed comparison bar chart

> If the backend is unavailable, the frontend falls back to a heuristic model based on amount, hour, location risk, and transaction type.

---

## 📊 Model Performance (Reference)

| Model | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|---|
| Logistic Regression | — | — | — | ~0.97 |
| Random Forest + SMOTE | — | — | — | ~0.99 |
| Tuned XGBoost | — | — | — | ~0.99 |
| **Voting Classifier (Final)** | **High** | **High** | **High** | **~0.99** |

> Exact values depend on your dataset split and SMOTE seed. Run the notebook to generate your metrics.

---

## 🔮 Future Improvements

- Persistent blockchain storage (SQLite / PostgreSQL)
- JWT authentication on the FastAPI endpoints  
- Real-time streaming predictions via WebSockets  
- Docker containerization  
- SHAP explanations exposed via API endpoint  
- Model retraining pipeline with drift detection  

---

## 📄 License

This project is for educational and research purposes.  
Dataset sourced from the [ULB Machine Learning Group](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud).
