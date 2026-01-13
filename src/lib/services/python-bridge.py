#!/usr/bin/env python3
"""
🐍 SmartLab Python Analytics Bridge

Industrial-grade statistical analysis service for complex calculations
that are computationally expensive or require specialized libraries.

This script is designed to be called from Node.js via:
1. child_process (development)
2. FastAPI endpoint (production)

Usage:
    python python-bridge.py spc '{"values": [1,2,3,4,5]}'
    python python-bridge.py anomaly '{"values": [1,2,3,100,5]}'
    python python-bridge.py forecast '{"values": [1,2,3,4,5], "periods": 3}'
"""

import sys
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

# Statistical Analysis Functions

def calculate_spc_metrics(values: List[float]) -> Dict[str, Any]:
    """
    Calculate Statistical Process Control metrics.
    Returns: mean, std, UCL, LCL, Cp, Cpk (if spec_limits provided)
    """
    if not values:
        return {"error": "No data provided"}
    
    n = len(values)
    mean = sum(values) / n
    variance = sum((x - mean) ** 2 for x in values) / n
    std = variance ** 0.5
    
    # Control limits (3-sigma)
    ucl = mean + 3 * std
    lcl = mean - 3 * std
    
    # Check for out-of-control points
    out_of_control = [
        {"index": i, "value": v, "type": "above_ucl" if v > ucl else "below_lcl"}
        for i, v in enumerate(values)
        if v > ucl or v < lcl
    ]
    
    return {
        "mean": round(mean, 4),
        "std": round(std, 4),
        "ucl": round(ucl, 4),
        "lcl": round(lcl, 4),
        "n": n,
        "out_of_control_points": out_of_control,
        "process_stable": len(out_of_control) == 0
    }


def detect_anomalies(values: List[float], threshold: float = 2.5) -> Dict[str, Any]:
    """
    Detect anomalies using Z-score method.
    """
    if not values or len(values) < 3:
        return {"error": "Insufficient data for anomaly detection"}
    
    n = len(values)
    mean = sum(values) / n
    std = (sum((x - mean) ** 2 for x in values) / n) ** 0.5
    
    if std == 0:
        return {"anomalies": [], "message": "No variance in data"}
    
    anomalies = []
    for i, v in enumerate(values):
        z_score = (v - mean) / std
        if abs(z_score) > threshold:
            anomalies.append({
                "index": i,
                "value": v,
                "z_score": round(z_score, 4),
                "severity": "high" if abs(z_score) > 3 else "medium"
            })
    
    return {
        "anomalies": anomalies,
        "total_points": n,
        "anomaly_rate": round(len(anomalies) / n * 100, 2),
        "threshold_used": threshold
    }


def simple_forecast(values: List[float], periods: int = 5) -> Dict[str, Any]:
    """
    Simple linear regression forecast.
    """
    if not values or len(values) < 2:
        return {"error": "Insufficient data for forecasting"}
    
    n = len(values)
    x = list(range(n))
    
    # Linear regression
    x_mean = sum(x) / n
    y_mean = sum(values) / n
    
    numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    
    if denominator == 0:
        slope = 0
    else:
        slope = numerator / denominator
    
    intercept = y_mean - slope * x_mean
    
    # Generate forecasts
    forecasts = []
    for i in range(n, n + periods):
        forecasts.append({
            "period": i + 1,
            "forecast": round(intercept + slope * i, 4)
        })
    
    return {
        "slope": round(slope, 4),
        "intercept": round(intercept, 4),
        "trend": "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
        "forecasts": forecasts
    }


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python-bridge.py <analysis_type> <json_data>"}))
        sys.exit(1)
    
    analysis_type = sys.argv[1]
    
    try:
        data = json.loads(sys.argv[2])
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}))
        sys.exit(1)
    
    values = data.get("values", [])
    
    result = {
        "analysis_type": analysis_type,
        "timestamp": datetime.now().isoformat(),
        "input_size": len(values)
    }
    
    if analysis_type == "spc":
        result["result"] = calculate_spc_metrics(values)
    elif analysis_type == "anomaly":
        threshold = data.get("threshold", 2.5)
        result["result"] = detect_anomalies(values, threshold)
    elif analysis_type == "forecast":
        periods = data.get("periods", 5)
        result["result"] = simple_forecast(values, periods)
    else:
        result["error"] = f"Unknown analysis type: {analysis_type}"
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
