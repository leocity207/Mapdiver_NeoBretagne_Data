Stations
========

The station json is a file that regroup information about all the stations on the map

This documentation explains the structure of a JSON model used for defining train stations, including their identifiers, labels, and associated transport lines.

---------------------

Structure of the JSON Model
---------------------------

The JSON model consists of a root object with a key `Stations`, which contains multiple station entries. Each station is identified by a unique key (e.g., `FR_22070_0`) and contains the following properties:

- `label`: The name of the station.
- `lines`: A list of transport lines that serve the station.

Here is a breakdown of these keys:

``Stations``
++++++++++++

This key contains all the stations, each defined as an object.

Example:

.. code-block:: json

	{
		"Stations": {
			"FR_22070_0": {
				"label": "Guingamp",
				"lines": ["LER_BRE0", "LGV_BRE2", "LGV_BRE0"]
			}
		}
	}


``label``
++++++++++++

- A string representing the name of the station.
- Example: `"Guingamp"`

``lines``
++++++++++++

- A list of transport lines that pass through the station.
- Example:

.. code-block:: json

	"lines": ["LER_BRE0", "LGV_BRE2", "LGV_BRE0"]


Each value in this list corresponds to a transport line identifier, indicating that the station is served by these lines.

---------------------

Creating Your Own Stations Data
----------------------------------

To create your own JSON stations data, follow these steps:

1. Define the `Stations` object.
2. Add unique station keys (e.g., `FR_22070_0`) with the following properties:
   - `label`: Set the station name.
   - `lines`: List the transport lines serving the station.


Example:

.. code-block:: json

	{
		"Stations": {
			"STATION_001": {
				"label": "Example Station",
				"lines": ["LINE_A", "LINE_B"]
			},
			"STATION_002": {
				"label": "Another Station",
				"lines": ["LINE_B", "LINE_C"]
			}
		}
	}


This structure allows for easy modification and extension as needed.

