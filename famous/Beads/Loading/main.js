var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;
// var element = document.getElementById("text");

var mainContext = Engine.createContext();
var rayCollector = [];

for(var i=0; i < 10; i++) {
	var ray = []
	var ar = Math.floor((Math.random() * 200) + 1); //aspect ratio
	var rp = Math.floor((Math.random() * 200) + 1); //random position

	//RANDOM COLOR
		function getRandomColor() {
		  var letters = '0123456789ABCDEF'.split('');
		  var color = '#';
		  for (var i = 0; i < 6; i++ ) {
		    color += letters[Math.floor(Math.random() * 16)];
		  }
		  return color;
		}

	//SQUARE
		var square = new Surface({
			size: [ar,ar],
			properties: {	
				backgroundColor: getRandomColor(),
				backgroundImage: 'url(\'Images\/layouts\/leaf.png\')',
				backgroundSize: '100%',
				border: 'solid',
				borderRadius: '4%',
				borderWeight: '10px',
				borderColor: 'white'
			}
		});

		var squareModifier = new Modifier({
			origin: [0, 0],
			align: [0.5, 0.5],
			transform: Transform.translate(ar,ar)
		});
	//CIRCLE1
		var circle1 = new Surface({
			size: [.75*ar, .75*ar],
			properties: {
				backgroundColor: getRandomColor(),
				backgroundImage: 'url(\'Images\/layouts\/leaf.png\')',
				backgroundSize: '100%',
				border: 'solid',
				// borderRadius: '100%',
				borderWeight: '10px',
				borderRadius: '100%',
				borderColor: 'white'
			}
		});

		var circle1Modifier = new Modifier({
			origin: [0, 0],
			align: [0.5, 0.5],
			transform: Transform.translate(.75*ar,.75*ar)
		});
	//CIRCLE2
		var circle2 = new Surface({
			size: [.50*ar, .50*ar],
			
			properties: {
				backgroundColor: getRandomColor(),
				backgroundImage: 'url(\'Images\/layouts\/leaf.png\')',
				backgroundSize: '100%',
				border: 'solid',
				// borderRadius: '100%',
				borderWeight: '10px',
				borderRadius: '100%',
				borderColor: 'white'
			}
		});

		var circle2Modifier = new Modifier({
			origin: [0, 0],
			align: [0.5, 0.5],
			transform: Transform.translate(.50*ar, .50*ar)
		});
	//CIRCLE3
		var circle3 = new Surface({
			
			size: [.25*ar, .25*ar],
			properties: {
				backgroundColor: getRandomColor(),
				backgroundImage: 'url(\'Images\/layouts\/leaf.png\')',
				backgroundSize: '100%',
				border: 'solid',
				// borderRadius: '100%',
				borderWeight: '10px',
				borderRadius: '100%',
				borderColor: 'white'
			}
		});

		var circle3Modifier = new Modifier({
			origin: [0, 0],
			align: [0.5, 0.5],
			transform: Transform.translate(.25*ar, .25*ar + rp)
		});

	ray.push(square);
	ray.push(circle1);
	ray.push(circle2);
	ray.push(circle3);
	rayCollector.push(ray);


	//MAIN OUTPUT
		mainContext.add(squareModifier).add(square);
		mainContext.add(circle1Modifier).add(circle1);
		mainContext.add(circle2Modifier).add(circle2);
		mainContext.add(circle3Modifier).add(circle3);


	// ANIMATION TAIL
		var counter = 0;
		circle3Modifier.transformFrom(function() {
		  var rotateX = Math.sin(counter++ / 200);
		  var rotateY = Math.sin(counter / 200);
		  var rotateZ = Math.sin(counter / 100);
		  return Transform.rotate(rotateX, rotateY, rotateZ); 
		});
	// ANIMATION TAIL
		// var counter = 0;
		// squareModifier.transformFrom(function() {
		//   var rotateX = Math.sin(counter++ / 200);
		//   var rotateY = Math.sin(counter / 200);
		//   var rotateZ = Math.sin(counter / 100);
		//   return Transform.rotate(rotateX, rotateY, rotateZ); 
		// });	



















}
