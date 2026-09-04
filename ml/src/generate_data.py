import pandas as pd
import numpy as np

np.random.seed(42)

# Number of orders
n = 3000

# -----------------------------
# Generate customer history
# -----------------------------

previous_orders = np.random.randint(1, 31, n)

previous_returns = np.array([
    np.random.randint(0, min(orders, 10) + 1)
    for orders in previous_orders
])

# -----------------------------
# Generate order information
# -----------------------------

order_value = np.random.randint(200, 10000, n)

customer_age = np.random.randint(18, 65, n)

delivery_days = np.random.randint(1, 11, n)

payment_method = np.random.choice(
    ["COD", "UPI", "CARD"],
    n,
    p=[0.45, 0.35, 0.20]
)

customer_rating = np.round(
    np.random.uniform(2.0, 5.0, n),
    1
)

# -----------------------------
# Calculate return rate
# -----------------------------

return_rate = (
    previous_returns / previous_orders
)

# -----------------------------
# Create dataframe
# -----------------------------

data = pd.DataFrame({
    "order_value": order_value,
    "customer_age": customer_age,
    "previous_orders": previous_orders,
    "previous_returns": previous_returns,
    "delivery_days": delivery_days,
    "payment_method": payment_method,
    "customer_rating": customer_rating,
    "return_rate": return_rate
})

# -----------------------------
# Create realistic risk score
# -----------------------------

risk_score = (
    -2.5
    + 3.5 * data["return_rate"]
    + 0.75 * (data["payment_method"] == "COD")
    + 0.00008 * data["order_value"]
    + 0.18 * data["delivery_days"]
    + 0.70 * (data["customer_rating"] < 3.0)
    + 0.08 * data["previous_returns"]
)

# -----------------------------
# Convert score to probability
# -----------------------------

probability = 1 / (1 + np.exp(-risk_score))

probability = np.clip(
    probability,
    0.02,
    0.95
)

# -----------------------------
# Generate return label
# -----------------------------

data["returned"] = np.random.binomial(
    1,
    probability
)

# -----------------------------
# Save dataset
# -----------------------------

data.to_csv(
    "ml/data/orders.csv",
    index=False
)

# -----------------------------
# Display information
# -----------------------------

print("===================================")
print("ReturnGuard AI Dataset Created")
print("===================================")

print("Rows:", len(data))
print("Columns:", len(data.columns))

print("\nSample:")
print(data.head())

print("\nReturn Distribution:")
print(data["returned"].value_counts())

print("\nReturn Percentage:")
print(
    data["returned"].value_counts(normalize=True) * 100
)

print("\nReturn Rate Range:")
print("Minimum:", data["return_rate"].min())
print("Maximum:", data["return_rate"].max())

print("\nDataset saved to:")
print("ml/data/orders.csv")