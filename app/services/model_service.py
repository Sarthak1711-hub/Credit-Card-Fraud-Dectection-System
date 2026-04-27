import pickle
import numpy as np

MODEL_PATH = "model/fraud_model.pkl"

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

def predict(data):
    """
    data: list or array of features
    """
    data = np.array(data).reshape(1, -1)
    prediction = model.predict(data)
    return int(prediction[0])