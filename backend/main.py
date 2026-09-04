from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)
sys.path.append(PROJECT_ROOT)

from ml.src.predict import predict_return_risk


app = FastAPI(
    title="ReturnGuard AI",
    description="AI-powered return risk assessment API",
    version="2.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Order(BaseModel):
    order_value: float
    customer_age: int
    previous_orders: int
    previous_returns: int
    delivery_days: int
    payment_method: str
    customer_rating: float
    return_rate: float


def analyze_risk_factors(order):
    factors = []

    # Previous return behaviour
    if order["return_rate"] >= 0.40:
        factors.append({
            "name": "High historical return rate",
            "detail": f'{order["return_rate"] * 100:.0f}% of previous orders were returned',
            "severity": "high"
        })
    elif order["return_rate"] >= 0.25:
        factors.append({
            "name": "Elevated return history",
            "detail": f'{order["return_rate"] * 100:.0f}% historical return rate',
            "severity": "medium"
        })

    # Previous returns
    if order["previous_returns"] >= 5:
        factors.append({
            "name": "Frequent previous returns",
            "detail": f'{order["previous_returns"]} previous returns recorded',
            "severity": "high"
        })
    elif order["previous_returns"] >= 3:
        factors.append({
            "name": "Multiple previous returns",
            "detail": f'{order["previous_returns"]} previous returns recorded',
            "severity": "medium"
        })

    # Delivery time
    if order["delivery_days"] >= 7:
        factors.append({
            "name": "Long delivery window",
            "detail": f'{order["delivery_days"]}-day delivery estimate',
            "severity": "high"
        })
    elif order["delivery_days"] >= 5:
        factors.append({
            "name": "Extended delivery time",
            "detail": f'{order["delivery_days"]}-day delivery estimate',
            "severity": "medium"
        })

    # Customer rating
    if order["customer_rating"] <= 2.5:
        factors.append({
            "name": "Low customer rating",
            "detail": f'{order["customer_rating"]:.1f}/5 customer rating',
            "severity": "high"
        })
    elif order["customer_rating"] <= 3.2:
        factors.append({
            "name": "Below-average customer rating",
            "detail": f'{order["customer_rating"]:.1f}/5 customer rating',
            "severity": "medium"
        })

    # Payment
    if order["payment_method"].upper() == "COD":
        factors.append({
            "name": "Cash on Delivery",
            "detail": "COD orders carry additional return / refusal exposure",
            "severity": "medium"
        })

    # High-value order
    if order["order_value"] >= 7500:
        factors.append({
            "name": "High-value order",
            "detail": f'₹{order["order_value"]:,.0f} order value at risk',
            "severity": "medium"
        })

    # Customer history
    if order["previous_orders"] <= 5:
        factors.append({
            "name": "Limited customer history",
            "detail": f'{order["previous_orders"]} previous orders',
            "severity": "medium"
        })

    severity_order = {
        "high": 0,
        "medium": 1,
        "low": 2
    }

    factors.sort(key=lambda x: severity_order[x["severity"]])

    return factors[:5]


def generate_recommendation(risk_level, factors, order):
    if risk_level == "HIGH":
        return {
            "title": "Intervene before fulfillment",
            "action": "Review this order before dispatch",
            "reason": "Multiple behavioural and transaction signals indicate elevated return exposure."
        }

    if risk_level == "MEDIUM":
        return {
            "title": "Apply targeted safeguards",
            "action": "Consider additional verification or delivery confirmation",
            "reason": "The order shows moderate return-risk signals that can be reduced before fulfillment."
        }

    return {
        "title": "Proceed normally",
        "action": "Fulfill using the standard workflow",
        "reason": "The available signals indicate relatively low return exposure."
    }


@app.get("/")
def home():
    return {
        "message": "ReturnGuard AI API is running",
        "status": "success",
        "version": "2.0.0"
    }


@app.post("/predict")
def predict(order: Order):

    order_data = order.model_dump()

    # Existing ML prediction
    result = predict_return_risk(order_data)

    # Support the existing prediction structure
    probability = float(
        result.get(
            "probability",
            result.get(
                "return_probability",
                result.get("risk_probability", 0)
            )
        )
    )

    # Handle probabilities returned as percentages
    if probability > 1:
        probability = probability / 100

    probability = max(0, min(1, probability))

    # Determine risk level
    if probability >= 0.70:
        risk_level = "HIGH"
    elif probability >= 0.40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    factors = analyze_risk_factors(order_data)

    recommendation = generate_recommendation(
        risk_level,
        factors,
        order_data
    )

    # Expected financial exposure
    exposure = order_data["order_value"] * probability

    return {
        "status": "success",

        "prediction": {
            "probability": probability,
            "risk_level": risk_level,

            "risk_factors": factors,

            "recommendation": recommendation,

            "estimated_exposure": round(exposure, 2),

            "order_value": order_data["order_value"],

            "model": {
                "name": "ReturnGuard Risk Engine",
                "version": "1.0"
            }
        }
    }
print("FINAL REGISTERED ROUTES:")
for route in app.routes:
    print(route.path, route.methods)