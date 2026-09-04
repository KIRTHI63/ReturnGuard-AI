import pandas as pd

# Load dataset
df = pd.read_csv("ml/data/orders.csv")

print("========== DATASET SHAPE ==========")
print(df.shape)

print("\n========== COLUMNS ==========")
print(df.columns.tolist())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== DUPLICATES ==========")
print(df.duplicated().sum())

print("\n========== RETURN DISTRIBUTION ==========")
print(df["returned"].value_counts())

print("\n========== RETURN PERCENTAGE ==========")
print(df["returned"].value_counts(normalize=True) * 100)

print("\n========== STATISTICS ==========")
print(df.describe())