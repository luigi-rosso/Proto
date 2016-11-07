var Triangle = (function ()
{
	function Triangle(s, width, height)
	{
		var hWidth = width/2;
		var hHeight = height/2;
		this.set(
			[
				0, hHeight, 0.5, 0,
				hWidth, -hHeight, 1, 1,
				-hWidth, -hHeight, 0, 1
			],
			[
				0, 1, 2
			]);
	}

	return Triangle;
}());