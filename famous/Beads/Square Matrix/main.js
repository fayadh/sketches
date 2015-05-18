var Engine = famous.core.Engine;
var Transform = famous.core.Transform;
var Surface = famous.core.Surface;
var Modifier = famous.core.Modifier;
var StateModifier = famous.modifiers.StateModifier;
var Timer = famous.utilities.Timer;

var mainContext = Engine.createContext();

  function getRandomColor() {
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

//surface generator 
surfaces = [];
function surfaceGen(number) {
  for(var i = 0; i < number; i++) {
    var fooSurface = new Surface({ 
      size: [100, 100],
      properties: {
        backgroundColor: "black"
      } 
    });
    surfaces.push(fooSurface);
  };
};

var matrix_dump = []

function matrix(rows, columns) {
  for(var i = 0; i < rows; i++) {
    var column_dump = []
    for(var j = 0; j < columns; j++) {
      var fooSurface = new Surface({ 
        size: [ 100, 100 ],
        properties: {
          backgroundColor: getRandomColor()
        } 
      })

      var fooSurfaceModifier = new StateModifier ({
          transform: Transform.translate(i * 100, j * 100)
      });

      mainContext.add(fooSurfaceModifier).add(fooSurface);
      column_dump.push(fooSurface);
    }
    matrix_dump.push(column_dump);
  }
}

matrix(10, 10);

for(x = 0; x < 9; x++) {
   Timer.every(function() {matrix_dump[x][0].setProperties({ backgroundColor: getRandomColor() })}, 100);
}

Timer.every(function() {matrix_dump[0][0].setProperties({ backgroundColor: getRandomColor() })}, 100),
Timer.every(function() {matrix_dump[1][0].setProperties({ backgroundColor: getRandomColor() })}, 100)


// sur1 = new Surface({ 
//   size: [100, 100],
//   properties: {
//     backgroundColor: 'red'
//   }
// });

// sur1mod = new StateModifier({
// });


// sur1.on('click', function() {
//   sur1mod.setSize(100, 100)
// });

// sur2 = new Surface({ 
//   size: [100, 100],
//   content: sur1,
//   properties: {
//     backgroundColor: 'yellow'
//   }
// });

// sur2mod = new StateModifier({
//   transform: Transform.translate(0, 100)
// });

// mainContext.add(sur1mod).add(sur1)
// mainContext.add(sur2mod).add(sur2)

// var counter = 0;
//   Timer.every(function() { sur1.setProperties({
//     backgroundColor: getRandomColor(),
//   })}, 50);
