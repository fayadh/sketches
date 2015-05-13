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


var rows = 10;
var columns = 10;


//ROW
for(j = 0; j < rows; j++) { 
	row =  j * (beadResolution * spacing)
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
				align: [0.5, 0.5],
				transform: Transform.translate( i* (beadResolution * spacing), row) 
			});

			Bead.on('mouseover', function() {
				this.setProperties({
					backgroundColor: 'black'
				});
			});

			mainContext.add(beadmodifier).add(Bead);
			beadCollector.push(Bead);
	};
};