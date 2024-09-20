class Zoom {

	constructor(target_shape, initial_viewbox_size, initial_viewbox_position = {x:0 ,y:0}, initial_scale = 1.0) {

		this.m_target_shape = target_shape;
		this.m_mouseStartPosition = {x: 0, y: 0};
		this.m_mousePosition = {x: 0, y: 0};
		this.m_viewboxStartPosition = {x: 0, y: 0};
		this.m_viewboxPosition = initial_viewbox_position;
		this.m_viewboxSize = initial_viewbox_size;
		this.m_viewboxScale = initial_scale;
		this.m_mouseDown = false

		this.m_target_shape.addEventListener("mousemove", this.mousemove.bind(this));
		this.m_target_shape.addEventListener("mousedown", this.mousedown.bind(this));
		this.m_target_shape.addEventListener("wheel", this.wheel.bind(this));
		
		this.m_target_shape.zoom_obj = this.zoom_obj = this;
		this.setviewbox();
	}

	mousedown(e) {
		this.m_mouseStartPosition.x = e.pageX;
		this.m_mouseStartPosition.y = e.pageY;

		this.m_viewboxStartPosition.x = this.m_viewboxPosition.x;
		this.m_viewboxStartPosition.y = this.m_viewboxPosition.y;

		window.addEventListener("mouseup", this.mouseup.bind(this));

		this.m_mouseDown = true;
	}

	setviewbox()
	{
		var vp = {x: 0, y: 0};
		var vs = {x: 0, y: 0};
		
		vp.x = this.m_viewboxPosition.x;
		vp.y = this.m_viewboxPosition.y;
		
		vs.x = this.m_viewboxSize.x * this.m_viewboxScale;
		vs.y = this.m_viewboxSize.y * this.m_viewboxScale;

		this.m_target_shape.setAttribute("viewBox", vp.x + " " + vp.y + " " + vs.x + " " + vs.y);
		
	}

	mousemove(e)
	{
		this.m_mousePosition.x = e.offsetX;
		this.m_mousePosition.y = e.offsetY;
		
		if (this.m_mouseDown)
		{
			this.m_viewboxPosition.x = this.m_viewboxStartPosition.x + (this.m_mouseStartPosition.x - e.pageX) * this.m_viewboxScale;
			this.m_viewboxPosition.y = this.m_viewboxStartPosition.y + (this.m_mouseStartPosition.y - e.pageY) * this.m_viewboxScale;

			this.setviewbox();
		}
		
		//var mpos = {x: mousePosition.x * viewboxScale, y: mousePosition.y * viewboxScale};
		//var vpos = {x: viewboxPosition.x, y: viewboxPosition.y};
		//var cpos = {x: mpos.x + vpos.x, y: mpos.y + vpos.y}
	}

	mouseup(e) {
		window.removeEventListener("mouseup", this.mouseup.bind(this));
		
		this.m_mouseDown = false;
	}

	wheel(e) {
		var scale = (e.deltaY < 0) ? 0.8 : 1.2;
		
		if ((this.m_viewboxScale * scale < 8.) && (this.m_viewboxScale * scale > 1./256.))
		{  
			var mpos = {x: this.m_mousePosition.x * this.m_viewboxScale, y: this.m_mousePosition.y * this.m_viewboxScale};
			var vpos = {x: this.m_viewboxPosition.x, y: this.m_viewboxPosition.y};
			var cpos = {x: mpos.x + vpos.x, y: mpos.y + vpos.y}

			this.m_viewboxPosition.x = (this.m_viewboxPosition.x - cpos.x) * scale + cpos.x;
			this.m_viewboxPosition.y = (this.m_viewboxPosition.y - cpos.y) * scale + cpos.y;
			this.m_viewboxScale *= scale;
		
			this.setviewbox();
		}
	}
}