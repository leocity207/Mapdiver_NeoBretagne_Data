import json

# ---- Global input string ----
RAW_INPUT = """
{
					"station_ID": "FR_67482_0",
					"departure_time": 0
				},
				{
					"station_ID": "FR_54546_0",
					"arrival_minute": 32,
					"departure_time": 33
				},
				{
					"station_ID": "FR_55545_1",
					"arrival_minute": 54,
					"departure_time": 55
				},
				{
					"station_ID": "FR_51454_0",
					"arrival_minute": 76,
					"departure_time": 77
				},
				{
					"station_ID": "FR_91377_1",
					"arrival_minute": 109,
					"departure_time": 110
				},
				{
					"station_ID": "FR_28085_0",
					"arrival_minute": 142,
					"departure_time": 143
				},
				{
					"station_ID": "FR_41269_1",
					"arrival_minute": 175,
					"departure_time": 176
				},
				{
					"station_ID": "FR_37233_0",
					"arrival_minute": 208,
					"departure_time": 209
				},
				{
					"station_ID": "FR_49007_0",
					"arrival_minute": 241,
					"departure_time": 242
				},
				{
					"station_ID": "FR_44109_0",
					"arrival_minute": 274
				}
"""

def compress_objects(raw_string: str) -> dict:
	# Make valid JSON array
	json_array_str = f"[{raw_string}]"
	objects = json.loads(json_array_str)

	result = {
		"arrival_times": [
			obj.get("arrival_minute", None) for obj in objects
		],
		"departure_times": [
			obj.get("departure_time", None) for obj in objects
		],
		"stations": [
			obj.get("station_ID", None) for obj in objects
		],
	}

	return result


if __name__ == "__main__":
	compressed = compress_objects(RAW_INPUT)
	print(json.dumps(compressed, indent=4))
