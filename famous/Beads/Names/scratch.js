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

var rows = 20 ;
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

//LETTERS DB
var F = [StraightLine('ver', 2, 10, 5)]; 
var F2 = [StraightLine('ver', 2, 10, 3)];

//DRAW LETTER
	function DrawLetter(letter) {
		length = letter.length;
		console.log(letter);
		for(i = 0; i <= length; i++) {
			point = letter[i]
			innerLength = point.length;

			for(j = 0; j <= innerLength; j++) {
				bead = beadCollector[ point[j][0] ][ point[j][1] ]; 
				console.log(bead);
				bead.setProperties({ 
					backgroundColor: 'black',
				}); 
			};

		};
	};

DrawLetter(F2);
DrawLetter(F);




