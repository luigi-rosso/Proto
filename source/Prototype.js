var Prototype = (function ()
{
	var _LowFrequencyAdvanceTime = 1/15*1000;

	function Prototype(logic, canvas)
	{
		var _Graphics = new Graphics(canvas);
		_Graphics.enableBlending();
		var _LastAdvanceTime = Date.now();
		var _ViewTransform = mat2d.create();
		var _MeshInstances = [];

		var _Translation = vec2.create();
		var _TranslationTarget = vec2.create();
		var _Scale = 1.0;
		var _ScaleTarget = 1.0;

		var _LastMouse = vec2.create();

		var _This = this;
		var _AdvanceTimeout;

		var _MinZoom = 0.15;
		var _MaxZoom = 12.0;
		var _OverrideViewTransform = null;
		var _ScreenScale = /*window.devicePixelRatio ||*/ 1.0;
		var _OverrideRenderPath = null;
		var _OverrideMouseDown = null;
		var _OverrideMouseUp = null;
		var _OverrideMouseWheel = null;
		var _OverrideMouseDrag = null;

		function _ZoomTo(x, y, scale)
		{
			var min = _MinZoom;
			var scale = Math.min(_MaxZoom, Math.max(min, scale));
			var previousScale = _ScaleTarget;
			_ScaleTarget = scale;

			var zoomDelta = _ScaleTarget/previousScale;

			var ox = x - _TranslationTarget[0];
			var oy = y - _TranslationTarget[1];

			var ox2 = ox*zoomDelta;
			var oy2 = oy*zoomDelta;

			_TranslationTarget[0] += ox-ox2;
			_TranslationTarget[1] += oy-oy2;
		}

		function _Advance()
		{
			var now = Date.now();
			var elapsed = (now - _LastAdvanceTime)/1000.0;
			_LastAdvanceTime = now;
			if(_Graphics.setSize(window.innerWidth, window.innerHeight))
			{
				_ScaleTarget = 1.0;
				_TranslationTarget[0] = _Translation[0] = _Graphics.viewportWidth/2.0;
				_TranslationTarget[1] = _Translation[1] = _Graphics.viewportHeight/2.0;
			}

			// Do view positioning.
			//if(!_OverrideViewTransform)
			{
				var ds = _ScaleTarget - _Scale;
				var dx = _TranslationTarget[0] - _Translation[0];
				var dy = _TranslationTarget[1] - _Translation[1];

				var factor = Math.min(1.0, elapsed*20.0);
				if(Math.abs(ds) > 0.00001)
				{
					ds *= factor;
				}
				if(Math.abs(dx) > 0.01)
				{
					dx *= factor;
				}
				if(Math.abs(dy) > 0.01)
				{
					dy *= factor;
				}
				
				_Scale += ds;
				_Translation[0] += dx;
				_Translation[1] += dy;

				_ViewTransform[0] = _Scale;
				_ViewTransform[3] = _Scale;
				_ViewTransform[4] = _Translation[0];
				_ViewTransform[5] = _Translation[1];
			}


			if(_Logic && _Logic.advance)
			{
				_Logic.advance(elapsed);
			}

			_Draw();

			_ScheduleAdvance();
		}

		function _Draw()
		{
			_Graphics.clear();
			if(_OverrideRenderPath)
			{
				_OverrideRenderPath(_Graphics);
			}
			else
			{
				for(var i = 0; i < _MeshInstances.length; i++)
				{
					var mi = _MeshInstances[i];
					if(mi.isHidden)
					{
						continue;
					}
					mi.draw(_Graphics, _OverrideViewTransform || _ViewTransform, _Scale);
				}
			}
		}

		function _ScheduleAdvance(proto)
		{
			clearTimeout(_AdvanceTimeout);
			if(document.hasFocus())
			{
				window.requestAnimationFrame(function()
					{
						_Advance(proto);
					});	
			}
			else
			{
				_AdvanceTimeout = setTimeout(function()
					{
						_Advance();
					}, _LowFrequencyAdvanceTime);
			}
		}

		window.addEventListener("focus", function()
		{
			_ScheduleAdvance();
		});

		canvas.addEventListener("contextmenu", function(e)
		{
			e.preventDefault();
		});

		function _MouseDragged(ev)
		{
			var dx = ev.clientX - _LastMouse[0];
			var dy = ev.clientY - _LastMouse[1];
			_LastMouse[0] = ev.clientX;
			_LastMouse[1] = ev.clientY;
			if(_OverrideMouseDrag)
			{
				_OverrideMouseDrag(ev, dx, dy, _DragButton);
			}
			else if(_DragButton == 2 || ev.metaKey)
			{
				_TranslationTarget[0] += dx;
				_TranslationTarget[1] -= dy;
			}
			else if(_DragInstance)
			{
				var v = _OverrideViewTransform || _ViewTransform;
				var toWorld = mat2d.invert(mat2d.create(), v);
				var screenMove = vec2.set(vec2.create(), dx, -dy);
				var worldMove = vec2.transformMat2(vec2.create(), screenMove, toWorld);
				var localMove = vec2.transformMat2(vec2.create(), worldMove, _DragInstance.inverseTransform);

				if(_DragInstance)
				{
					_DragInstance.onDrag(localMove);
				}
				else
				{
					_DragInstance.x += localMove[0];
					_DragInstance.y += localMove[1];
				}
			}
		}


		function _OnMouseWheel(ev)
		{
			if(_OverrideMouseWheel)
			{
				_OverrideMouseWheel(ev);
				return;
			}
			var scaleInc = (ev.wheelDeltaY/1000.0)*2;
			if(ev.ctrlKey)
			{
				scaleInc /= 15.0;
			}
			_ZoomTo(ev.x * _ScreenScale, _Graphics.viewportHeight - ev.y * _ScreenScale, _ScaleTarget+scaleInc);
			return true;
		}

		var _DragButton = 0;
		var _DragInstance = null;
		canvas.addEventListener("mousewheel", _OnMouseWheel);
		canvas.addEventListener("mousedown", function(e)
		{
			_DragInstance = null;
			if(_OverrideMouseDown)
			{
				_OverrideMouseDown(ev);
			}
			e.preventDefault();
			_DragButton = e.button;
			//if(e.button === 2)
			{
				_LastMouse[0] = e.clientX;
				_LastMouse[1] = e.clientY;
				canvas.addEventListener("mousemove", _MouseDragged, true);
			}
			if(e.button === 0)
			{
				var temp = vec2.create();
				var x = e.clientX;
				var y = _Graphics.viewportHeight-e.clientY;
				temp[0] = x;
				temp[1] = y;

				// get it to view space.
				var v = _OverrideViewTransform || _ViewTransform;
				var toWorld = mat2d.invert(mat2d.create(), v);
				vec2.transformMat2d(temp, temp, toWorld);

				x = temp[0];
				y = temp[1];

				for(var i = 0; i < _MeshInstances.length; i++)
				{
					var mi = _MeshInstances[i];
					if(mi.canDrag)
					{
						var inv = mi.inverseTransform;
						temp[0] = x;
						temp[1] = y;
						vec2.transformMat2d(temp, temp, inv);
						
						if(mi.mesh.checkHit(temp[0], temp[1]))
						{
							_DragInstance = mi;	
						}
					}
				}
			}
		}, true);

		canvas.addEventListener("mouseup", function(e)
		{
			if(_OverrideMouseUp)
			{
				_OverrideMouseUp(ev);
			}
			e.preventDefault();
			canvas.removeEventListener("mousemove", _MouseDragged, true);

		}, true);

		this.addMeshInstance = function(mesh)
		{
			if(mesh.constructor === Float32Array)
			{
				if(mesh.isLine)
				{
					var m = new LineInstance(mesh);
					_MeshInstances.push(m);
					return m;
				}
				else
				{
					var m = new WireFrameInstance(mesh);
					_MeshInstances.push(m);
					return m;
				}
			}
			var m = new MeshInstance(mesh);
			_MeshInstances.push(m);
			return m;
		};

		this.removeMeshInstance = function(instance)
		{
			var idx = _MeshInstances.indexOf(instance);
			if(idx !== -1)
			{
				_MeshInstances.splice(idx, 1);
			}
		};

		this.makeMesh = function(generator)
		{
			var m = new Mesh(_Graphics);
			if(generator)
			{
				generator.apply(m, arguments);
			}
			return m;
		};

		this.makeLine = _Graphics.makeLine;
		this.makeWireFrame = _Graphics.makeWireFrame;

		this.setViewTransform = function(vt)
		{
			_OverrideViewTransform = vt;
		};

		this.alignViewTo = function (geometryInstance)
		{
			if(geometryInstance)
			{
				_OverrideViewTransform = mat2d.invert(mat2d.create(), geometryInstance.transform);
				mat2d.multiply(_OverrideViewTransform, mat2d.fromScaling(mat2d.create(), [_Scale, _Scale]), _OverrideViewTransform);
				mat2d.multiply(_OverrideViewTransform, mat2d.fromTranslation(mat2d.create(), [canvas.width/2, canvas.height/2]), _OverrideViewTransform);
			}
			else
			{
				_OverrideViewTransform = null;
			}
		};

		this.isViewOverridden = function()
		{
			return _OverrideViewTransform != null;
		};

		this.addRenderer = function(renderer)
		{
			_Graphics.initRenderer(renderer);
		};

		this.useCustomRenderPath = function(path)
		{
			_OverrideRenderPath = path;
		};

		this.overrideMouseDown = function(md)
		{
			_OverrideMouseDown = md;
		};

		this.overrideMouseUp = function(md)
		{
			_OverrideMouseUp = md;
		};

		this.overrideMouseWheel = function(md)
		{
			_OverrideMouseWheel = md;
		};

		this.overrideMouseDrag = function(md)
		{
			_OverrideMouseDrag = md;
		};


		Object.defineProperties(this, 
		{
			viewTransform:
			{
				get: function()
				{
					return _OverrideViewTransform || _ViewTransform;
				}
			},
			graphics:
			{
				get: function()
				{
					return _Graphics;
				}
			},
			scale:
			{
				get: function()
				{
					return _Scale;
				},
				set: function(is)
				{
					_Scale = is;
				}
			},
			width:
			{
				get: function()
				{
					return canvas.width;
				}
			},
			height:
			{
				get: function()
				{
					return canvas.height;
				}
			}
		});

		var _Logic = new logic(this);
		_ScheduleAdvance();
		_Advance();
	}

	return Prototype;
}());