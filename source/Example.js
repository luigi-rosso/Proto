function Example(proto)
{
	var _This = this;
	var _AlignToTriangle = false;

	var _Rect = proto.addMeshInstance(proto.makeMesh(Rectangle, 100, 50));
	var _Line = proto.addMeshInstance(proto.makeLine([
                    [-200.0, -200.0],
                    [200.0, -200.0],
                    [200.0, 200.0],
                    [-200.0, 100.0]
                ], true));

	var _WireMesh = proto.addMeshInstance(proto.makeWireFrame([
                -100.0, -100.0,
                100.0, -100.0,
                100.0, 100.0,

                -100.0, -100.0,
                100.0, 100.0,
                -100.0, 100.0
            ], 2));

	var _Tri = proto.addMeshInstance(proto.makeMesh(Triangle, 20, 50));
	_Tri.x = 400;

	var _Circle = proto.addMeshInstance(proto.makeMesh(Circle, 50, 22));
	_Circle.x = -400;

	function _Advance(elapsed)
	{
		_Line.rotation += elapsed;
		_Tri.rotation += elapsed;
		_Rect.rotation += elapsed;
		_Circle.rotation += elapsed/2;

		var a = _Tri.rotation;
		_Tri.position = [Math.cos(a) * 300, Math.sin(a) * 300];

		if(_AlignToTriangle)
		{
			proto.alignViewTo(_Tri);
		}
	}

	_This.advance = _Advance;

	Object.defineProperties(this, 
	{
		viewToTriangle:
		{
			get: function()
			{
				return _AlignToTriangle;
			},
			set: function(is)
			{
				_AlignToTriangle = is;
				if(!is)
				{
					proto.alignViewTo(null);
				}
			}
		}
	});
	var gui = new dat.GUI();
	gui.add(_This, "viewToTriangle")
}