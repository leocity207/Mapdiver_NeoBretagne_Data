Network_Map
===========

.. js:autoclass:: Network_Map

====================

Public Members
--------------
	.. js:autofunction:: Network_Map#Setup_Mouse_Handlers
	.. js:autofunction:: Network_Map#Change_Color
	.. js:autofunction:: Network_Map#Highlight_Lines
	.. js:autofunction:: Network_Map#Reset_Line_Highlight
	.. js:autofunction:: Network_Map#Highlight_All_Lines_At_Station
	.. js:autofunction:: Network_Map#Zoom_Highlighted_Line
	.. js:autofunction:: Network_Map#Zoom_Highlighted_Stations
	.. js:autofunction:: Network_Map#Zoom_Highlighted_Tracks
	.. js:autofunction:: Network_Map#Zoom_Not_Visible_Station
	.. js:autofunction:: Network_Map#Highlight_Station
	.. js:autofunction:: Network_Map#Reset_All_Highlight_Station
	.. js:autofunction:: Network_Map#Check_Station_Visible
		
====================

Private Members
---------------
	.. js:autofunction:: Network_Map#_Handle_Mouse_Click_Track
	.. js:autofunction:: Network_Map#_Handle_Mouse_Click_Station
	.. js:autofunction:: Network_Map#_Find_Track_Code_In_Id
	.. js:autofunction:: Network_Map#_Find_Station_Code_In_Id
	.. js:autofunction:: Network_Map#_Find_Line_Data_By_Id
	.. js:autofunction:: Network_Map#_Find_Station_Data_By_Id

====================

Attributes
----------
	.. js:autoattribute:: Network_Map#network_config
	.. js:autoattribute:: Network_Map#lines
	.. js:autoattribute:: Network_Map#stations
	.. js:autoattribute:: Network_Map#selected_color
	.. js:autoattribute:: Network_Map#highlighted_line_codes

====================

Network map specification
-------------------------

ligne/track
^^^^^^^^^^^
	Ligne node should have an ID built as follow ``L-LIGN_ID-TRACK_ID`` Where:
		* ``L`` designate that the node is a line.
		* ``LIGN_ID`` is the ID of the Line. It should be replaced with the appropriate name.
		* ``TRACK_ID`` (optional) is the ID of the track if it exist. It should be replaced with the appropriate name.
	
	You shall not forget to add the ``-`` between each part to separate them.

	Exemple:
		- ``L-LER_BRE1`` here ``L`` designate a ligne ``LER_BRE1`` is the Ligne ID
		- ``L-K90-LYO_VIE`` here ``L`` designate a ligne ``LER_BRE1`` is the Ligne ID and ``NY_MOR`` the track ID

ligne Label
^^^^^^^^^^^
	Ligne label node should have an ID built as follow ``LT-LIGN_ID-LABEL_DIFF`` Where:
		* ``LT`` designate that the node is a line label.
		* ``LIGN_ID`` is the ID of the Line. It should be replaced with the appropriate name.
		* ``LABEL_DIFF`` (optional) should be use to diferentiat two different ligne label for the same ligne.
	
	You shall not forget to add the ``-`` between each part to separate them.

	Exemple:
		- ``LT-LER_BRE1`` here ``LT`` designate a ligne label and ``LER_BRE1`` a ligne ID
		- ``L-K90-1`` here ``LT`` designate a ligne label and ``K90`` a ligne ID finali the ``1`` designate that this is the label of the ligne K90 named 1.

Station 
^^^^^^^
	Station node should have an ID built as follow ``S-STATION_ID-STATION_DIFF`` Where:
		* ``S`` designate that the node is a station.
		* ``STATION_ID`` is the ID of the station. It should be replaced with the appropriate name.
		* ``STATION_DIFF`` (optional) should be use to diferentiat two different station.

	You shall not forget to add the ``-`` between each part to separate them.

	Exemple:
		- ``S-VIENNE_0`` here ``S`` designate a station and ``VIENNE_0`` a is the station ID
		- ``S-NY_MON-1`` here ``S`` designate a station and ``NY_MON`` a is the station ID ``1`` designate this is the first station ``NY_MON`` other may be found

Station Label
^^^^^^^^^^^^^
	Station label node should have an ID built as follow ``ST-STATION_ID-STATION_LIGNE`` Where:
		* ``S`` designate that the node is a station.
		* ``STATION_ID`` is the ID of the station. It should be replaced with the appropriate name.
		* ``STATION_LIGNE`` (optional) should be use for station label that are write with multiple label.

	You shall not forget to add the ``-`` between each part to separate them.

	Exemple:
		- ``ST-VIENNE_0`` here ``ST`` designate a station label and ``VIENNE_0`` a is the station label ID
		- ``ST-NY_MON-A`` here ``ST`` designate a station label and ``NY_MON`` a is the station label ID ``1`` designate this is the first station ``NY_MON`` other may be found but they are all linked together