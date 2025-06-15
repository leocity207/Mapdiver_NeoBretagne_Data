import os
import json

# ----------- Configuration -----------
MAJOR_STATION_LIST = ["FR_35238_0", "FR_29232_0", "FR_44109_0", "FR_49007_0", "FR_72181_0", "FR_85191_0", "FR_14118_0"]  # Replace with your own list
LINES_DIR = "line"
STATIONS_DIR = "station"

# ----------- Load All Lines -----------
line_data = {}
for filename in os.listdir(LINES_DIR):
    if filename.endswith(".json"):
        path = os.path.join(LINES_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                line_data[data["code"]] = data
            except Exception as e:
                print(f"Failed to load line {filename}: {e}")

# ----------- Process Each Station -----------
for station_filename in os.listdir(STATIONS_DIR):
    if not station_filename.endswith(".json"):
        continue

    station_path = os.path.join(STATIONS_DIR, station_filename)
    with open(station_path, "r", encoding="utf-8") as f:
        try:
            station = json.load(f)
        except Exception as e:
            print(f"Failed to load station {station_filename}: {e}")
            continue

    station_code = station.get("code")
    if not station_code:
        print(f"Skipping station with no code: {station_filename}")
        continue

    station_directions = {}

    for line_code in station.get("lines", []):
        line = line_data.get(line_code)
        if not line:
            print(f"Line '{line_code}' not found for station '{station_code}'")
            continue

        for pattern in line.get("timetable_pattern", []):
            pattern_code = pattern.get("code")
            stops = pattern.get("lineflowstops", [])
            stop_ids = [stop["station_ID"] for stop in stops]

            if not stop_ids or stop_ids[-1] == station_code:
                continue  # Skip if this station is the last stop

            try:
                current_index = stop_ids.index(station_code)
            except ValueError:
                continue  # Station not in this pattern

            # Search for first major station after current one
            direction = None
            for next_station in stop_ids[current_index + 1:]:
                if next_station in MAJOR_STATION_LIST:
                    direction = next_station
                    break

            # Default to last station
            if not direction:
                direction = stop_ids[-1]

            station_directions[pattern_code] = direction

    # Save updated direction field
    station["direction"] = station_directions
    with open(station_path, "w", encoding="utf-8") as f:
        json.dump(station, f, indent=4, ensure_ascii=False)

print("Station files updated successfully.")
