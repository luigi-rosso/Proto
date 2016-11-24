var GeometryInstance = (function ()
{
	function GeometryInstance()
	{
		this._transform = mat2d.create();
		this._inverseTransform = null;
		this._rotation = 0;
		this._position = vec2.create();
		this._scale = vec2.set(vec2.create(), 1.0, 1.0);
		this._dirty = false;
		this._invertDirty = false;
	}

	GeometryInstance.prototype = {
		get transform()
		{
			if(this._dirty)
			{
				var r = this._rotation;
				var t = this._position;
				var s = this._scale;

				var x = this._transform;

				mat2d.fromRotation(x, r);

				x[4] = t[0];
				x[5] = t[1];

				mat2d.scale(x, x, s);

				this._dirty = false;
			}
			return this._transform;
		},
		set transform(v)
		{
			mat2d.copy(this._transform, v);

			this._position[0] = v[4];
			this._position[1] = v[5];
			this._rotation = Math.atan2(v[1], v[0]);

			var x = v[0];
			var y = v[1];
			this._scale[0] = Math.sqrt(x*x + y*y);

			x = v[2];
			y = v[3];
			this._scale[1] = Math.sqrt(x*x + y*y);

			this._dirty = false;
		},
		get inverseTransform()
		{
			if(this._invertDirty)
			{
				if(!this._inverseTransform)
				{
					this._inverseTransform = mat2d.create();
				}
				mat2d.invert(this._inverseTransform, this._transform);
				this._invertDirty = false;
			}
			return this._inverseTransform;
		},
		get position()
		{
			return this._position;
		},
		set position(val) 
		{
			this._position[0] = val[0];
			this._position[1] = val[1];
			this._dirty = true;
			this._invertDirty = true;
		},
		get x() 
		{
			return this._position[0];
		},
		set x(v) 
		{
			this._position[0] = v;
			this._dirty = true;
			this._invertDirty = true;
		},
		get y() 
		{
			return this._position[1];
		},
		set y(v) 
		{
			this._position[1] = v;
			this._dirty = true;
			this._invertDirty = true;
		},
		get rotation()
		{
			return this._rotation;
		},
		set rotation(v)
		{
			this._rotation = v;
			this._dirty = true;
			this._invertDirty = true;
		},
		get scale()
		{
			return this._scale;
		},
		set scale(v)
		{
			this._scale[0] = v[0];
			this._scale[1] = v[1];
			this._dirty = true;
			this._invertDirty = true;
		}
	};

	return GeometryInstance;
}());