var Node = require('famous/core/Node');
var DOMElement = require('famous/dom-renderables/DOMElement');
var PhysicsEngine = require('famous/physics/PhysicsEngine');
var Particle = require('famous/physics/bodies/Particle');
var Spring = require('famous/physics/forces/Spring');
var Vec3 = require('famous/math/Vec3')

// in this environment, the global scope is undefined. 
// so you HAVE to create a function which corrects this. 

function Example(node, color) { 
    this.color = color

    this.id = node.addComponent(this);
    this.node = node;
    // debugger
    this.pe = new PhysicsEngine();

    _makeButton.call(this);

    this.node.requestUpdate(this.id);
}

// debugger
//what you're doing here is that you are setting the 
Example.prototype = Object.create(Node.prototype);
// debugger

Example.prototype.onReceive = function onReceive (ev) {
    if(ev === 'click') {
        console.log('clicked btn');
        console.log(this.button.body);
        this.button.body.setPosition(100, -100, 0);
    }
};

Example.prototype.onUpdate = function onUpdate (t) {
    // update PE
    this.pe.update(t);

    // update btn position
    var pos = this.button.body.position;
    this.button.setPosition(pos.x, pos.y, pos.z);

    this.node.requestUpdateOnNextTick(this.id);
};

function _makeButton() {
    var c = this.color

    this.button = this.node.addChild();
    
    this.button
        .setSizeMode('absolute', 'absolute')
        .setAbsoluteSize(100, 100)
        .setOrigin(.5, .5, .5)
        .setMountPoint(.5, .5, .5)
        .setAlign(.5, .5, .5);

    this.button.el = new DOMElement(this.button, {
        properties: {
            background: c
        }
    });

    // make btn clickable
    this.button.addUIEvent('click');
    // debugger

    // add physics particle & spring to node
    this.button.body = new Particle({
        mass: 1,
        position: new Vec3(100, 0, 0)
    });
    // debugger

    this.button.force = new Spring(null, this.button.body, {
        period: 1.0,
        dampingRatio: 0.9,
        anchor: new Vec3(0, 0, 0)
    });

    // add body & force to PE
    this.pe.add(this.button.body, this.button.force);
    // console.log(this.pe)
}

module.exports = Example;

