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

var rows = 19;
var columns = 20;

//BACKGROUND
	var backgroundSurface = new Surface({ 
		size: [800, ],
		properties: {
			backgroundColor: "black"
		} 
	})

	var backgroundSurfaceModifier = new StateModifier ({
	});

	mainContext.add(backgroundSurfaceModifier).add(backgroundSurface)
//botg on the playground
	var botgImageSurface = new Surface({ 
		size: [800, ],
		properties: {
			backgroundColor: "transparent"
		} 
	})

	var botgImageStateModifier = new StateModifier ({
				
	});
//content container
	var contentSurface = new Surface({ 
		size: [640, ],
		properties: {
			backgroundColor: "white",
		} 
	})

	var contentStateModifier = new StateModifier ({
		transform: Transform.translate(800, 0)
	});

	mainContext.add(contentStateModifier).add(contentSurface);



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

				var initialTime = Date.now();
				// beadmodifier.setTransform({
				// 		transform: Transform.rotateY(.001 * (Date.now() - initialTime)) 
				// 	});

				Bead.on('mouseover', function() {
					this.setProperties({
						backgroundColor: 'pink',
						// boxShadow: '5px 5px 5px white'
					});
				});

				mainContext.add(beadmodifier).add(Bead);
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

		//where am I? 
		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)
		
		//test if the next move hits a block
		var condition = "false"
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				condition = "true";
				console.log(condition)
			}
		}

		//if it hits a block (i.e: condition is true), then don't run, and say you can't.
		if(condition == "false") { 
			//store old coordinate
			travelPath.push([startY, startX])
			//Reset previous bead
			beadCollector[startY][startX].setProperties({
		  	backgroundColor: "yellow",
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
		} else {
			console.log("cant")
		}

	} else if(e.which === 37) {
		//next cell
		var nextCell = startY + "," + (startX - 1)

		//where am I? 
		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)
		
		//test if the next move hits a block
		var condition = "false"
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				condition = "true";
				console.log(condition)
			}
		}

		//if it hits a block (i.e: condition is true), then don't run, and say you can't.
		if(condition == "false") { 
			//store old coordinate
			travelPath.push([startY, startX])
			//Reset previous bead
			beadCollector[startY][startX].setProperties({
		  	backgroundColor: "yellow",
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
		}
	} else if(e.which === 38) {
		//next cell
		var nextCell = (startY - 1) + "," + startX

		//where am I?
		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)

		//test if the next move hits a block
		var condition = "false"
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				condition = "true";
				console.log(condition)
			}
		}

		//if it hits a block (i.e: condition is true), then don't run, and say you can't.
		if(condition == "false") { 
			//store old coordinate
			travelPath.push([startY, startX])
			//Reset previous bead
			beadCollector[startY][startX].setProperties({
		  	backgroundColor: "yellow",
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
		}
	} else if(e.which === 40) {
		//next cell
		var nextCell = (startY + 1) + "," + startX

		//where am I?
		console.log("current cell is: " + startY + "," + startX)
		console.log("next cell is: " + nextCell)

		//test if the next move hits a block
		var condition = "false"
		for(var i = 0; i < blockCollection.length; i++) {
			if (blockCollection[i] == nextCell) {
				condition = "true";
				console.log(condition)
			}
		}

		//if it hits a block (i.e: condition is true), then don't run, and say you can't.
		if(condition == "false") {
			//store old coordinate
			travelPath.push([startY, startX])

			//Reset previous bead
			beadCollector[startY][startX].setProperties({
		  	backgroundColor: "yellow",
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
		} else {
			console.log("cant")
		}
	}
});

//RANDOM BEAD DELETER 
var blockCollection = []
function createRandomBlocks() {
	for(var i = 0; i < 50; i++) {
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

//Random food generator
//we need a function to determine selectable seeds.
	var foodCollection = []
	function createRandomFoods() {
		for(var i = 0; i < 50; i++) {
			var randY = randomIntFromInterval(0, rows - 1)
			var randX = randomIntFromInterval(0, columns - 1)
			var condition = "false"
			for(var j = 0; j < blockCollection.length; j++) {
				if(blockCollection[j][0] == randY && blockCollection[j][1 == randX]) { condition = "true" }
			}

			if(condition == "false") {
				foodCollection.push([randY, randX])
				beadCollector[randY][randX].setProperties({
					borderRadius: "100%",
					backgroundColor: "white",
					backgroundImage: 'http://effextures.com/wp-content/uploads/2013/08/Star.jpg',
					boxShadow: "0px 0px 30px white",
				})
			}
		}
	}

	createRandomFoods()

//Time the animation
	//first way
	var imageAnimationSwitch = 0;
	var ts = 270;

	// Timer.every(function() {
	// 	if(imageAnimationSwitch == 0) { $('#bashImage').removeClass("animated jello infinite"); imageAnimationSwitch = 1}
	// 	else { $('#bashImage').addClass("animated jello infinite"); imageAnimationSwitch = 0}
	// }, ts)

