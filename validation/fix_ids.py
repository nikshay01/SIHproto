#!/usr/bin/env python3
"""
Fix duplicate facility IDs by incorporating state RTO codes.

The original dataset sometimes reuses the same ID (e.g., AP001) for facilities
in different states. This script ensures each facility gets a unique ID
by prefixing with the state's RTO abbreviation and a sequential number
within that state.

Usage:
    python validation/fix_ids.py \
        --input data/e-waste-facilities/all_facilities.json \
        --output data/e-waste-facilities/all_facilities_fixed.json
"""

import json
import argparse
from collections import defaultdict
from typing import Dict, List

# Mapping of state/UT names (as they appear in the dataset) to their RTO codes.
# This list covers all 36 states/UTs in India. Add or adjust if the dataset uses
# slightly different names.
STATE_RTO_MAP = {
    "Andaman and Nicobar Islands": "AN",
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Bihar": "BR",
    "Chandigarh": "CH",
    "Chhattisgarh": "CG",
    "Dadra and Nagar Haveli and Daman and Diu": "DD",
    "Delhi": "DL",
    "Goa": "GA",
    "Gujarat": "GJ",
    "Haryana": "HR",
    "Himachal Pradesh": "HP",
    "Jammu and Kashmir": "JK",
    "Jharkhand": "JH",
    "Karnataka": "KA",
    "Kerala": "KL",
    "Ladakh": "LA",
    "Lakshadweep": "LD",
    "Madhya Pradesh": "MP",
    "Maharashtra": "MH",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Odisha": "OD",
    "Puducherry": "PY",
    "Punjab": "PB",
    "Rajasthan": "RJ",
    "Sikkim": "SK",
    "Tamil Nadu": "TN",
    "Telangana": "TS",
    "Tripura": "TR",
    "Uttar Pradesh": "UP",
    "Uttarakhand": "UK",
    "West Bengal": "WB",
}

def load_data(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data: Dict, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def fix_ids(data: Dict) -> Dict:
    """
    Ensure each facility gets a unique ID based on state RTO code.
    The new ID format: <STATE_RTO><NNN> where NNN is a zero‑padded
    sequential number inside that state.
    """
    # Counter per state
    state_counter: Dict[str, int] = defaultdict(int)

    facilities = data.get("all_facilities", [])
    for fac in facilities:
        state_name = fac.get("state")
        if not state_name:
            raise ValueError(f"Facility missing 'state' field: {fac.get('id', 'unknown')}")
        rto = STATE_RTO_MAP.get(state_name)
        if not rto:
            raise ValueError(f"Unknown state name '{state_name}' – add to STATE_RTO_MAP")
        # Increment counter and format ID
        state_counter[state_name] += 1
        new_id = f"{rto}{state_counter[state_name]:03d}"
        # Preserve the old ID for reference (optional)
        fac["old_id"] = fac.get("id")
        fac["id"] = new_id
    # Update any metadata that might rely on the old IDs (none in this dataset)
    return data

def main():
    parser = argparse.ArgumentParser(description="Fix duplicate facility IDs using state RTO codes.")
    parser.add_argument("--input", required=True, help="Path to the original all_facilities.json")
    parser.add_argument("--output", required=True, help="Path to write the corrected JSON")
    args = parser.parse_args()

    data = load_data(args.input)
    fixed_data = fix_ids(data)
    save_data(fixed_data, args.output)
    print(f"Successfully wrote fixed data to {args.output}")

if __name__ == "__main__":
    main()