var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;

var mainContext = Engine.createContext();
var beadResolution = 20;
var beadCollector = [];
var spacing = 2;

//RANDOM COLOR
		function getRandomColor() {
		  var letters = '0123456789ABCDEF'.split('');
		  var color = '#';
		  for (var i = 0; i < 6; i++ ) {
		    color += letters[Math.floor(Math.random() * 16)];
		  }
		  return color;
		}

var rows = 20;
var columns = 20;

//MATRIX
	for(j = 0; j < rows; j++) { 
		//ROW
		row =  j * (beadResolution * spacing)
		var beadCollectorColumn = [];
		//COLUMNS
		for(i = 0; i < columns; i++) {
			//SURFACE
				var Bead = new Surface({
					size: [beadResolution, beadResolution],
					properties: {
						backgroundColor: getRandomColor(),
						borderRadius: '100%'
					}
				})
			//MODIFIER
				var beadmodifier = new Modifier({
					align: [1/4, 0.01],
					transform: Transform.translate( i* (beadResolution * spacing), row) 
				});

				Bead.on('mouseover', function() {
					this.setProperties({
						backgroundColor: 'black',
						boxShadow: '5px 5px 5px pink'
					});
				});

				mainContext.add(beadmodifier).add(Bead);
				beadCollectorColumn.push(Bead);
		};
		beadCollector.push(beadCollectorColumn);
	};

//STRAIGHT LINE FUNCTION
	function StraightLine(mode, a, b, c) {
		if(mode==="hor") { 
			//HORIZONTAL 
			line = [];
			for(i = b; i <= c; i++) {
				point = [a, i];
				line.push(point);
			}; 
			return line;
		}
		else if(mode==="ver") {
			//VERTICAL
			var y1 = a;
			var y2 = b;
			var x = c;

			line = [];
			for(i = y1; i <= y2; i++) {
				point = [i, x];
				line.push(point);
			}; 
			return line;
		}
	};
//STRAIGHT LINE FUNCTION 2
	function StraightLine2(mode, startingPoint, length) {
		array = [];
		for(var i = 0; i < length; i++) {
			if(mode === "hor") {
				array.push([ startingPoint[0], i]);
			}
			else if(mode === "ver") {
				array.push([ i, startingPoint[1] ]);
			}
		};
		return array;
	};

//DELETE LINE
	function DeleteLine(line) {
		console.log(line.length)
		length = line.length
		for(var j = 0; j < length; j++) {
			point = line[j];
			console.log(point[0]);
			beadCollector[ point[0] ][ point[1] ].render = function() { return null } 
		};
	};

	// DeleteLine(StraightLine('ver', 2, 10, 5));
	// DeleteLine(StraightLine('ver', 2, 10, 3))

//DRAW LINE FUNCTION 
	function DrawLine(line) {
		length = line.length
		for(var j = 0; j < length; j++) {
			point = line[j];
			beadCollector[ point[0] ][ point[1] ].setProperties({
				backgroundColor: 'black',
				boxShadow: '10px 5px 5px red'
			});
		};
	};

//LETTERS DB 
	var F = [
		DrawLine(StraightLine2("hor", [0, 0], 6)),
		DrawLine(StraightLine2("hor", [1, 0], 6)),

		DrawLine(StraightLine2("hor", [4, 0], 6)),
		DrawLine(StraightLine2("hor", [5, 0], 6)),

		DrawLine(StraightLine2("ver", [0, 0], 10)),
		DrawLine(StraightLine2("ver", [0, 1], 10)),
	]

	var A = [
		DrawLine(StraightLine2("hor", [0, 0], 6)),
		DrawLine(StraightLine2("hor", [1, 0], 6)),

		DrawLine(StraightLine2("hor", [4, 0], 6)),
		DrawLine(StraightLine2("hor", [5, 0], 6)),

		DrawLine(StraightLine2("ver", [0, 0], 10)),
		DrawLine(StraightLine2("ver", [0, 1], 10)),

		DrawLine(StraightLine2("ver", [0, 4], 10)),
		DrawLine(StraightLine2("ver", [0, 5], 10)),
	]

//BORDER

// --OUTPUT -- //
	function DrawLetter(letter) {
		for(i = 0; i < letter.length; i++)  {
			return letter[i]
		};
	};

	// DrawLetter(A);
























