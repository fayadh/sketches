var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;
var Timer = famous.utilities.Timer;

var mainContext = Engine.createContext();
var mainCounter = 10
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

		function getRandomGreen() {
			green = Math.floor(Math.random() * (255 - 180 + 1)) + 180;
			return string = 'rgba(69, '+ green + ', 71, 1)'
		}

		function getRandomRed() {
			red = Math.floor(Math.random() * (255 - 180 + 1)) + 180;
			return string = 'rgba(' + red + ', 69, 71, 1)'
		}

		function getRandomBlue() {
			blue = Math.floor(Math.random() * (255 - 140 + 1)) + 180;
			return string = 'rgba( 1, 119, '+  blue +', 1)';
		}

for(i = 0; i < mainCounter; i++) {
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
		align: [0.5, 0.5],
		transform: Transform.translate( i* (beadResolution * spacing), 0) 
	});

	Bead.on('mouseover', function() {
		this.setProperties({
			backgroundColor: getRandomColor(),
			boxShadow: '0px 0px 10px black'
		});
	});

	Bead.on('mouseout', function() {
		this.setProperties({
			boxShadow: '5px 5px 5px white'
		})
	})

	mainContext.add(beadmodifier).add(Bead);
	beadCollector.push(Bead);
};

Timer.every(function() {
	// console.count();
	beadCollector[0].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[2].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[4].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[6].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[8].setProperties({ backgroundColor: getRandomBlue() });

	beadCollector[1].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[3].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[5].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[7].setProperties({ backgroundColor: getRandomBlue() });
	beadCollector[9].setProperties({ backgroundColor: getRandomBlue() });
}, 20);








