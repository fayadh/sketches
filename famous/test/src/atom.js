// 'use strict';

// Famous dependencies
var DOMElement = require('famous/dom-renderables/DOMElement');
var FamousEngine = require('famous/core/FamousEngine');
var Clock = require('famous/core/Clock');

var main = FamousEngine.createScene()
var node = main.addChild()

var light = node.addChild()
var center = node.addChild()

var x = "/==||========>"
var many_faced_g = "/==||==(:}]>"
new DOMElement(node, { tagName: "div" })
    .setAttribute("id", "background" )
    .setContent()


new DOMElement(node, { tagName: "div" })
    .setAttribute("id", "center-dot" )

// var time = new Clock()._time

node
    // Set size mode to 'absolute' to use absolute pixel values: (width 250px, height 250px)
    .setSizeMode('absolute', 'absolute', 'absolute')
    .setAbsoluteSize(125, 125)
    // Center the 'node' to the parent (the screen, in this instance)
    .setAlign(0.5, 0.5)
    // Set the translational origin to the center of the 'node'
    .setMountPoint(0.5, 0.5)
    // Set the rotational origin to the center of the 'node'
    .setOrigin(0.5, 0.5);

light
    .setSizeMode('absolute', 'absolute', 'absolute')
    .setAbsoluteSize(125, 125)
    .setAlign(0.5, 0.5)
    // Set the translational origin to the center of the 'node'
    .setMountPoint(0.5, 0.5)
    // Set the rotational origin to the center of the 'node'
    .setOrigin(0.5, 0.5);

center 
    .setSizeMode('absolute', 'absolute', 'absolute')
    .setAbsoluteSize(62, 62)
    .setAlign(0.5, 0.5)
    // Set the translational origin to the center of the 'node'
    .setMountPoint(0.5, 0.5)
    // Set the rotational origin to the center of the 'node'
    .setOrigin(0.5, 0.5);

var spinner = node.addComponent({
    onUpdate: function(time) {
        node.setRotation(0, time / 100, time / 10)
        node.requestUpdateOnNextTick(spinner); 
    }
}) 

var light_spinner = light.addComponent({
    onUpdate: function(time) {
        light.setRotation(time / 1000, 0.2, 0)
        light.requestUpdateOnNextTick(light_spinner); 
    }
})

new DOMElement(light, {tagName: "div"})
    .setAttribute("id", "light")
    

node.requestUpdate(spinner)
light.requestUpdate(light_spinner)

// Boilerplate code to make your life easier
FamousEngine.init();

