.. _index:

Octoliner Maptiva Documentation
================================

Introduction
------------

**Octoliner Maptiva** is an open-source web application designed to display public transport network maps interactively. It simplifies the presentation of network and transport information, making it user-friendly and intuitive.

Key Features
------------

Octoliner Maptiva offers several interactive functionalities:

- **Interactive Map** – Select a station and view all the lines that pass through it.
- **Line Information Display** – View details about specific transport lines.
- **Searchable Lines & Stations** – Quickly locate transport lines and stations.
- **Customizable Line Colors** – Easily adjust line colors for better readability and consistency.

Planned Enhancements
--------------------

Future improvements will include:

- **GTFS Support** – Display future train arrivals at a station.
- **Real-Time Transport Updates** – Show currently operating transport via GTFS real-time data.
- **Ridership Information** – Display transport usage statistics.
- **Connection Display** – Show transfer points when selecting a line.
- **Route Finder** – Find all possible connections between two stations.
- **Personalized Timetable Generation** – Create custom schedules for travel planning.
- **Ticket Purchase Integration** – Redirect users to ticketing platforms.

Project Structure
-----------------

Octoliner Maptiva is organized into several key components:

.. graphviz::

   digraph ProjectStructure {
      rankdir=LR;
      App -> Page [label="Contains"];
      Page -> Map [label="Displays"];
      Page -> Component [label="Includes"];
      App -> Loader [label="Uses"];
      App -> Config [label="Configured by"];
      Page -> Utils [label="Utilizes"];
   }

Component Overview
------------------

- **Application (`app_base`)** – Manages multiple pages, similar to a book with chapters.
- **Pages (`page_base`)** – Main areas where users interact with the application.
- **Maps (`map_base`)** – Objects inside pages designed to display transport network maps.
- **Components (`component_base`)** – General UI elements like sticky headers or side panels.
- **Loaders (`loader_base`)** – Loading animations displayed inside an application.
- **Configuration (`config_base`)** – Defines variables and settings for the application.
- **Utilities (`utils`)** – Common functions used throughout the project.

License
-------

Octoliner Maptiva is licensed under the **MIT License**, ensuring openness and flexibility for developers and contributors.

For more details, visit the official repository or contribute to the project!

**Let's make transport information more accessible and interactive!** 🚆🌍



Documentation Index
-------------------

.. toctree::
   :maxdepth: 2
   :caption: Table of Contents

   src/app/app_base
   src/page/page_base
   src/map/map_base
   src/components/component_base
   src/loader/loader_base
   src/config/config_base
   src/utils/utils