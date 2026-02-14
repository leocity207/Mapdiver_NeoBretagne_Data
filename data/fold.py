import json

# ---- Global input string ----
RAW_INPUT = """
{
					"station_ID": "FR_67482_0",
					"departure_minute": 0
				},
				{
					"station_ID": "FR_54546_0",
					"arrival_minute": 32,
					"departure_minute": 33
				},
				{
					"station_ID": "FR_55545_1",
					"arrival_minute": 54,
					"departure_minute": 55
				},
				{
					"station_ID": "FR_51454_0",
					"arrival_minute": 76,
					"departure_minute": 77
				},
				{
					"station_ID": "FR_91377_1",
					"arrival_minute": 109,
					"departure_minute": 110
				},
				{
					"station_ID": "FR_28085_0",
					"arrival_minute": 142,
					"departure_minute": 143
				},
				{
					"station_ID": "FR_41269_1",
					"arrival_minute": 175,
					"departure_minute": 176
				},
				{
					"station_ID": "FR_37233_0",
					"arrival_minute": 208,
					"departure_minute": 209
				},
				{
					"station_ID": "FR_49007_0",
					"arrival_minute": 241,
					"departure_minute": 242
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
		"arrival_minutes": [
			obj.get("arrival_minute", None) for obj in objects
		],
		"departure_minutes": [
			obj.get("departure_minute", None) for obj in objects
		],
		"stations": [
			obj.get("station_ID", None) for obj in objects
		],
	}

	return result


if __name__ == "__main__":
	compressed = compress_objects(RAW_INPUT)
	print(json.dumps(compressed, indent=4))
