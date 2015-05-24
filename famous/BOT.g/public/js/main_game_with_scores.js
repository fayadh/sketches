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
var columns = 19;

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

Engine.on('keydown', function(e) {
	 if(e.which === 37) {
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
	} 
})

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
		var i = 0;
		var quantity = 50;
		while (i < quantity) {
			var randY = randomIntFromInterval(0, rows - 1)
			var randX = randomIntFromInterval(0, columns - 1)
			var condition = "false"
			for(var j = 0; j < blockCollection.length; j++) {
				if(blockCollection[j][0] == randY && blockCollection[j][1] == randX) { condition = "true" }
			}
			console.log(condition)
			if(condition == "false") {
				i++;
				foodCollection.push([randY, randX]);
				beadCollector[randY][randX].setProperties({
					borderRadius: "100%",
					backgroundColor: "white",
					backgroundImage: 'http://effextures.com/wp-content/uploads/2013/08/Star.jpg',
					boxShadow: "0px 0px 30px white",
				})
			}
		}
	}


///

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

//STRAIGHT LINE FUNCTION
	function StraightLine(mode, startingPoint, length) {
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

	

//DRAW
function Draw_Object(input) {
	console.log(input)
	for(var i = 0; i < input.length; i++) {
		array = [ StraightLine(input[i].mode, input[i].start, input[i].length) ];
		console.log(array)
		Draw(array); //Draw expects an array
	};
}

///////////////////////////////////////////////////////////////////////////////////////////

// Object DB 

////////////////////////////////////////////////////////////////////////////////////////////

//BORDERS
		var Border1 = [
			{mode: "ver", start: [0, rows - 1], length: rows},
			{mode: "ver", start: [0, 0], length: rows},

			{mode: "hor", start: [columns - 1, 0], length: columns},
			{mode: "hor", start: [0, 0], length: columns},
		]

		
//LETTERS
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

///////////////////////////////////////////////////////////////////////////////////////////

// Objects To Be Drawn 

////////////////////////////////////////////////////////////////////////////////////////////

Draw_Object(Border1);
createRandomFoods()

///////////////////////////////////////////////////////////////////////////////////////////

// AUTO BOT

////////////////////////////////////////////////////////////////////////////////////////////


	
//Time the animation
	//first way
	var imageAnimationSwitch = 0;
	var ts = 270;

	// Timer.every(function() {
	// 	if(imageAnimationSwitch == 0) { $('#bashImage').removeClass("animated jello infinite"); imageAnimationSwitch = 1}
	// 	else { $('#bashImage').addClass("animated jello infinite"); imageAnimationSwitch = 0}
	// }, ts)

