Lines
=====

Lines.json is a file that will describe the tracks and lines of your Netwok map

---------------------

Structure of the JSON Model
------------------------------

Lines.json consists of a root object with a key ``Lines``, which contains multiple transport lines. Each transport line is identified by a unique key (e.g., ``LER_BRE0``) and contains several properties:

- ``label``: The name of the line.
- ``urls``: A placeholder for additional resources (currently empty in examples).
- ``color``: Defines different colors for the line.
- ``stations``: Contains station sequences for different routes.

Here is a breakdown of these keys:


``Lines``
+++++++++

This key contains all the transport lines, each defined as an object.

Example:

.. code-block:: json

    {
        "Lines": {
            "LER_BRE0": {
                "label": "LER BRE0",
                "urls": {},
                "color": {
                    "default": "#25158B",
                    "easy": "#DD2F1D"
                },
                "stations": {
                    "default-a": [
                        "FR_29019_0",
                        "FR_29103_0",
                        "FR_29105_0"
                    ],
                    "default-r": "~default-a"
                }
            }
        }
    }

``label``
+++++++++

- A string representing the name of the transport line.
- Example: ``"LER BRE0"``

``urls``
++++++++

- An object meant to store additional resources or related URLs (currently empty in the examples).

``color``
+++++++++

- Defines color codes for different modes.
- Example:

.. code-block:: json

    "color": {
        "default": "#25158B",
        "easy": "#DD2F1D"
    }

``stations``
++++++++++++

- Defines the sequence of stations for different routes.
- Example:

.. code-block:: json

    "stations": {
        "default-a": ["FR_29019_0", "FR_29103_0"],
        "default-r": "~default-a"
    }

The ``default-a`` key contains a list of station IDs, while ``default-r`` uses the ``~`` notation to indicate that it mirrors ``default-a`` in reverse order.

---------------------

Creating Your Own Data Files
-----------------------------

To create your own JSON data files, follow these steps:

1. Define the ``Lines`` object.
2. Add unique line keys (e.g., ``LER_BRE0``) with the following properties:
   - ``label``: Set a descriptive name.
   - ``urls``: Define any additional metadata (optional).
   - ``color``: Specify color codes.
   - ``stations``: Define station sequences.

Example:

.. code-block:: json

    {
        "Lines": {
            "MY_LINE": {
                "label": "My Custom Line",
                "urls": {},
                "color": {
                    "default": "#123456",
                    "easy": "#654321"
                },
                "stations": {
                    "route-a": ["STATION_1", "STATION_2"],
                    "route-b": "~route-a"
                }
            }
        }
    }

This structure allows for easy modification and extension as needed.



