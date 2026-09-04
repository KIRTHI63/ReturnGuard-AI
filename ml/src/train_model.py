import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

import joblib


# ==========================================
# 1. LOAD DATASET
# ==========================================

df = pd.read_csv("ml/data/orders.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)


# ==========================================
# 2. DEFINE FEATURES AND TARGET
# ==========================================

X = df.drop("returned", axis=1)

y = df["returned"]


# ==========================================
# 3. IDENTIFY COLUMN TYPES
# ==========================================

categorical_features = [
    "payment_method"
]

numerical_features = [
    "order_value",
    "customer_age",
    "previous_orders",
    "previous_returns",
    "delivery_days",
    "customer_rating",
    "return_rate"
]


# ==========================================
# 4. PREPROCESSING
# ==========================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),

        (
            "numerical",
            "passthrough",
            numerical_features
        )
    ]
)


# ==========================================
# 5. CREATE ML MODEL
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)


# ==========================================
# 6. CREATE PIPELINE
# ==========================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)


# ==========================================
# 7. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# 8. TRAIN MODEL
# ==========================================

print("\nTraining ReturnGuard AI model...")

pipeline.fit(
    X_train,
    y_train
)

print("Model training completed!")


# ==========================================
# 9. MAKE PREDICTIONS
# ==========================================

y_pred = pipeline.predict(X_test)


# ==========================================
# 10. MODEL EVALUATION
# ==========================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

print("\n===================================")
print("MODEL PERFORMANCE")
print("===================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred
    )
)

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# ==========================================
# 11. SAVE MODEL
# ==========================================

joblib.dump(
    pipeline,
    "ml/models/return_guard_model.pkl"
)

print("\n===================================")
print("MODEL SAVED")
print("===================================")

print(
    "ml/models/return_guard_model.pkl"
)