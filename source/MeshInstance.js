var MeshInstance = (function ()
{
	function MeshInstance(mesh)
	{
		GeometryInstance.call(this);
		this.mesh = mesh;
		this.color = [1.0, 1.0, 1.0, 1.0];
		this.opacity = 1.0;
		this.texture = null;
	}

	MeshInstance.prototype = Object.create(GeometryInstance.prototype);

	MeshInstance.prototype.draw = function(graphics, view)
	{
		this.mesh.draw(graphics, view, this.transform, this.opacity, this.color, this.texture);
	};

	return MeshInstance;
}());