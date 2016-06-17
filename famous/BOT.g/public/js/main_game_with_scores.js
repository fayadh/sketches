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

///////////////////////////////////////////////////////////////////////////////////////////

// General Functions

////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////

// Main Matrix 

////////////////////////////////////////////////////////////////////////////////////////////

//BACKGROUND
	var backgroundSurface = new Surface({ 
		size: [860, ],
		properties: {
			backgroundColor: "#005555",
			borderRadius: "0%",
			boxShadow: "5px 0px 10px ForestGreen",
	}})


	var backgroundSurfaceModifier = new StateModifier ({
	});

	mainContext.add(backgroundSurfaceModifier).add(backgroundSurface)

//botg on the playground
	var botgImageSurface = new Surface({ 
		size: [800, ],
		properties: {
			backgroundColor: "transparent",
		} 
	})

	var botgImageStateModifier = new StateModifier ({
				
	});

// //content container
// 	var contentSurface = new Surface({ 
// 		size: [640, ],
// 		properties: {
// 			backgroundColor: "red",
// 		} 
// 	})

// 	var contentStateModifier = new StateModifier ({
// 		transform: Transform.translate(800, 0)
// 	});

// 	mainContext.add(contentStateModifier).add(contentSurface);

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
						backgroundColor: 'transparent',
						// boxShadow: '0px 0px 50px white',
						borderRadius: '100%'
					}
				})
			//MODIFIER
				var beadmodifier = new StateModifier({
					align: [0.02, 0.04],
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
//STARTING POINT
	startY = 1;
	startX = 1;

var travelPath = []

///////////////////////////////////////////////////////////////////////////////////////////

// MAIN USER BOT

////////////////////////////////////////////////////////////////////////////////////////////

var g_keyboard_array = [37, 38, 39, 40] //respectively: left, up, right, down

function user_bot() {
	Engine.on('keydown', function(e) {
		console.log(e)
		if (e.which === 39) {
			//next cell
			var nextCell = startX + "," + (startY + 1)

			//where am I? 
			console.log("current cell is: " + startX + "," + startY)
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
				travelPath.push([startX, startY])
				//Reset previous bead
				beadCollector[startX][startY].setProperties({
			  	backgroundColor: "yellow",
			  	backgroundImage: "none"
			  });
				//RIGHT
				startY++;
			  beadCollector[startX][startY].setProperties({
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
			var nextCell = (startX - 1) + "," + startY

			//where am I?
			console.log("current cell is: " + startX + "," + startY)
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
				travelPath.push([startX, startY])
				//Reset previous bead
				beadCollector[startX][startY].setProperties({
			  	backgroundColor: "yellow",
			  	backgroundImage: "none"
			  });
				//UP
				startX = startX - 1
				beadCollector[startX][startY].setProperties({
			  	backgroundColor: "blue",
			  	boxShadow: "0px 0px 10px yellow",
			  	backgroundImage: "url('images/bot.gif')",
			  	backgroundSize: "100%"
				})
			}
		} else if(e.which === 40) {
			//next cell
			var nextCell = (startX + 1) + "," + startY

			//where am I?
			console.log("current cell is: " + startX + "," + startY)
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
				travelPath.push([startX, startY])

				//Reset previous bead
				beadCollector[startX][startY].setProperties({
			  	backgroundColor: "yellow",
			  	backgroundImage: "none"
			  });
				//DOWN
				startX++;
				beadCollector[startX][startY].setProperties({
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
			var nextCell = startX + "," + (startY - 1)

			//where am I? 
			console.log("current cell is: " + startX + "," + startY)
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
				travelPath.push([startX, startY])
				//Reset previous bead
				beadCollector[startX][startY].setProperties({
			  	backgroundColor: "yellow",
			  	backgroundImage: "none"
			  });
				//LEFT
				startY = startY - 1
				beadCollector[startX][startY].setProperties({
			  	backgroundColor: "blue",
			  	boxShadow: "0px 0px 10px yellow",
			  	backgroundImage: "url('images/bot.gif')",
			  	backgroundSize: "100%" 
				})
			}
		}
	});
}

///////////////////////////////////////////////////////////////////////////////////////////

// FUNCTIONS

////////////////////////////////////////////////////////////////////////////////////////////

//RANDOM BEAD DELETER 
var blockCollection = []
function createRandomBlocks(number) {
	for(var i = 0; i < number; i++) {
		var randY = randomIntFromInterval(0, rows - 1)
		var randX = randomIntFromInterval(0, columns - 1)
		blockCollection.push([randY, randX])
		beadCollector[randY][randX].setProperties({
			borderRadius: "0%",
			backgroundColor: "white",
			boxShadow: "0px 0px 30px white",
			opacity: "0.4"
		})
	}
}

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
			// console.log(condition)
			if(condition == "false") {
				i++;
				foodCollection.push([randY, randX]);
				beadCollector[randY][randX].setProperties({
					borderRadius: "100%",
					backgroundColor: "transparent",
					backgroundImage: 'http://effextures.com/wp-content/uploads/2013/08/Star.jpg',
					boxShadow: "0px 0px 30px white",
				})
			}
		}
	}


///
var borderCollection = [];

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
		function Draw_Object(input, starting_point, rotation) {
			//set default starting point to [0, 0]
			if(starting_point === undefined) {
				starting_point = [0, 0]
			} else if (rotation === undefined) {
				rotation = 0;
			}
		
		// console.log(input)
		for(var i = 0; i < input.length; i++) {
			var point1 = input[i].start[0];
			var point2 = input[i].start[1];
			var updated_point1 = point1 + starting_point[0]
			var updated_point2 = point2 + starting_point[1]
			var new_start_array = [updated_point1, updated_point2];

			array = [ StraightLine(input[i].mode, new_start_array, input[i].length) ];
			// console.log(array)
			
			Draw(array); //Draw expects an array
		};
	}
	

	function Draw(thing) {
		for(i = 0; i < thing.length; i++) {
			// console.log(thing[i])
			DrawLine(thing[i]);
		};
	};

	function DrawLine(line) {
		length = line.length
		for(var j = 0; j < length; j++) {
			point = line[j];
			beadCollector[ point[0] ][ point[1] ].setProperties({
				backgroundColor: 'white',
				// boxShadow: '10px 5px 5px pink',
				borderRadius: '100%'
			});
			blockCollection.push([point[0], point[1]]);
			borderCollection.push([point[0], point[1]])
		};
	};



///////////////////////////////////////////////////////////////////////////////////////////

// Object DB 

////////////////////////////////////////////////////////////////////////////////////////////

// | BORDERS
		var Border1 = [
			{mode: "ver", start: [0, rows - 1], length: rows},
			{mode: "ver", start: [0, 0], length: rows},

			{mode: "hor", start: [columns - 1, 0], length: columns},
			{mode: "hor", start: [0, 0], length: columns},
		]
// | LETTERS
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

// AUTO BOT

////////////////////////////////////////////////////////////////////////////////////////////

// Stupid autobot: 
// All it does is avoid blocks all the time
// assess all possible empty spaces around bot
// take random step

function build_bots(color_trail) {
	var bot_startX = 8;
	var bot_startY = 10;
	var bot_speed = 2;
	var belongs = 0;
	var rungame = 1;

	Timer.every(function() {
		if(rungame == 1) {
			//bot current locaiton
			var bot_location = [bot_startX, bot_startY];

			//always check for blocks on all directions of the block
			var blocks_to_be_analyzed = [ 
			[bot_startX, bot_startY + 1], 
			[bot_startX, bot_startY - 1], 
			[bot_startX + 1, bot_startY], 
			[bot_startX - 1, bot_startY]
			]

			//analyze for possble moves and then print the array
			var possible_moves = []

			for(var i = 0; i < 4; i++) {
					var error = 0
					// console.log("awarness: " + i )

					//creating possible moves
					for(var p = 0; p < blockCollection.length; p++) {
						if (blocks_to_be_analyzed[i][0] == blockCollection[p][0] && blocks_to_be_analyzed[i][1] == blockCollection[p][1]) {
							//if you catch an error, log it.
							error++
							stop()
							// console.log("error")
						} else if (blocks_to_be_analyzed[i][0] <= 0) {
							//watch out for impossible values
							error++
						} else if (blocks_to_be_analyzed[i][1] <= 0) {
							error++
							//watch out for impossible values
						}
					}

					// console.log("current location is: " + bot_startX + ',' + bot_startY)
					if(error >= 1) {
						// console.log(error)
				  } else { 
				  	possible_moves.push(blocks_to_be_analyzed[i])
				  }
				}

				// console.log(possible_moves.length)

				//make random move
				var next_move_index = randomIntFromInterval(0, possible_moves.length - 1)
				var x = possible_moves[next_move_index]

				// console.log("New Coordinates:"+x[0]+","+x[1]+" ; current loction:" + bot_startX + "," + bot_startY)

				// reset previous bead
				beadCollector[bot_startX][bot_startY].setProperties({
			  	backgroundColor: color_trail,
			  	backgroundImage: "none",
			  	boxShadow: "0px 0px 10px yellow",
			  	backgroundSize: "100%"
				})

				//update bead
			  beadCollector[x[0]][x[1]].setProperties({
			  	backgroundColor: color_trail,
			  	boxShadow: "0px 0px 30px red",
			  	backgroundImage: "url('images/ibash_bot.png')",
			  	backgroundSize: "100%"
				})		  

				var user_current_location = [startX, startY]

				//update current position
				bot_startX = x[0];
				bot_startY = x[1];

				

				//if the bot hits the user, game is temrinated.
				// if(user_current_location[0] == bot_startX && user_current_location[1] == bot_startY) {
				// 	console.log("HIT")
				// 	//turn game off
				// 	rungame = 0;
				// 	window.alert("Game Over!")

				// 	x = randomIntFromInterval(0, scale_int.length - 1)
				// 	choice = scale_int[x]
				// 	sin_wave.frequency.value = note(choice)
				// 	bass.frequency.value = note(choice)
				// }
			}
		}
	, bot_speed)
}

///////////////////////////////////////////////////////////////////////////////////////////

// Animations

////////////////////////////////////////////////////////////////////////////////////////////

//Time the animation
	//first way
	var imageAnimationSwitch = 0;
	var ts = 270;

	// Timer.every(function() {
	// 	if(imageAnimationSwitch == 0) { $('#bashImage').removeClass("animated jello infinite"); imageAnimationSwitch = 1}
	// 	else { $('#bashImage').addClass("animated jello infinite"); imageAnimationSwitch = 0}
	// }, ts)

///////////////////////////////////////////////////////////////////////////////////////////

// GAMES 

////////////////////////////////////////////////////////////////////////////////////////////
// TETRIS
////////////////////////////////////////////////////////////////////////////////////////////

function run_tetris() {
	//MAPS
	//////////////////////////////////////////////////////////
	var pyramid_map = {
				"initial_coordinates": [[0,1], [1,0], [1,1], [1,2]],
				"relationships" : 
					{"east_to_south" : -1, 
					"south_to_west" : -1,
					"west_to_north" : +1,
					"north_to_east" : +1,
					}
			}
	var l_map = {
				"initial_coordinates": [[0,0], [1,0], [1,1], [1,2]],
				"relationships" : 
					{"east_to_south" : -1, 
					"south_to_west" : -1,
					"west_to_north" : +1,
					"north_to_east" : +1,
					}
			}
	var z_map = {
			"initial_coordinates": [[0, 1], [0, 2] ,[1,0], [1,1]],
			"relationships" : 
				{"east_to_south" : -1, 
				"south_to_west" : -1,
				"west_to_north" : +1,
				"north_to_east" : +1,
				}
		}
	var square_map = {
			"initial_coordinates": [[0, 0], [0, 1] ,[1,0], [1,1]],
			"relationships" : 
				{"east_to_south" : -1, 
				"south_to_west" : -1,
				"west_to_north" : +1,
				"north_to_east" : +1,
				}
		}

	var maps = [pyramid_map, l_map, z_map, square_map]

	var current_map;

	//the initial positioning; acts like a predetermined shift. 
	block_start = [1, 1]

	Engine.on("keydown", function(e) {
			for (var i = 0; i < g_keyboard_array.length; i++) {
			
				e.which === 37? key_mode = "left": null
				e.which === 38? null: null	//disable up option
				e.which === 39? key_mode = "right": null	
				e.which === 40? key_mode = "down": null	

				//reset old coordinations
				function initial_settings(object) {
					for (var i = 0; i < object.initial_coordinates.length; i++) {
						c0 = object.initial_coordinates[i][0] + block_start[0]
						c1 = object.initial_coordinates[i][1]	+ block_start[1]
						beadCollector[c0][c1].setProperties({
							backgroundColor: getRandomColor(),
							borderRadius: "100%"
						})
					};
				}
				var shifted_coordinates = []
				function setup_object(object, direction) {
					var shift = 0;	
					for (var i = 0; i < object.initial_coordinates.length; i++) {
						var x = object.initial_coordinates[i][0] 
						var y = object.initial_coordinates[i][1] 
						//update coordinates
						if(direction == "down") { 
							//our main concern is here: 
							//awareness function 
							//look around you and tell me what you see.
							console.log(x, y)


							shift = [x + 1, y]; 
							shifted_coordinates.push(shift) ; 
							object.initial_coordinates[i] = [x + 1, y]; 
						}
						if(direction == "right") { shift = [x, y + 1]; shifted_coordinates.push(shift) ; object.initial_coordinates[i] = [x, y + 1];  }
						if(direction == "left") { shift = [x, y - 1]; shifted_coordinates.push(shift) ; object.initial_coordinates[i] = [x, y - 1]; }
					};
				}

				function draw_tetris_object(object) {
						for(i = 0; i < object.length; i++) {
							// draw blocks
							c0 = object[i][0] + block_start[0]
							c1 = object[i][1] + block_start[1]
							beadCollector[c0][c1].setProperties({
								backgroundColor: "yellow",
								borderRadius: "0%",
								boxShadow: "0px 0px 10px red",
							})
							//remove old blocks from collection
							blockCollection.pop()

							//add to collection
							blockCollection.push([c0, c1])

						}
					}

				function do_this(object, mode) {
					initial_settings(object)
					setup_object(object, mode)
					draw_tetris_object(shifted_coordinates)
					// console.log(shifted_coordinates)
				}

				// random_do_this_index
				do_this(maps[rand_i], key_mode)
			};
		})

	//REPEATED ALWAYS GOING DOWN
	/////////////////////////////////////////////////////////
	
	rand_i = randomIntFromInterval(0, maps.length - 1)
	console.log(blockCollection.length)

	Timer.every(function(){
		function run() {
			//reset old coordinations
			function initial_settings(object) {
				for (var i = 0; i < object.initial_coordinates.length; i++) {
					//goes through each coordinate of the tetris object from its map and then shifts it via block start
					c0 = object.initial_coordinates[i][0] + block_start[0]
					c1 = object.initial_coordinates[i][1]	+ block_start[1]
					//resets the appropriate bead. 
					beadCollector[c0][c1].setProperties({
						backgroundColor: getRandomColor(),
						borderRadius: "100%"
					})
				};
			}

			//setup a collection to pass to draw_tetris_object with all shifted coordinates
			var shifted_coordinates = []

			function setup_object(object, direction) {
				var shift;	
				for (var i = 0; i < object.initial_coordinates.length; i++) {
					var x = object.initial_coordinates[i][0]
					var y = object.initial_coordinates[i][1]
					//update coordinates

					//our main concern is here: 
					shift = [x + 1, y]; 
					shifted_coordinates.push(shift) ; 
					object.initial_coordinates[i] = [x + 1, y];
				};
			}

			function draw_tetris_object(object) {
					for(i = 0; i < object.length; i++) {
						// draw blocks
						c0 = object[i][0] + block_start[0]
						c1 = object[i][1] + block_start[1]
						beadCollector[c0][c1].setProperties({
							backgroundColor: "yellow",
							borderRadius: "0%",
							boxShadow: "0px 0px 10px red",
						})

						//remove old blocks from collection
						blockCollection.pop()

						//add to collection
						blockCollection.push([c0, c1])
							console.log(blockCollection.length)

						// console.log(blockCollection.length)
				}
			}

		function do_this(object, mode, starting_point) {
			initial_settings(object)
			setup_object(object, mode, starting_point)
			draw_tetris_object(shifted_coordinates)
			// console.log(shifted_coordinates)
		}

		function change_map() {
		}

		// random_do_this_index
		do_this(maps[rand_i], "down")

		}
		// run()
	}, 25)
}

// run_tetris()
	// plot out the shape
	// Draw_Object(possible_falling_pieces.pyramid)

	// write an Timer.every function to make sure it drops every second
	// write the Engine.on("keydown") functions to make it "shift the squares by one piece"
	// once any of the bottom blocks hit, it has to stick where it and become a part of the "tetris_block_collection"

	// write the destroy function (upon racking up the right colors)
	// make sure everything "above it" shifts down
	// rack up points 
	// }

///////////////////////////////////////////////////////////////////////////////////////////

// Renderables

////////////////////////////////////////////////////////////////////////////////////////////

Draw_Object (Border1);
run_tetris()
user_bot()

// write a function to bring the animation to the center
Draw_Object(F, [5,7])
// Draw_Object(Border1)
createRandomFoods();
createRandomBlocks(20);

//build X number of bots
var number_of_bots = 5;
for(i = 0; i <= number_of_bots; i++) {
	//add more colors to your pleasing. Otherwise, set build_bots argument to randomColor()
	var bot_colors = ["black", "white", "green"]
	var index = randomIntFromInterval(0, bot_colors.length)
	// build_bots(bot_colors[index])
	build_bots(getRandomColor())
}


