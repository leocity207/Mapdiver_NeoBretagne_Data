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
		let that = this.zoom_obj;
		that.m_mouseStartPosition.x = e.pageX;
		that.m_mouseStartPosition.y = e.pageY;

		that.m_viewboxStartPosition.x = that.m_viewboxPosition.x;
		that.m_viewboxStartPosition.y = that.m_viewboxPosition.y;

		window.addEventListener("mouseup", that.mouseup.bind(this));

		that.m_mouseDown = true;
	}

	setviewbox()
	{
		let that = this.zoom_obj;
		var vp = {x: 0, y: 0};
		var vs = {x: 0, y: 0};
		
		vp.x = that.m_viewboxPosition.x;
		vp.y = that.m_viewboxPosition.y;
		
		vs.x = that.m_viewboxSize.x * that.m_viewboxScale;
		vs.y = that.m_viewboxSize.y * that.m_viewboxScale;

		that.m_target_shape.setAttribute("viewBox", vp.x + " " + vp.y + " " + vs.x + " " + vs.y);
		
	}

	mousemove(e)
	{
		let that = this.zoom_obj;
		that.m_mousePosition.x = e.offsetX;
		that.m_mousePosition.y = e.offsetY;
		
		if (that.m_mouseDown)
		{
			that.m_viewboxPosition.x = that.m_viewboxStartPosition.x + (that.m_mouseStartPosition.x - e.pageX) * that.m_viewboxScale;
			that.m_viewboxPosition.y = that.m_viewboxStartPosition.y + (that.m_mouseStartPosition.y - e.pageY) * that.m_viewboxScale;

			that.setviewbox();
		}
		
		//var mpos = {x: mousePosition.x * viewboxScale, y: mousePosition.y * viewboxScale};
		//var vpos = {x: viewboxPosition.x, y: viewboxPosition.y};
		//var cpos = {x: mpos.x + vpos.x, y: mpos.y + vpos.y}
	}

	mouseup(e) {
		let that = this.zoom_obj;
		window.removeEventListener("mouseup", that.mouseup.bind(this));
		
		that.m_mouseDown = false;
	}

	wheel(e) {
		let that = this.zoom_obj;
		var scale = (e.deltaY < 0) ? 0.8 : 1.2;
		
		if ((that.m_viewboxScale * scale < 8.) && (that.m_viewboxScale * scale > 1./256.))
		{  
			var mpos = {x: that.m_mousePosition.x * that.m_viewboxScale, y: that.m_mousePosition.y * that.m_viewboxScale};
			var vpos = {x: that.m_viewboxPosition.x, y: that.m_viewboxPosition.y};
			var cpos = {x: mpos.x + vpos.x, y: mpos.y + vpos.y}

			that.m_viewboxPosition.x = (that.m_viewboxPosition.x - cpos.x) * scale + cpos.x;
			that.m_viewboxPosition.y = (that.m_viewboxPosition.y - cpos.y) * scale + cpos.y;
			that.m_viewboxScale *= scale;
		
			that.setviewbox();
		}
	}
}