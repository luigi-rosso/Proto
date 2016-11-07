var Circle = (function ()
{
	function Circle(s, radius, segments)
	{
		if(!segments)
		{
			segments = 12;
		}
		var inc = (Math.PI*2)/segments;
		var angle = 0;
		this.addVertex([0,0,0,0]);
		for(var i = 0; i < segments; i++)
		{
			var x = Math.cos(angle);
			var y = Math.sin(angle);

			this.addVertex([x*radius, y*radius, x, y]);
			angle += inc;

			var nextSeg = (i+1)%(segments)+1;
			this.addTri([0, i+1, nextSeg]);
		}
		this.update();
	}

	return Circle;
}());