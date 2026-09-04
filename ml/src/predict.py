import pandas as pd
import joblib


# ==========================================
# LOAD TRAINED MODEL
# ==========================================

MODEL_PATH = "ml/models/return_guard_model.pkl"

model = joblib.load(MODEL_PATH)


# ==========================================
# PREDICTION FUNCTION
# ==========================================

def predict_return_risk(order):
    """
    Predict the return probability and risk level
    for a single order.
    """

    # Convert input into DataFrame
    df = pd.DataFrame([order])

    # Get probability of return
    probability = model.predict_proba(df)[0][1]

    # Convert probability to percentage
    risk_percentage = probability * 100

    # Determine risk level
    if probability < 0.30:
        risk_level = "LOW"

    elif probability < 0.60:
        risk_level = "MEDIUM"

    else:
        risk_level = "HIGH"

    # ==========================================
    # IDENTIFY RISK FACTORS
    # ==========================================

    risk_factors = []

    if order["return_rate"] >= 0.30:
        risk_factors.append(
            "High previous return rate"
        )

    if order["payment_method"] == "COD":
        risk_factors.append(
            "Cash on Delivery payment"
        )

    if order["order_value"] >= 6000:
        risk_factors.append(
            "High order value"
        )

    if order["delivery_days"] >= 7:
        risk_factors.append(
            "Long delivery time"
        )

    if order["customer_rating"] < 3.0:
        risk_factors.append(
            "Low customer rating"
        )

    if order["previous_returns"] >= 4:
        risk_factors.append(
            "Multiple previous returns"
        )

    # If no major risk factors
    if not risk_factors:
        risk_factors.append(
            "No major risk factors detected"
        )

    # ==========================================
    # RECOMMENDED ACTION
    # ==========================================

    if risk_level == "LOW":

        recommendation = (
            "Process order normally"
        )

    elif risk_level == "MEDIUM":

        recommendation = (
            "Perform additional verification"
        )

    else:

        recommendation = (
            "Flag order for risk review"
        )

    # ==========================================
    # RETURN RESULT
    # ==========================================

    return {
        "return_probability": round(
            risk_percentage,
            2
        ),

        "risk_level": risk_level,

        "risk_factors": risk_factors,

        "recommended_action": recommendation
    }


# ==========================================
# TEST THE MODEL
# ==========================================

if __name__ == "__main__":

    test_order = {

        "order_value": 8500,

        "customer_age": 24,

        "previous_orders": 10,

        "previous_returns": 5,

        "delivery_days": 8,

        "payment_method": "COD",

        "customer_rating": 2.4,

        "return_rate": 0.50
    }

    result = predict_return_risk(
        test_order
    )

    print("\n===================================")
    print("       RETURNGUARD AI")
    print("===================================")

    print(
        "\nReturn Probability:",
        result["return_probability"],
        "%"
    )

    print(
        "Risk Level:",
        result["risk_level"]
    )

    print("\nRisk Factors:")

    for factor in result["risk_factors"]:
        print(" -", factor)

    print(
        "\nRecommended Action:",
        result["recommended_action"]
    )