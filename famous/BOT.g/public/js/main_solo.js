var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;
var StateModifier = famous.modifiers.StateModifier

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

//BACKGROUND
	var backgroundSurface = new Surface({ 
		size: [ , ],
		properties: {
			backgroundColor: "black"
		} 
	})

	var backgroundSurfaceModifier = new StateModifier ({
	});

	mainContext.add(backgroundSurfaceModifier).add(backgroundSurface)

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
						// boxShadow: '0px 0px 50px white',
						borderRadius: '100%'
					}
				})
			//MODIFIER
				var beadmodifier = new StateModifier({
					align: [0.01, 0.01],
					transform: Transform.translate( i * (beadResolution * spacing), row) 
				});

				// var initialTime = Date.now();
				// beadmodifier.setTransform({
				// 		transform: Transform.rotateY(.001 * (Date.now() - initialTime)) 
				// 	});

				Bead.on('mouseover', function() {
					this.setProperties({
						backgroundColor: 'white',
						boxShadow: '5px 5px 5px white'
					});
				});

				mainContext.add(beadmodifier).add(Bead);
				// Bead.on('click', function() {
				// 	beadmodifier.setTransform(
				// 		Transform.translate(Math.random()*600, Math.random()*600, 2),
				// 		{ duration: 500 } 
				// 	)
				// });

				beadCollectorColumn.push(Bead);
		};
		beadCollector.push(beadCollectorColumn);
	};

//RANDOM EMPTY CELLS


startX = 0;
startY = 0;

currentCell = []
travelPath = []

Engine.on('keydown', function(e) {
	console.log(e)
	if (e.which === 39) {
		//store old coordinate
		travelPath.push([startX, startY])
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//RIGHT
		startX++;
	  beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 30px white",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	} else if(e.which === 37) {
		//store old coordinate
		travelPath.push([startX, startY])
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//LEFT
		startX = startX - 1
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 30px white",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%" 
		})
	} else if(e.which === 38) {
		//store old coordinate
		travelPath.push([startX, startY])
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//UP
		startY = startY - 1
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 30px white",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	} else if(e.which === 40) {
		//store old coordinate
		travelPath.push([startX, startY])
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//DOWN
		startY++;

		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 30px white",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	}

});


// DELETE: beadCollector[ point[0] ][ point[1] ].render = function() { return null }

// how to chart something on a board.
// 1 0 0
// 0 0 0
// 0 0 0
// flipping between one's and zero's. 
// click right.
// 0 1 0
// 0 0 0
// 0 0 0
// when i click right, you select the cell on the same row, but the column on my right.  
// you turn that into the current cell, so its value is one
// and then you turn the old cell back to zero.  
