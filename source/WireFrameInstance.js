var WireFrameInstance = (function ()
{
	function WireFrameInstance(wiremesh)
	{
		GeometryInstance.call(this);
		this.wiremesh = wiremesh;
		this.color = [1.0, 1.0, 1.0, 1.0];
		this.innerColor = [0.0, 0.0, 0.0, 0.0];
		this.opacity = 1.0;
		this.thickness = 1.0;
	}
	WireFrameInstance.prototype = Object.create(GeometryInstance.prototype);
	WireFrameInstance.prototype.draw = function(graphics, view, scale)
	{
		graphics.drawWireFrame(view, this.transform, this.wiremesh, this.thickness, [this.color[0], this.color[1], this.color[2], this.color[3] * this.opacity], [this.innerColor[0], this.innerColor[1], this.innerColor[2], this.innerColor[3] * this.opacity]);
	};


	return WireFrameInstance;
}());