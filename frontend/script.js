// ============================================================
// RETURNGUARD AI — FRONTEND CONTROLLER
// ============================================================

const API_URL = "http://127.0.0.1:8000/predict";
const HISTORY_KEY = "returnguard_history";

let loadingTimer = null;

// ------------------------------------------------------------
// DOM ELEMENTS
// ------------------------------------------------------------

const form = document.getElementById("riskForm");

const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const resultState = document.getElementById("resultState");

const analyzeButton =
    document.getElementById("analyzeButton") ||
    document.querySelector('button[type="submit"]');

const probabilityElement =
    document.getElementById("probability") ||
    document.getElementById("riskProbability");

const riskLevelElement =
    document.getElementById("riskLevel") ||
    document.getElementById("level");

const resultDescription =
    document.getElementById("resultDescription") ||
    document.getElementById("riskDescription");

const factorsList =
    document.getElementById("factorsList") ||
    document.getElementById("riskFactors");

const recommendationElement =
    document.getElementById("recommendation") ||
    document.getElementById("recommendationText");

const gauge =
    document.getElementById("riskGauge") ||
    document.querySelector(".gauge-fill");


// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    updateRiskIntelligence();
    renderHistory();

    if (form) {
        form.addEventListener("submit", handlePrediction);
    }

    console.log("ReturnGuard AI frontend initialized.");
});


// ------------------------------------------------------------
// MAIN PREDICTION HANDLER
// ------------------------------------------------------------

async function handlePrediction(event) {
    event.preventDefault();

    const order = getOrderFromForm();

    if (!validateOrder(order)) {
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();

        console.log("ReturnGuard API response:", data);

        const prediction = data.prediction || data;

        const result = normalizePrediction(prediction, order);

        saveAnalysis(order, result);

        showResult(result);

        updateDashboard();
        updateRiskIntelligence();
        renderHistory();

        showToast("Risk assessment completed.");

    } catch (error) {
        console.error("Prediction error:", error);

        showToast(
            "Unable to connect to ReturnGuard AI backend."
        );

        showEmpty();

    } finally {
        setLoading(false);
    }
}


// ------------------------------------------------------------
// GET FORM DATA
// ------------------------------------------------------------

function getOrderFromForm() {
    const getValue = (id, fallback = "") => {
        const element = document.getElementById(id);
        return element ? element.value : fallback;
    };

    return {
        order_value: Number(getValue("order_value", 0)),
        customer_age: Number(getValue("customer_age", 0)),
        previous_orders: Number(getValue("previous_orders", 0)),
        previous_returns: Number(getValue("previous_returns", 0)),
        delivery_days: Number(getValue("delivery_days", 0)),
        payment_method: getValue("payment_method", "COD"),
        customer_rating: Number(getValue("customer_rating", 0)),
        return_rate: Number(getValue("return_rate", 0))
    };
}


// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

function validateOrder(order) {
    if (order.order_value <= 0) {
        showToast("Enter a valid order value.");
        return false;
    }

    if (order.customer_age <= 0) {
        showToast("Enter a valid customer age.");
        return false;
    }

    if (order.previous_orders < 0) {
        showToast("Previous orders cannot be negative.");
        return false;
    }

    if (order.previous_returns < 0) {
        showToast("Previous returns cannot be negative.");
        return false;
    }

    if (order.delivery_days < 0) {
        showToast("Delivery days cannot be negative.");
        return false;
    }

    if (
        order.customer_rating < 0 ||
        order.customer_rating > 5
    ) {
        showToast("Customer rating must be between 0 and 5.");
        return false;
    }

    if (
        order.return_rate < 0 ||
        order.return_rate > 1
    ) {
        showToast("Return rate must be between 0 and 1.");
        return false;
    }

    return true;
}


// ------------------------------------------------------------
// LOADING STATE
// ------------------------------------------------------------

function setLoading(isLoading) {
    clearInterval(loadingTimer);

    if (!loadingState) return;

    if (isLoading) {

        if (emptyState) {
            emptyState.classList.add("hidden");
        }

        if (resultState) {
            resultState.classList.add("hidden");
        }

        loadingState.classList.remove("hidden");

        if (analyzeButton) {
            analyzeButton.disabled = true;
        }

        const loadingText =
            loadingState.querySelector(".loading-text") ||
            loadingState.querySelector("[data-loading-text]");

        if (loadingText) {
            const messages = [
                "Analyzing order...",
                "Evaluating customer behavior...",
                "Calculating return risk...",
                "Generating recommendation..."
            ];

            let index = 0;

            loadingText.textContent = messages[index];

            loadingTimer = setInterval(() => {
                index = (index + 1) % messages.length;
                loadingText.textContent = messages[index];
            }, 650);
        }

    } else {

        clearInterval(loadingTimer);

        loadingState.classList.add("hidden");

        if (analyzeButton) {
            analyzeButton.disabled = false;
        }
    }
}


// ------------------------------------------------------------
// NORMALIZE API RESPONSE
// ------------------------------------------------------------

function normalizePrediction(prediction, order) {

    let probability = Number(
        prediction.probability ??
        prediction.return_probability ??
        prediction.risk_probability ??
        0
    );

    // Handle probability accidentally returned as percentage
    if (probability > 1) {
        probability = probability / 100;
    }

    probability = Math.max(
        0,
        Math.min(1, probability)
    );

    let riskLevel =
        prediction.risk_level ||
        prediction.riskLevel ||
        getRiskLevel(probability);

    riskLevel = String(riskLevel).toUpperCase();

    const factors =
        Array.isArray(prediction.risk_factors)
            ? prediction.risk_factors
            : Array.isArray(prediction.factors)
                ? prediction.factors
                : generateFallbackFactors(order);

    const recommendation =
        prediction.recommendation ||
        generateFallbackRecommendation(riskLevel);

    return {
        probability,
        riskLevel,
        factors,
        recommendation,
        orderValue: order.order_value,
        description: getRiskDescription(
            riskLevel,
            probability
        )
    };
}


// ------------------------------------------------------------
// RISK LEVEL
// ------------------------------------------------------------

function getRiskLevel(probability) {
    if (probability >= 0.70) {
        return "HIGH";
    }

    if (probability >= 0.40) {
        return "MEDIUM";
    }

    return "LOW";
}


// ------------------------------------------------------------
// SHOW RESULT
// ------------------------------------------------------------

function showResult(result) {

    clearInterval(loadingTimer);

    // Hide loading
    if (loadingState) {
        loadingState.classList.add("hidden");
    }

    // Hide empty state
    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    // Show result
    if (resultState) {
        resultState.classList.remove("hidden");
    }

    // Probability
    if (probabilityElement) {
        probabilityElement.textContent =
            `${(result.probability * 100).toFixed(1)}%`;
    }

    // Risk level
    if (riskLevelElement) {
        riskLevelElement.textContent =
            result.riskLevel;
    }

    // Description
    if (resultDescription) {
        resultDescription.textContent =
            result.description;
    }

    // Gauge
    updateGauge(result.probability);

    // IMPORTANT:
    // Render risk factors safely.
    // This fixes "[object Object]".
    renderRiskFactors(result.factors);
    updateSignalCount(result.factors.length);

    // Recommendation
    renderRecommendation(result.recommendation);
}


// ------------------------------------------------------------
// RISK FACTOR RENDERING
// ------------------------------------------------------------

function renderRiskFactors(factors) {

    if (!factorsList) {
        console.warn("Risk factors element not found.");
        return;
    }

    if (!Array.isArray(factors) || factors.length === 0) {

        factorsList.innerHTML = `
            <div class="factor-item">
                <span class="factor-dot"></span>
                <span>No major risk signals detected.</span>
            </div>
        `;

        return;
    }

    factorsList.innerHTML = factors
        .slice(0, 5)
        .map((factor) => {

            const text = getFactorText(factor);

            const severity = getFactorSeverity(factor);

            return `
                <div class="factor-item">
                    <span class="factor-dot ${severity}"></span>
                    <span>${escapeHTML(text)}</span>
                </div>
            `;

        })
        .join("");
}


// ------------------------------------------------------------
// EXTRACT TEXT FROM RISK FACTOR OBJECT
// ------------------------------------------------------------

function getFactorText(factor) {

    // Backend might return a simple string
    if (typeof factor === "string") {
        return factor;
    }

    // Backend might return an object
    if (factor && typeof factor === "object") {

        // Try common property names
        const possibleText =
            factor.reason ??
            factor.description ??
            factor.signal ??
            factor.factor ??
            factor.message ??
            factor.text ??
            factor.name ??
            factor.label;

        if (typeof possibleText === "string") {
            return possibleText;
        }

        // Search object values for a readable string
        const stringValue = Object.values(factor)
            .find(value => typeof value === "string");

        if (stringValue) {
            return stringValue;
        }

        return "Risk signal detected";
    }

    return String(factor);
}


// ------------------------------------------------------------
// FACTOR SEVERITY
// ------------------------------------------------------------

function getFactorSeverity(factor) {

    if (
        factor &&
        typeof factor === "object"
    ) {

        const severity = String(
            factor.severity ??
            factor.level ??
            factor.priority ??
            ""
        ).toLowerCase();

        if (severity === "high") {
            return "high";
        }

        if (severity === "medium") {
            return "medium";
        }

        if (severity === "low") {
            return "low";
        }
    }

    return "high";
}


// ------------------------------------------------------------
// RECOMMENDATION
// ------------------------------------------------------------

function renderRecommendation(recommendation) {

    if (!recommendationElement) {
        return;
    }

    let text = "";

    if (typeof recommendation === "string") {

        text = recommendation;

    } else if (
        recommendation &&
        typeof recommendation === "object"
    ) {

        text =
            recommendation.action ??
            recommendation.message ??
            recommendation.description ??
            recommendation.recommendation ??
            Object.values(recommendation)
                .find(value => typeof value === "string") ??
            "Review this order before dispatch.";

    } else {

        text = "Review this order before dispatch.";
    }

    recommendationElement.textContent = text;
}


// ------------------------------------------------------------
// RISK DESCRIPTION
// ------------------------------------------------------------

function getRiskDescription(level, probability) {

    const percentage =
        (probability * 100).toFixed(1);

    if (level === "HIGH") {

        return `The model estimates a ${percentage}% probability of return. This order deserves additional attention before fulfillment.`;

    }

    if (level === "MEDIUM") {

        return `The model estimates a ${percentage}% probability of return. Consider targeted safeguards before fulfillment.`;

    }

    return `The model estimates a ${percentage}% probability of return. This order appears suitable for normal fulfillment.`;
}


// ------------------------------------------------------------
// GAUGE
// ------------------------------------------------------------

function updateGauge(probability) {

    if (!gauge) {
        return;
    }

    const percentage =
        probability * 100;

    /*
       Supports:
       - SVG stroke-dashoffset
       - CSS custom property
       - regular width-based gauge
    */

    gauge.style.setProperty(
        "--risk-progress",
        `${percentage}%`
    );

    gauge.style.setProperty(
        "--progress",
        `${percentage}%`
    );

    if (
        gauge.tagName &&
        gauge.tagName.toLowerCase() === "circle"
    ) {

        const circumference = 440;

        const offset =
            circumference -
            (percentage / 100) * circumference;

        gauge.style.strokeDasharray =
            circumference;

        gauge.style.strokeDashoffset =
            offset;
    }

    if (
        gauge.classList.contains("gauge-fill") ||
        gauge.classList.contains("progress-fill")
    ) {
        gauge.style.width =
            `${percentage}%`;
    }
}


// ------------------------------------------------------------
// FALLBACK RISK FACTORS
// ------------------------------------------------------------

function generateFallbackFactors(order) {

    const factors = [];

    if (order.return_rate >= 0.40) {

        factors.push({
            severity: "high",
            reason: "High historical return rate"
        });

    } else if (order.return_rate >= 0.25) {

        factors.push({
            severity: "medium",
            reason: "Elevated return history"
        });
    }

    if (order.previous_returns >= 5) {

        factors.push({
            severity: "high",
            reason: "Frequent previous returns"
        });

    } else if (order.previous_returns >= 3) {

        factors.push({
            severity: "medium",
            reason: "Multiple previous returns"
        });
    }

    if (order.delivery_days >= 7) {

        factors.push({
            severity: "high",
            reason: "Long delivery window"
        });

    } else if (order.delivery_days >= 5) {

        factors.push({
            severity: "medium",
            reason: "Extended delivery time"
        });
    }

    if (order.customer_rating <= 2.5) {

        factors.push({
            severity: "high",
            reason: "Low customer rating"
        });

    } else if (order.customer_rating <= 3.2) {

        factors.push({
            severity: "medium",
            reason: "Below-average customer rating"
        });
    }

    if (
        String(order.payment_method).toUpperCase() === "COD"
    ) {

        factors.push({
            severity: "medium",
            reason: "Cash-on-delivery payment"
        });
    }

    if (order.order_value >= 7500) {

        factors.push({
            severity: "medium",
            reason: "High-value order"
        });
    }

    if (order.previous_orders <= 5) {

        factors.push({
            severity: "medium",
            reason: "Limited customer order history"
        });
    }

    return factors
        .sort((a, b) => {

            const priority = {
                high: 3,
                medium: 2,
                low: 1
            };

            return (
                (priority[b.severity] || 0) -
                (priority[a.severity] || 0)
            );

        })
        .slice(0, 5);
}


// ------------------------------------------------------------
// FALLBACK RECOMMENDATION
// ------------------------------------------------------------

function generateFallbackRecommendation(level) {

    if (level === "HIGH") {

        return {
            action: "Review this order before dispatch"
        };
    }

    if (level === "MEDIUM") {

        return {
            action: "Apply targeted safeguards before fulfillment"
        };
    }

    return {
        action: "Proceed with normal fulfillment"
    };
}


// ------------------------------------------------------------
// EMPTY STATE
// ------------------------------------------------------------

function showEmpty() {

    clearInterval(loadingTimer);

    if (loadingState) {
        loadingState.classList.add("hidden");
    }

    if (resultState) {
        resultState.classList.add("hidden");
    }

    if (emptyState) {
        emptyState.classList.remove("hidden");
    }

    if (analyzeButton) {
        analyzeButton.disabled = false;
    }
}


// ------------------------------------------------------------
// HISTORY
// ------------------------------------------------------------

function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(HISTORY_KEY)
        ) || [];

    } catch (error) {

        console.error(
            "Unable to read history:",
            error
        );

        return [];
    }
}


function saveAnalysis(order, result) {

    const history = getHistory();

    history.unshift({
        timestamp: new Date().toISOString(),
        order,
        probability: result.probability,
        riskLevel: result.riskLevel
    });

    // Keep latest 20 analyses
    const trimmedHistory =
        history.slice(0, 20);

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(trimmedHistory)
    );
}


// ------------------------------------------------------------
// HISTORY UI
// ------------------------------------------------------------

function renderHistory() {

    const historyContainer =
        document.getElementById("historyList") ||
        document.getElementById("history");

    if (!historyContainer) {
        return;
    }

    const history = getHistory();

    if (history.length === 0) {

        historyContainer.innerHTML = `
            <div class="history-empty">
                No analyses yet.
            </div>
        `;

        return;
    }

    historyContainer.innerHTML =
        history.map(item => {

            const percentage =
                (item.probability * 100).toFixed(1);

            const time =
                new Date(item.timestamp)
                    .toLocaleString();

            return `
                <div class="history-item">

                    <div class="history-main">

                        <strong>
                            ₹${Number(
                                item.order.order_value
                            ).toLocaleString("en-IN")}
                        </strong>

                        <span>
                            ${time}
                        </span>

                    </div>

                    <div class="history-risk ${String(
                        item.riskLevel
                    ).toLowerCase()}">

                        ${item.riskLevel}

                        <span>
                            ${percentage}%
                        </span>

                    </div>

                </div>
            `;

        }).join("");
}


// ------------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------------

function updateDashboard() {

    const history = getHistory();

    const total =
        history.length;

    const high =
        history.filter(
            item => item.riskLevel === "HIGH"
        ).length;

    const medium =
        history.filter(
            item => item.riskLevel === "MEDIUM"
        ).length;

    const low =
        history.filter(
            item => item.riskLevel === "LOW"
        ).length;

    const averageRisk =
        total > 0
            ? history.reduce(
                (sum, item) =>
                    sum + item.probability,
                0
            ) / total
            : 0;

    setMetric(
        [
            "totalAnalyses",
            "totalOrders",
            "analysisCount"
        ],
        total
    );

    setMetric(
        [
            "highRiskCount",
            "highCount"
        ],
        high
    );

    setMetric(
        [
            "mediumRiskCount",
            "mediumCount"
        ],
        medium
    );

    setMetric(
        [
            "lowRiskCount",
            "lowCount"
        ],
        low
    );

    setMetric(
        [
            "averageRisk",
            "avgRisk"
        ],
        `${(averageRisk * 100).toFixed(1)}%`
    );
}


// ------------------------------------------------------------
// RISK INTELLIGENCE
// ------------------------------------------------------------

function updateRiskIntelligence() {

    const history = getHistory();

    const total =
        history.length;

    const high =
        history.filter(
            item => item.riskLevel === "HIGH"
        ).length;

    const highRate =
        total > 0
            ? high / total
            : 0;

    setMetric(
        [
            "riskCoverage",
            "highRiskRate"
        ],
        `${(highRate * 100).toFixed(0)}%`
    );

    setMetric(
        [
            "ordersAnalyzed",
            "ordersScanned"
        ],
        total
    );
}


// ------------------------------------------------------------
// GENERIC METRIC HELPER
// ------------------------------------------------------------

function setMetric(ids, value) {

    for (const id of ids) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;

            return;
        }
    }
}


// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------

function showToast(message) {

    let toast =
        document.getElementById("toast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "toast";

        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);
}


// ------------------------------------------------------------
// HTML ESCAPING
// ------------------------------------------------------------

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// ============================================================
// VISUAL PROGRESS BAR FIX
// ============================================================

function fixVisualBars() {

    // -----------------------------
    // RISK GAUGE
    // -----------------------------

    const gaugeElements = document.querySelectorAll(
        ".gauge-fill, .gauge-progress, .risk-gauge-fill, .progress-ring"
    );

    gaugeElements.forEach(el => {

        const probabilityText =
            document.getElementById("probability")?.textContent || "";

        const probability =
            parseFloat(probabilityText) / 100;

        if (!isNaN(probability)) {

            const percent =
                Math.max(0, Math.min(100, probability * 100));

            el.style.setProperty(
                "--progress",
                `${percent}%`
            );

            el.style.setProperty(
                "--risk-progress",
                `${percent}%`
            );

            // SVG
            if (el.tagName.toLowerCase() === "path") {

                const length =
                    el.getTotalLength
                        ? el.getTotalLength()
                        : 440;

                el.style.strokeDasharray =
                    `${length}`;

                el.style.strokeDashoffset =
                    `${length * (1 - probability)}`;

                el.style.stroke =
                    "#ff5c7a";
            }

            // Regular progress element
            if (
                el.classList.contains("gauge-fill") ||
                el.classList.contains("gauge-progress")
            ) {
                el.style.width =
                    `${percent}%`;
            }
        }
    });


    // -----------------------------
    // RISK DISTRIBUTION BARS
    // -----------------------------

    const history = getHistory();

    const total = history.length;

    if (total === 0) return;

    const high =
        history.filter(x => x.riskLevel === "HIGH").length;

    const medium =
        history.filter(x => x.riskLevel === "MEDIUM").length;

    const low =
        history.filter(x => x.riskLevel === "LOW").length;

    const percentages = {
        HIGH: (high / total) * 100,
        MEDIUM: (medium / total) * 100,
        LOW: (low / total) * 100
    };

    // Find distribution rows and their bars
    document.querySelectorAll(
        ".distribution-row, .risk-distribution-row, .portfolio-row"
    ).forEach(row => {

        const text =
            row.textContent.toUpperCase();

        let level = null;

        if (text.includes("HIGH")) level = "HIGH";
        else if (text.includes("MEDIUM")) level = "MEDIUM";
        else if (text.includes("LOW")) level = "LOW";

        if (!level) return;

        const bar =
            row.querySelector(
                ".distribution-fill, .risk-fill, .portfolio-fill, .bar-fill, .progress-fill"
            );

        if (bar) {

            bar.style.width =
                `${percentages[level]}%`;

            bar.style.background =
                level === "HIGH"
                    ? "#ff5c7a"
                    : level === "MEDIUM"
                        ? "#f5b942"
                        : "#45d99b";

            bar.style.display = "block";
        }
    });
}


// Run after page loads
setTimeout(fixVisualBars, 100);


// Run whenever a prediction is displayed
const originalShowResult = window.showResult;

if (typeof originalShowResult === "function") {

    window.showResult = function(result) {

        originalShowResult(result);

        setTimeout(fixVisualBars, 50);
    };
}
function updateSignalCount(count) {
    const elements = document.querySelectorAll("*");

    elements.forEach(el => {
        const text = el.textContent.trim();

        if (text === "0 signals" || text === "1 signals") {
            el.textContent = `${count} signals`;
        }
    });
}