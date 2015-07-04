var Node = require('famous/core/Node');
var DOMElement = require('famous/dom-renderables/DOMElement');
var PhysicsEngine = require('famous/physics/PhysicsEngine');
var Particle = require('famous/physics/bodies/Particle');
var Spring = require('famous/physics/forces/Spring');
var Vec3 = require('famous/math/Vec3')

var Sphere = require('famous/physics/bodies/Sphere');
console.log(Sphere)

// var mySphere = new Sphere({mass: 10, radius: 25});

// in this environment, the global scope is undefined. 
// so you HAVE to create a function which corrects this. 

function Circle(node, color, position) { 
    this.color = color
    this.id = node._id;
    this.update_caller = node.addComponent(this)
    this.node = node;
    this.pe = new PhysicsEngine();
    this.position = position

    _makeButton.call(this);

    this.node.requestUpdate(this.update_caller);
}

// debugger
//what you're doing here is that you are setting the 
Circle.prototype = Object.create(Node.prototype);
// debugger

Circle.prototype.onReceive = function onReceive (ev) {
    if(ev === 'click') {
        console.log('clicked btn');
        console.log(this.button.body);
        this.button.body.setPosition(100, -100, 0);
    }
};

Circle.prototype.onUpdate = function onUpdate (t) {
    // update PE
    this.pe.update(t);

    // update btn position
    var pos = this.button.body.position;
    this.button.setPosition(pos.x, pos.y, pos.z);

    this.node.requestUpdateOnNextTick(this.update_caller);
};

function _makeButton() {
    var c = this.color
    var pos = this.position

    this.button = this.node.addChild();
    
    var x = "0."
    x += Math.random().toString()[2]
    x += Math.random().toString()[3]

    this.button
        .setSizeMode('absolute', 'absolute')
        .setAbsoluteSize(100, 100)
        .setOrigin(.5, .5, .5)
        .setMountPoint(.5, .5, .5)
        .setAlign(0.5, 0.5, x);

    this.button.el = new DOMElement(this.button, {
        properties: {
            background: c,
            borderRadius: '100%'
        }
    });

    // make btn clickable
    this.button.addUIEvent('click');
    // debugger

    // add physics particle & spring to node
    this.button.body = new Particle({
        mass: 1,
        position: pos
    });
    // debugger

    this.button.force = new Spring(null, this.button.body, {
        period: 1.0,
        dampingRatio: 0.1,
        anchor: new Vec3(0, 0, 90)
    });

    // add body & force to PE
    this.pe.add(this.button.body, this.button.force);
    // console.log(this.pe)
}

module.exports = Circle;

