var LineInstance = (function ()
{
	function LineInstance(line)
	{
		GeometryInstance.call(this);
		this.line = line;
		this.color = [1.0, 1.0, 1.0, 1.0];
		this.opacity = 1.0;
		this.thickness = 1.0;
		this.inScreenSpace = true;
	}
	LineInstance.prototype = Object.create(GeometryInstance.prototype);
	LineInstance.prototype.draw = function(graphics, view, scale)
	{
		graphics.drawLine(view, this.transform, this.line, this.thickness / (this.inScreenSpace ? scale : 1.0), this.opacity, [this.color[0], this.color[1], this.color[2], this.color[3] * this.opacity]);
	};


	return LineInstance;
}());