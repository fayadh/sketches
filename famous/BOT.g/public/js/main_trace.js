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

var rows = 10;
var columns = 10;

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

				// var beadStateModifier = new StateModifier({
				// });

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

startX = 0;
startY = 0;

Engine.on('keydown', function(e) {
	console.log(e)
	if (e.which === 39) {
		//RIGHT
		startX++
  beadCollector[startY][startX].setProperties({
  	backgroundColor: "blue",
  	boxShadow: "5px 5px 10px black",
  	backgroundImage: "url('images/bot.gif')",
  	backgroundSize: "100%"
	})
	} else if(e.which === 37) {
		//LEFT
		startX = startX - 1
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "5px 5px 10px black",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%" 
		})
	} else if(e.which === 38) {
		//UP
		startY = startY - 1
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "5px 5px 10px black",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	} else if(e.which === 40) {
		//DOWN
		startY++
		beadCollector[startY][startX].setProperties({
	  	backgroundColor: "blue",
	  	boxShadow: "5px 5px 10px black",
	  	backgroundImage: "url('images/bot.gif')",
	  	backgroundSize: "100%"
		})
	}

});

