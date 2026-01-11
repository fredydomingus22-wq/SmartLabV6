import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple

class ReportsEngine:
    """
    Core Analytics Engine for SmartLab-V6.
    Handles Statistical Process Control (SPC), Capability Analysis, and Trend Forecasting.
    Designed to run in a Python runtime (e.g., Supabase Edge Functions with Python support).
    """
    
    @staticmethod
    def calculate_spc_metrics(data: List[Dict], specs: Optional[Dict] = None) -> Dict:
        """
        Calculates comprehensive SPC metrics including Cp, Cpk, and Control Limits.
        """
        if not data:
            return {"error": "No data provided"}

        df = pd.DataFrame(data)
        
        # Ensure we have numeric values
        if 'value' not in df.columns:
            return {"error": "Invalid data format: 'value' column missing"}

        numeric_values = pd.to_numeric(df['value'], errors='coerce').dropna()
        
        # 1. Basic Stats
        mean = numeric_values.mean()
        std = numeric_values.std()
        min_val = numeric_values.min()
        max_val = numeric_values.max()
        
        # 2. Control Limits (3 sigma)
        ucl = mean + (3 * std)
        lcl = mean - (3 * std)
        ucl_1s = mean + std
        lcl_1s = mean - std
        ucl_2s = mean + (2 * std)
        lcl_2s = mean - (2 * std)
        
        # 3. Process Capability (Cp, Cpk)
        capability = {}
        if specs:
            usl = specs.get('max_value')
            lsl = specs.get('min_value')
            
            if usl is not None and lsl is not None:
                cp = (usl - lsl) / (6 * std) if std > 0 else 0
                cpu = (usl - mean) / (3 * std) if std > 0 else 0
                cpl = (mean - lsl) / (3 * std) if std > 0 else 0
                cpk = min(cpu, cpl)
                
                capability = {
                    "Cp": round(cp, 3),
                    "Cpk": round(cpk, 3),
                    "Pp": round(cp, 3), # Approximation for this context
                    "Ppk": round(cpk, 3)
                }

        # 4. Nelson Rules (Simplified Check)
        # Rule 1: Point beyond 3 sigma
        violations_rule_1 = ((numeric_values > ucl) | (numeric_values < lcl)).sum()
        
        return {
            "statistics": {
                "mean": round(mean, 3),
                "std": round(std, 3),
                "min": round(min_val, 3),
                "max": round(max_val, 3),
                "count": len(numeric_values)
            },
            "control_limits": {
                "ucl": round(ucl, 3),
                "lcl": round(lcl, 3),
                "center_line": round(mean, 3),
                "sigma_1": {"upper": round(ucl_1s, 3), "lower": round(lcl_1s, 3)},
                "sigma_2": {"upper": round(ucl_2s, 3), "lower": round(lcl_2s, 3)}
            },
            "capability": capability,
            "violations": {
                "rule_1_count": int(violations_rule_1),
                "is_stable": violations_rule_1 == 0
            }
        }

    @staticmethod
    def predict_trend(data: List[Dict]) -> Dict:
        """
        Predicts future trends using Linear Regression.
        """
        if not data or len(data) < 2:
            return {"trend": "insufficient_data"}

        values = [d['value'] for d in data if d.get('value') is not None]
        y = np.array(values)
        x = np.arange(len(y))
        
        if len(y) == 0:
             return {"trend": "no_numeric_data"}

        # Linear regression: y = mx + c
        m, c = np.polyfit(x, y, 1)
        
        next_val = m * len(y) + c
        
        stats_trend = "stable"
        if m > 0.1: stats_trend = "increasing"
        elif m < -0.1: stats_trend = "decreasing"
        
        return {
            "slope": round(float(m), 4),
            "intercept": round(float(c), 4),
            "prediction_next": round(float(next_val), 3),
            "trend_direction": stats_trend
        }

# --- Module Metadata ---
# Version: 2.0.0
# Engine: SmartLab Analytical Core
