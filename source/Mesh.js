var Mesh = (function ()
{
	function Mesh(graphics)
	{
		this._IndexBuffer = graphics.makeIndexBuffer();
		this._VertexBuffer = graphics.makeVertexBuffer();
		this._Min = vec2.create();
		this._Max = vec2.create();
	}

	Mesh.prototype.set = function(vertices, indices)
	{
		this._VertexData = vertices;
		this._IndexData = indices;
		this.update();
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
			//delete this._VertexData;
		}
		if(this._IndexData)
		{
			this._IndexBuffer.update(this._IndexData);
			//delete this._IndexData;
		}

		if(this._VertexData)
		{
			// calc min/max
			var min_x = Number.MAX_VALUE;
			var min_y = Number.MAX_VALUE;
			var max_x = -Number.MAX_VALUE;
			var max_y = -Number.MAX_VALUE;
			var stride = 4;
			var points = this._VertexData;

			for(var i = 0; i < points.length; i += stride)
			{
				var x = points[i];
				var y = points[i+1];
				if(x < min_x)
				{
					min_x = x;
				}
				if(y < min_y)
				{
					min_y = y;
				}
				if(x > max_x)
				{
					max_x = x;
				}
				if(y > max_y)
				{
					max_y = y;
				}
			}

			this._Min[0] = min_x;
			this._Min[1] = min_y;

			this._Max[0] = max_x;
			this._Max[1] = max_y;
		}
	};

	Mesh.prototype.checkHit = function(x, y)
	{
		var earlyDetect = x >= this._Min[0] && x <= this._Max[0] && y >= this._Min[1] && y <= this._Max[1];

		if(!earlyDetect)
		{
			return false;
		}

		var indices = this._IndexData;
		var points = this._VertexData;
		var stride = 4;
		for(var i = 0; i < indices.length; i+=3)
		{
			var idx = indices[i]*stride;
			var p0x = points[idx];
			var p0y = points[idx+1];

			idx = indices[i+1]*stride;
			var p1x = points[idx];
			var p1y = points[idx+1];

			idx = indices[i+2]*stride;
			var p2x = points[idx];
			var p2y = points[idx+1];



			var s = p0y * p2x - p0x * p2y + (p2y - p0y) * x + (p0x - p2x) * y;
			var t = p0x * p1y - p0y * p1x + (p0y - p1y) * x + (p1x - p0x) * y;

			if(s*t < 0)
			{
				continue;
			}
			//if ((s < 0) != (t < 0))
			//    return false;

			var A = -p1y * p2x + p0y * (p2x - p1x) + p0x * (p1y - p2y) + p1x * p2y;
			if (A < 0.0)
			{
			    s = -s;
			    t = -t;
			    A = -A;
			}

			if(s > 0 && t > 0 && (s + t) < A)
			{
				return true;
			}
		}
		return false;
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