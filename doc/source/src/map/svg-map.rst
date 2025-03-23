SVG_Map
=======

.. js:autoclass:: SVG_Map

====================

Public Members
--------------
	.. js:autofunction:: SVG_Map#Setup
	.. js:autofunction:: SVG_Map#Setup_Mouse_Handlers
	.. js:autofunction:: SVG_Map#Find_Map_Objs_By_Classname
	.. js:autofunction:: SVG_Map#Animated_Pan_Zoom
	.. js:autofunction:: SVG_Map#Zoom_Check_Map_Resize
	.. js:autofunction:: SVG_Map#Initial_Zoom_Move
	.. js:autofunction:: SVG_Map#Zoom_Box_For_Objs

====================
	
Protected Members
-----------------
	.. js:autofunction:: SVG_Map#_GetObjectBounds
	.. js:autofunction:: SVG_Map#_Handle_Mouse_Over_Obj
	.. js:autofunction:: SVG_Map#_Handle_Mouse_Out_Obj
	.. js:autofunction:: SVG_Map#_Find_Map_Objs_By_Id
	.. js:autofunction:: SVG_Map#_Optimize_Zoom_Box_For_Viewport
	.. js:autofunction:: SVG_Map#_Handle_Animation_State
	.. js:autofunction:: SVG_Map#_calcMapAnimationTiming

====================

Private Members
---------------
	.. js:autofunction:: SVG_Map#_Handle_Pinch_Start
	.. js:autofunction:: SVG_Map#_Handle_Pinch_End
	.. js:autofunction:: SVG_Map#_Handle_User_Gesture_Zoom
	.. js:autofunction:: SVG_Map#_Handle_User_Mousewheel_Zoom
	.. js:autofunction:: SVG_Map#_Handle_User_Map_Move_Touch
	.. js:autofunction:: SVG_Map#_Handle_Main_Group_Mousedown
	.. js:autofunction:: SVG_Map#_Best_Initial_Zoom
	.. js:autofunction:: SVG_Map#_Traverse_All_Canvas_Objects

====================

Private Static Members
----------------------
	.. js:autofunction:: SVG_Map._Initialize_Fabric

====================

Attributes
----------
	.. js:autoattribute:: SVG_Map#filename
	.. js:autoattribute:: SVG_Map#config
	.. js:autoattribute:: SVG_Map#fabric_canvas
	.. js:autoattribute:: SVG_Map#groupSVGElements
	.. js:autoattribute:: SVG_Map#language
	.. js:autoattribute:: SVG_Map#panel_detail_space
	.. js:autoattribute:: SVG_Map#panel_header_height
	.. js:autoattribute:: SVG_Map#client_type
	.. js:autoattribute:: SVG_Map#move_zoom_animation_obj
	.. js:autoattribute:: SVG_Map#last_bounding_data
	.. js:autoattribute:: SVG_Map#map_animation_run
	.. js:autoattribute:: SVG_Map#pinch_start_scale
	.. js:autoattribute:: SVG_Map#last_scale
	.. js:autoattribute:: SVG_Map#last_pointer