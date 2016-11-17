var Graphics = (function()
{
	function Graphics(canvas)
	{
		var _This = this;
		var contextOptions = {
			premultipliedAlpha: false,
			preserveDrawingBuffer: true
		};

		var _GL = canvas.getContext("webgl", contextOptions) || canvas.getContext("experimental-webgl", contextOptions);

		_GL.getExtension("OES_standard_derivatives");

		var _Projection = mat4.create();
		var _Transform = mat4.create();
		var _ViewTransform = mat4.create();
		var _ColorBuffer = new Float32Array(4);
		var _ViewportWidth = 0;
		var _ViewportHeight = 0;
		var _BlendMode = null;

		function _SetSize(width, height)
		{
			// Check if the canvas is not the same size.
			if (canvas.width != width || canvas.height != height)
			{
				// Make the canvas the same size
				canvas.width = width;
				canvas.height = height;

				_ViewportWidth = width;
				_ViewportHeight = height;
				mat4.ortho(_Projection, 0, _ViewportWidth, 0, _ViewportHeight, 0, 1);
				_GL.viewport(0, 0, _ViewportWidth, _ViewportHeight);
				return true;
			}
			return false;
		}

		function _Clear()
		{
			//_GL.clearColor(0.0, 0.0, 0.0, 1.0);
			_GL.clearColor(0.222, 0.222, 0.222, 1.0);
			//_GL.clearColor(0.3628, 0.3628, 0.3628, 1.0);
			_GL.clear(_GL.COLOR_BUFFER_BIT | _GL.DEPTH_BUFFER_BIT);
			_GL.enable(_GL.CULL_FACE);
        	_GL.frontFace(_GL.CW);
		}

		function _DeleteTexture(tex)
		{
			_GL.deleteTexture(tex);
		}

		function _LoadTexture(blob)
		{
			var tex = _GL.createTexture();
			tex.ready = false;

			_GL.bindTexture(_GL.TEXTURE_2D, tex);
			_GL.texImage2D(_GL.TEXTURE_2D, 0, _GL.RGBA, 1, 1, 0, _GL.RGBA, _GL.UNSIGNED_BYTE, null);
			_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_MAG_FILTER, _GL.LINEAR);
			_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_MIN_FILTER, _GL.LINEAR);
			_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_WRAP_S, _GL.CLAMP_TO_EDGE);
			_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_WRAP_T, _GL.CLAMP_TO_EDGE);
			_GL.bindTexture(_GL.TEXTURE_2D, null);
			_GL.pixelStorei(_GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
			if(blob.constructor !== Blob)
			{
				_GL.bindTexture(_GL.TEXTURE_2D, tex);
				_GL.texImage2D(_GL.TEXTURE_2D, 0, _GL.RGBA, _GL.RGBA, _GL.UNSIGNED_BYTE, blob.img);
				_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_MAG_FILTER, _GL.LINEAR);
				_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_MIN_FILTER, _GL.LINEAR_MIPMAP_NEAREST);
				_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_WRAP_S, _GL.CLAMP_TO_EDGE);
				_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_WRAP_T, _GL.CLAMP_TO_EDGE);
				_GL.generateMipmap(_GL.TEXTURE_2D);
				_GL.bindTexture(_GL.TEXTURE_2D, null);

				tex.ready = true;
			}
			else
			{
				var reader = new FileReader();
				reader.onload = function(e)
				{
					var img = new Image();
					img.src = e.target.result;
					img.onload = function()
					{
						_GL.bindTexture(_GL.TEXTURE_2D, tex);
						_GL.texImage2D(_GL.TEXTURE_2D, 0, _GL.RGBA, _GL.RGBA, _GL.UNSIGNED_BYTE, this);
						_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_MAG_FILTER, _GL.LINEAR);
						_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_MIN_FILTER, _GL.LINEAR_MIPMAP_NEAREST);
						_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_WRAP_S, _GL.CLAMP_TO_EDGE);
						_GL.texParameteri(_GL.TEXTURE_2D, _GL.TEXTURE_WRAP_T, _GL.CLAMP_TO_EDGE);
						_GL.generateMipmap(_GL.TEXTURE_2D);
						_GL.bindTexture(_GL.TEXTURE_2D, null);

						tex.ready = true;
					};
				};
				reader.readAsDataURL(blob);
			}

			return tex;
		}

		function _Bind(shader, buffer, buffer2)
		{
			var boundBuffer = _GL.getParameter(_GL.ARRAY_BUFFER_BINDING);
			var boundShader = _GL.getParameter(_GL.CURRENT_PROGRAM);

			// May need to revisit this based on buffer2
			if (boundShader === shader && boundBuffer === buffer)
			{
				return;
			}

			// Disable anything necessary for the old shader.
			if (boundShader)
			{
				var attribCount = _GL.getProgramParameter(boundShader, _GL.ACTIVE_ATTRIBUTES);
				for (var i = 1; i < attribCount; i++)
				{
					_GL.disableVertexAttribArray(i);
				}
			}

			if (shader == null)
			{
				_GL.useProgram(null);
				return;
			}

			// Bind the new one.
			_GL.useProgram(shader.program);

			// Assume the user knows what they are doing, binding a secondary set of attribs from another buffer.
			if (buffer2)
			{
				_GL.bindBuffer(_GL.ARRAY_BUFFER, buffer2);

				var atts = shader.attributes2;
				for (var a in atts)
				{
					var at = atts[a];

					if (at.index != -1)
					{
						_GL.enableVertexAttribArray(at.index);
						_GL.vertexAttribPointer(at.index, at.size, _GL.FLOAT, false, at.stride, at.offset);
					}
				}
			}

			_GL.bindBuffer(_GL.ARRAY_BUFFER, buffer);

			var atts = shader.attributes;
			for (var a in atts)
			{
				var at = atts[a];

				if (at.index != -1)
				{
					_GL.enableVertexAttribArray(at.index);
					_GL.vertexAttribPointer(at.index, at.size, _GL.FLOAT, false, at.stride, at.offset);
				}
			}
		};

		function _DisableBlending()
		{
			if (_BlendMode === 0)
			{
				return;
			}
			_BlendMode = 0;
			_GL.disable(_GL.BLEND);
		};

		function _EnableBlending()
		{
			if (_BlendMode === 1)
			{
				return;
			}
			_BlendMode = 1;
			_GL.enable(_GL.BLEND);
			//_GL.blendFuncSeparate(_GL.SRC_ALPHA, _GL.ONE_MINUS_SRC_ALPHA, _GL.ONE, _GL.ONE_MINUS_SRC_ALPHA);
			_GL.blendFunc(_GL.ONE, _GL.ONE_MINUS_SRC_ALPHA);
		};

		function _EnableScreenBlending()
		{
			if (_BlendMode === 2)
			{
				return;
			}
			_BlendMode = 2;
			_GL.enable(_GL.BLEND);
			_GL.blendFuncSeparate(_GL.ONE, _GL.ONE_MINUS_SRC_COLOR, _GL.ONE, _GL.ONE_MINUS_SRC_ALPHA);
		};

		function _EnableMultiplyBlending()
		{
			if (_BlendMode === 3)
			{
				return;
			}
			_BlendMode = 3;
			_GL.enable(_GL.BLEND);
			_GL.blendFuncSeparate(_GL.DST_COLOR, _GL.ONE_MINUS_SRC_ALPHA, _GL.DST_ALPHA, _GL.ONE_MINUS_SRC_ALPHA);
		};

		function _EnablePremultipliedBlending()
		{
			if (_BlendMode === 4)
			{
				return;
			}
			_BlendMode = 4;
			_GL.enable(_GL.BLEND);
			_GL.blendFuncSeparate(_GL.ONE, _GL.ONE_MINUS_SRC_ALPHA, _GL.ONE, _GL.ONE_MINUS_SRC_ALPHA);
		};

		function _EnableAdditiveBlending()
		{
			if (_BlendMode === 5)
			{
				return;
			}
			_BlendMode = 5;
			_GL.enable(_GL.BLEND);
			//_GL.blendFuncSeparate(_GL.ONE, _GL.ONE, _GL.ONE, _GL.ONE);
			_GL.blendFunc(_GL.ONE, _GL.ONE);
		};

		function VertexBuffer(id)
		{
			var _Size = 0;
			this.update = function(data)
			{
				_GL.bindBuffer(_GL.ARRAY_BUFFER, id);
				_GL.bufferData(_GL.ARRAY_BUFFER, data instanceof Float32Array ? data : new Float32Array(data), _GL.DYNAMIC_DRAW);

				_Size = data.length;
			};

			this.__defineGetter__("id", function()
			{
				return id;
			});

			this.__defineGetter__("size", function()
			{
				return _Size;
			});

			this.dispose = function()
			{
				_GL.deleteBuffer(id);
			};
		}

		function _MakeVertexBuffer(data)
		{
			var buffer = _GL.createBuffer();
			var vtxBuffer = new VertexBuffer(buffer);
			if (data)
			{
				vtxBuffer.update(data);
			}

			return vtxBuffer;
		}

		function IndexBuffer(id)
		{
			var _Size = 0;

			this.update = function(data)
			{
				_GL.bindBuffer(_GL.ELEMENT_ARRAY_BUFFER, id);
				_GL.bufferData(_GL.ELEMENT_ARRAY_BUFFER, data instanceof Uint16Array ? data : new Uint16Array(data), _GL.DYNAMIC_DRAW);

				_Size = data.length;
			};

			this.__defineGetter__("id", function()
			{
				return id;
			});

			this.__defineGetter__("size", function()
			{
				return _Size;
			});

			this.dispose = function()
			{
				_GL.deleteBuffer(id);
			};
		}

		function _MakeIndexBuffer(data)
		{
			var buffer = _GL.createBuffer();
			var indexBuffer = new IndexBuffer(buffer);
			if (data)
			{
				indexBuffer.update(data);
			}

			return indexBuffer;
		}

		function _InitializeShader(s)
		{
			if (!(s.fragment = _GetShader(s.fragment, ".fs")))
			{
				return null;
			}
			if (!(s.vertex = _GetShader(s.vertex, ".vs")))
			{
				return null;
			}
			s.program = _GL.createProgram();

			_GL.attachShader(s.program, s.vertex);
			_GL.attachShader(s.program, s.fragment);
			_GL.linkProgram(s.program);

			if (!_GL.getProgramParameter(s.program, _GL.LINK_STATUS))
			{
				console.log("Could not link shader", s.name, _GL.getProgramInfoLog(s.program));
			}
			else
			{
				_GL.useProgram(s.program);

				for (var a in s.attributes)
				{
					if ((s.attributes[a].index = _GL.getAttribLocation(s.program, s.attributes[a].name)) == -1)
					{
						console.log("Could not find attribute", s.attributes[a].name, "for shader", s.name);
					}
				}
				if (s.attributes2)
				{
					for (var a in s.attributes2)
					{
						if ((s.attributes2[a].index = _GL.getAttribLocation(s.program, s.attributes2[a].name)) == -1)
						{
							console.log("Could not find attribute", s.attributes2[a].name, "for shader", s.name);
						}
					}
				}
				for (var u in s.uniforms)
				{
					var name = s.uniforms[u];
					if ((s.uniforms[u] = _GL.getUniformLocation(s.program, name)) == null)
					{
						console.log("Could not find uniform", name, "for shader", s.name);
					}
				}
			}

			return s;
		};

		var _LineA = vec2.create();
		var _LineB = vec2.create();
		var _Tangent = vec2.create();
		var _Miter = vec2.create();
		var _Tmp = vec2.create();

		function _Normal(out, direction)
		{
			vec2.set(out, -direction[1], direction[0]);
			return out;
		}

		function _Add(out, position, normal, length)
		{
			out.push(	position[0], position[1], normal[0], normal[1], length,
						position[0], position[1], normal[0], normal[1], -length);
		}

		function _Direction(out, a, b)
		{
			vec2.subtract(out, a, b);
			vec2.normalize(out, out);
			return out;
		}

		function _ComputeMiter(tangent, miter, lineA, lineB, halfThickness)
		{
			vec2.add(tangent, lineA, lineB);
			vec2.normalize(tangent, tangent);

			vec2.set(miter, -tangent[1], tangent[0]);
			vec2.set(_Tmp, -lineA[1], lineA[0]);

			return halfThickness / vec2.dot(miter, _Tmp);
		}

		function _MakeLine(points, isClosed)
		{
			var currentNormal;
			var output = [];
			if(isClosed)
			{
				points = points.slice();
				points.push(points[0]);
			}

			var numPoints = points.length;
			for(var i = 1; i < numPoints; i++)
			{
				var previousPoint = points[i-1];
				var currentPoint = points[i];
				var nextPoint = i < numPoints-1 ? points[i+1] : null;

				vec2.subtract(_LineA, currentPoint, previousPoint);
				vec2.normalize(_LineA, _LineA);
				if(!currentNormal)
				{
					currentNormal = vec2.create();
					_Normal(currentNormal, _LineA);
				}

				if(i === 1)
				{
					_Add(output, previousPoint, currentNormal, 1.0);
				}

				if(!nextPoint)
				{
					_Normal(currentNormal, _LineA);
					_Add(output, currentPoint, currentNormal, 1.0);
				}
				else
				{
					_Direction(_LineB, nextPoint, currentPoint);
					var miterLength = _ComputeMiter(_Tangent, _Miter, _LineA, _LineB, 1.0);
					_Add(output, currentPoint, _Miter, miterLength);
				}
			}

			if(points.length > 2 && isClosed)
			{
				var last2 = points[numPoints-2];
				var cur2 = points[0];
				var next2 = points[1];

				_Direction(_LineA, cur2, last2);
				_Direction(_LineB, next2, cur2);
				_Normal(currentNormal, _LineA);

				var miterLen2 = _ComputeMiter(_Tangent, _Miter, _LineA, _LineB, 1);

				var last = (numPoints-1) * 5 * 2;

				output[last + 2] = output[2] = output[last + 2 + 5] = output[2 + 5] = _Miter[0];
				output[last + 3] = output[3] = output[last + 3 + 5] = output[3 + 5] = _Miter[1];
				output[last + 4] = output[4] = miterLen2;
				output[last + 4 + 5] = output[4 + 5] = -miterLen2;
			}

			var r = new Float32Array(output);
			r.isLine = true;
			return r;
		}

		function _MakeWireFrame(buffer, components, stride, offset)
		{
			if(!components)
			{
				components = 3;
			}
			if(!offset)
			{
				offset = 0;
			}
			if(!stride)
			{
				stride = components;
			}

			var output = [];

			var triangleCount = buffer.length/stride/3;
			var index = offset;

			var barycentricCoords =
			[
				[1,0,0],
				[0,1,0],
				[0,0,1]
			];
			for(var i = 0; i < triangleCount; i++)
			{
				for(var v = 0; v < 3; v++)
				{
					var j;
					for(j = 0; j < components; j++)
					{
						output.push(buffer[index+j]);
					}
					while(j < 3)
					{
						output.push(0.0);
						j++;
					}
					var bc = barycentricCoords[v];
					output.push(bc[0], bc[1], bc[2]);

					index += stride;
				}
			}

			return new Float32Array(output);
		}

		function _GetShader(id, ext)
		{
			var s = _CompiledShaders[id];
			if (s)
			{
				return s;
			}

			var shader = null;

			var shaderScript = _ShaderSources[id] || id;
			if (shaderScript)
			{
				if (id.indexOf(".fs") == id.length - 3 || ext === ".fs")
				{
					shader = _GL.createShader(_GL.FRAGMENT_SHADER);
				}
				else if (id.indexOf(".vs") == id.length - 3 || ext === ".vs")
				{
					shader = _GL.createShader(_GL.VERTEX_SHADER);
				}

				_GL.shaderSource(shader, shaderScript);
				_GL.compileShader(shader);

				if (!_GL.getShaderParameter(shader, _GL.COMPILE_STATUS))
				{
					console.log("Failed to compile", id, _GL.getShaderInfoLog(shader));
					return null;
				}
				_CompiledShaders[id] = shader;
			}
			return shader;
		};

		var _CompiledShaders = {};
		var _ShaderSources = {
			"Textured.vs": "attribute vec2 VertexPosition; attribute vec2 VertexTexCoord; uniform mat4 ProjectionMatrix; uniform mat4 WorldMatrix; uniform mat4 ViewMatrix; varying vec2 TexCoord; void main(void) {TexCoord = VertexTexCoord; vec4 pos = ViewMatrix * WorldMatrix * vec4(VertexPosition.x, VertexPosition.y, 0.0, 1.0); gl_Position = ProjectionMatrix * vec4(pos.xyz, 1.0); }",
			"Textured.fs": "#ifdef GL_ES \nprecision highp float;\n #endif\n uniform vec4 Color; uniform float Opacity; uniform sampler2D TextureSampler; varying vec2 TexCoord; void main(void) {vec4 color = texture2D(TextureSampler, TexCoord) * Color; color.a *= Opacity; gl_FragColor = color; }",
			"Color.fs": "#ifdef GL_ES \nprecision highp float;\n #endif\n uniform vec4 Color; uniform float Opacity; varying vec2 TexCoord; void main(void) {vec4 color = Color; color.a *= Opacity; gl_FragColor = color; }",
			"Line.vs":"attribute vec2 position;attribute vec2 normal;attribute float miter; uniform mat4 projection;uniform mat4 modelView;uniform float thickness;varying float edge;varying float inner2;void main(){  edge = sign(miter);  inner2 = (thickness - 3.0)/thickness;  vec2 pointPos = position.xy + vec2(normal * thickness/2.0 * miter);  gl_Position = projection * modelView * vec4(pointPos, 0.0, 1.0);}",
			"Line.fs":"#ifdef GL_ES \nprecision highp float;\n#endif\n uniform vec4 color;varying float edge;varying float inner2;void main(){  float v = abs(edge);  v = smoothstep(inner2, 1.0, v);   gl_FragColor = mix(color, vec4(color.xyz, 0.0), v);}",
			"Wireframe.vs":"attribute vec3 position;attribute vec3 barycentric;uniform mat4 projection;uniform mat4 modelView;varying vec3 bc;void main(){  bc = barycentric;  gl_Position = projection * modelView * vec4(position, 1.0);}",
			"Wireframe.fs":"#ifdef GL_ES\nprecision highp float;\n#endif\n#extension GL_OES_standard_derivatives : enable\nuniform vec4 edgeColor;uniform vec4 innerColor;uniform float thickness;varying vec3 bc;void main(){	vec3 d = fwidth(bc);	vec3 a3 = smoothstep(vec3(0.0), d*thickness, bc);	float edgeFactor = min(min(a3.x, a3.y), a3.z);	gl_FragColor = mix(edgeColor, innerColor, edgeFactor);}"
		};

		var _TexturedShader = _InitializeShader(
		{
			name: "TexturedShader",

			vertex: "Textured.vs",
			fragment: "Textured.fs",

			attributes:
			{
				VertexPosition:
				{
					name: "VertexPosition",
					size: 2,
					stride: 16,
					offset: 0
				},
				VertexNormal:
				{
					name: "VertexTexCoord",
					size: 2,
					stride: 16,
					offset: 8
				}
			},

			uniforms:
			{
				ProjectionMatrix: "ProjectionMatrix",
				ViewMatrix: "ViewMatrix",
				WorldMatrix: "WorldMatrix",
				TextureSampler: "TextureSampler",
				Opacity: "Opacity",
				Color: "Color"
			}
		});

		var _ColorShader = _InitializeShader(
		{
			name: "ColoredShader",

			vertex: "Textured.vs",
			fragment: "Color.fs",

			attributes:
			{
				VertexPosition:
				{
					name: "VertexPosition",
					size: 2,
					stride: 16,
					offset: 0
				},
				VertexNormal:
				{
					name: "VertexTexCoord",
					size: 2,
					stride: 16,
					offset: 8
				}
			},

			uniforms:
			{
				ProjectionMatrix: "ProjectionMatrix",
				ViewMatrix: "ViewMatrix",
				WorldMatrix: "WorldMatrix",
				Opacity: "Opacity",
				Color: "Color"
			}
		});
		
		var _LineShader = _InitializeShader(
		{
			name: "LineShader",

			vertex: "Line.vs",
			fragment: "Line.fs",

			attributes:
			{
				VertexPosition:
				{
					name: "position",
					size: 2,
					stride: 20,
					offset: 0
				},
				VertexNormal:
				{
					name: "normal",
					size: 2,
					stride: 20,
					offset: 8
				},
				Miter:
				{
					name: "miter",
					size: 1,
					stride: 20,
					offset: 16
				}
			},

			uniforms:
			{
				ProjectionMatrix: "projection",
				ModelView: "modelView",
				Thickness: "thickness",
				Color: "color"
			}
		});

		var _WireFrameShader = _InitializeShader(
		{
			name: "WireFrameShader",

			vertex: "Wireframe.vs",
			fragment: "Wireframe.fs",

			attributes:
			{
				VertexPosition:
				{
					name: "position",
					size: 3,
					stride: 24,
					offset: 0
				},
				VertexBarycentric:
				{
					name: "barycentric",
					size: 3,
					stride: 24,
					offset: 12
				}
			},

			uniforms:
			{
				ProjectionMatrix: "projection",
				ModelView: "modelView",
				Thickness: "thickness",
				EdgeColor: "edgeColor",
				InnerColor: "innerColor"
			}
		});

		function _DrawTextured(view, transform, vertexBuffer, indexBuffer, opacity, color, tex)
		{
			_ViewTransform[0] = view[0];
			_ViewTransform[1] = view[1];
			_ViewTransform[4] = view[2];
			_ViewTransform[5] = view[3];
			_ViewTransform[12] = view[4];
			_ViewTransform[13] = view[5];

			_Transform[0] = transform[0];
			_Transform[1] = transform[1];
			_Transform[4] = transform[2];
			_Transform[5] = transform[3];
			_Transform[12] = transform[4];
			_Transform[13] = transform[5];

			_Bind(_TexturedShader, vertexBuffer.id);

			for (var i = 0; i < 4; i++) _ColorBuffer[i] = color[i];

			var uniforms = _TexturedShader.uniforms;
			_GL.uniform1f(uniforms.Opacity, opacity);
			_GL.uniform4fv(uniforms.Color, _ColorBuffer);

			_GL.uniformMatrix4fv(uniforms.WorldMatrix, false, _Transform);
			_GL.uniformMatrix4fv(uniforms.ViewMatrix, false, _ViewTransform);
			_GL.uniformMatrix4fv(uniforms.ProjectionMatrix, false, _Projection);

			_GL.activeTexture(_GL.TEXTURE0);
			_GL.bindTexture(_GL.TEXTURE_2D, tex);
			_GL.uniform1i(uniforms.TextureSampler, 0);

			_GL.bindBuffer(_GL.ELEMENT_ARRAY_BUFFER, indexBuffer.id);
			_GL.drawElements(_GL.TRIANGLES, indexBuffer.size, _GL.UNSIGNED_SHORT, 0);
		};

		function _DrawColored(view, transform, vertexBuffer, indexBuffer, opacity, color)
		{
			_ViewTransform[0] = view[0];
			_ViewTransform[1] = view[1];
			_ViewTransform[4] = view[2];
			_ViewTransform[5] = view[3];
			_ViewTransform[12] = view[4];
			_ViewTransform[13] = view[5];

			_Transform[0] = transform[0];
			_Transform[1] = transform[1];
			_Transform[4] = transform[2];
			_Transform[5] = transform[3];
			_Transform[12] = transform[4];
			_Transform[13] = transform[5];

			_Bind(_ColorShader, vertexBuffer.id);

			for (var i = 0; i < 4; i++) _ColorBuffer[i] = color[i];

			var uniforms = _ColorShader.uniforms;
			_GL.uniform1f(uniforms.Opacity, opacity);
			_GL.uniform4fv(uniforms.Color, _ColorBuffer);

			_GL.uniformMatrix4fv(uniforms.WorldMatrix, false, _Transform);
			_GL.uniformMatrix4fv(uniforms.ViewMatrix, false, _ViewTransform);
			_GL.uniformMatrix4fv(uniforms.ProjectionMatrix, false, _Projection);

			_GL.bindBuffer(_GL.ELEMENT_ARRAY_BUFFER, indexBuffer.id);
			_GL.drawElements(_GL.TRIANGLES, indexBuffer.size, _GL.UNSIGNED_SHORT, 0);
		};

		var _LineBuffer = _MakeVertexBuffer();
		function _DrawLine(view, transform, line, thickness, opacity, color)
		{
			_GL.frontFace(_GL.CCW);
			view = mat2d.mul(mat2d.create(), transform, view);
			_LineBuffer.update(line);

			_ViewTransform[0] = view[0];
			_ViewTransform[1] = view[1];
			_ViewTransform[4] = view[2];
			_ViewTransform[5] = view[3];
			_ViewTransform[12] = view[4];
			_ViewTransform[13] = view[5];

			_Bind(_LineShader, _LineBuffer.id);

			for (var i = 0; i < 4; i++) _ColorBuffer[i] = color[i];

			var uniforms = _LineShader.uniforms;
			_GL.uniform4fv(uniforms.Color, _ColorBuffer);
			_GL.uniform1f(uniforms.Thickness, thickness);
			_GL.uniformMatrix4fv(uniforms.ModelView, false, _ViewTransform);
			_GL.uniformMatrix4fv(uniforms.ProjectionMatrix, false, _Projection);

			_GL.drawArrays(_GL.TRIANGLE_STRIP, 0, line.length/5);
			_GL.frontFace(_GL.CW);
		}

		var _MeshBuffer = _MakeVertexBuffer();
		var _SecondaryColorBuffer = new Float32Array(4);
		function _DrawWireFrame(view, transform, mesh, thickness, edgeColor, innerColor)
		{
			view = mat2d.mul(mat2d.create(), transform, view);
			_MeshBuffer.update(mesh);

			_ViewTransform[0] = view[0];
			_ViewTransform[1] = view[1];
			_ViewTransform[4] = view[2];
			_ViewTransform[5] = view[3];
			_ViewTransform[12] = view[4];
			_ViewTransform[13] = view[5];

			_Bind(_WireFrameShader, _MeshBuffer.id);

			for (var i = 0; i < 4; i++) _ColorBuffer[i] = edgeColor[i];
			for (var i = 0; i < 4; i++) _SecondaryColorBuffer[i] = innerColor[i];

			var uniforms = _WireFrameShader.uniforms;
			_GL.uniform4fv(uniforms.EdgeColor, _ColorBuffer);
			_GL.uniform4fv(uniforms.InnerColor, _SecondaryColorBuffer);

			_GL.uniform1f(uniforms.Thickness, thickness);
			_GL.uniformMatrix4fv(uniforms.ModelView, false, _ViewTransform);
			_GL.uniformMatrix4fv(uniforms.ProjectionMatrix, false, _Projection);

			_GL.drawArrays(_GL.TRIANGLES, 0, mesh.length/6);
		}

		function _EnableDepthTest(enable)
		{
			if(enable)
			{	
				_GL.enable(_GL.DEPTH_TEST);
				_GL.depthFunc(_GL.LEQUAL);
			}
			else
			{
				_GL.disable(_GL.DEPTH_TEST);
			}
		}

		function _EnableDepthWrite(enable)
		{
			_GL.depthMask(enable);
		}

		this.loadTexture = _LoadTexture;
		this.deleteTexture = _DeleteTexture;
		this.setSize = _SetSize;
		this.disableBlending = _DisableBlending;
		this.enableBlending = _EnableBlending;
		this.enablePremultipliedBlending = _EnablePremultipliedBlending;
		this.enableAdditiveBlending = _EnableAdditiveBlending;
		this.enableScreenBlending = _EnableScreenBlending;
		this.enableMultiplyBlending = _EnableMultiplyBlending;
		this.clear = _Clear;
		this.makeVertexBuffer = _MakeVertexBuffer;
		this.makeIndexBuffer = _MakeIndexBuffer;
		this.makeLine = _MakeLine;
		this.makeWireFrame = _MakeWireFrame;
		this.drawTextured = _DrawTextured;
		this.drawColored = _DrawColored;
		this.drawLine = _DrawLine;
		this.drawWireFrame = _DrawWireFrame;
		this.enableDepthTest = _EnableDepthTest;
		this.enableDepthWrite = _EnableDepthWrite;
		this.getContext = function()
		{
			return _GL;
		};
		this.initializeShader = _InitializeShader;
		this.initRenderer = function(renderer)
		{
			var r = new renderer();
			r.initialize(_This);
		};
		this.bind = _Bind;

		this.__defineGetter__("viewportWidth", function()
		{
			return _ViewportWidth;
		});

		this.__defineGetter__("viewportHeight", function()
		{
			return _ViewportHeight;
		});
	}

	return Graphics;
}());