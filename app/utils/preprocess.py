import pandas as pd

def preprocess_input(data, scaler):
    """
    Convert incoming JSON/dict to the exact scaled format
    expected by the trained model
    """
    df = pd.DataFrame([data])

    expected_columns = [
        'Time','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10',
        'V11','V12','V13','V14','V15','V16','V17','V18','V19',
        'V20','V21','V22','V23','V24','V25','V26','V27','V28','Amount'
    ]

    df = df[expected_columns]

    df_scaled = scaler.transform(df)

    return df_scaled
