var FamousEngine = require('famous/core/FamousEngine');
var Example = require('./Example/Example');
var Circle = require('./Example/Circle')
var Vec3 = require('famous/math/Vec3')
// var Beads = require('./Example/Beads')

var container = FamousEngine.createScene();

function RandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

FamousEngine.init();

var container = FamousEngine.createScene();
var array = []; 

for (var i = 0; i < 10; i++) {
	var node = container.addChild()
	var color = RandomColor()
	var position = new Vec3(i * 100, 0, 0)
	array.push(new Circle(node, color, position))
};


console.log(array)