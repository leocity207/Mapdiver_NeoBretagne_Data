#!/usr/bin/env python3
import json
import os
from pathlib import Path
from typing import Any, Union

# Keys that contain minute-based values
MINUTE_KEYS = {
    "interval_time",
    "departure_time",
    "arrival_times",
    "departure_times",
}

# Time fields like "5:15:00" -> seconds from midnight
TIME_KEYS = {
    "first_departure",
    "last_departure",
}

def minutes_to_seconds(value: Any) -> Any:
    """Convert a minute value (int/float) to seconds."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(round(value * 60))
    return value

def hms_to_seconds(value: str) -> Any:
    """
    Convert a time string like '5:15:00' or '05:15:00' to seconds.
    Returns the original value if parsing fails.
    """
    if not isinstance(value, str):
        return value

    parts = value.strip().split(":")
    if len(parts) != 3:
        return value

    try:
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = int(parts[2])
        return hours * 3600 + minutes * 60 + seconds
    except ValueError:
        return value

def transform_json(obj: Any) -> Any:
    """
    Recursively walk through dictionaries and lists and convert
    the targeted fields from minutes to seconds.
    """
    if isinstance(obj, dict):
        new_obj = {}
        for key, value in obj.items():
            if key in MINUTE_KEYS:
                if isinstance(value, list):
                    new_obj[key] = [minutes_to_seconds(v) for v in value]
                else:
                    new_obj[key] = minutes_to_seconds(value)
            elif key in TIME_KEYS:
                new_obj[key] = hms_to_seconds(value)
            else:
                new_obj[key] = transform_json(value)
        return new_obj

    if isinstance(obj, list):
        return [transform_json(item) for item in obj]

    return obj

def process_file(file_path: Path) -> None:
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    transformed = transform_json(data)

    # First dump with spaces
    json_str = json.dumps(transformed, ensure_ascii=False, indent=2)

    # Then replace 2 spaces by tabs
    json_str = json_str.replace("  ", "\t")

    with file_path.open("w", encoding="utf-8") as f:
        f.write(json_str)

    print(f"Updated: {file_path}")

def process_folder(folder: Union[str, Path]) -> None:
    folder_path = Path(folder)

    if not folder_path.is_dir():
        raise ValueError(f"Not a folder: {folder_path}")

    for file_path in folder_path.rglob("*.json"):
        process_file(file_path)

if __name__ == "__main__":
    # Change this to your folder path
    input_folder = "./lines"
    process_folder(input_folder)