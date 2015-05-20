var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;
var StateModifier = famous.modifiers.StateModifier
var Timer = famous.utilities.Timer

var mainContext = Engine.createContext();
var beadResolution = 10;
var beadCollector = [];
var spacing = 1;

//RANDOM COLOR
		function getRandomColor() {
		  var letters = '0123456789ABCDEF'.split('');
		  var color = '#';
		  for (var i = 0; i < 6; i++ ) {
		    color += letters[Math.floor(Math.random() * 16)];
		  }
		  return color;
		}
//RANDOM INTEGER
function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

var rows = 80;
var columns = 40;

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
						backgroundColor: 'red',
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

Engine.on('keydown', function(e) {
	console.log(e)
	if (e.which === 39) {
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//RIGHT
		startX++;
	  beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 10px yellow",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	} else if(e.which === 37) {
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//LEFT
		startX = startX - 1
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 10px yellow",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%" 
		})
	} else if(e.which === 38) {
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//UP
		startY = startY - 1
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 10px yellow",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	} else if(e.which === 40) {
		//Reset previous bead
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: getRandomColor(),
	  	backgroundImage: "none"
	  });
		//DOWN
		startY++;

		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "0px 0px 10px yellow",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	}
});

//RANDOM BEAD DELETER 

function createRandomBlocks() {
	for(var i = 0; i < 10; i++) {
		beadCollector[randomIntFromInterval(0, rows - 1)][randomIntFromInterval(0, columns - 1)].setProperties({
			borderRadius: "0%",
			backgroundColor: "white",
			boxShadow: "0px 0px 30px white",
		})
	}
}

Timer.every(function() { return createRandomBlocks() }, 2) 
// createRandomBlocks()

// DELETE: beadCollector[ point[0] ][ point[1] ].render = function() { return null }

