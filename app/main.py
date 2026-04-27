from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.blockchain_service import Blockchain
from app.utils.preprocess import preprocess_input

import numpy as np
import os
import pickle

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "..", "model", "fraud_model.pkl")

with open(model_path, "rb") as f:
    model_package = pickle.load(f)

model = model_package["model"]
scaler = model_package["scaler"]

app = FastAPI(title="AI Fraud Detection API")

blockchain = Blockchain()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    features: list

@app.post("/predict")
async def predict(transaction: Transaction):

    try:
        data = np.array(transaction.features).reshape(1, -1)

        if data.shape[1] != 30:
            return {"error": "Exactly 30 feature values required."}

        columns = [
            'Time','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10',
            'V11','V12','V13','V14','V15','V16','V17','V18','V19',
            'V20','V21','V22','V23','V24','V25','V26','V27','V28','Amount'
        ]

        data_dict = {col: data[0][i] for i, col in enumerate(columns)}

        data_scaled = preprocess_input(data_dict, scaler)

        prediction = int(model.predict(data_scaled)[0])
        probability = float(model.predict_proba(data_scaled)[0][1])

        block_data = {
            "input": list(transaction.features),
            "prediction": prediction,
            "probability": probability
        }

        block = blockchain.add_block(block_data)

        print(f"[Blockchain] Block Added with Hash: {block.hash}")

        if probability < 0.3:
            risk = "Low Risk"
        elif probability < 0.7:
            risk = "Medium Risk"
        else:
            risk = "High Risk"

        return {
            "prediction": prediction,
            "fraud_probability": round(probability, 4),
            "risk_level": risk
        }

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)} 

@app.get("/blocks")
def get_blocks():
    chain_data = []

    for block in blockchain.chain:
        chain_data.append({
            "index": block.index,
            "timestamp": block.timestamp,
            "data": block.data,
            "hash": block.hash,
            "previous_hash": block.previous_hash
        })

    return {"chain": chain_data}