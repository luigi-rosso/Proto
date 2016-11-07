var Mesh = (function ()
{
	function Mesh(graphics)
	{
		this._IndexBuffer = graphics.makeIndexBuffer();
		this._VertexBuffer = graphics.makeVertexBuffer();
	}

	Mesh.prototype.set = function(vertices, indices)
	{
		this._VertexBuffer.update(vertices);
		this._IndexBuffer.update(indices);
	};

	Mesh.prototype.addVertex = function(vertex, uv)
	{
		if(!this._VertexData)
		{
			this._VertexData = [];
		}
		this._VertexData.push(vertex[0], vertex[1]);
		if(uv)
		{
			this._VertexData.push(uv[0], uv[1]);
		}
		else if(vertex.length >= 4)
		{
			this._VertexData.push(vertex[2], vertex[3]);
		}
		else
		{
			this._VertexData.push(0, 0);	
		}
	};

	Mesh.prototype.addTri = function(tri)
	{
		if(!this._IndexData)
		{
			this._IndexData = [];
		}
		this._IndexData.push(tri[0], tri[1], tri[2]);
	};

	Mesh.prototype.update = function()
	{
		if(this._VertexData)
		{
			this._VertexBuffer.update(this._VertexData);
			delete this._VertexData;
		}
		if(this._IndexData)
		{
			this._IndexBuffer.update(this._IndexData);
			delete this._IndexData;
		}
	};

	Mesh.prototype.draw = function(graphics, view, transform, opacity, color, tex)
	{
		if(tex)
		{
			graphics.drawTextured(view, transform, this._VertexBuffer, this._IndexBuffer, opacity, color, tex);
		}
		else
		{
			graphics.drawColored(view, transform, this._VertexBuffer, this._IndexBuffer, opacity, color, tex);
		}
	};

	return Mesh;
}());