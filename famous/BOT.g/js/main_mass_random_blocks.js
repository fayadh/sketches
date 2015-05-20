var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;
var StateModifier = famous.modifiers.StateModifier
var Timer = famous.utilities.Timer

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
//RANDOM INTEGER
function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
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
						backgroundColor: 'green',
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

var travelPath = []

Engine.on('keydown', function(e) {
	console.log(e)
	if (e.which === 39) {

		//next cell
		var nextCell = startY + "," + (startX + 1)

		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)
		//test necessary increment
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				console.log("block")
			}
		}

		//store old coordinate
		travelPath.push([startY, startX])
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

		//next cell
		var nextCell = startY + "," + (startX - 1)

		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)
		//test necessary increment
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				console.log("block")
			}
		}



		//store old coordinate
		travelPath.push([startY, startX])
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

		//next cell
		var nextCell = (startY - 1) + "," + startX

		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)
		//test necessary increment
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				console.log("block")
			}
		}



		//store old coordinate
		travelPath.push([startY, startX])
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

		//next cell
		var nextCell = (startY + 1) + "," + startX

		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)
		//test necessary increment
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				console.log("block")
			}
		}

		//store old coordinate
		travelPath.push([startY, startX])
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
var blockCollection = []
function createRandomBlocks() {
	for(var i = 0; i < 20; i++) {
		var randY = randomIntFromInterval(0, rows - 1)
		var randX = randomIntFromInterval(0, columns - 1)
		blockCollection.push([randY, randX])
		beadCollector[randY][randX].setProperties({
			borderRadius: "0%",
			backgroundColor: "white",
			boxShadow: "0px 0px 30px white",
		})
	}
}

createRandomBlocks()
// Timer.every(function() { return createRandomBlocks() }, 5) 
// createRandomBlocks()

// if I have 
// 0 0 0 1 B
// be is at [0][5]
// I'm at [0][4]
// If I click right, the function knows that [0][5] is the next co-ordinate.
// If the next coordinate is in the blockCollection, don't allow this. 









// DELETE: beadCollector[ point[0] ][ point[1] ].render = function() { return null }

