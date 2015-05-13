var Engine = famous.core.Engine;
var Modifier = famous.core.Modifier;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
// var element = document.getElementById("text");

var mainContext = Engine.createContext();
var rayCollector = [];


for(var i=0; i < 10; i++) {
	var ray = []
	var ar = Math.floor((Math.random() * 250) + 1); //aspect ratio

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
				backgroundColor: getRandomColor().toString(),
			}
		});

		var squareModifier = new Modifier({
			origin: [0, 0],
			transform: Transform.translate(ar,ar)
		});
	//CIRCLE1
		var circle1 = new Surface({
			size: [.75*ar, .75*ar],
			properties: {
				background: getRandomColor().toString(),
				borderRadius: '100%'
			}
		});

		var circle1Modifier = new Modifier({
			origin: [0, 0],
			transform: Transform.translate(75,75)
		});
	//CIRCLE2
		var circle2 = new Surface({
			size: [.50*ar, .50*ar],
			properties: {
				background: getRandomColor().toString(),
				borderRadius: '100%'
			}
		});

		var circle2Modifier = new Modifier({
			origin: [0, 0],
			transform: Transform.translate(50,50)
		});
	//CIRCLE3
		var circle3 = new Surface({
			size: [.25*ar, .25*ar],
			properties: {
				background: getRandomColor().toString(),
				borderRadius: '100%'
			}
		});

		var circle3Modifier = new Modifier({
			origin: [0, 0],
			transform: Transform.translate(25,25)
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
}
