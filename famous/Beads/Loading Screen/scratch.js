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
				array.push([ startingPoint[0], startingPoint[1] + i]);
			}
			else if(mode === "ver") {
				array.push([ startingPoint[0] + i, startingPoint[1] ]);
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
				backgroundColor: 'blue',
				boxShadow: '10px 5px 5px red'
			});
		};
	};

// --OUTPUT -- //
	function Draw(border) {
		for(i = 0; i < border.length; i++) {
			// console.log(thing[i])
			DrawLine(border[i]);
		};
	};

//IMAGE DB
	//BORDER
		var Border1 = [
			StraightLine2("ver", [0, columns - 1], columns),
			StraightLine2("ver", [0, 0], columns),
			StraightLine2("hor", [0, 0], rows),
			StraightLine2("hor", [rows - 1, 0], rows),
		]

	//CAPITAL LETTERS DB
		var A = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 6),

			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 4], 10),
			StraightLine2("ver", [0, 5], 10),
		]

		var B = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 6),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),

			StraightLine2("ver", [0, 1], 10),
			StraightLine2("ver", [0, 4], 10),
			StraightLine2("ver", [0, 5], 10),
		]

		var C = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),

			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),
		]

		var D = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),


			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),

			StraightLine2("ver", [0, 1], 10),
			StraightLine2("ver", [0, 4], 10),
			StraightLine2("ver", [0, 5], 10),
		]

		var E = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 6),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),

			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),
		]

		var F = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 6),

			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),
		]

		var G = [
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 3], 3),
			StraightLine2("hor", [5, 3], 3),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),

			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [4, 4], 4),
			StraightLine2("ver", [4, 5], 4),
		]

		var H = [
			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 6),

			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 4], 10),
			StraightLine2("ver", [0, 5], 10),
		]

		var I = [
			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),

			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("ver", [0, 2], 10),
			StraightLine2("ver", [0, 3], 10),
		]

		var J = [
			StraightLine2("hor", [0, 1], 5),
			StraightLine2("hor", [1, 1], 5),

			StraightLine2("hor", [6, 0], 2),
			StraightLine2("hor", [7, 0], 2),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 1], 4),

			StraightLine2("ver", [0, 4], 10),
			StraightLine2("ver", [0, 5], 9),
		]

		var K = [
			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("hor", [0, 4], 2),
			StraightLine2("hor", [1, 4], 2),
			StraightLine2("hor", [2, 4], 2),

			StraightLine2("hor", [3, 3], 1),
			StraightLine2("hor", [4, 2], 1),
			StraightLine2("hor", [5, 2], 1),
			StraightLine2("hor", [6, 3], 1),
			StraightLine2("hor", [7, 4], 2),
			StraightLine2("hor", [8, 4], 2),
			StraightLine2("hor", [9, 4], 2),
		]

		var L = [
			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),
		]

		var M = [
			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 5], 10),
			StraightLine2("ver", [0, 6], 10),

			StraightLine2("hor", [4, 2], 1),
			StraightLine2("hor", [5, 3], 1),
			StraightLine2("hor", [4, 4], 1),
		]

		var N = [
			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 5], 10),
			StraightLine2("ver", [0, 6], 10),

			StraightLine2("hor", [2, 2], 1),

			StraightLine2("hor", [3, 2], 1),
			StraightLine2("hor", [3, 3], 1),

			StraightLine2("hor", [4, 2], 1),
			StraightLine2("hor", [4, 3], 1),
			StraightLine2("hor", [4, 4], 1),

			StraightLine2("hor", [5, 3], 1),
			StraightLine2("hor", [5, 4], 1),

			StraightLine2("hor", [6, 4], 1),
		]

		var O = [
			StraightLine2("ver", [1, 0], 8),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 5], 10),
			StraightLine2("ver", [1, 6], 8),

			StraightLine2("hor", [0, 1], 4),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 1], 4),
		]

		var P = [
			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 4], 5),
			StraightLine2("ver", [0, 5], 5),

			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 6),
		]

		var Q = []

		var R = [
			StraightLine2("ver", [0, 0], 10),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 4], 5),
			StraightLine2("ver", [0, 5], 4),

			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [4, 0], 6),
			StraightLine2("hor", [5, 0], 5),

			StraightLine2("hor", [6, 3], 1),
			StraightLine2("hor", [7, 4], 1),
			StraightLine2("hor", [8, 4], 2),
			StraightLine2("hor", [9, 4], 2),
		]

		var S = []
		var T = [ 
			StraightLine2("ver", [0, 2], 10),
			StraightLine2("ver", [0, 3], 10),

			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),
		]
		var U = [
			StraightLine2("ver", [0, 0], 9),
			StraightLine2("ver", [0, 1], 10),

			StraightLine2("ver", [0, 5], 10),
			StraightLine2("ver", [0, 6], 9),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 1], 4),
		]

		var V = [
			StraightLine2("hor", [1, 0], 2),
			StraightLine2("hor", [2, 0], 2),
			StraightLine2("hor", [3, 0], 2),
			StraightLine2("hor", [4, 0], 3),
			StraightLine2("hor", [5, 1], 2),
			StraightLine2("hor", [6, 1], 2),

			StraightLine2("hor", [7, 2], 3),
			StraightLine2("hor", [8, 2], 3),
			StraightLine2("hor", [9, 3], 1),

			StraightLine2("hor", [6, 4], 2),
			StraightLine2("hor", [5, 4], 2),
			StraightLine2("hor", [4, 4], 3),
			StraightLine2("hor", [3, 5], 2),
			StraightLine2("hor", [2, 5], 2),
			StraightLine2("hor", [1, 5], 2),
		]
		var W = [
			StraightLine2("hor", [0, 0], 1),	
			StraightLine2("hor", [1, 0], 2),
			StraightLine2("hor", [2, 0], 2),
			StraightLine2("hor", [3, 0], 2),
			StraightLine2("hor", [4, 0], 3),
			StraightLine2("hor", [5, 1], 2),
			StraightLine2("hor", [6, 1], 2),

			StraightLine2("hor", [7, 2], 3),
			StraightLine2("hor", [8, 2], 3),
			StraightLine2("hor", [9, 3], 1),

			StraightLine2("hor", [6, 4], 2),
			StraightLine2("hor", [5, 4], 5),
			StraightLine2("hor", [4, 4], 5),
			StraightLine2("hor", [3, 5], 3),
			StraightLine2("hor", [2, 5], 3),
			StraightLine2("hor", [1, 5], 3),

			StraightLine2("hor", [0, 6], 1),

			StraightLine2("hor", [6, 7], 2),		
			StraightLine2("hor", [7, 8], 3),	
			StraightLine2("hor", [8, 8], 3),	
			StraightLine2("hor", [9, 9], 1),

			StraightLine2("hor", [0, 12], 1),	
			StraightLine2("hor", [1, 11], 2),		
			StraightLine2("hor", [2, 11], 2),		
			StraightLine2("hor", [3, 11], 2),	
			StraightLine2("hor", [4, 10], 3),		
			StraightLine2("hor", [5, 10], 2),		
			StraightLine2("hor", [6, 10], 2),	
		]

		var X = [
			
		]



		var Y = []	
		
		var Z = [ 
			StraightLine2("hor", [0, 0], 6),
			StraightLine2("hor", [1, 0], 6),

			StraightLine2("hor", [2, 4], 2),

			StraightLine2("hor", [3, 4], 1),
			StraightLine2("hor", [4, 3], 1),
			StraightLine2("hor", [5, 2], 1),
			StraightLine2("hor", [6, 1], 1),

			StraightLine2("hor", [7, 0], 2),

			StraightLine2("hor", [8, 0], 6),
			StraightLine2("hor", [9, 0], 6),
		]
 

	Draw(W);

// AGENDA 
// Draw all letters
// space them out 
// GO GET MIDI CONTROLLER FOR JOSH

// MARKUS SHULZ 1:41:00









