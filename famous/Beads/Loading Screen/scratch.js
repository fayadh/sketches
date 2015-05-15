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
var columns = 40;

backgroundSurface = new Surface({properties: { backgroundColor: 'black' }, size: [,]});
mainContext.add(backgroundSurface);


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
					align: [0.01, 0.01],
					transform: Transform.translate( i* (beadResolution * spacing), row) 
				});

				Bead.on('mouseover', function() {
					this.setProperties({
						backgroundColor: 'white',
						boxShadow: '5px 5px 5px white'
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
				backgroundColor: 'white',
				boxShadow: '10px 5px 5px green'
			});
		};
	};

// --OUTPUT -- //
	function Draw(thing) {
		for(i = 0; i < thing.length; i++) {
			// console.log(thing[i])
			DrawLine(thing[i]);
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
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 6},

			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 4], length: 10},
			{mode: "ver", start: [0, 5], length: 10},
		]

		var B = [
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 6},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},

			{mode: "ver", start: [0, 1], length: 10},
			{mode: "ver", start: [0, 4], length: 10},
			{mode: "ver", start: [0, 5], length: 10},
		]

		var C = [
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},

			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},
		]

		var D = [
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},


			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},

			{mode: "ver", start: [0, 1], length: 10},
			{mode: "ver", start: [0, 4], length: 10},
			{mode: "ver", start: [0, 5], length: 10},
		]

		var E = [
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 6},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},

			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},
		]

		var F = [
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 6},

			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},
		]

		var G = [
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 3], length: 3},
			{mode: "hor", start: [5, 3], length: 3},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},

			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [4, 4], length: 4},
			{mode: "ver", start: [4, 5], length: 4},
		]

		var H = [
			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 6},

			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 4], length: 10},
			{mode: "ver", start: [0, 5], length: 10},
		]

		var I = [
			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},

			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "ver", start: [0, 2], length: 10},
			{mode: "ver", start: [0, 3], length: 10},
		]

		var J = [
			{mode: "hor", start: [0, 1], length: 5},
			{mode: "hor", start: [1, 1], length: 5},

			{mode: "hor", start: [6, 0], length: 2},
			{mode: "hor", start: [7, 0], length: 2},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 1], length: 4},

			{mode: "ver", start: [0, 4], length: 10},
			{mode: "ver", start: [0, 5], length: 9},
		]

		var K = [
			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "hor", start: [0, 4], length: 2},
			{mode: "hor", start: [1, 4], length: 2},
			{mode: "hor", start: [2, 4], length: 2},

			{mode: "hor", start: [3, 3], length: 1},
			{mode: "hor", start: [4, 2], length: 1},
			{mode: "hor", start: [5, 2], length: 1},
			{mode: "hor", start: [6, 3], length: 1},
			{mode: "hor", start: [7, 4], length: 2},
			{mode: "hor", start: [8, 4], length: 2},
			{mode: "hor", start: [9, 4], length: 2},
		]

		var L = [
			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},
		]

		var M = [
			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 5], length: 10},
			{mode: "ver", start: [0, 6], length: 10},

			{mode: "hor", start: [4, 2], length: 1},
			{mode: "hor", start: [5, 3], length: 1},
			{mode: "hor", start: [4, 4], length: 1},
		]

		var N = [
			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 5], length: 10},
			{mode: "ver", start: [0, 6], length: 10},

			{mode: "hor", start: [2, 2], length: 1},

			{mode: "hor", start: [3, 2], length: 1},
			{mode: "hor", start: [3, 3], length: 1},

			{mode: "hor", start: [4, 2], length: 1},
			{mode: "hor", start: [4, 3], length: 1},
			{mode: "hor", start: [4, 4], length: 1},

			{mode: "hor", start: [5, 3], length: 1},
			{mode: "hor", start: [5, 4], length: 1},

			{mode: "hor", start: [6, 4], length: 1},
		]

		var O = [
			{mode: "ver", start: [1, 0], length: 8},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 5], length: 10},
			{mode: "ver", start: [1, 6], length: 8},

			{mode: "hor", start: [0, 1], length: 4},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 1], length: 4},
		]

		var P = [
			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 4], length: 5},
			{mode: "ver", start: [0, 5], length: 5},

			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 6},
		]

		var Q = []

		var R = [
			{mode: "ver", start: [0, 0], length: 10},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 4], length: 5},
			{mode: "ver", start: [0, 5], length: 4},

			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [4, 0], length: 6},
			{mode: "hor", start: [5, 0], length: 5},

			{mode: "hor", start: [6, 3], length: 1},
			{mode: "hor", start: [7, 4], length: 1},
			{mode: "hor", start: [8, 4], length: 2},
			{mode: "hor", start: [9, 4], length: 2},
		]

		var S = []
		var T = [ 
			{mode: "ver", start: [0, 2], length: 10},
			{mode: "ver", start: [0, 3], length: 10},

			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},
		]
		var U = [
			{mode: "ver", start: [0, 0], length: 9},
			{mode: "ver", start: [0, 1], length: 10},

			{mode: "ver", start: [0, 5], length: 10},
			{mode: "ver", start: [0, 6], length: 9},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 1], length: 4},
		]

		var V = [
			{mode: "hor", start: [1, 0], length: 2},
			{mode: "hor", start: [2, 0], length: 2},
			{mode: "hor", start: [3, 0], length: 2},
			{mode: "hor", start: [4, 0], length: 3},
			{mode: "hor", start: [5, 1], length: 2},
			{mode: "hor", start: [6, 1], length: 2},

			{mode: "hor", start: [7, 2], length: 3},
			{mode: "hor", start: [8, 2], length: 3},
			{mode: "hor", start: [9, 3], length: 1},

			{mode: "hor", start: [6, 4], length: 2},
			{mode: "hor", start: [5, 4], length: 2},
			{mode: "hor", start: [4, 4], length: 3},
			{mode: "hor", start: [3, 5], length: 2},
			{mode: "hor", start: [2, 5], length: 2},
			{mode: "hor", start: [1, 5], length: 2},
		]
		var W = [
			{mode: "hor", start: [0, 0], length: 1},	
			{mode: "hor", start: [1, 0], length: 2},
			{mode: "hor", start: [2, 0], length: 2},
			{mode: "hor", start: [3, 0], length: 2},
			{mode: "hor", start: [4, 0], length: 3},
			{mode: "hor", start: [5, 1], length: 2},
			{mode: "hor", start: [6, 1], length: 2},

			{mode: "hor", start: [7, 2], length: 3},
			{mode: "hor", start: [8, 2], length: 3},
			{mode: "hor", start: [9, 3], length: 1},

			{mode: "hor", start: [6, 4], length: 2},
			{mode: "hor", start: [5, 4], length: 5},
			{mode: "hor", start: [4, 4], length: 5},
			{mode: "hor", start: [3, 5], length: 3},
			{mode: "hor", start: [2, 5], length: 3},
			{mode: "hor", start: [1, 5], length: 3},

			{mode: "hor", start: [0, 6], length: 1},

			{mode: "hor", start: [6, 7], length: 2},	
			{mode: "hor", start: [7, 8], length: 3},
			{mode: "hor", start: [8, 8], length: 3},	
			{mode: "hor", start: [9, 9], length: 1},

			{mode: "hor", start: [0, 12], length: 1},	
			{mode: "hor", start: [1, 11], length: 2},	
			{mode: "hor", start: [2, 11], length: 2},	
			{mode: "hor", start: [3, 11], length: 2},	
			{mode: "hor", start: [4, 10], length: 3},	
			{mode: "hor", start: [5, 10], length: 2},	
			{mode: "hor", start: [6, 10], length: 2}	
		]

		var X = [
			{mode: "hor", start: [0, 0], length: 1},
			{mode: "hor", start: [0, 5], length: 1},

			{mode: "hor", start: [1, 0], length: 1},
			{mode: "hor", start: [1, 5], length: 1},

			{mode: "hor", start: [2, 0], length: 2},
			{mode: "hor", start: [2, 4], length: 2},

			{mode: "hor", start: [3, 1], length: 4},

			{mode: "hor", start: [4, 2], length: 2},
			{mode: "hor", start: [5, 2], length: 2},

			{mode: "hor", start: [6, 1], length: 1},
			{mode: "hor", start: [6, 4], length: 1},

			{mode: "ver", start: [7, 0], length: 3},
			{mode: "ver", start: [7, 5], length: 3},
		]

		var Y = []	


		var Z = [ 
			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [0, 0], length: 6},
			{mode: "hor", start: [1, 0], length: 6},

			{mode: "hor", start: [2, 4], length: 2},

			{mode: "hor", start: [3, 4], length: 1},
			{mode: "hor", start: [4, 3], length: 1},
			{mode: "hor", start: [5, 2], length: 1},
			{mode: "hor", start: [6, 1], length: 1},

			{mode: "hor", start: [7, 0], length: 2},

			{mode: "hor", start: [8, 0], length: 6},
			{mode: "hor", start: [9, 0], length: 6},
		]

function newDraw(input) {
	for(var i = 0; i < input.length; i++) {
		array = [ StraightLine2(input[i].mode, input[i].start, input[i].length) ];
		Draw(array); //Draw expects an array
	};
}

newDraw(W);

// Draw(X);

//SENTENCE FUNCTION 

//START POINT 



// AGENDA 
// Draw all letters
// space them out 

// MARKUS SHULZ 1:41:00









