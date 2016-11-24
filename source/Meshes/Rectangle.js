var Rectangle = (function ()
{
	function Rectangle(s, width, height)
	{
		var hWidth = width/2;
		var hHeight = height/2;
		this.set(
			[
				-hWidth, hHeight, 0, 0,
				hWidth, hHeight, 1, 0,
				hWidth, -hHeight, 1, 1,
				-hWidth, -hHeight, 0, 1
			],
			[
				2, 1, 0,
				0, 3, 2
			]);
	}

	return Rectangle;
}());