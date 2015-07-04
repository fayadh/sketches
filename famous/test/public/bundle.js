(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Camera is a component that is responsible for sending information to the renderer about where
 * the camera is in the scene.  This allows the user to set the type of projection, the focal depth,
 * and other properties to adjust the way the scenes are rendered.
 *
 * @class Camera
 *
 * @param {Node} node to which the instance of Camera will be a component of
 */
function Camera(node) {
    this._node = node;
    this._projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
    this._focalDepth = 0;
    this._near = 0;
    this._far = 0;
    this._requestingUpdate = false;
    this._id = node.addComponent(this);
    this._viewTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._viewDirty = false;
    this._perspectiveDirty = false;
    this.setFlat();
}

Camera.FRUSTUM_PROJECTION = 0;
Camera.PINHOLE_PROJECTION = 1;
Camera.ORTHOGRAPHIC_PROJECTION = 2;

/**
 * @method
 *
 * @return {String} Name of the component
 */
Camera.prototype.toString = function toString() {
    return 'Camera';
};

/**
 * Gets object containing serialized data for the component
 *
 * @method
 *
 * @return {Object} the state of the component
 */
Camera.prototype.getValue = function getValue() {
    return {
        component: this.toString(),
        projectionType: this._projectionType,
        focalDepth: this._focalDepth,
        near: this._near,
        far: this._far
    };
};

/**
 * Set the components state based on some serialized data
 *
 * @method
 *
 * @param {Object} state an object defining what the state of the component should be
 *
 * @return {Boolean} status of the set
 */
Camera.prototype.setValue = function setValue(state) {
    if (this.toString() === state.component) {
        this.set(state.projectionType, state.focalDepth, state.near, state.far);
        return true;
    }
    return false;
};

/**
 * Set the internals of the component
 *
 * @method
 *
 * @param {Number} type an id corresponding to the type of projection to use
 * @param {Number} depth the depth for the pinhole projection model
 * @param {Number} near the distance of the near clipping plane for a frustum projection
 * @param {Number} far the distanct of the far clipping plane for a frustum projection
 * 
 * @return {Boolean} status of the set
 */
Camera.prototype.set = function set(type, depth, near, far) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
    this._projectionType = type;
    this._focalDepth = depth;
    this._near = near;
    this._far = far;
};

/**
 * Set the camera depth for a pinhole projection model
 *
 * @method
 *
 * @param {Number} depth the distance between the Camera and the origin
 *
 * @return {Camera} this
 */
Camera.prototype.setDepth = function setDepth(depth) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
    this._perspectiveDirty = true;
    this._projectionType = Camera.PINHOLE_PROJECTION;
    this._focalDepth = depth;
    this._near = 0;
    this._far = 0;

    return this;
};

/**
 * Gets object containing serialized data for the component
 *
 * @method
 *
 * @param {Number} near distance from the near clipping plane to the camera
 * @param {Number} far distance from the far clipping plane to the camera
 * 
 * @return {Camera} this
 */
Camera.prototype.setFrustum = function setFrustum(near, far) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    this._perspectiveDirty = true;
    this._projectionType = Camera.FRUSTUM_PROJECTION;
    this._focalDepth = 0;
    this._near = near;
    this._far = far;

    return this;
};

/**
 * Set the Camera to have orthographic projection
 *
 * @method
 *
 * @return {Camera} this
 */
Camera.prototype.setFlat = function setFlat() {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    this._perspectiveDirty = true;
    this._projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
    this._focalDepth = 0;
    this._near = 0;
    this._far = 0;

    return this;
};

/**
 * When the node this component is attached to updates, the Camera will
 * send new camera information to the Compositor to update the rendering
 * of the scene.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Camera.prototype.onUpdate = function onUpdate() {
    this._requestingUpdate = false;

    var path = this._node.getLocation();

    this._node
        .sendDrawCommand('WITH')
        .sendDrawCommand(path);

    if (this._perspectiveDirty) {
        this._perspectiveDirty = false;

        switch (this._projectionType) {
            case Camera.FRUSTUM_PROJECTION:
                this._node.sendDrawCommand('FRUSTUM_PROJECTION');
                this._node.sendDrawCommand(this._near);
                this._node.sendDrawCommand(this._far);
                break;
            case Camera.PINHOLE_PROJECTION:
                this._node.sendDrawCommand('PINHOLE_PROJECTION');
                this._node.sendDrawCommand(this._focalDepth);
                break;
            case Camera.ORTHOGRAPHIC_PROJECTION:
                this._node.sendDrawCommand('ORTHOGRAPHIC_PROJECTION');
                break;
        }
    }

    if (this._viewDirty) {
        this._viewDirty = false;

        this._node.sendDrawCommand('CHANGE_VIEW_TRANSFORM');
        this._node.sendDrawCommand(this._viewTransform[0]);
        this._node.sendDrawCommand(this._viewTransform[1]);
        this._node.sendDrawCommand(this._viewTransform[2]);
        this._node.sendDrawCommand(this._viewTransform[3]);

        this._node.sendDrawCommand(this._viewTransform[4]);
        this._node.sendDrawCommand(this._viewTransform[5]);
        this._node.sendDrawCommand(this._viewTransform[6]);
        this._node.sendDrawCommand(this._viewTransform[7]);

        this._node.sendDrawCommand(this._viewTransform[8]);
        this._node.sendDrawCommand(this._viewTransform[9]);
        this._node.sendDrawCommand(this._viewTransform[10]);
        this._node.sendDrawCommand(this._viewTransform[11]);

        this._node.sendDrawCommand(this._viewTransform[12]);
        this._node.sendDrawCommand(this._viewTransform[13]);
        this._node.sendDrawCommand(this._viewTransform[14]);
        this._node.sendDrawCommand(this._viewTransform[15]);
    }
};

/**
 * When the transform of the node this component is attached to
 * changes, have the Camera update its projection matrix and
 * if needed, flag to node to update.
 *
 * @method
 *
 * @param {Array} transform an array denoting the transform matrix of the node
 *
 * @return {Camera} this
 */
Camera.prototype.onTransformChange = function onTransformChange(transform) {
    var a = transform;
    this._viewDirty = true;

    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
    a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
    a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
    a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

    b00 = a00 * a11 - a01 * a10,
    b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10,
    b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,
    b05 = a02 * a13 - a03 * a12,
    b06 = a20 * a31 - a21 * a30,
    b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30,
    b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,
    b11 = a22 * a33 - a23 * a32,

    det = 1/(b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

    this._viewTransform[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    this._viewTransform[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    this._viewTransform[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    this._viewTransform[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    this._viewTransform[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    this._viewTransform[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    this._viewTransform[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    this._viewTransform[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    this._viewTransform[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    this._viewTransform[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    this._viewTransform[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    this._viewTransform[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    this._viewTransform[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    this._viewTransform[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    this._viewTransform[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    this._viewTransform[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
};

module.exports = Camera;

},{}],2:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Channels are being used for interacting with the UI Thread when running in
 * a Web Worker or with the UIManager/ Compositor when running in single
 * threaded mode (no Web Worker).
 *
 * @class Channel
 * @constructor
 */
function Channel() {
    if (typeof self !== 'undefined' && self.window !== self) {
        this._enterWorkerMode();
    }
}


/**
 * Called during construction. Subscribes for `message` event and routes all
 * future `sendMessage` messages to the Main Thread ("UI Thread").
 *
 * Primarily used for testing.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Channel.prototype._enterWorkerMode = function _enterWorkerMode() {
    this._workerMode = true;
    var _this = this;
    self.addEventListener('message', function onmessage(ev) {
        _this.onMessage(ev.data);
    });
};

/**
 * Meant to be overriden by `Famous`.
 * Assigned method will be invoked for every received message.
 *
 * @type {Function}
 * @override
 *
 * @return {undefined} undefined
 */
Channel.prototype.onMessage = null;

/**
 * Sends a message to the UIManager.
 *
 * @param  {Any}    message Arbitrary message object.
 *
 * @return {undefined} undefined
 */
Channel.prototype.sendMessage = function sendMessage (message) {
    if (this._workerMode) {
        self.postMessage(message);
    }
    else {
        this.onmessage(message);
    }
};

/**
 * Meant to be overriden by the UIManager when running in the UI Thread.
 * Used for preserving API compatibility with Web Workers.
 * When running in Web Worker mode, this property won't be mutated.
 *
 * Assigned method will be invoked for every message posted by `famous-core`.
 *
 * @type {Function}
 * @override
 */
Channel.prototype.onmessage = null;

/**
 * Sends a message to the manager of this channel (the `Famous` singleton) by
 * invoking `onMessage`.
 * Used for preserving API compatibility with Web Workers.
 *
 * @private
 * @alias onMessage
 *
 * @param {Any} message a message to send over the channel
 *
 * @return {undefined} undefined
 */
Channel.prototype.postMessage = function postMessage(message) {
    return this.onMessage(message);
};

module.exports = Channel;

},{}],3:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Equivalent of an Engine in the Worker Thread. Used to synchronize and manage
 * time across different Threads.
 *
 * @class  Clock
 * @constructor
 * @private
 */
function Clock () {
    this._time = 0;
    this._frame = 0;
    this._timerQueue = [];
    this._updatingIndex = 0;

    this._scale = 1;
    this._scaledTime = this._time;
}

/**
 * Sets the scale at which the clock time is passing.
 * Useful for slow-motion or fast-forward effects.
 * 
 * `1` means no time scaling ("realtime"),
 * `2` means the clock time is passing twice as fast,
 * `0.5` means the clock time is passing two times slower than the "actual"
 * time at which the Clock is being updated via `.step`.
 *
 * Initally the clock time is not being scaled (factor `1`).
 * 
 * @method  setScale
 * @chainable
 * 
 * @param {Number} scale    The scale at which the clock time is passing.
 *
 * @return {Clock} this
 */
Clock.prototype.setScale = function setScale (scale) {
    this._scale = scale;
    return this;
};

/**
 * @method  getScale
 * 
 * @return {Number} scale    The scale at which the clock time is passing.
 */
Clock.prototype.getScale = function getScale () {
    return this._scale;
};

/**
 * Updates the internal clock time.
 *
 * @method  step
 * @chainable
 * 
 * @param  {Number} time high resolution timstamp used for invoking the
 *                       `update` method on all registered objects
 * @return {Clock}       this
 */
Clock.prototype.step = function step (time) {
    this._frame++;

    this._scaledTime = this._scaledTime + (time - this._time)*this._scale;
    this._time = time;

    for (var i = 0; i < this._timerQueue.length; i++) {
        if (this._timerQueue[i](this._scaledTime)) {
            this._timerQueue.splice(i, 1);
        }
    }
    return this;
};

/**
 * Returns the internal clock time.
 *
 * @method  now
 * 
 * @return  {Number} time high resolution timstamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.now = function now () {
    return this._scaledTime;
};

/**
 * Returns the internal clock time.
 *
 * @method  getTime
 * @deprecated Use #now instead
 * 
 * @return  {Number} time high resolution timstamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.getTime = Clock.prototype.now;

/**
 * Returns the number of frames elapsed so far.
 *
 * @method getFrame
 * 
 * @return {Number} frames
 */
Clock.prototype.getFrame = function getFrame () {
    return this._frame;
};

/**
 * Wraps a function to be invoked after a certain amount of time.
 * After a set duration has passed, it executes the function and
 * removes it as a listener to 'prerender'.
 *
 * @method setTimeout
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay milliseconds from now to execute the function
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setTimeout = function (callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            return true;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};


/**
 * Wraps a function to be invoked after a certain amount of time.
 *  After a set duration has passed, it executes the function and
 *  resets the execution time.
 *
 * @method setInterval
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay interval to execute function in milliseconds
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setInterval = function setInterval(callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            startedAt = time;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};

/**
 * Removes previously via `Clock#setTimeout` or `Clock#setInterval`
 * registered callback function
 *
 * @method clearTimer
 * @chainable
 * 
 * @param  {Function} timer  previously by `Clock#setTimeout` or
 *                              `Clock#setInterval` returned callback function
 * @return {Clock}              this
 */
Clock.prototype.clearTimer = function (timer) {
    var index = this._timerQueue.indexOf(timer);
    if (index !== -1) {
        this._timerQueue.splice(index, 1);
    }
    return this;
};

module.exports = Clock;


},{}],4:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

// TODO: Dispatch should be generalized so that it can work on any Node
// not just Contexts.

var Event = require('./Event');

/**
 * The Dispatch class is used to propogate events down the
 * scene graph.
 *
 * @class Dispatch
 * @param {Scene} context The context on which it operates
 * @constructor
 */
function Dispatch (context) {

    if (!context) throw new Error('Dispatch needs to be instantiated on a node');

    this._context = context; // A reference to the context
                             // on which the dispatcher
                             // operates

    this._queue = []; // The queue is used for two purposes
                      // 1. It is used to list indicies in the
                      //    Nodes path which are then used to lookup
                      //    a node in the scene graph.
                      // 2. It is used to assist dispatching
                      //    such that it is possible to do a breadth first
                      //    traversal of the scene graph.
}

/**
 * lookupNode takes a path and returns the node at the location specified
 * by the path, if one exists. If not, it returns undefined.
 *
 * @param {String} location The location of the node specified by its path
 *
 * @return {Node | undefined} The node at the requested path
 */
Dispatch.prototype.lookupNode = function lookupNode (location) {
    if (!location) throw new Error('lookupNode must be called with a path');

    var path = this._queue;

    _splitTo(location, path);

    if (path[0] !== this._context.getSelector()) return void 0;

    var children = this._context.getChildren();
    var child;
    var i = 1;
    path[0] = this._context;

    while (i < path.length) {
        child = children[path[i]];
        path[i] = child;
        if (child) children = child.getChildren();
        else return void 0;
        i++;
    }

    return child;
};

/**
 * dispatch takes an event name and a payload and dispatches it to the
 * entire scene graph below the node that the dispatcher is on. The nodes
 * receive the events in a breadth first traversal, meaning that parents
 * have the opportunity to react to the event before children.
 *
 * @param {String} event name of the event
 * @param {Any} payload the event payload
 *
 * @return {undefined} undefined
 */
Dispatch.prototype.dispatch = function dispatch (event, payload) {
    if (!event) throw new Error('dispatch requires an event name as it\'s first argument');

    var queue = this._queue;
    var item;
    var i;
    var len;
    var children;

    queue.length = 0;
    queue.push(this._context);

    while (queue.length) {
        item = queue.shift();
        if (item.onReceive) item.onReceive(event, payload);
        children = item.getChildren();
        for (i = 0, len = children.length ; i < len ; i++) queue.push(children[i]);
    }
};

/**
 * dispatchUIevent takes a path, an event name, and a payload and dispatches them in
 * a manner anologous to DOM bubbling. It first traverses down to the node specified at
 * the path. That node receives the event first, and then every ancestor receives the event
 * until the context.
 *
 * @param {String} path the path of the node
 * @param {String} event the event name
 * @param {Any} payload the payload
 *
 * @return {undefined} undefined
 */
Dispatch.prototype.dispatchUIEvent = function dispatchUIEvent (path, event, payload) {
    if (!path) throw new Error('dispatchUIEvent needs a valid path to dispatch to');
    if (!event) throw new Error('dispatchUIEvent needs an event name as its second argument');

    var queue = this._queue;
    var node;

    Event.call(payload);
    payload.node = this.lookupNode(path); // After this call, the path is loaded into the queue
                                          // (lookUp node doesn't clear the queue after the lookup)

    while (queue.length) {
        node = queue.pop(); // pop nodes off of the queue to move up the ancestor chain.
        if (node.onReceive) node.onReceive(event, payload);
        if (payload.propagationStopped) break;
    }
};

/**
 * _splitTo is a private method which takes a path and splits it at every '/'
 * pushing the result into the supplied array. This is a destructive change.
 *
 * @private
 * @param {String} string the specified path
 * @param {Array} target the array to which the result should be written
 *
 * @return {Array} the target after having been written to
 */
function _splitTo (string, target) {
    target.length = 0; // clears the array first.
    var last = 0;
    var i;
    var len = string.length;

    for (i = 0 ; i < len ; i++) {
        if (string[i] === '/') {
            target.push(string.substring(last, i));
            last = i + 1;
        }
    }

    if (i - last > 0) target.push(string.substring(last, i));

    return target;
}

module.exports = Dispatch;

},{"./Event":5}],5:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Event class adds the stopPropagation functionality
 * to the UIEvents within the scene graph.
 *
 * @constructor Event
 */
function Event () {
    this.propagationStopped = false;
    this.stopPropagation = stopPropagation;
}

/**
 * stopPropagation ends the bubbling of the event in the
 * scene graph.
 *
 * @method stopPropagation
 *
 * @return {undefined} undefined
 */
function stopPropagation () {
    this.propagationStopped = true;
}

module.exports = Event;


},{}],6:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Clock = require('./Clock');
var Scene = require('./Scene');
var Channel = require('./Channel');
var UIManager = require('../renderers/UIManager');
var Compositor = require('../renderers/Compositor');
var RequestAnimationFrameLoop = require('../render-loops/RequestAnimationFrameLoop');

var ENGINE_START = ['ENGINE', 'START'];
var ENGINE_STOP = ['ENGINE', 'STOP'];
var TIME_UPDATE = ['TIME', null];

/**
 * Famous has two responsibilities, one to act as the highest level
 * updater and another to send messages over to the renderers. It is
 * a singleton.
 *
 * @class FamousEngine
 * @constructor
 */
function FamousEngine() {
    this._updateQueue = []; // The updateQueue is a place where nodes
                            // can place themselves in order to be
                            // updated on the frame.

    this._nextUpdateQueue = []; // the nextUpdateQueue is used to queue
                                // updates for the next tick.
                                // this prevents infinite loops where during
                                // an update a node continuously puts itself
                                // back in the update queue.

    this._scenes = {}; // a hash of all of the scenes's that the FamousEngine
                         // is responsible for.

    this._messages = TIME_UPDATE;   // a queue of all of the draw commands to
                                    // send to the the renderers this frame.

    this._inUpdate = false; // when the famous is updating this is true.
                            // all requests for updates will get put in the
                            // nextUpdateQueue

    this._clock = new Clock(); // a clock to keep track of time for the scene
                               // graph.

    this._channel = new Channel();
    this._channel.onMessage = this.handleMessage.bind(this);
}


/**
 * An init script that initializes the FamousEngine with options
 * or default parameters.
 *
 * @method
 *
 * @param {Object} options a set of options containing a compositor and a render loop
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.init = function init(options) {
    this.compositor = options && options.compositor || new Compositor();
    this.renderLoop = options && options.renderLoop || new RequestAnimationFrameLoop();
    this.uiManager = new UIManager(this.getChannel(), this.compositor, this.renderLoop);
    return this;
};

/**
 * Sets the channel that the engine will use to communicate to
 * the renderers.
 *
 * @method
 *
 * @param {Channel} channel     The channel to be used for communicating with
 *                              the `UIManager`/ `Compositor`.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.setChannel = function setChannel(channel) {
    this._channel = channel;
    return this;
};

/**
 * Returns the channel that the engine is currently using
 * to communicate with the renderers.
 *
 * @method
 *
 * @return {Channel} channel    The channel to be used for communicating with
 *                              the `UIManager`/ `Compositor`.
 */
FamousEngine.prototype.getChannel = function getChannel () {
    return this._channel;
};

/**
 * _update is the body of the update loop. The frame consists of
 * pulling in appending the nextUpdateQueue to the currentUpdate queue
 * then moving through the updateQueue and calling onUpdate with the current
 * time on all nodes. While _update is called _inUpdate is set to true and
 * all requests to be placed in the update queue will be forwarded to the
 * nextUpdateQueue.
 *
 * @method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype._update = function _update () {
    this._inUpdate = true;
    var time = this._clock.now();
    var nextQueue = this._nextUpdateQueue;
    var queue = this._updateQueue;
    var item;

    this._messages[1] = time;

    while (nextQueue.length) queue.unshift(nextQueue.pop());

    while (queue.length) {
        item = queue.shift();
        if (item && item.onUpdate) item.onUpdate(time);
    }

    this._inUpdate = false;
};

/**
 * requestUpdates takes a class that has an onUpdate method and puts it
 * into the updateQueue to be updated at the next frame.
 * If FamousEngine is currently in an update, requestUpdate
 * passes its argument to requestUpdateOnNextTick.
 *
 * @method
 *
 * @param {Object} requester an object with an onUpdate method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype.requestUpdate = function requestUpdate (requester) {
    if (!requester)
        throw new Error(
            'requestUpdate must be called with a class to be updated'
        );

    if (this._inUpdate) this.requestUpdateOnNextTick(requester);
    else this._updateQueue.push(requester);
};

/**
 * requestUpdateOnNextTick is requests an update on the next frame.
 * If FamousEngine is not currently in an update than it is functionally equivalent
 * to requestUpdate. This method should be used to prevent infinite loops where
 * a class is updated on the frame but needs to be updated again next frame.
 *
 * @method
 *
 * @param {Object} requester an object with an onUpdate method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype.requestUpdateOnNextTick = function requestUpdateOnNextTick (requester) {
    this._nextUpdateQueue.push(requester);
};

/**
 * postMessage sends a message queue into FamousEngine to be processed.
 * These messages will be interpreted and sent into the scene graph
 * as events if necessary.
 *
 * @method
 *
 * @param {Array} messages an array of commands.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleMessage = function handleMessage (messages) {
    if (!messages)
        throw new Error(
            'onMessage must be called with an array of messages'
        );

    var command;

    while (messages.length > 0) {
        command = messages.shift();
        switch (command) {
            case 'WITH':
                this.handleWith(messages);
                break;
            case 'FRAME':
                this.handleFrame(messages);
                break;
            default:
                throw new Error('received unknown command: ' + command);
        }
    }
    return this;
};

/**
 * handleWith is a method that takes an array of messages following the
 * WITH command. It'll then issue the next commands to the path specified
 * by the WITH command.
 *
 * @method
 *
 * @param {Array} messages array of messages.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleWith = function handleWith (messages) {
    var path = messages.shift();
    var command = messages.shift();

    switch (command) {
        case 'TRIGGER': // the TRIGGER command sends a UIEvent to the specified path
            var type = messages.shift();
            var ev = messages.shift();

            this.getContext(path).getDispatch().dispatchUIEvent(path, type, ev);
            break;
        default:
            throw new Error('received unknown command: ' + command);
    }
    return this;
};

/**
 * handleFrame is called when the renderers issue a FRAME command to
 * FamousEngine. FamousEngine will then step updating the scene graph to the current time.
 *
 * @method
 *
 * @param {Array} messages array of messages.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleFrame = function handleFrame (messages) {
    if (!messages) throw new Error('handleFrame must be called with an array of messages');
    if (!messages.length) throw new Error('FRAME must be sent with a time');

    this.step(messages.shift());
    return this;
};

/**
 * step updates the clock and the scene graph and then sends the draw commands
 * that accumulated in the update to the renderers.
 *
 * @method
 *
 * @param {Number} time current engine time
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.step = function step (time) {
    if (time == null) throw new Error('step must be called with a time');

    this._clock.step(time);
    this._update();

    if (this._messages.length) {
        this._channel.sendMessage(this._messages);
        this._messages.length = 2;
    }

    return this;
};

/**
 * returns the context of a particular path. The context is looked up by the selector
 * portion of the path and is listed from the start of the string to the first
 * '/'.
 *
 * @method
 *
 * @param {String} selector the path to look up the context for.
 *
 * @return {Context | Undefined} the context if found, else undefined.
 */
FamousEngine.prototype.getContext = function getContext (selector) {
    if (!selector) throw new Error('getContext must be called with a selector');

    var index = selector.indexOf('/');
    selector = index === -1 ? selector : selector.substring(0, index);

    return this._scenes[selector];
};

/**
 * returns the instance of clock within famous.
 *
 * @method
 *
 * @return {Clock} FamousEngine's clock
 */
FamousEngine.prototype.getClock = function getClock () {
    return this._clock;
};

/**
 * queues a message to be transfered to the renderers.
 *
 * @method
 *
 * @param {Any} command Draw Command
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.message = function message (command) {
    this._messages.push(command);
    return this;
};

/**
 * Creates a scene under which a scene graph could be built.
 *
 * @method
 *
 * @param {String} selector a dom selector for where the scene should be placed
 *
 * @return {Scene} a new instance of Scene.
 */
FamousEngine.prototype.createScene = function createScene (selector) {
    selector = selector || 'body';

    if (this._scenes[selector]) this._scenes[selector].dismount();
    this._scenes[selector] = new Scene(selector, this);
    return this._scenes[selector];
};

/**
 * Starts the engine running in the Main-Thread.
 * This effects **every** updateable managed by the Engine.
 *
 * @method
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.startEngine = function startEngine () {
    this._channel.sendMessage(ENGINE_START);
    return this;
};

/**
 * Stops the engine running in the Main-Thread.
 * This effects **every** updateable managed by the Engine.
 *
 * @method
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.stopEngine = function stopEngine () {
    this._channel.sendMessage(ENGINE_STOP);
    return this;
};

module.exports = new FamousEngine();

},{"../render-loops/RequestAnimationFrameLoop":31,"../renderers/Compositor":32,"../renderers/UIManager":34,"./Channel":2,"./Clock":3,"./Scene":8}],7:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

var Transform = require('./Transform');
var Size = require('./Size');

var TRANSFORM_PROCESSOR = new Transform();
var SIZE_PROCESSOR = new Size();

var IDENT = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

var ONES = [1, 1, 1];
var QUAT = [0, 0, 0, 1];

/**
 * Nodes define hierarchy and geometrical transformations. They can be moved
 * (translated), scaled and rotated.
 *
 * A Node is either mounted or unmounted. Unmounted nodes are detached from the
 * scene graph. Unmounted nodes have no parent node, while each mounted node has
 * exactly one parent. Nodes have an arbitary number of children, which can be
 * dynamically added using @{@link addChild}.
 *
 * Each Nodes have an arbitrary number of `components`. Those components can
 * send `draw` commands to the renderer or mutate the node itself, in which case
 * they define behavior in the most explicit way. Components that send `draw`
 * commands aare considered `renderables`. From the node's perspective, there is
 * no distinction between nodes that send draw commands and nodes that define
 * behavior.
 *
 * Because of the fact that Nodes themself are very unopinioted (they don't
 * "render" to anything), they are often being subclassed in order to add e.g.
 * components at initialization to them. Because of this flexibility, they might
 * as well have been called `Entities`.
 *
 * @example
 * // create three detached (unmounted) nodes
 * var parent = new Node();
 * var child1 = new Node();
 * var child2 = new Node();
 *
 * // build an unmounted subtree (parent is still detached)
 * parent.addChild(child1);
 * parent.addChild(child2);
 *
 * // mount parent by adding it to the context
 * var context = Famous.createContext("body");
 * context.addChild(parent);
 *
 * @class Node
 * @constructor
 */
function Node () {
    this._calculatedValues = {
        transform: new Float32Array(IDENT),
        size: new Float32Array(3)
    };

    this._requestingUpdate = false;
    this._inUpdate = false;

    this._updateQueue = [];
    this._nextUpdateQueue = [];

    this._freedComponentIndicies = [];
    this._components = [];

    this._freedChildIndicies = [];
    this._children = [];

    this._parent = null;
    this._globalUpdater = null;

    this._lastEulerX = 0;
    this._lastEulerY = 0;
    this._lastEulerZ = 0;
    this._lastEuler = false;

    this.value = new Node.Spec();
}

Node.RELATIVE_SIZE = Size.RELATIVE;
Node.ABSOLUTE_SIZE = Size.ABSOLUTE;
Node.RENDER_SIZE = Size.RENDER;
Node.DEFAULT_SIZE = Size.DEFAULT;

/**
 * A Node spec holds the "data" associated with a Node.
 *
 * @class Spec
 * @constructor
 *
 * @property {String} location path to the node (e.g. "body/0/1")
 * @property {Object} showState
 * @property {Boolean} showState.mounted
 * @property {Boolean} showState.shown
 * @property {Number} showState.opacity
 * @property {Object} offsets
 * @property {Float32Array.<Number>} offsets.mountPoint
 * @property {Float32Array.<Number>} offsets.align
 * @property {Float32Array.<Number>} offsets.origin
 * @property {Object} vectors
 * @property {Float32Array.<Number>} vectors.position
 * @property {Float32Array.<Number>} vectors.rotation
 * @property {Float32Array.<Number>} vectors.scale
 * @property {Object} size
 * @property {Float32Array.<Number>} size.sizeMode
 * @property {Float32Array.<Number>} size.proportional
 * @property {Float32Array.<Number>} size.differential
 * @property {Float32Array.<Number>} size.absolute
 * @property {Float32Array.<Number>} size.render
 */
Node.Spec = function Spec () {
    this.location = null;
    this.showState = {
        mounted: false,
        shown: false,
        opacity: 1
    };
    this.offsets = {
        mountPoint: new Float32Array(3),
        align: new Float32Array(3),
        origin: new Float32Array(3)
    };
    this.vectors = {
        position: new Float32Array(3),
        rotation: new Float32Array(QUAT),
        scale: new Float32Array(ONES)
    };
    this.size = {
        sizeMode: new Float32Array([Size.RELATIVE, Size.RELATIVE, Size.RELATIVE]),
        proportional: new Float32Array(ONES),
        differential: new Float32Array(3),
        absolute: new Float32Array(3),
        render: new Float32Array(3)
    };
    this.UIEvents = [];
};

/**
 * Determine the node's location in the scene graph hierarchy.
 * A location of `body/0/1` can be interpreted as the following scene graph
 * hierarchy (ignoring siblings of ancestors and additional child nodes):
 *
 * `Context:body` -> `Node:0` -> `Node:1`, where `Node:1` is the node the
 * `getLocation` method has been invoked on.
 *
 * @method getLocation
 *
 * @return {String} location (path), e.g. `body/0/1`
 */
Node.prototype.getLocation = function getLocation () {
    return this.value.location;
};

/**
 * @alias getId
 *
 * @return {String} the path of the Node
 */
Node.prototype.getId = Node.prototype.getLocation;

/**
 * Globally dispatches the event using the Scene's Dispatch. All nodes will
 * receive the dispatched event.
 *
 * @method emit
 *
 * @param  {String} event   Event type.
 * @param  {Object} payload Event object to be dispatched.
 *
 * @return {Node} this
 */
Node.prototype.emit = function emit (event, payload) {
    var current = this;

    while (current !== current.getParent()) {
        current = current.getParent();
    }

    current.getDispatch().dispatch(event, payload);
    return this;
};

// THIS WILL BE DEPRICATED
Node.prototype.sendDrawCommand = function sendDrawCommand (message) {
    this._globalUpdater.message(message);
    return this;
};

/**
 * Recursively serializes the Node, including all previously added components.
 *
 * @method getValue
 *
 * @return {Object}     Serialized representation of the node, including
 *                      components.
 */
Node.prototype.getValue = function getValue () {
    var numberOfChildren = this._children.length;
    var numberOfComponents = this._components.length;
    var i = 0;

    var value = {
        location: this.value.location,
        spec: this.value,
        components: new Array(numberOfComponents),
        children: new Array(numberOfChildren)
    };

    for (; i < numberOfChildren ; i++)
        if (this._children[i] && this._children[i].getValue)
            value.children[i] = this._children[i].getValue();

    for (i = 0 ; i < numberOfComponents ; i++)
        if (this._components[i] && this._components[i].getValue)
            value.components[i] = this._components[i].getValue();

    return value;
};

/**
 * Similar to @{@link getValue}, but returns the actual "computed" value. E.g.
 * a proportional size of 0.5 might resolve into a "computed" size of 200px
 * (assuming the parent has a width of 400px).
 *
 * @method getComputedValue
 *
 * @return {Object}     Serialized representation of the node, including
 *                      children, excluding components.
 */
Node.prototype.getComputedValue = function getComputedValue () {
    var numberOfChildren = this._children.length;

    var value = {
        location: this.value.location,
        computedValues: this._calculatedValues,
        children: new Array(numberOfChildren)
    };

    for (var i = 0 ; i < numberOfChildren ; i++)
        value.children[i] = this._children[i].getComputedValue();

    return value;
};

/**
 * Retrieves all children of the current node.
 *
 * @method getChildren
 *
 * @return {Array.<Node>}   An array of children.
 */
Node.prototype.getChildren = function getChildren () {
    return this._children;
};

/**
 * Retrieves the parent of the current node. Unmounted nodes do not have a
 * parent node.
 *
 * @method getParent
 *
 * @return {Node}       Parent node.
 */
Node.prototype.getParent = function getParent () {
    return this._parent;
};

/**
 * Schedules the @{@link update} function of the node to be invoked on the next
 * frame (if no update during this frame has been scheduled already).
 * If the node is currently being updated (which means one of the requesters
 * invoked requestsUpdate while being updated itself), an update will be
 * scheduled on the next frame.
 *
 * @method requestUpdate
 *
 * @param  {Object} requester   If the requester has an `onUpdate` method, it
 *                              will be invoked during the next update phase of
 *                              the node.
 *
 * @return {Node} this
 */
Node.prototype.requestUpdate = function requestUpdate (requester) {
    if (this._inUpdate || !this.isMounted())
        return this.requestUpdateOnNextTick(requester);
    this._updateQueue.push(requester);
    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Schedules an update on the next tick. Similarily to @{@link requestUpdate},
 * `requestUpdateOnNextTick` schedules the node's `onUpdate` function to be
 * invoked on the frame after the next invocation on the node's onUpdate function.
 *
 * @method requestUpdateOnNextTick
 *
 * @param  {Object} requester   If the requester has an `onUpdate` method, it
 *                              will be invoked during the next update phase of
 *                              the node.
 *
 * @return {Node} this
 */
Node.prototype.requestUpdateOnNextTick = function requestUpdateOnNextTick (requester) {
    this._nextUpdateQueue.push(requester);
    return this;
};

/**
 * Get the object responsible for updating this node.
 *
 * @method
 *
 * @return {Object} The global updater.
 */
Node.prototype.getUpdater = function getUpdater () {
    return this._globalUpdater;
};

/**
 * Checks if the node is mounted. Unmounted nodes are detached from the scene
 * graph.
 *
 * @method isMounted
 *
 * @return {Boolean}    Boolean indicating weather the node is mounted or not.
 */
Node.prototype.isMounted = function isMounted () {
    return this.value.showState.mounted;
};

/**
 * Checks if the node is visible ("shown").
 *
 * @method isShown
 *
 * @return {Boolean}    Boolean indicating weather the node is visible
 *                      ("shown") or not.
 */
Node.prototype.isShown = function isShown () {
    return this.value.showState.shown;
};

/**
 * Determines the node's relative opacity.
 * The opacity needs to be within [0, 1], where 0 indicates a completely
 * transparent, therefore invisible node, whereas an opacity of 1 means the
 * node is completely solid.
 *
 * @method getOpacity
 *
 * @return {Number}         Relative opacity of the node.
 */
Node.prototype.getOpacity = function getOpacity () {
    return this.value.showState.opacity;
};

/**
 * Determines the node's previously set mount point.
 *
 * @method getMountPoint
 *
 * @return {Float32Array}   An array representing the mount point.
 */
Node.prototype.getMountPoint = function getMountPoint () {
    return this.value.offsets.mountPoint;
};

/**
 * Determines the node's previously set align.
 *
 * @method getAlign
 *
 * @return {Float32Array}   An array representing the align.
 */
Node.prototype.getAlign = function getAlign () {
    return this.value.offsets.align;
};

/**
 * Determines the node's previously set origin.
 *
 * @method getOrigin
 *
 * @return {Float32Array}   An array representing the origin.
 */
Node.prototype.getOrigin = function getOrigin () {
    return this.value.offsets.origin;
};

/**
 * Determines the node's previously set position.
 *
 * @method getPosition
 *
 * @return {Float32Array}   An array representing the position.
 */
Node.prototype.getPosition = function getPosition () {
    return this.value.vectors.position;
};

/**
 * Returns the node's current rotation
 *
 * @method getRotation
 *
 * @return {Float32Array} an array of four values, showing the rotation as a quaternion
 */
Node.prototype.getRotation = function getRotation () {
    return this.value.vectors.rotation;
};

/**
 * Returns the scale of the node
 *
 * @method
 *
 * @return {Float32Array} an array showing the current scale vector
 */
Node.prototype.getScale = function getScale () {
    return this.value.vectors.scale;
};

/**
 * Returns the current size mode of the node
 *
 * @method
 *
 * @return {Float32Array} an array of numbers showing the current size mode
 */
Node.prototype.getSizeMode = function getSizeMode () {
    return this.value.size.sizeMode;
};

/**
 * Returns the current proportional size
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current proportional size
 */
Node.prototype.getProportionalSize = function getProportionalSize () {
    return this.value.size.proportional;
};

/**
 * Returns the differential size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current differential size
 */
Node.prototype.getDifferentialSize = function getDifferentialSize () {
    return this.value.size.differential;
};

/**
 * Returns the absolute size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current absolute size of the node
 */
Node.prototype.getAbsoluteSize = function getAbsoluteSize () {
    return this.value.size.absolute;
};

/**
 * Returns the current Render Size of the node. Note that the render size
 * is asynchronous (will always be one frame behind) and needs to be explicitely
 * calculated by setting the proper size mode.
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current render size
 */
Node.prototype.getRenderSize = function getRenderSize () {
    return this.value.size.render;
};

/**
 * Returns the external size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 of the final calculated side of the node
 */
Node.prototype.getSize = function getSize () {
    return this._calculatedValues.size;
};

/**
 * Returns the current world transform of the node
 *
 * @method
 *
 * @return {Float32Array} a 16 value transform
 */
Node.prototype.getTransform = function getTransform () {
    return this._calculatedValues.transform;
};

/**
 * Get the list of the UI Events that are currently associated with this node
 *
 * @method
 *
 * @return {Array} an array of strings representing the current subscribed UI event of this node
 */
Node.prototype.getUIEvents = function getUIEvents () {
    return this.value.UIEvents;
};

/**
 * Adds a new child to this node. If this method is called with no argument it will
 * create a new node, however it can also be called with an existing node which it will
 * append to the node that this method is being called on. Returns the new or passed in node.
 *
 * @method
 *
 * @param {Node | void} child the node to appended or no node to create a new node.
 *
 * @return {Node} the appended node.
 */
Node.prototype.addChild = function addChild (child) {
    var index = child ? this._children.indexOf(child) : -1;
    child = child ? child : new Node();

    if (index === -1) {
        index = this._freedChildIndicies.length ? this._freedChildIndicies.pop() : this._children.length;
        this._children[index] = child;

        if (this.isMounted() && child.onMount) {
            var myId = this.getId();
            var childId = myId + '/' + index;
            child.onMount(this, childId);
        }

    }

    return child;
};

/**
 * Removes a child node from another node. The passed in node must be
 * a child of the node that this method is called upon.
 *
 * @method
 *
 * @param {Node} child node to be removed
 *
 * @return {Boolean} whether or not the node was successfully removed
 */
Node.prototype.removeChild = function removeChild (child) {
    var index = this._children.indexOf(child);
    var added = index !== -1;
    if (added) {
        this._freedChildIndicies.push(index);

        this._children[index] = null;

        if (this.isMounted() && child.onDismount)
            child.onDismount();
    }
    return added;
};

/**
 * Each component can only be added once per node.
 *
 * @method addComponent
 *
 * @param {Object} component    An component to be added.
 * @return {Number} index       The index at which the component has been
 *                              registered. Indices aren't necessarily
 *                              consecutive.
 */
Node.prototype.addComponent = function addComponent (component) {
    var index = this._components.indexOf(component);
    if (index === -1) {
        index = this._freedComponentIndicies.length ? this._freedComponentIndicies.pop() : this._components.length;
        this._components[index] = component;

        if (this.isMounted() && component.onMount)
            component.onMount(this, index);

        if (this.isShown() && component.onShow)
            component.onShow();
    }

    return index;
};

/**
 * @method  getComponent
 *
 * @param  {Number} index   Index at which the component has been regsitered
 *                          (using `Node#addComponent`).
 * @return {*}              The component registered at the passed in index (if
 *                          any).
 */
Node.prototype.getComponent = function getComponent (index) {
    return this._components[index];
};

/**
 * Removes a previously via @{@link addComponent} added component.
 *
 * @method removeComponent
 *
 * @param  {Object} component   An component that has previously been added
 *                              using @{@link addComponent}.
 *
 * @return {Node} this
 */
Node.prototype.removeComponent = function removeComponent (component) {
    var index = this._components.indexOf(component);
    if (index !== -1) {
        this._freedComponentIndicies.push(index);
        if (this.isShown() && component.onHide)
            component.onHide();

        if (this.isMounted() && component.onDismount)
            component.onDismount();

        this._components[index] = null;
    }
    return component;
};

/**
 * Subscribes a node to a UI Event. All components on the node
 * will have the opportunity to begin listening to that event
 * and alerting the scene graph.
 *
 * @method
 *
 * @param {String} eventName the name of the event
 *
 * @return {undefined} undefined
 */
Node.prototype.addUIEvent = function addUIEvent (eventName) {
    var UIEvents = this.getUIEvents();
    var components = this._components;
    var component;

    var added = UIEvents.indexOf(eventName) !== -1;
    if (!added) {
        UIEvents.push(eventName);
        for (var i = 0, len = components.length ; i < len ; i++) {
            component = components[i];
            if (component && component.onAddUIEvent) component.onAddUIEvent(eventName);
        }
    }
};

/**
 * Private method for the Node to request an update for itself.
 *
 * @method
 * @private
 *
 * @param {Boolean} force whether or not to force the update
 *
 * @return {undefined} undefined
 */
Node.prototype._requestUpdate = function _requestUpdate (force) {
    if (force || (!this._requestingUpdate && this._globalUpdater)) {
        this._globalUpdater.requestUpdate(this);
        this._requestingUpdate = true;
    }
};

/**
 * Private method to set an optional value in an array, and
 * request an update if this changes the value of the array.
 *
 * @method
 *
 * @param {Array} vec the array to insert the value into
 * @param {Number} index the index at which to insert the value
 * @param {Any} val the value to potentially insert (if not null or undefined)
 *
 * @return {Boolean} whether or not a new value was inserted.
 */
Node.prototype._vecOptionalSet = function _vecOptionalSet (vec, index, val) {
    if (val != null && vec[index] !== val) {
        vec[index] = val;
        if (!this._requestingUpdate) this._requestUpdate();
        return true;
    }
    return false;
};

/**
 * Shows the node, which is to say, calls onShow on all of the
 * node's components. Renderable components can then issue the
 * draw commands necessary to be shown.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.show = function show () {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    this.value.showState.shown = true;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onShow) item.onShow();
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentShow) item.onParentShow();
    }
    return this;
};

/**
 * Hides the node, which is to say, calls onHide on all of the
 * node's components. Renderable components can then issue
 * the draw commands necessary to be hidden
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.hide = function hide () {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    this.value.showState.shown = false;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onHide) item.onHide();
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentHide) item.onParentHide();
    }
    return this;
};

/**
 * Sets the align value of the node. Will call onAlignChange
 * on all of the Node's components.
 *
 * @method
 *
 * @param {Number} x Align value in the x dimension.
 * @param {Number} y Align value in the y dimension.
 * @param {Number} z Align value in the z dimension.
 *
 * @return {Node} this
 */
Node.prototype.setAlign = function setAlign (x, y, z) {
    var vec3 = this.value.offsets.align;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onAlignChange) item.onAlignChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the mount point value of the node. Will call onMountPointChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x MountPoint value in x dimension
 * @param {Number} y MountPoint value in y dimension
 * @param {Number} z MountPoint value in z dimension
 *
 * @return {Node} this
 */
Node.prototype.setMountPoint = function setMountPoint (x, y, z) {
    var vec3 = this.value.offsets.mountPoint;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onMountPointChange) item.onMountPointChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the origin value of the node. Will call onOriginChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x Origin value in x dimension
 * @param {Number} y Origin value in y dimension
 * @param {Number} z Origin value in z dimension
 *
 * @return {Node} this
 */
Node.prototype.setOrigin = function setOrigin (x, y, z) {
    var vec3 = this.value.offsets.origin;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onOriginChange) item.onOriginChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the position of the node. Will call onPositionChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x Position in x
 * @param {Number} y Position in y
 * @param {Number} z Position in z
 *
 * @return {Node} this
 */
Node.prototype.setPosition = function setPosition (x, y, z) {
    var vec3 = this.value.vectors.position;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onPositionChange) item.onPositionChange(x, y, z);
        }
    }

    return this;
};

/**
 * Sets the rotation of the node. Will call onRotationChange
 * on all of the node's components. This method takes either
 * Euler angles or a quaternion. If the fourth argument is undefined
 * Euler angles are assumed.
 *
 * @method
 *
 * @param {Number} x Either the rotation around the x axis or the magnitude in x of the axis of rotation.
 * @param {Number} y Either the rotation around the y axis or the magnitude in y of the axis of rotation.
 * @param {Number} z Either the rotation around the z axis or the magnitude in z of the axis of rotation.
 * @param {Number|undefined} w the amount of rotation around the axis of rotation, if a quaternion is specified.
 *
 * @return {undefined} undefined
 */
Node.prototype.setRotation = function setRotation (x, y, z, w) {
    var quat = this.value.vectors.rotation;
    var propogate = false;
    var qx, qy, qz, qw;

    if (w != null) {
        qx = x;
        qy = y;
        qz = z;
        qw = w;
        this._lastEulerX = null;
        this._lastEulerY = null;
        this._lastEulerZ = null;
        this._lastEuler = false;
    }
    else {
        if (x == null || y == null || z == null) {
            if (this._lastEuler) {
                x = x == null ? this._lastEulerX : x;
                y = y == null ? this._lastEulerY : y;
                z = z == null ? this._lastEulerZ : z;
            }
            else {
                var sp = -2 * (quat[1] * quat[2] - quat[3] * quat[0]);

                if (Math.abs(sp) > 0.99999) {
                    y = y == null ? Math.PI * 0.5 * sp : y;
                    x = x == null ? Math.atan2(-quat[0] * quat[2] + quat[3] * quat[1], 0.5 - quat[1] * quat[1] - quat[2] * quat[2]) : x;
                    z = z == null ? 0 : z;
                }
                else {
                    y = y == null ? Math.asin(sp) : y;
                    x = x == null ? Math.atan2(quat[0] * quat[2] + quat[3] * quat[1], 0.5 - quat[0] * quat[0] - quat[1] * quat[1]) : x;
                    z = z == null ? Math.atan2(quat[0] * quat[1] + quat[3] * quat[2], 0.5 - quat[0] * quat[0] - quat[2] * quat[2]) : z;
                }
            }
        }

        var hx = x * 0.5;
        var hy = y * 0.5;
        var hz = z * 0.5;

        var sx = Math.sin(hx);
        var sy = Math.sin(hy);
        var sz = Math.sin(hz);
        var cx = Math.cos(hx);
        var cy = Math.cos(hy);
        var cz = Math.cos(hz);

        var sysz = sy * sz;
        var cysz = cy * sz;
        var sycz = sy * cz;
        var cycz = cy * cz;

        qx = sx * cycz + cx * sysz;
        qy = cx * sycz - sx * cysz;
        qz = cx * cysz + sx * sycz;
        qw = cx * cycz - sx * sysz;

        this._lastEuler = true;
        this._lastEulerX = x;
        this._lastEulerY = y;
        this._lastEulerZ = z;
    }

    propogate = this._vecOptionalSet(quat, 0, qx) || propogate;
    propogate = this._vecOptionalSet(quat, 1, qy) || propogate;
    propogate = this._vecOptionalSet(quat, 2, qz) || propogate;
    propogate = this._vecOptionalSet(quat, 3, qw) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = quat[0];
        y = quat[1];
        z = quat[2];
        w = quat[3];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onRotationChange) item.onRotationChange(x, y, z, w);
        }
    }
    return this;
};

/**
 * Sets the scale of the node. The default value is 1 in all dimensions.
 * The node's components will have onScaleChanged called on them.
 *
 * @method
 *
 * @param {Number} x Scale value in x
 * @param {Number} y Scale value in y
 * @param {Number} z Scale value in z
 *
 * @return {Node} this
 */
Node.prototype.setScale = function setScale (x, y, z) {
    var vec3 = this.value.vectors.scale;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onScaleChange) item.onScaleChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the value of the opacity of this node. All of the node's
 * components will have onOpacityChange called on them/
 *
 * @method
 *
 * @param {Number} val Value of the opacity. 1 is the default.
 *
 * @return {Node} this
 */
Node.prototype.setOpacity = function setOpacity (val) {
    if (val !== this.value.showState.opacity) {
        this.value.showState.opacity = val;
        if (!this._requestingUpdate) this._requestUpdate();

        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onOpacityChange) item.onOpacityChange(val);
        }
    }
    return this;
};

/**
 * Sets the size mode being used for determining the nodes final width, height
 * and depth.
 * Size modes are a way to define the way the node's size is being calculated.
 * Size modes are enums set on the @{@link Size} constructor (and aliased on
 * the Node).
 *
 * @example
 * node.setSizeMode(Node.RELATIVE_SIZE, Node.ABSOLUTE_SIZE, Node.ABSOLUTE_SIZE);
 * // Instead of null, any proporional height or depth can be passed in, since
 * // it would be ignored in any case.
 * node.setProportionalSize(0.5, null, null);
 * node.setAbsoluteSize(null, 100, 200);
 *
 * @method setSizeMode
 *
 * @param {SizeMode} x    The size mode being used for determining the size in
 *                        x direction ("width").
 * @param {SizeMode} y    The size mode being used for determining the size in
 *                        y direction ("height").
 * @param {SizeMode} z    The size mode being used for determining the size in
 *                        z direction ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setSizeMode = function setSizeMode (x, y, z) {
    var vec3 = this.value.size.sizeMode;
    var propogate = false;

    if (x != null) propogate = this._resolveSizeMode(vec3, 0, x) || propogate;
    if (y != null) propogate = this._resolveSizeMode(vec3, 1, y) || propogate;
    if (z != null) propogate = this._resolveSizeMode(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onSizeModeChange) item.onSizeModeChange(x, y, z);
        }
    }
    return this;
};

/**
 * A protected method that resolves string representations of size mode
 * to numeric values and applies them.
 *
 * @method
 *
 * @param {Array} vec the array to write size mode to
 * @param {Number} index the index to write to in the array
 * @param {String|Number} val the value to write
 *
 * @return {Bool} whether or not the sizemode has been changed for this index.
 */
Node.prototype._resolveSizeMode = function _resolveSizeMode (vec, index, val) {
    if (val.constructor === String) {
        switch (val.toLowerCase()) {
            case 'relative':
            case 'default':
                return this._vecOptionalSet(vec, index, 0);
            case 'absolute':
                return this._vecOptionalSet(vec, index, 1);
            case 'render':
                return this._vecOptionalSet(vec, index, 2);
            default: throw new Error('unknown size mode: ' + val);
        }
    }
    else return this._vecOptionalSet(vec, index, val);
};

/**
 * A proportional size defines the node's dimensions relative to its parents
 * final size.
 * Proportional sizes need to be within the range of [0, 1].
 *
 * @method setProportionalSize
 *
 * @param {Number} x    x-Size in pixels ("width").
 * @param {Number} y    y-Size in pixels ("height").
 * @param {Number} z    z-Size in pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setProportionalSize = function setProportionalSize (x, y, z) {
    var vec3 = this.value.size.proportional;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onProportionalSizeChange) item.onProportionalSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Differential sizing can be used to add or subtract an absolute size from a
 * otherwise proportionally sized node.
 * E.g. a differential width of `-10` and a proportional width of `0.5` is
 * being interpreted as setting the node's size to 50% of its parent's width
 * *minus* 10 pixels.
 *
 * @method setDifferentialSize
 *
 * @param {Number} x    x-Size to be added to the relatively sized node in
 *                      pixels ("width").
 * @param {Number} y    y-Size to be added to the relatively sized node in
 *                      pixels ("height").
 * @param {Number} z    z-Size to be added to the relatively sized node in
 *                      pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setDifferentialSize = function setDifferentialSize (x, y, z) {
    var vec3 = this.value.size.differential;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onDifferentialSizeChange) item.onDifferentialSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the nodes size in pixels, independent of its parent.
 *
 * @method setAbsoluteSize
 *
 * @param {Number} x    x-Size in pixels ("width").
 * @param {Number} y    y-Size in pixels ("height").
 * @param {Number} z    z-Size in pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setAbsoluteSize = function setAbsoluteSize (x, y, z) {
    var vec3 = this.value.size.absolute;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onAbsoluteSizeChange) item.onAbsoluteSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Private method for alerting all components and children that
 * this node's transform has changed.
 *
 * @method
 *
 * @param {Float32Array} transform The transform that has changed
 *
 * @return {undefined} undefined
 */
Node.prototype._transformChanged = function _transformChanged (transform) {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onTransformChange) item.onTransformChange(transform);
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentTransformChange) item.onParentTransformChange(transform);
    }
};

/**
 * Private method for alerting all components and children that
 * this node's size has changed.
 *
 * @method
 *
 * @param {Float32Array} size the size that has changed
 *
 * @return {undefined} undefined
 */
Node.prototype._sizeChanged = function _sizeChanged (size) {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onSizeChange) item.onSizeChange(size);
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentSizeChange) item.onParentSizeChange(size);
    }
};

/**
 * Method for getting the current frame. Will be depricated.
 *
 * @method
 *
 * @return {Number} current frame
 */
Node.prototype.getFrame = function getFrame () {
    return this._globalUpdater.getFrame();
};

/**
 * returns an array of the components currently attached to this
 * node.
 *
 * @method getComponents
 *
 * @return {Array} list of components.
 */
Node.prototype.getComponents = function getComponents () {
    return this._components;
};

/**
 * Enters the node's update phase while updating its own spec and updating its components.
 *
 * @method update
 *
 * @param  {Number} time    high-resolution timstamp, usually retrieved using
 *                          requestAnimationFrame
 *
 * @return {Node} this
 */
Node.prototype.update = function update (time){
    this._inUpdate = true;
    var nextQueue = this._nextUpdateQueue;
    var queue = this._updateQueue;
    var item;

    while (nextQueue.length) queue.unshift(nextQueue.pop());

    while (queue.length) {
        item = this._components[queue.shift()];
        if (item && item.onUpdate) item.onUpdate(time);
    }

    var mySize = this.getSize();
    var myTransform = this.getTransform();
    var parent = this.getParent();
    var parentSize = parent.getSize();
    var parentTransform = parent.getTransform();
    var sizeChanged = SIZE_PROCESSOR.fromSpecWithParent(parentSize, this, mySize);

    var transformChanged = TRANSFORM_PROCESSOR.fromSpecWithParent(parentTransform, this.value, mySize, parentSize, myTransform);
    if (transformChanged) this._transformChanged(myTransform);
    if (sizeChanged) this._sizeChanged(mySize);

    this._inUpdate = false;
    this._requestingUpdate = false;

    if (!this.isMounted()) {
        // last update
        this._parent = null;
        this.value.location = null;
        this._globalUpdater = null;
    }
    else if (this._nextUpdateQueue.length) {
        this._globalUpdater.requestUpdateOnNextTick(this);
        this._requestingUpdate = true;
    }
    return this;
};

/**
 * Mounts the node and therefore its subtree by setting it as a child of the
 * passed in parent.
 *
 * @method mount
 *
 * @param  {Node} parent    parent node
 * @param  {String} myId    path to node (e.g. `body/0/1`)
 *
 * @return {Node} this
 */
Node.prototype.mount = function mount (parent, myId) {
    if (this.isMounted()) return this;
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;

    this._parent = parent;
    this._globalUpdater = parent.getUpdater();
    this.value.location = myId;
    this.value.showState.mounted = true;

    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onMount) item.onMount(this, i);
    }

    i = 0;
    list = this._children;
    len = list.length;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onParentMount) item.onParentMount(this, myId, i);
    }

    if (!this._requestingUpdate) this._requestUpdate(true);
    return this;
};

/**
 * Dismounts (detaches) the node from the scene graph by removing it as a
 * child of its parent.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.dismount = function dismount () {
    if (!this.isMounted()) return this;
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;

    this.value.showState.mounted = false;

    this._parent.removeChild(this);

    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onDismount) item.onDismount();
    }

    i = 0;
    list = this._children;
    len = list.length;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onParentDismount) item.onParentDismount();
    }

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Function to be invoked by the parent as soon as the parent is
 * being mounted.
 *
 * @method onParentMount
 *
 * @param  {Node} parent        The parent node.
 * @param  {String} parentId    The parent id (path to parent).
 * @param  {Number} index       Id the node should be mounted to.
 *
 * @return {Node} this
 */
Node.prototype.onParentMount = function onParentMount (parent, parentId, index) {
    return this.mount(parent, parentId + '/' + index);
};

/**
 * Function to be invoked by the parent as soon as the parent is being
 * unmounted.
 *
 * @method onParentDismount
 *
 * @return {Node} this
 */
Node.prototype.onParentDismount = function onParentDismount () {
    return this.dismount();
};

/**
 * Method to be called in order to dispatch an event to the node and all its
 * components. Note that this doesn't recurse the subtree.
 *
 * @method receive
 *
 * @param  {String} type   The event type (e.g. "click").
 * @param  {Object} ev     The event payload object to be dispatched.
 *
 * @return {Node} this
 */
Node.prototype.receive = function receive (type, ev) {
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onReceive) item.onReceive(type, ev);
    }
    return this;
};


/**
 * Private method to avoid accidentally passing arguments
 * to update events.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype._requestUpdateWithoutArgs = function _requestUpdateWithoutArgs () {
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * A method to execute logic on update. Defaults to the
 * node's .update method.
 *
 * @method
 *
 * @param {Number} current time
 *
 * @return {undefined} undefined
 */
Node.prototype.onUpdate = Node.prototype.update;

/**
 * A method to execute logic when a parent node is shown. Delegates
 * to Node.show.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onParentShow = Node.prototype.show;

/**
 * A method to execute logic when the parent is hidden. Delegates
 * to Node.hide.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onParentHide = Node.prototype.hide;

/**
 * A method to execute logic when the parent transform changes.
 * Delegates to Node._requestUpdateWithoutArgs.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype.onParentTransformChange = Node.prototype._requestUpdateWithoutArgs;

/**
 * A method to execute logic when the parent size changes.
 * Delegates to Node._requestUpdateWIthoutArgs.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype.onParentSizeChange = Node.prototype._requestUpdateWithoutArgs;

/**
 * A method to execute logic when the node something wants
 * to show the node. Delegates to Node.show.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onShow = Node.prototype.show;

/**
 * A method to execute logic when something wants to hide this
 * node. Delegates to Node.hide.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onHide = Node.prototype.hide;

/**
 * A method which can execute logic when this node is added to
 * to the scene graph. Delegates to mount.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onMount = Node.prototype.mount;

/**
 * A method which can execute logic when this node is removed from
 * the scene graph. Delegates to Node.dismount.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onDismount = Node.prototype.dismount;

/**
 * A method which can execute logic when this node receives
 * an event from the scene graph. Delegates to Node.receive.
 *
 * @method
 *
 * @param {String} event name
 * @param {Object} payload
 *
 * @return {undefined} undefined
 */
Node.prototype.onReceive = Node.prototype.receive;

module.exports = Node;

},{"./Size":9,"./Transform":10}],8:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

var Dispatch = require('./Dispatch');
var Node = require('./Node');
var Size = require('./Size');

/**
 * Scene is the bottom of the scene graph. It is it's own
 * parent and provides the global updater to the scene graph.
 *
 * @class Scene
 * @constructor
 *
 * @param {String} selector a string which is a dom selector
 *                 signifying which dom element the context
 *                 should be set upon
 * @param {Famous} updater a class which conforms to Famous' interface
 *                 it needs to be able to send methods to
 *                 the renderers and update nodes in the scene graph
 */
function Scene (selector, updater) {
    if (!selector) throw new Error('Scene needs to be created with a DOM selector');
    if (!updater) throw new Error('Scene needs to be created with a class like Famous');

    Node.call(this);         // Scene inherits from node

    this._updater = updater; // The updater that will both
                             // send messages to the renderers
                             // and update dirty nodes 

    this._dispatch = new Dispatch(this); // instantiates a dispatcher
                                         // to send events to the scene
                                         // graph below this context
    
    this._selector = selector; // reference to the DOM selector
                               // that represents the elemnent
                               // in the dom that this context
                               // inhabits

    this.onMount(this, selector); // Mount the context to itself
                                  // (it is its own parent)
    
    this._updater                  // message a request for the dom
        .message('NEED_SIZE_FOR')  // size of the context so that
        .message(selector);        // the scene graph has a total size

    this.show(); // the context begins shown (it's already present in the dom)

}

// Scene inherits from node
Scene.prototype = Object.create(Node.prototype);
Scene.prototype.constructor = Scene;

/**
 * Scene getUpdater function returns the passed in updater
 *
 * @return {Famous} the updater for this Scene
 */
Scene.prototype.getUpdater = function getUpdater () {
    return this._updater;
};

/**
 * Returns the selector that the context was instantiated with
 *
 * @return {String} dom selector
 */
Scene.prototype.getSelector = function getSelector () {
    return this._selector;
};

/**
 * Returns the dispatcher of the context. Used to send events
 * to the nodes in the scene graph.
 *
 * @return {Dispatch} the Scene's Dispatch
 */
Scene.prototype.getDispatch = function getDispatch () {
    return this._dispatch;
};

/**
 * Receives an event. If the event is 'CONTEXT_RESIZE' it sets the size of the scene
 * graph to the payload, which must be an array of numbers of at least
 * length three representing the pixel size in 3 dimensions.
 *
 * @param {String} event the name of the event being received
 * @param {*} payload the object being sent
 *
 * @return {undefined} undefined
 */
Scene.prototype.onReceive = function onReceive (event, payload) {
    // TODO: In the future the dom element that the context is attached to
    // should have a representation as a component. It would be render sized
    // and the context would receive its size the same way that any render size
    // component receives its size.
    if (event === 'CONTEXT_RESIZE') {
        
        if (payload.length < 2) 
            throw new Error(
                    'CONTEXT_RESIZE\'s payload needs to be at least a pair' +
                    ' of pixel sizes'
            );

        this.setSizeMode(Size.ABSOLUTE, Size.ABSOLUTE, Size.ABSOLUTE);
        this.setAbsoluteSize(payload[0],
                             payload[1],
                             payload[2] ? payload[2] : 0);

    }
};

module.exports = Scene;


},{"./Dispatch":4,"./Node":7,"./Size":9}],9:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Size class is responsible for processing Size from a node
 * @constructor Size
 */
function Size () {
    this._size = new Float32Array(3);
}

// an enumeration of the different types of size modes
Size.RELATIVE = 0;
Size.ABSOLUTE = 1;
Size.RENDER = 2;
Size.DEFAULT = Size.RELATIVE;

/**
 * fromSpecWithParent takes the parent node's size, the target nodes spec,
 * and a target array to write to. Using the node's size mode it calculates 
 * a final size for the node from the node's spec. Returns whether or not
 * the final size has changed from its last value.
 *
 * @param {Array} parentSize parent node's calculated size
 * @param {Node.Spec} node the target node's spec
 * @param {Array} target an array to write the result to
 *
 * @return {Boolean} true if the size of the node has changed.
 */
Size.prototype.fromSpecWithParent = function fromSpecWithParent (parentSize, node, target) {
    var spec = node.getValue().spec;
    var components = node.getComponents();
    var mode = spec.size.sizeMode;
    var prev;
    var changed = false;
    var len = components.length;
    var j;
    for (var i = 0 ; i < 3 ; i++) {
        switch (mode[i]) {
            case Size.RELATIVE:
                prev = target[i];
                target[i] = parentSize[i] * spec.size.proportional[i] + spec.size.differential[i];
                break;
            case Size.ABSOLUTE:
                prev = target[i];
                target[i] = spec.size.absolute[i];
                break;
            case Size.RENDER:
                var candidate;
                for (j = 0; j < len ; j++) {
                    if (components[j].getRenderSize) {
                        candidate = components[j].getRenderSize()[i];
                        prev = target[i];
                        target[i] = target[i] < candidate || target[i] === 0 ? candidate : target[i];
                    }
                }
                break;
        }
        changed = changed || prev !== target[i];
    }
    return changed;
};

module.exports = Size;

},{}],10:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The transform class is responsible for calculating the transform of a particular
 * node from the data on the node and its parent
 *
 * @constructor Transform
 */
function Transform () {
    this._matrix = new Float32Array(16);
}

/**
 * Returns the last calculated transform
 *
 * @return {Array} a transform
 */
Transform.prototype.get = function get () {
    return this._matrix;
};

/**
 * Uses the parent transform, the node's spec, the node's size, and the parent's size
 * to calculate a final transform for the node. Returns true if the transform has changed.
 *
 * @param {Array} parentMatrix the parent matrix
 * @param {Node.Spec} spec the target node's spec
 * @param {Array} mySize the size of the node
 * @param {Array} parentSize the size of the parent
 * @param {Array} target the target array to write the resulting transform to
 *
 * @return {Boolean} whether or not the transform changed
 */
Transform.prototype.fromSpecWithParent = function fromSpecWithParent (parentMatrix, spec, mySize, parentSize, target) {
    target = target ? target : this._matrix;

    // local cache of everything
    var t00         = target[0];
    var t01         = target[1];
    var t02         = target[2];
    var t10         = target[4];
    var t11         = target[5];
    var t12         = target[6];
    var t20         = target[8];
    var t21         = target[9];
    var t22         = target[10];
    var t30         = target[12];
    var t31         = target[13];
    var t32         = target[14];
    var p00         = parentMatrix[0];
    var p01         = parentMatrix[1];
    var p02         = parentMatrix[2];
    var p10         = parentMatrix[4];
    var p11         = parentMatrix[5];
    var p12         = parentMatrix[6];
    var p20         = parentMatrix[8];
    var p21         = parentMatrix[9];
    var p22         = parentMatrix[10];
    var p30         = parentMatrix[12];
    var p31         = parentMatrix[13];
    var p32         = parentMatrix[14];
    var posX        = spec.vectors.position[0];
    var posY        = spec.vectors.position[1];
    var posZ        = spec.vectors.position[2];
    var rotX        = spec.vectors.rotation[0];
    var rotY        = spec.vectors.rotation[1];
    var rotZ        = spec.vectors.rotation[2];
    var rotW        = spec.vectors.rotation[3];
    var scaleX      = spec.vectors.scale[0];
    var scaleY      = spec.vectors.scale[1];
    var scaleZ      = spec.vectors.scale[2];
    var alignX      = spec.offsets.align[0] * parentSize[0];
    var alignY      = spec.offsets.align[1] * parentSize[1];
    var alignZ      = spec.offsets.align[2] * parentSize[2];
    var mountPointX = spec.offsets.mountPoint[0] * mySize[0];
    var mountPointY = spec.offsets.mountPoint[1] * mySize[1];
    var mountPointZ = spec.offsets.mountPoint[2] * mySize[2];
    var originX     = spec.offsets.origin[0] * mySize[0];
    var originY     = spec.offsets.origin[1] * mySize[1];
    var originZ     = spec.offsets.origin[2] * mySize[2];

    var wx = rotW * rotX;
    var wy = rotW * rotY;
    var wz = rotW * rotZ;
    var xx = rotX * rotX;
    var yy = rotY * rotY;
    var zz = rotZ * rotZ;
    var xy = rotX * rotY;
    var xz = rotX * rotZ;
    var yz = rotY * rotZ;

    var rs0 = (1 - 2 * (yy + zz)) * scaleX;
    var rs1 = (2 * (xy + wz)) * scaleX;
    var rs2 = (2 * (xz - wy)) * scaleX;
    var rs3 = (2 * (xy - wz)) * scaleY;
    var rs4 = (1 - 2 * (xx + zz)) * scaleY;
    var rs5 = (2 * (yz + wx)) * scaleY;
    var rs6 = (2 * (xz + wy)) * scaleZ;
    var rs7 = (2 * (yz - wx)) * scaleZ;
    var rs8 = (1 - 2 * (xx + yy)) * scaleZ;

    var tx = alignX + posX - mountPointX + originX - (rs0 * originX + rs3 * originY + rs6 * originZ);
    var ty = alignY + posY - mountPointY + originY - (rs1 * originX + rs4 * originY + rs7 * originZ);
    var tz = alignZ + posZ - mountPointZ + originZ - (rs2 * originX + rs5 * originY + rs8 * originZ);

    target[0] = p00 * rs0 + p10 * rs1 + p20 * rs2;
    target[1] = p01 * rs0 + p11 * rs1 + p21 * rs2;
    target[2] = p02 * rs0 + p12 * rs1 + p22 * rs2;
    target[3] = 0;
    target[4] = p00 * rs3 + p10 * rs4 + p20 * rs5;
    target[5] = p01 * rs3 + p11 * rs4 + p21 * rs5;
    target[6] = p02 * rs3 + p12 * rs4 + p22 * rs5;
    target[7] = 0;
    target[8] = p00 * rs6 + p10 * rs7 + p20 * rs8;
    target[9] = p01 * rs6 + p11 * rs7 + p21 * rs8;
    target[10] = p02 * rs6 + p12 * rs7 + p22 * rs8;
    target[11] = 0;
    target[12] = p00 * tx + p10 * ty + p20 * tz + p30;
    target[13] = p01 * tx + p11 * ty + p21 * tz + p31;
    target[14] = p02 * tx + p12 * ty + p22 * tz + p32;
    target[15] = 1;

    return t00 !== target[0] ||
        t01 !== target[1] ||
        t02 !== target[2] ||
        t10 !== target[4] ||
        t11 !== target[5] ||
        t12 !== target[6] ||
        t20 !== target[8] ||
        t21 !== target[9] ||
        t22 !== target[10] ||
        t30 !== target[12] ||
        t31 !== target[13] ||
        t32 !== target[14];

};

module.exports = Transform;

},{}],11:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var CallbackStore = require('../utilities/CallbackStore');

var RENDER_SIZE = 2;

/**
 * A DOMElement is a component that can be added to a Node with the
 * purpose of sending draw commands to the renderer. Renderables send draw commands
 * to through their Nodes to the Compositor where they are acted upon.
 *
 * @class DOMElement
 *
 * @param {Node} node                   The Node to which the `DOMElement`
 *                                      renderable should be attached to.
 * @param {Object} options              Initial options used for instantiating
 *                                      the Node.
 * @param {Object} options.properties   CSS properties that should be added to
 *                                      the actual DOMElement on the initial draw.
 * @param {Object} options.attributes   Element attributes that should be added to
 *                                      the actual DOMElement.
 * @param {String} options.id           String to be applied as 'id' of the actual
 *                                      DOMElement.
 * @param {String} options.content      String to be applied as the content of the
 *                                      actual DOMElement.
 * @param {Boolean} options.cutout      Specifies the presence of a 'cutout' in the
 *                                      WebGL canvas over this element which allows
 *                                      for DOM and WebGL layering.  On by default.
 */
function DOMElement(node, options) {
    if (!node) throw new Error('DOMElement must be instantiated on a node');

    this._node = node;
    this._parent = null;
    this._children = [];

    this._requestingUpdate = false;
    this._renderSized = false;
    this._requestRenderSize = false;

    this._changeQueue = [];

    this._UIEvents = node.getUIEvents().slice(0);
    this._classes = ['famous-dom-element'];
    this._requestingEventListeners = [];
    this._styles = {};

    this.setProperty('display', node.isShown() ? 'none' : 'block');
    this.onOpacityChange(node.getOpacity());

    this._attributes = {};
    this._content = '';

    this._tagName = options && options.tagName ? options.tagName : 'div';
    this._id = node ? node.addComponent(this) : null;

    this._renderSize = [0, 0, 0];

    this._callbacks = new CallbackStore();


    if (!options) return;

    var i;
    var key;

    if (options.classes)
        for (i = 0; i < options.classes.length; i++)
            this.addClass(options.classes[i]);

    if (options.attributes)
        for (key in options.attributes)
            this.setAttribute(key, options.attributes[key]);

    if (options.properties)
        for (key in options.properties)
            this.setProperty(key, options.properties[key]);

    if (options.id) this.setId(options.id);
    if (options.content) this.setContent(options.content);
    if (options.cutout === false) this.setCutoutState(options.cutout);
}

/**
 * Serializes the state of the DOMElement.
 *
 * @method
 *
 * @return {Object} serialized interal state
 */
DOMElement.prototype.getValue = function getValue() {
    return {
        classes: this._classes,
        styles: this._styles,
        attributes: this._attributes,
        content: this._content,
        id: this._attributes.id,
        tagName: this._tagName
    };
};

/**
 * Method to be invoked by the node as soon as an update occurs. This allows
 * the DOMElement renderable to dynamically react to state changes on the Node.
 *
 * This flushes the internal draw command queue by sending individual commands
 * to the node using `sendDrawCommand`.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onUpdate = function onUpdate() {
    var node = this._node;
    var queue = this._changeQueue;
    var len = queue.length;

    if (len && node) {
        node.sendDrawCommand('WITH');
        node.sendDrawCommand(node.getLocation());

        while (len--) node.sendDrawCommand(queue.shift());
        if (this._requestRenderSize) {
            node.sendDrawCommand('DOM_RENDER_SIZE');
            node.sendDrawCommand(node.getLocation());
            this._requestRenderSize = false;
        }

    }

    this._requestingUpdate = false;
};

/**
 * Private method which sets the parent of the element in the DOM
 * hierarchy.
 *
 * @method _setParent
 * @private
 *
 * @param {String} path of the parent
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._setParent = function _setParent(path) {
    if (this._node) {
        var location = this._node.getLocation();
        if (location === path || location.indexOf(path) === -1)
            throw new Error('The given path isn\'t an ancestor');
        this._parent = path;
    } else throw new Error('_setParent called on an Element that isn\'t in the scene graph');
};

/**
 * Private method which adds a child of the element in the DOM
 * hierarchy.
 *
 * @method
 * @private
 *
 * @param {String} path of the child
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._addChild = function _addChild(path) {
    if (this._node) {
        var location = this._node.getLocation();
        if (path === location || path.indexOf(location) === -1)
            throw new Error('The given path isn\'t a descendent');
        if (this._children.indexOf(path) === -1) this._children.push(path);
        else throw new Error('The given path is already a child of this element');
    } else throw new Error('_addChild called on an Element that isn\'t in the scene graph');
};

/**
 * Private method which returns the path of the parent of this element
 *
 * @method
 * @private
 *
 * @return {String} path of the parent element
 */
DOMElement.prototype._getParent = function _getParent() {
    return this._parent;
};

/**
 * Private method which returns an array of paths of the children elements
 * of this element
 *
 * @method
 * @private
 *
 * @return {Array} an array of the paths of the child element
 */
DOMElement.prototype._getChildren = function _getChildren() {
    return this._children;
};

/**
 * Method to be invoked by the Node as soon as the node (or any of its
 * ancestors) is being mounted.
 *
 * @method onMount
 *
 * @param {Node} node      Parent node to which the component should be added.
 * @param {String} id      Path at which the component (or node) is being
 *                          attached. The path is being set on the actual
 *                          DOMElement as a `data-fa-path`-attribute.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onMount = function onMount(node, id) {
    this._node = node;
    this._id = id;
    this._UIEvents = node.getUIEvents().slice(0);
    this.draw();
    this.setAttribute('data-fa-path', node.getLocation());
};

/**
 * Method to be invoked by the Node as soon as the node is being dismounted
 * either directly or by dismounting one of its ancestors.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onDismount = function onDismount() {
    this.setProperty('display', 'none');
    this.setAttribute('data-fa-path', '');
    this._initialized = false;
};

/**
 * Method to be invoked by the node as soon as the DOMElement is being shown.
 * This results into the DOMElement setting the `display` property to `block`
 * and therefore visually showing the corresponding DOMElement (again).
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onShow = function onShow() {
    this.setProperty('display', 'block');
};

/**
 * Method to be invoked by the node as soon as the DOMElement is being hidden.
 * This results into the DOMElement setting the `display` property to `none`
 * and therefore visually hiding the corresponding DOMElement (again).
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onHide = function onHide() {
    this.setProperty('display', 'none');
};

/**
 * Enables or disables WebGL 'cutout' for this element, which affects
 * how the element is layered with WebGL objects in the scene.  This is designed
 * mainly as a way to acheive
 *
 * @method
 *
 * @param {Boolean} usesCutout  The presence of a WebGL 'cutout' for this element.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.setCutoutState = function setCutoutState(usesCutout) {
    this._changeQueue.push('GL_CUTOUT_STATE', usesCutout);

    if (this._initialized) this._requestUpdate();
};

/**
 * Method to be invoked by the node as soon as the transform matrix associated
 * with the node changes. The DOMElement will react to transform changes by sending
 * `CHANGE_TRANSFORM` commands to the `DOMRenderer`.
 *
 * @method
 *
 * @param {Float32Array} transform The final transform matrix
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onTransformChange = function onTransformChange (transform) {
    this._changeQueue.push('CHANGE_TRANSFORM');
    for (var i = 0, len = transform.length ; i < len ; i++)
        this._changeQueue.push(transform[i]);

    this.onUpdate();
};

/**
 * Method to be invoked by the node as soon as its computed size changes.
 *
 * @method
 *
 * @param {Float32Array} size Size of the Node in pixels
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.onSizeChange = function onSizeChange(size) {
    var sizeMode = this._node.getSizeMode();
    var sizedX = sizeMode[0] !== RENDER_SIZE;
    var sizedY = sizeMode[1] !== RENDER_SIZE;
    if (this._initialized)
        this._changeQueue.push('CHANGE_SIZE',
            sizedX ? size[0] : sizedX,
            sizedY ? size[1] : sizedY);

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Method to be invoked by the node as soon as its opacity changes
 *
 * @method
 *
 * @param {Number} opacity The new opacity, as a scalar from 0 to 1
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.onOpacityChange = function onOpacityChange(opacity) {
    return this.setProperty('opacity', opacity);
};

/**
 * Method to be invoked by the node as soon as a new UIEvent is being added.
 * This results into an `ADD_EVENT_LISTENER` command being send.
 *
 * @param {String} UIEvent UIEvent to be subscribed to (e.g. `click`)
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onAddUIEvent = function onAddUIEvent(UIEvent) {
    if (this._UIEvents.indexOf(UIEvent) === -1) {
        this._subscribe(UIEvent);
        this._UIEvents.push(UIEvent);
    }
    else if (this._inDraw) {
        this._subscribe(UIEvent);
    }
    return this;
};

/**
 * Appends an `ADD_EVENT_LISTENER` command to the command queue.
 *
 * @method
 * @private
 *
 * @param {String} UIEvent Event type (e.g. `click`)
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._subscribe = function _subscribe (UIEvent) {
    if (this._initialized) {
        this._changeQueue.push('SUBSCRIBE', UIEvent, true);
    }
    if (!this._requestingUpdate) {
        this._requestUpdate();
    }
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * Method to be invoked by the node as soon as the underlying size mode
 * changes. This results into the size being fetched from the node in
 * order to update the actual, rendered size.
 *
 * @method
 *
 * @param {Number} x the sizing mode in use for determining size in the x direction
 * @param {Number} y the sizing mode in use for determining size in the y direction
 * @param {Number} z the sizing mode in use for determining size in the z direction
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onSizeModeChange = function onSizeModeChange(x, y, z) {
    if (x === RENDER_SIZE || y === RENDER_SIZE || z === RENDER_SIZE) {
        this._renderSized = true;
        this._requestRenderSize = true;
    }
    this.onSizeChange(this._node.getSize());
};

/**
 * Method to be retrieve the rendered size of the DOM element that is
 * drawn for this node.
 *
 * @method
 *
 * @return {Array} size of the rendered DOM element in pixels
 */
DOMElement.prototype.getRenderSize = function getRenderSize() {
    return this._renderSize;
};

/**
 * Method to have the component request an update from its Node
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._requestUpdate = function _requestUpdate() {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
};

/**
 * Initializes the DOMElement by sending the `INIT_DOM` command. This creates
 * or reallocates a new Element in the actual DOM hierarchy.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.init = function init() {
    this._changeQueue.push('INIT_DOM', this._tagName);
    this._initialized = true;
    this.onTransformChange(this._node.getTransform());
    this.onSizeChange(this._node.getSize());
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * Sets the id attribute of the DOMElement.
 *
 * @method
 *
 * @param {String} id New id to be set
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setId = function setId (id) {
    this.setAttribute('id', id);
    return this;
};

/**
 * Adds a new class to the internal class list of the underlying Element in the
 * DOM.
 *
 * @method
 *
 * @param {String} value New class name to be added
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.addClass = function addClass (value) {
    if (this._classes.indexOf(value) < 0) {
        if (this._initialized) this._changeQueue.push('ADD_CLASS', value);
        this._classes.push(value);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
        return this;
    }

    if (this._inDraw) {
        if (this._initialized) this._changeQueue.push('ADD_CLASS', value);
        if (!this._requestingUpdate) this._requestUpdate();
    }
    return this;
};

/**
 * Removes a class from the DOMElement's classList.
 *
 * @method
 *
 * @param {String} value Class name to be removed
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.removeClass = function removeClass (value) {
    var index = this._classes.indexOf(value);

    if (index < 0) return this;

    this._changeQueue.push('REMOVE_CLASS', value);

    this._classes.splice(index, 1);

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};


/**
 * Checks if the DOMElement has the passed in class.
 *
 * @method
 *
 * @param {String} value The class name
 *
 * @return {Boolean} Boolean value indicating whether the passed in class name is in the DOMElement's class list.
 */
DOMElement.prototype.hasClass = function hasClass (value) {
    return this._classes.indexOf(value) !== -1;
};

/**
 * Sets an attribute of the DOMElement.
 *
 * @method
 *
 * @param {String} name Attribute key (e.g. `src`)
 * @param {String} value Attribute value (e.g. `http://famo.us`)
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setAttribute = function setAttribute (name, value) {
    if (this._attributes[name] !== value || this._inDraw) {
        this._attributes[name] = value;
        if (this._initialized) this._changeQueue.push('CHANGE_ATTRIBUTE', name, value);
        if (!this._requestUpdate) this._requestUpdate();
    }

    return this;
};

/**
 * Sets a CSS property
 *
 * @chainable
 *
 * @param {String} name  Name of the CSS rule (e.g. `background-color`)
 * @param {String} value Value of CSS property (e.g. `red`)
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setProperty = function setProperty (name, value) {
    if (this._styles[name] !== value || this._inDraw) {
        this._styles[name] = value;
        if (this._initialized) this._changeQueue.push('CHANGE_PROPERTY', name, value);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
    }

    return this;
};

/**
 * Sets the content of the DOMElement. This is using `innerHTML`, escaping user
 * generated content is therefore essential for security purposes.
 *
 * @method
 *
 * @param {String} content Content to be set using `.innerHTML = ...`
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setContent = function setContent (content) {
    if (this._content !== content || this._inDraw) {
        this._content = content;
        if (this._initialized) this._changeQueue.push('CHANGE_CONTENT', content);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
    }

    return this;
};

/**
 * Subscribes to a DOMElement using.
 *
 * @method on
 *
 * @param {String} event       The event type (e.g. `click`).
 * @param {Function} listener  Handler function for the specified event type
 *                              in which the payload event object will be
 *                              passed into.
 *
 * @return {Function} A function to call if you want to remove the callback
 */
DOMElement.prototype.on = function on (event, listener) {
    return this._callbacks.on(event, listener);
};

/**
 * Function to be invoked by the Node whenever an event is being received.
 * There are two different ways to subscribe for those events:
 *
 * 1. By overriding the onReceive method (and possibly using `switch` in order
 *     to differentiate between the different event types).
 * 2. By using DOMElement and using the built-in CallbackStore.
 *
 * @method
 *
 * @param {String} event Event type (e.g. `click`)
 * @param {Object} payload Event object.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onReceive = function onReceive (event, payload) {
    if (event === 'resize') {
        this._renderSize[0] = payload.val[0];
        this._renderSize[1] = payload.val[1];
        if (!this._requestingUpdate) this._requestUpdate();
    }
    this._callbacks.trigger(event, payload);
};

/**
 * The draw function is being used in order to allow mutating the DOMElement
 * before actually mounting the corresponding node.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.draw = function draw() {
    var key;
    var i;
    var len;

    this._inDraw = true;

    this.init();

    for (i = 0, len = this._classes.length ; i < len ; i++)
        this.addClass(this._classes[i]);

    if (this._content) this.setContent(this._content);

    for (key in this._styles)
        if (this._styles[key])
            this.setProperty(key, this._styles[key]);

    for (key in this._attributes)
        if (this._attributes[key])
            this.setAttribute(key, this._attributes[key]);

    for (i = 0, len = this._UIEvents.length ; i < len ; i++)
        this.onAddUIEvent(this._UIEvents[i]);

    this._inDraw = false;
};

module.exports = DOMElement;

},{"../utilities/CallbackStore":36}],12:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var ElementCache = require('./ElementCache');
var math = require('./Math');
var vendorPrefix = require('../utilities/vendorPrefix');
var eventMap = require('./events/EventMap');

var TRANSFORM = null;

/**
 * DOMRenderer is a class responsible for adding elements
 * to the DOM and writing to those elements.
 * There is a DOMRenderer per context, represented as an
 * element and a selector. It is instantiated in the
 * context class.
 *
 * @class DOMRenderer
 *
 * @param {HTMLElement} element an element.
 * @param {String} selector the selector of the element.
 * @param {Compositor} compositor the compositor controlling the renderer
 */
function DOMRenderer (element, selector, compositor) {
    element.classList.add('famous-dom-renderer');

    TRANSFORM = TRANSFORM || vendorPrefix('transform');
    this._compositor = compositor; // a reference to the compositor

    this._target = null; // a register for holding the current
                         // element that the Renderer is operating
                         // upon

    this._parent = null; // a register for holding the parent
                         // of the target

    this._path = null; // a register for holding the path of the target
                       // this register must be set first, and then
                       // children, target, and parent are all looked
                       // up from that.

    this._children = []; // a register for holding the children of the
                         // current target.

    this._root = new ElementCache(element, selector); // the root
                                                      // of the dom tree that this
                                                      // renderer is responsible
                                                      // for

    this._boundTriggerEvent = this._triggerEvent.bind(this);

    this._selector = selector;

    this._elements = {};

    this._elements[selector] = this._root;

    this.perspectiveTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._VPtransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this._size = [null, null];
}


/**
 * Attaches an EventListener to the element associated with the passed in path.
 * Prevents the default browser action on all subsequent events if
 * `preventDefault` is truthy.
 * All incoming events will be forwarded to the compositor by invoking the
 * `sendEvent` method.
 * Delegates events if possible by attaching the event listener to the context.
 *
 * @method
 *
 * @param {String} type DOM event type (e.g. click, mouseover).
 * @param {Boolean} preventDefault Whether or not the default browser action should be prevented.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.subscribe = function subscribe(type, preventDefault) {
    // TODO preventDefault should be a separate command
    this._assertTargetLoaded();

    this._target.preventDefault[type] = preventDefault;
    this._target.subscribe[type] = true;

    if (
        !this._target.listeners[type] && !this._root.listeners[type]
    ) {
        var target = eventMap[type][1] ? this._root : this._target;
        target.listeners[type] = this._boundTriggerEvent;
        target.element.addEventListener(type, this._boundTriggerEvent);
    }
};

/**
 * Function to be added using `addEventListener` to the corresponding
 * DOMElement.
 *
 * @method
 * @private
 *
 * @param {Event} ev DOM Event payload
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._triggerEvent = function _triggerEvent(ev) {
    // Use ev.path, which is an array of Elements (polyfilled if needed).
    var evPath = ev.path ? ev.path : _getPath(ev);
    // First element in the path is the element on which the event has actually
    // been emitted.
    for (var i = 0; i < evPath.length; i++) {
        // Skip nodes that don't have a dataset property or data-fa-path
        // attribute.
        if (!evPath[i].dataset) continue;
        var path = evPath[i].dataset.faPath;
        if (!path) continue;

        // Stop further event propogation and path traversal as soon as the
        // first ElementCache subscribing for the emitted event has been found.
        if (this._elements[path].subscribe[ev.type]) {
            ev.stopPropagation();

            // Optionally preventDefault. This needs forther consideration and
            // should be optional. Eventually this should be a separate command/
            // method.
            if (this._elements[path].preventDefault[ev.type]) {
                ev.preventDefault();
            }

            var NormalizedEventConstructor = eventMap[ev.type][0];

            // Finally send the event to the Worker Thread through the
            // compositor.
            this._compositor.sendEvent(path, ev.type, new NormalizedEventConstructor(ev));

            break;
        }
    }
};


/**
 * getSizeOf gets the dom size of a particular DOM element.  This is
 * needed for render sizing in the scene graph.
 *
 * @method
 *
 * @param {String} path path of the Node in the scene graph
 *
 * @return {Array} a vec3 of the offset size of the dom element
 */
DOMRenderer.prototype.getSizeOf = function getSizeOf(path) {
    var element = this._elements[path];
    if (!element) return null;

    var res = {val: element.size};
    this._compositor.sendEvent(path, 'resize', res);
    return res;
};

function _getPath(ev) {
    // TODO move into _triggerEvent, avoid object allocation
    var path = [];
    var node = ev.target;
    while (node !== document.body) {
        path.push(node);
        node = node.parentNode;
    }
    return path;
}


/**
 * Determines the size of the context by querying the DOM for `offsetWidth` and
 * `offsetHeight`.
 *
 * @method
 *
 * @return {Array} Offset size.
 */
DOMRenderer.prototype.getSize = function getSize() {
    this._size[0] = this._root.element.offsetWidth;
    this._size[1] = this._root.element.offsetHeight;
    return this._size;
};

DOMRenderer.prototype._getSize = DOMRenderer.prototype.getSize;


/**
 * Executes the retrieved draw commands. Draw commands only refer to the
 * cross-browser normalized `transform` property.
 *
 * @method
 *
 * @param {Object} renderState description
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.draw = function draw(renderState) {
    if (renderState.perspectiveDirty) {
        this.perspectiveDirty = true;

        this.perspectiveTransform[0] = renderState.perspectiveTransform[0];
        this.perspectiveTransform[1] = renderState.perspectiveTransform[1];
        this.perspectiveTransform[2] = renderState.perspectiveTransform[2];
        this.perspectiveTransform[3] = renderState.perspectiveTransform[3];

        this.perspectiveTransform[4] = renderState.perspectiveTransform[4];
        this.perspectiveTransform[5] = renderState.perspectiveTransform[5];
        this.perspectiveTransform[6] = renderState.perspectiveTransform[6];
        this.perspectiveTransform[7] = renderState.perspectiveTransform[7];

        this.perspectiveTransform[8] = renderState.perspectiveTransform[8];
        this.perspectiveTransform[9] = renderState.perspectiveTransform[9];
        this.perspectiveTransform[10] = renderState.perspectiveTransform[10];
        this.perspectiveTransform[11] = renderState.perspectiveTransform[11];

        this.perspectiveTransform[12] = renderState.perspectiveTransform[12];
        this.perspectiveTransform[13] = renderState.perspectiveTransform[13];
        this.perspectiveTransform[14] = renderState.perspectiveTransform[14];
        this.perspectiveTransform[15] = renderState.perspectiveTransform[15];
    }

    if (renderState.viewDirty || renderState.perspectiveDirty) {
        math.multiply(this._VPtransform, this.perspectiveTransform, renderState.viewTransform);
        this._root.element.style[TRANSFORM] = this._stringifyMatrix(this._VPtransform);
    }
};


/**
 * Internal helper function used for ensuring that a path is currently loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertPathLoaded = function _asserPathLoaded() {
    if (!this._path) throw new Error('path not loaded');
};

/**
 * Internal helper function used for ensuring that a parent is currently loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertParentLoaded = function _assertParentLoaded() {
    if (!this._parent) throw new Error('parent not loaded');
};

/**
 * Internal helper function used for ensuring that children are currently
 * loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertChildrenLoaded = function _assertChildrenLoaded() {
    if (!this._children) throw new Error('children not loaded');
};

/**
 * Internal helper function used for ensuring that a target is currently loaded.
 *
 * @method  _assertTargetLoaded
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertTargetLoaded = function _assertTargetLoaded() {
    if (!this._target) throw new Error('No target loaded');
};

/**
 * Finds and sets the parent of the currently loaded element (path).
 *
 * @method
 * @private
 *
 * @return {ElementCache} Parent element.
 */
DOMRenderer.prototype.findParent = function findParent () {
    this._assertPathLoaded();

    var path = this._path;
    var parent;

    while (!parent && path.length) {
        path = path.substring(0, path.lastIndexOf('/'));
        parent = this._elements[path];
    }
    this._parent = parent;
    return parent;
};


/**
 * Finds all children of the currently loaded element.
 *
 * @method
 * @private
 *
 * @param {Array} array Output-Array used for writing to (subsequently appending children)
 *
 * @return {Array} array of children elements
 */
DOMRenderer.prototype.findChildren = function findChildren(array) {
    // TODO: Optimize me.
    this._assertPathLoaded();

    var path = this._path + '/';
    var keys = Object.keys(this._elements);
    var i = 0;
    var len;
    array = array ? array : this._children;

    this._children.length = 0;

    while (i < keys.length) {
        if (keys[i].indexOf(path) === -1 || keys[i] === path) keys.splice(i, 1);
        else i++;
    }
    var currentPath;
    var j = 0;
    for (i = 0 ; i < keys.length ; i++) {
        currentPath = keys[i];
        for (j = 0 ; j < keys.length ; j++) {
            if (i !== j && keys[j].indexOf(currentPath) !== -1) {
                keys.splice(j, 1);
                i--;
            }
        }
    }
    for (i = 0, len = keys.length ; i < len ; i++)
        array[i] = this._elements[keys[i]];

    return array;
};


/**
 * Used for determining the target loaded under the current path.
 *
 * @method
 *
 * @return {ElementCache|undefined} Element loaded under defined path.
 */
DOMRenderer.prototype.findTarget = function findTarget() {
    this._target = this._elements[this._path];
    return this._target;
};


/**
 * Loads the passed in path.
 *
 * @method
 *
 * @param {String} path Path to be loaded
 *
 * @return {String} Loaded path
 */
DOMRenderer.prototype.loadPath = function loadPath (path) {
    this._path = path;
    return this._path;
};


/**
 * Inserts a DOMElement at the currently loaded path, assuming no target is
 * loaded. Only one DOMElement can be associated with each path.
 *
 * @method
 *
 * @param {String} tagName Tag name (capitalization will be normalized).
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.insertEl = function insertEl (tagName) {
    if (!this._target ||
         this._target.element.tagName.toLowerCase() === tagName.toLowerCase()) {

        this.findParent();
        this.findChildren();

        this._assertParentLoaded();
        this._assertChildrenLoaded();

        if (this._target) this._parent.element.removeChild(this._target.element);

        this._target = new ElementCache(document.createElement(tagName), this._path);
        this._parent.element.appendChild(this._target.element);
        this._elements[this._path] = this._target;

        for (var i = 0, len = this._children.length ; i < len ; i++) {
            this._target.element.appendChild(this._children[i].element);
        }
    }
};


/**
 * Sets a property on the currently loaded target.
 *
 * @method
 *
 * @param {String} name Property name (e.g. background, color, font)
 * @param {String} value Proprty value (e.g. black, 20px)
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setProperty = function setProperty (name, value) {
    this._assertTargetLoaded();
    this._target.element.style[name] = value;
};


/**
 * Sets the size of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} width   Width to be set.
 * @param {Number|false} height  Height to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setSize = function setSize (width, height) {
    this._assertTargetLoaded();

    this.setWidth(width);
    this.setHeight(height);
};

/**
 * Sets the width of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} width Width to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setWidth = function setWidth(width) {
    this._assertTargetLoaded();

    var contentWrapper = this._target.content;

    if (width === false) {
        this._target.explicitWidth = true;
        if (contentWrapper) contentWrapper.style.width = '';
        width = contentWrapper ? contentWrapper.offsetWidth : 0;
        this._target.element.style.width = width + 'px';
    }
    else {
        this._target.explicitWidth = false;
        if (contentWrapper) contentWrapper.style.width = width + 'px';
        this._target.element.style.width = width + 'px';
    }

    this._target.size[0] = width;
};

/**
 * Sets the height of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} height Height to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setHeight = function setHeight(height) {
    this._assertTargetLoaded();

    var contentWrapper = this._target.content;

    if (height === false) {
        this._target.explicitHeight = true;
        if (contentWrapper) contentWrapper.style.height = '';
        height = contentWrapper ? contentWrapper.offsetHeight : 0;
        this._target.element.style.height = height + 'px';
    }
    else {
        this._target.explicitHeight = false;
        if (contentWrapper) contentWrapper.style.height = height + 'px';
        this._target.element.style.height = height + 'px';
    }

    this._target.size[1] = height;
};

/**
 * Sets an attribute on the currently loaded target.
 *
 * @method
 *
 * @param {String} name Attribute name (e.g. href)
 * @param {String} value Attribute value (e.g. http://famous.org)
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setAttribute = function setAttribute(name, value) {
    this._assertTargetLoaded();
    this._target.element.setAttribute(name, value);
};

/**
 * Sets the `innerHTML` content of the currently loaded target.
 *
 * @method
 *
 * @param {String} content Content to be set as `innerHTML`
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setContent = function setContent(content) {
    this._assertTargetLoaded();
    this.findChildren();

    if (!this._target.content) {
        this._target.content = document.createElement('div');
        this._target.content.classList.add('famous-dom-element-content');
        this._target.element.insertBefore(
            this._target.content,
            this._target.element.firstChild
        );
    }
    this._target.content.innerHTML = content;

    this.setSize(
        this._target.explicitWidth ? false : this._target.size[0],
        this._target.explicitHeight ? false : this._target.size[1]
    );
};


/**
 * Sets the passed in transform matrix (world space). Inverts the parent's world
 * transform.
 *
 * @method
 *
 * @param {Float32Array} transform The transform for the loaded DOM Element in world space
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setMatrix = function setMatrix(transform) {
    // TODO Don't multiply matrics in the first place.
    this._assertTargetLoaded();
    this.findParent();
    var worldTransform = this._target.worldTransform;
    var changed = false;

    var i;
    var len;

    if (transform)
        for (i = 0, len = 16 ; i < len ; i++) {
            changed = changed ? changed : worldTransform[i] === transform[i];
            worldTransform[i] = transform[i];
        }
    else changed = true;

    if (changed) {
        math.invert(this._target.invertedParent, this._parent.worldTransform);
        math.multiply(this._target.finalTransform, this._target.invertedParent, worldTransform);

        // TODO: this is a temporary fix for draw commands
        // coming in out of order
        var children = this.findChildren([]);
        var previousPath = this._path;
        var previousTarget = this._target;
        for (i = 0, len = children.length ; i < len ; i++) {
            this._target = children[i];
            this._path = this._target.path;
            this.setMatrix();
        }
        this._path = previousPath;
        this._target = previousTarget;
    }

    this._target.element.style[TRANSFORM] = this._stringifyMatrix(this._target.finalTransform);
};


/**
 * Adds a class to the classList associated with the currently loaded target.
 *
 * @method
 *
 * @param {String} domClass Class name to be added to the current target.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.addClass = function addClass(domClass) {
    this._assertTargetLoaded();
    this._target.element.classList.add(domClass);
};


/**
 * Removes a class from the classList associated with the currently loaded
 * target.
 *
 * @method
 *
 * @param {String} domClass Class name to be removed from currently loaded target.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.removeClass = function removeClass(domClass) {
    this._assertTargetLoaded();
    this._target.element.classList.remove(domClass);
};


/**
 * Stringifies the passed in matrix for setting the `transform` property.
 *
 * @method  _stringifyMatrix
 * @private
 *
 * @param {Array} m    Matrix as an array or array-like object.
 * @return {String}     Stringified matrix as `matrix3d`-property.
 */
DOMRenderer.prototype._stringifyMatrix = function _stringifyMatrix(m) {
    var r = 'matrix3d(';

    r += (m[0] < 0.000001 && m[0] > -0.000001) ? '0,' : m[0] + ',';
    r += (m[1] < 0.000001 && m[1] > -0.000001) ? '0,' : m[1] + ',';
    r += (m[2] < 0.000001 && m[2] > -0.000001) ? '0,' : m[2] + ',';
    r += (m[3] < 0.000001 && m[3] > -0.000001) ? '0,' : m[3] + ',';
    r += (m[4] < 0.000001 && m[4] > -0.000001) ? '0,' : m[4] + ',';
    r += (m[5] < 0.000001 && m[5] > -0.000001) ? '0,' : m[5] + ',';
    r += (m[6] < 0.000001 && m[6] > -0.000001) ? '0,' : m[6] + ',';
    r += (m[7] < 0.000001 && m[7] > -0.000001) ? '0,' : m[7] + ',';
    r += (m[8] < 0.000001 && m[8] > -0.000001) ? '0,' : m[8] + ',';
    r += (m[9] < 0.000001 && m[9] > -0.000001) ? '0,' : m[9] + ',';
    r += (m[10] < 0.000001 && m[10] > -0.000001) ? '0,' : m[10] + ',';
    r += (m[11] < 0.000001 && m[11] > -0.000001) ? '0,' : m[11] + ',';
    r += (m[12] < 0.000001 && m[12] > -0.000001) ? '0,' : m[12] + ',';
    r += (m[13] < 0.000001 && m[13] > -0.000001) ? '0,' : m[13] + ',';
    r += (m[14] < 0.000001 && m[14] > -0.000001) ? '0,' : m[14] + ',';

    r += m[15] + ')';
    return r;
};

module.exports = DOMRenderer;

},{"../utilities/vendorPrefix":39,"./ElementCache":13,"./Math":14,"./events/EventMap":17}],13:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

// Transform identity matrix. 
var ident = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

/**
 * ElementCache is being used for keeping track of an element's DOM Element,
 * path, world transform, inverted parent, final transform (as being used for
 * setting the actual `transform`-property) and post render size (final size as
 * being rendered to the DOM).
 * 
 * @class ElementCache
 *  
 * @param {Element} element DOMElement
 * @param {String} path Path used for uniquely identifying the location in the scene graph.
 */ 
function ElementCache (element, path) {
    this.element = element;
    this.path = path;
    this.content = null;
    this.size = new Int16Array(3);
    this.explicitHeight = false;
    this.explicitWidth = false;
    this.worldTransform = new Float32Array(ident);
    this.invertedParent = new Float32Array(ident);
    this.finalTransform = new Float32Array(ident);
    this.postRenderSize = new Float32Array(2);
    this.listeners = {};
    this.preventDefault = {};
    this.subscribe = {};
}

module.exports = ElementCache;

},{}],14:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A method for inverting a transform matrix
 *
 * @method
 *
 * @param {Array} out array to store the return of the inversion
 * @param {Array} a transform matrix to inverse
 *
 * @return {Array} out
 *   output array that is storing the transform matrix
 */
function invert (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
}

/**
 * A method for multiplying two matricies
 *
 * @method
 *
 * @param {Array} out array to store the return of the multiplication
 * @param {Array} a transform matrix to multiply
 * @param {Array} b transform matrix to multiply
 *
 * @return {Array} out
 *   output array that is storing the transform matrix
 */
function multiply (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3],
        b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7],
        b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

    var changed = false;
    var out0, out1, out2, out3;

    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[0] ||
                        out1 === out[1] ||
                        out2 === out[2] ||
                        out3 === out[3];

    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = out3;

    b0 = b4; b1 = b5; b2 = b6; b3 = b7;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[4] ||
                        out1 === out[5] ||
                        out2 === out[6] ||
                        out3 === out[7];

    out[4] = out0;
    out[5] = out1;
    out[6] = out2;
    out[7] = out3;

    b0 = b8; b1 = b9; b2 = b10; b3 = b11;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[8] ||
                        out1 === out[9] ||
                        out2 === out[10] ||
                        out3 === out[11];

    out[8] = out0;
    out[9] = out1;
    out[10] = out2;
    out[11] = out3;

    b0 = b12; b1 = b13; b2 = b14; b3 = b15;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[12] ||
                        out1 === out[13] ||
                        out2 === out[14] ||
                        out3 === out[15];

    out[12] = out0;
    out[13] = out1;
    out[14] = out2;
    out[15] = out3;

    return out;
}

module.exports = {
    multiply: multiply,
    invert: invert
};

},{}],15:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-compositionevents).
 *
 * @class CompositionEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function CompositionEvent(ev) {
    // [Constructor(DOMString typeArg, optional CompositionEventInit compositionEventInitDict)]
    // interface CompositionEvent : UIEvent {
    //     readonly    attribute DOMString data;
    // };

    UIEvent.call(this, ev);

    /**
     * @name CompositionEvent#data
     * @type String
     */
    this.data = ev.data;
}

CompositionEvent.prototype = Object.create(UIEvent.prototype);
CompositionEvent.prototype.constructor = CompositionEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
CompositionEvent.prototype.toString = function toString () {
    return 'CompositionEvent';
};

module.exports = CompositionEvent;

},{"./UIEvent":23}],16:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Event class is being used in order to normalize native DOM events.
 * Events need to be normalized in order to be serialized through the structured
 * cloning algorithm used by the `postMessage` method (Web Workers).
 *
 * Wrapping DOM events also has the advantage of providing a consistent
 * interface for interacting with DOM events across browsers by copying over a
 * subset of the exposed properties that is guaranteed to be consistent across
 * browsers.
 *
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#interface-Event).
 *
 * @class Event
 *
 * @param {Event} ev The native DOM event.
 */
function Event(ev) {
    // [Constructor(DOMString type, optional EventInit eventInitDict),
    //  Exposed=Window,Worker]
    // interface Event {
    //   readonly attribute DOMString type;
    //   readonly attribute EventTarget? target;
    //   readonly attribute EventTarget? currentTarget;

    //   const unsigned short NONE = 0;
    //   const unsigned short CAPTURING_PHASE = 1;
    //   const unsigned short AT_TARGET = 2;
    //   const unsigned short BUBBLING_PHASE = 3;
    //   readonly attribute unsigned short eventPhase;

    //   void stopPropagation();
    //   void stopImmediatePropagation();

    //   readonly attribute boolean bubbles;
    //   readonly attribute boolean cancelable;
    //   void preventDefault();
    //   readonly attribute boolean defaultPrevented;

    //   [Unforgeable] readonly attribute boolean isTrusted;
    //   readonly attribute DOMTimeStamp timeStamp;

    //   void initEvent(DOMString type, boolean bubbles, boolean cancelable);
    // };

    /**
     * @name Event#type
     * @type String
     */
    this.type = ev.type;

    /**
     * @name Event#defaultPrevented
     * @type Boolean
     */
    this.defaultPrevented = ev.defaultPrevented;

    /**
     * @name Event#timeStamp
     * @type Number
     */
    this.timeStamp = ev.timeStamp;


    /**
     * Used for exposing the current target's value.
     *
     * @name Event#value
     * @type String
     */
    var targetConstructor = ev.target.constructor;
    // TODO Support HTMLKeygenElement
    if (
        targetConstructor === HTMLInputElement ||
        targetConstructor === HTMLTextAreaElement ||
        targetConstructor === HTMLSelectElement
    ) {
        this.value = ev.target.value;
    }
}

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
Event.prototype.toString = function toString () {
    return 'Event';
};

module.exports = Event;

},{}],17:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var CompositionEvent = require('./CompositionEvent');
var Event = require('./Event');
var FocusEvent = require('./FocusEvent');
var InputEvent = require('./InputEvent');
var KeyboardEvent = require('./KeyboardEvent');
var MouseEvent = require('./MouseEvent');
var TouchEvent = require('./TouchEvent');
var UIEvent = require('./UIEvent');
var WheelEvent = require('./WheelEvent');

/**
 * A mapping of DOM events to the corresponding handlers
 *
 * @name EventMap
 * @type Object
 */
var EventMap = {
    change                         : [Event, true],
    submit                         : [Event, true],

    // UI Events (http://www.w3.org/TR/uievents/)
    abort                          : [Event, false],
    beforeinput                    : [InputEvent, true],
    blur                           : [FocusEvent, false],
    click                          : [MouseEvent, true],
    compositionend                 : [CompositionEvent, true],
    compositionstart               : [CompositionEvent, true],
    compositionupdate              : [CompositionEvent, true],
    dblclick                       : [MouseEvent, true],
    focus                          : [FocusEvent, false],
    focusin                        : [FocusEvent, true],
    focusout                       : [FocusEvent, true],
    input                          : [InputEvent, true],
    keydown                        : [KeyboardEvent, true],
    keyup                          : [KeyboardEvent, true],
    load                           : [Event, false],
    mousedown                      : [MouseEvent, true],
    mouseenter                     : [MouseEvent, false],
    mouseleave                     : [MouseEvent, false],

    // bubbles, but will be triggered very frequently
    mousemove                      : [MouseEvent, false],

    mouseout                       : [MouseEvent, true],
    mouseover                      : [MouseEvent, true],
    mouseup                        : [MouseEvent, true],
    resize                         : [UIEvent, false],

    // might bubble
    scroll                         : [UIEvent, false],

    select                         : [Event, true],
    unload                         : [Event, false],
    wheel                          : [WheelEvent, true],

    // Touch Events Extension (http://www.w3.org/TR/touch-events-extensions/)
    touchcancel                    : [TouchEvent, true],
    touchend                       : [TouchEvent, true],
    touchmove                      : [TouchEvent, true],
    touchstart                     : [TouchEvent, true]
};

module.exports = EventMap;

},{"./CompositionEvent":15,"./Event":16,"./FocusEvent":18,"./InputEvent":19,"./KeyboardEvent":20,"./MouseEvent":21,"./TouchEvent":22,"./UIEvent":23,"./WheelEvent":24}],18:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-focusevent).
 *
 * @class FocusEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function FocusEvent(ev) {
    // [Constructor(DOMString typeArg, optional FocusEventInit focusEventInitDict)]
    // interface FocusEvent : UIEvent {
    //     readonly    attribute EventTarget? relatedTarget;
    // };

    UIEvent.call(this, ev);
}

FocusEvent.prototype = Object.create(UIEvent.prototype);
FocusEvent.prototype.constructor = FocusEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
FocusEvent.prototype.toString = function toString () {
    return 'FocusEvent';
};

module.exports = FocusEvent;

},{"./UIEvent":23}],19:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [Input Events](http://w3c.github.io/editing-explainer/input-events.html#idl-def-InputEvent).
 *
 * @class InputEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function InputEvent(ev) {
    // [Constructor(DOMString typeArg, optional InputEventInit inputEventInitDict)]
    // interface InputEvent : UIEvent {
    //     readonly    attribute DOMString inputType;
    //     readonly    attribute DOMString data;
    //     readonly    attribute boolean   isComposing;
    //     readonly    attribute Range     targetRange;
    // };

    UIEvent.call(this, ev);

    /**
     * @name    InputEvent#inputType
     * @type    String
     */
    this.inputType = ev.inputType;

    /**
     * @name    InputEvent#data
     * @type    String
     */
    this.data = ev.data;

    /**
     * @name    InputEvent#isComposing
     * @type    Boolean
     */
    this.isComposing = ev.isComposing;

    /**
     * **Limited browser support**.
     *
     * @name    InputEvent#targetRange
     * @type    Boolean
     */
    this.targetRange = ev.targetRange;
}

InputEvent.prototype = Object.create(UIEvent.prototype);
InputEvent.prototype.constructor = InputEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
InputEvent.prototype.toString = function toString () {
    return 'InputEvent';
};

module.exports = InputEvent;

},{"./UIEvent":23}],20:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-keyboardevents).
 *
 * @class KeyboardEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function KeyboardEvent(ev) {
    // [Constructor(DOMString typeArg, optional KeyboardEventInit keyboardEventInitDict)]
    // interface KeyboardEvent : UIEvent {
    //     // KeyLocationCode
    //     const unsigned long DOM_KEY_LOCATION_STANDARD = 0x00;
    //     const unsigned long DOM_KEY_LOCATION_LEFT = 0x01;
    //     const unsigned long DOM_KEY_LOCATION_RIGHT = 0x02;
    //     const unsigned long DOM_KEY_LOCATION_NUMPAD = 0x03;
    //     readonly    attribute DOMString     key;
    //     readonly    attribute DOMString     code;
    //     readonly    attribute unsigned long location;
    //     readonly    attribute boolean       ctrlKey;
    //     readonly    attribute boolean       shiftKey;
    //     readonly    attribute boolean       altKey;
    //     readonly    attribute boolean       metaKey;
    //     readonly    attribute boolean       repeat;
    //     readonly    attribute boolean       isComposing;
    //     boolean getModifierState (DOMString keyArg);
    // };

    UIEvent.call(this, ev);

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_STANDARD
     * @type Number
     */
    this.DOM_KEY_LOCATION_STANDARD = 0x00;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_LEFT
     * @type Number
     */
    this.DOM_KEY_LOCATION_LEFT = 0x01;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_RIGHT
     * @type Number
     */
    this.DOM_KEY_LOCATION_RIGHT = 0x02;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_NUMPAD
     * @type Number
     */
    this.DOM_KEY_LOCATION_NUMPAD = 0x03;

    /**
     * @name KeyboardEvent#key
     * @type String
     */
    this.key = ev.key;

    /**
     * @name KeyboardEvent#code
     * @type String
     */
    this.code = ev.code;

    /**
     * @name KeyboardEvent#location
     * @type Number
     */
    this.location = ev.location;

    /**
     * @name KeyboardEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name KeyboardEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;

    /**
     * @name KeyboardEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name KeyboardEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @name KeyboardEvent#repeat
     * @type Boolean
     */
    this.repeat = ev.repeat;

    /**
     * @name KeyboardEvent#isComposing
     * @type Boolean
     */
    this.isComposing = ev.isComposing;

    /**
     * @name KeyboardEvent#keyCode
     * @type String
     * @deprecated
     */
    this.keyCode = ev.keyCode;
}

KeyboardEvent.prototype = Object.create(UIEvent.prototype);
KeyboardEvent.prototype.constructor = KeyboardEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
KeyboardEvent.prototype.toString = function toString () {
    return 'KeyboardEvent';
};

module.exports = KeyboardEvent;

},{"./UIEvent":23}],21:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-mouseevents).
 *
 * @class KeyboardEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function MouseEvent(ev) {
    // [Constructor(DOMString typeArg, optional MouseEventInit mouseEventInitDict)]
    // interface MouseEvent : UIEvent {
    //     readonly    attribute long           screenX;
    //     readonly    attribute long           screenY;
    //     readonly    attribute long           clientX;
    //     readonly    attribute long           clientY;
    //     readonly    attribute boolean        ctrlKey;
    //     readonly    attribute boolean        shiftKey;
    //     readonly    attribute boolean        altKey;
    //     readonly    attribute boolean        metaKey;
    //     readonly    attribute short          button;
    //     readonly    attribute EventTarget?   relatedTarget;
    //     // Introduced in this specification
    //     readonly    attribute unsigned short buttons;
    //     boolean getModifierState (DOMString keyArg);
    // };

    UIEvent.call(this, ev);

    /**
     * @name MouseEvent#screenX
     * @type Number
     */
    this.screenX = ev.screenX;

    /**
     * @name MouseEvent#screenY
     * @type Number
     */
    this.screenY = ev.screenY;

    /**
     * @name MouseEvent#clientX
     * @type Number
     */
    this.clientX = ev.clientX;

    /**
     * @name MouseEvent#clientY
     * @type Number
     */
    this.clientY = ev.clientY;

    /**
     * @name MouseEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name MouseEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;

    /**
     * @name MouseEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name MouseEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @type MouseEvent#button
     * @type Number
     */
    this.button = ev.button;

    /**
     * @type MouseEvent#buttons
     * @type Number
     */
    this.buttons = ev.buttons;

    /**
     * @type MouseEvent#pageX
     * @type Number
     */
    this.pageX = ev.pageX;

    /**
     * @type MouseEvent#pageY
     * @type Number
     */
    this.pageY = ev.pageY;

    /**
     * @type MouseEvent#x
     * @type Number
     */
    this.x = ev.x;

    /**
     * @type MouseEvent#y
     * @type Number
     */
    this.y = ev.y;

    /**
     * @type MouseEvent#offsetX
     * @type Number
     */
    this.offsetX = ev.offsetX;

    /**
     * @type MouseEvent#offsetY
     * @type Number
     */
    this.offsetY = ev.offsetY;
}

MouseEvent.prototype = Object.create(UIEvent.prototype);
MouseEvent.prototype.constructor = MouseEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
MouseEvent.prototype.toString = function toString () {
    return 'MouseEvent';
};

module.exports = MouseEvent;

},{"./UIEvent":23}],22:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

var EMPTY_ARRAY = [];

/**
 * See [Touch Interface](http://www.w3.org/TR/2013/REC-touch-events-20131010/#touch-interface).
 *
 * @class Touch
 * @private
 *
 * @param {Touch} touch The native Touch object.
 */
function Touch(touch) {
    // interface Touch {
    //     readonly    attribute long        identifier;
    //     readonly    attribute EventTarget target;
    //     readonly    attribute double      screenX;
    //     readonly    attribute double      screenY;
    //     readonly    attribute double      clientX;
    //     readonly    attribute double      clientY;
    //     readonly    attribute double      pageX;
    //     readonly    attribute double      pageY;
    // };

    /**
     * @name Touch#identifier
     * @type Number
     */
    this.identifier = touch.identifier;

    /**
     * @name Touch#screenX
     * @type Number
     */
    this.screenX = touch.screenX;

    /**
     * @name Touch#screenY
     * @type Number
     */
    this.screenY = touch.screenY;

    /**
     * @name Touch#clientX
     * @type Number
     */
    this.clientX = touch.clientX;

    /**
     * @name Touch#clientY
     * @type Number
     */
    this.clientY = touch.clientY;

    /**
     * @name Touch#pageX
     * @type Number
     */
    this.pageX = touch.pageX;

    /**
     * @name Touch#pageY
     * @type Number
     */
    this.pageY = touch.pageY;
}


/**
 * Normalizes the browser's native TouchList by converting it into an array of
 * normalized Touch objects.
 *
 * @method  cloneTouchList
 * @private
 *
 * @param  {TouchList} touchList    The native TouchList array.
 * @return {Array.<Touch>}          An array of normalized Touch objects.
 */
function cloneTouchList(touchList) {
    if (!touchList) return EMPTY_ARRAY;
    // interface TouchList {
    //     readonly    attribute unsigned long length;
    //     getter Touch? item (unsigned long index);
    // };

    var touchListArray = [];
    for (var i = 0; i < touchList.length; i++) {
        touchListArray[i] = new Touch(touchList[i]);
    }
    return touchListArray;
}

/**
 * See [Touch Event Interface](http://www.w3.org/TR/2013/REC-touch-events-20131010/#touchevent-interface).
 *
 * @class TouchEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function TouchEvent(ev) {
    // interface TouchEvent : UIEvent {
    //     readonly    attribute TouchList touches;
    //     readonly    attribute TouchList targetTouches;
    //     readonly    attribute TouchList changedTouches;
    //     readonly    attribute boolean   altKey;
    //     readonly    attribute boolean   metaKey;
    //     readonly    attribute boolean   ctrlKey;
    //     readonly    attribute boolean   shiftKey;
    // };
    UIEvent.call(this, ev);

    /**
     * @name TouchEvent#touches
     * @type Array.<Touch>
     */
    this.touches = cloneTouchList(ev.touches);

    /**
     * @name TouchEvent#targetTouches
     * @type Array.<Touch>
     */
    this.targetTouches = cloneTouchList(ev.targetTouches);

    /**
     * @name TouchEvent#changedTouches
     * @type TouchList
     */
    this.changedTouches = cloneTouchList(ev.changedTouches);

    /**
     * @name TouchEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name TouchEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @name TouchEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name TouchEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;
}

TouchEvent.prototype = Object.create(UIEvent.prototype);
TouchEvent.prototype.constructor = TouchEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
TouchEvent.prototype.toString = function toString () {
    return 'TouchEvent';
};

module.exports = TouchEvent;

},{"./UIEvent":23}],23:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Event = require('./Event');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428).
 *
 * @class UIEvent
 * @augments Event
 *
 * @param  {Event} ev   The native DOM event.
 */
function UIEvent(ev) {
    // [Constructor(DOMString type, optional UIEventInit eventInitDict)]
    // interface UIEvent : Event {
    //     readonly    attribute Window? view;
    //     readonly    attribute long    detail;
    // };
    Event.call(this, ev);

    /**
     * @name UIEvent#detail
     * @type Number
     */
    this.detail = ev.detail;
}

UIEvent.prototype = Object.create(Event.prototype);
UIEvent.prototype.constructor = UIEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
UIEvent.prototype.toString = function toString () {
    return 'UIEvent';
};

module.exports = UIEvent;

},{"./Event":16}],24:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var MouseEvent = require('./MouseEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-wheelevents).
 *
 * @class WheelEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function WheelEvent(ev) {
    // [Constructor(DOMString typeArg, optional WheelEventInit wheelEventInitDict)]
    // interface WheelEvent : MouseEvent {
    //     // DeltaModeCode
    //     const unsigned long DOM_DELTA_PIXEL = 0x00;
    //     const unsigned long DOM_DELTA_LINE = 0x01;
    //     const unsigned long DOM_DELTA_PAGE = 0x02;
    //     readonly    attribute double        deltaX;
    //     readonly    attribute double        deltaY;
    //     readonly    attribute double        deltaZ;
    //     readonly    attribute unsigned long deltaMode;
    // };

    MouseEvent.call(this, ev);

    /**
     * @name WheelEvent#DOM_DELTA_PIXEL
     * @type Number
     */
    this.DOM_DELTA_PIXEL = 0x00;

    /**
     * @name WheelEvent#DOM_DELTA_LINE
     * @type Number
     */
    this.DOM_DELTA_LINE = 0x01;

    /**
     * @name WheelEvent#DOM_DELTA_PAGE
     * @type Number
     */
    this.DOM_DELTA_PAGE = 0x02;

    /**
     * @name WheelEvent#deltaX
     * @type Number
     */
    this.deltaX = ev.deltaX;

    /**
     * @name WheelEvent#deltaY
     * @type Number
     */
    this.deltaY = ev.deltaY;

    /**
     * @name WheelEvent#deltaZ
     * @type Number
     */
    this.deltaZ = ev.deltaZ;

    /**
     * @name WheelEvent#deltaMode
     * @type Number
     */
    this.deltaMode = ev.deltaMode;
}

WheelEvent.prototype = Object.create(MouseEvent.prototype);
WheelEvent.prototype.constructor = WheelEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
WheelEvent.prototype.toString = function toString () {
    return 'WheelEvent';
};

module.exports = WheelEvent;

},{"./MouseEvent":21}],25:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A two-dimensional vector.
 *
 * @class Vec2
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 */
var Vec2 = function(x, y) {
    if (x instanceof Array || x instanceof Float32Array) {
        this.x = x[0] || 0;
        this.y = x[1] || 0;
    }
    else {
        this.x = x || 0;
        this.y = y || 0;
    }
};

/**
 * Set the components of the current Vec2.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 *
 * @return {Vec2} this
 */
Vec2.prototype.set = function set(x, y) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    return this;
};

/**
 * Add the input v to the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to add.
 *
 * @return {Vec2} this
 */
Vec2.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
};

/**
 * Subtract the input v from the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to subtract.
 *
 * @return {Vec2} this
 */
Vec2.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
};

/**
 * Scale the current Vec2 by a scalar or Vec2.
 *
 * @method
 *
 * @param {Number|Vec2} s The Number or vec2 by which to scale.
 *
 * @return {Vec2} this
 */
Vec2.prototype.scale = function scale(s) {
    if (s instanceof Vec2) {
        this.x *= s.x;
        this.y *= s.y;
    }
    else {
        this.x *= s;
        this.y *= s;
    }
    return this;
};

/**
 * Rotate the Vec2 counter-clockwise by theta about the z-axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec2} this
 */
Vec2.prototype.rotate = function(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
};

/**
 * The cross product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.cross = function(v) {
    return this.x * v.y - this.y * v.x;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.invert = function invert() {
    this.x *= -1;
    this.y *= -1;
    return this;
};

/**
 * Apply a function component-wise to the current Vec2.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec2} this
 */
Vec2.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    return this;
};

/**
 * Get the magnitude of the current Vec2.
 *
 * @method
 *
 * @return {Number} the length of the vector
 */
Vec2.prototype.length = function length() {
    var x = this.x;
    var y = this.y;

    return Math.sqrt(x * x + y * y);
};

/**
 * Copy the input onto the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v Vec2 to copy
 *
 * @return {Vec2} this
 */
Vec2.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
};

/**
 * Reset the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec2 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the length is 0
 */
Vec2.prototype.isZero = function isZero() {
    if (this.x !== 0 || this.y !== 0) return false;
    else return true;
};

/**
 * The array form of the current Vec2.
 *
 * @method
 *
 * @return {Array} the Vec to as an array
 */
Vec2.prototype.toArray = function toArray() {
    return [this.x, this.y];
};

/**
 * Normalize the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The normalized Vec2.
 */
Vec2.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;

    var length = Math.sqrt(x * x + y * y) || 1;
    length = 1 / length;
    output.x = v.x * length;
    output.y = v.y * length;

    return output;
};

/**
 * Clone the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to clone.
 *
 * @return {Vec2} The cloned Vec2.
 */
Vec2.clone = function clone(v) {
    return new Vec2(v.x, v.y);
};

/**
 * Add the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the addition.
 */
Vec2.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;

    return output;
};

/**
 * Subtract the second Vec2 from the first.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the subtraction.
 */
Vec2.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    return output;
};

/**
 * Scale the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Number} s Number to scale by.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the scaling.
 */
Vec2.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    return output;
};

/**
 * The dot product of the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 *
 * @return {Number} The dot product.
 */
Vec2.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
};

/**
 * The cross product of the input Vec2's.
 *
 * @method
 *
 * @param {Number} v1 The left Vec2.
 * @param {Number} v2 The right Vec2.
 *
 * @return {Number} The z-component of the cross product.
 */
Vec2.cross = function(v1,v2) {
    return v1.x * v2.y - v1.y * v2.x;
};

module.exports = Vec2;

},{}],26:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A three-dimensional vector.
 *
 * @class Vec3
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 */
var Vec3 = function(x ,y, z){
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

/**
 * Set the components of the current Vec3.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 *
 * @return {Vec3} this
 */
Vec3.prototype.set = function set(x, y, z) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    if (z != null) this.z = z;

    return this;
};

/**
 * Add the input v to the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to add.
 *
 * @return {Vec3} this
 */
Vec3.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
};

/**
 * Subtract the input v from the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to subtract.
 *
 * @return {Vec3} this
 */
Vec3.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the x axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateX = function rotateX(theta) {
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.y = y * cosTheta - z * sinTheta;
    this.z = y * sinTheta + z * cosTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the y axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = z * sinTheta + x * cosTheta;
    this.z = z * cosTheta - x * sinTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the z axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 *
 * @method
 *
 * @param {Vec3} v The other Vec3.
 *
 * @return {Vec3} this
 */
Vec3.prototype.dot = function dot(v) {
    return this.x*v.x + this.y*v.y + this.z*v.z;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 * Stores the result in the current Vec3.
 *
 * @method cross
 *
 * @param {Vec3} v The other Vec3
 *
 * @return {Vec3} this
 */
Vec3.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    this.x = y * vz - z * vy;
    this.y = z * vx - x * vz;
    this.z = x * vy - y * vx;
    return this;
};

/**
 * Scale the current Vec3 by a scalar.
 *
 * @method
 *
 * @param {Number} s The Number by which to scale
 *
 * @return {Vec3} this
 */
Vec3.prototype.scale = function scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;

    return this;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.invert = function invert() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
};

/**
 * Apply a function component-wise to the current Vec3.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec3} this
 */
Vec3.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    this.z = fn(this.z);

    return this;
};

/**
 * The magnitude of the current Vec3.
 *
 * @method
 *
 * @return {Number} the magnitude of the Vec3
 */
Vec3.prototype.length = function length() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return Math.sqrt(x * x + y * y + z * z);
};

/**
 * The magnitude squared of the current Vec3.
 *
 * @method
 *
 * @return {Number} magnitude of the Vec3 squared
 */
Vec3.prototype.lengthSq = function lengthSq() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return x * x + y * y + z * z;
};

/**
 * Copy the input onto the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v Vec3 to copy
 *
 * @return {Vec3} this
 */
Vec3.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
};

/**
 * Reset the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec3 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the magnitude is zero
 */
Vec3.prototype.isZero = function isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
};

/**
 * The array form of the current Vec3.
 *
 * @method
 *
 * @return {Array} a three element array representing the components of the Vec3
 */
Vec3.prototype.toArray = function toArray() {
    return [this.x, this.y, this.z];
};

/**
 * Preserve the orientation but change the length of the current Vec3 to 1.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.normalize = function normalize() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    len = 1 / len;

    this.x *= len;
    this.y *= len;
    this.z *= len;
    return this;
};

/**
 * Apply the rotation corresponding to the input (unit) Quaternion
 * to the current Vec3.
 *
 * @method
 *
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyRotation = function applyRotation(q) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = this.x;
    var vy = this.y;
    var vz = this.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    this.x = tx * w + x * tw + y * tz - ty * z;
    this.y = ty * w + y * tw + tx * z - x * tz;
    this.z = tz * w + z * tw + x * ty - tx * y;
    return this;
};

/**
 * Apply the input Mat33 the the current Vec3.
 *
 * @method
 *
 * @param {Mat33} matrix Mat33 to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyMatrix = function applyMatrix(matrix) {
    var M = matrix.get();

    var x = this.x;
    var y = this.y;
    var z = this.z;

    this.x = M[0]*x + M[1]*y + M[2]*z;
    this.y = M[3]*x + M[4]*y + M[5]*z;
    this.z = M[6]*x + M[7]*y + M[8]*z;
    return this;
};

/**
 * Normalize the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The normalize Vec3.
 */
Vec3.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;
    var z = v.z;

    var length = Math.sqrt(x * x + y * y + z * z) || 1;
    length = 1 / length;

    output.x = x * length;
    output.y = y * length;
    output.z = z * length;
    return output;
};

/**
 * Apply a rotation to the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The rotated version of the input Vec3.
 */
Vec3.applyRotation = function applyRotation(v, q, output) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    output.x = tx * w + x * tw + y * tz - ty * z;
    output.y = ty * w + y * tw + tx * z - x * tz;
    output.z = tz * w + z * tw + x * ty - tx * y;
    return output;
};

/**
 * Clone the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to clone.
 *
 * @return {Vec3} The cloned Vec3.
 */
Vec3.clone = function clone(v) {
    return new Vec3(v.x, v.y, v.z);
};

/**
 * Add the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the addition.
 */
Vec3.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;
    output.z = v1.z + v2.z;
    return output;
};

/**
 * Subtract the second Vec3 from the first.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the subtraction.
 */
Vec3.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    output.z = v1.z - v2.z;
    return output;
};

/**
 * Scale the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Number} s Number to scale by.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the scaling.
 */
Vec3.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    output.z = v.z * s;
    return output;
};

/**
 * The dot product of the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 *
 * @return {Number} The dot product.
 */
Vec3.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

/**
 * The (right-handed) cross product of the input Vec3's.
 * v1 x v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into
 */
Vec3.cross = function cross(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    output.x = y1 * z2 - z1 * y2;
    output.y = z1 * x2 - x1 * z2;
    output.z = x1 * y2 - y1 * x2;
    return output;
};

/**
 * The projection of v1 onto v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into 
 */
Vec3.project = function project(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    var scale = x1 * x2 + y1 * y2 + z1 * z2;
    scale /= x2 * x2 + y2 * y2 + z2 * z2;

    output.x = x2 * scale;
    output.y = y2 * scale;
    output.z = z2 * scale;

    return output;
};

module.exports = Vec3;

},{}],27:[function(require,module,exports){
module.exports = noop

function noop() {
  throw new Error(
      'You should bundle your code ' +
      'using `glslify` as a transform.'
  )
}

},{}],28:[function(require,module,exports){
module.exports = programify

function programify(vertex, fragment, uniforms, attributes) {
  return {
    vertex: vertex, 
    fragment: fragment,
    uniforms: uniforms, 
    attributes: attributes
  };
}

},{}],29:[function(require,module,exports){
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license

'use strict';

var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];

var rAF, cAF;

if (typeof window === 'object') {
    rAF = window.requestAnimationFrame;
    cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame;
    for (var x = 0; x < vendors.length && !rAF; ++x) {
        rAF = window[vendors[x] + 'RequestAnimationFrame'];
        cAF = window[vendors[x] + 'CancelRequestAnimationFrame'] ||
              window[vendors[x] + 'CancelAnimationFrame'];
    }

    if (rAF && !cAF) {
        // cAF not supported.
        // Fall back to setInterval for now (very rare).
        rAF = null;
    }
}

if (!rAF) {
    var now = Date.now ? Date.now : function () {
        return new Date().getTime();
    };

    rAF = function(callback) {
        var currTime = now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = setTimeout(function () {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

    cAF = function (id) {
        clearTimeout(id);
    };
}

var animationFrame = {
    /**
     * Cross browser version of [requestAnimationFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}.
     *
     * Used by Engine in order to establish a render loop.
     *
     * If no (vendor prefixed version of) `requestAnimationFrame` is available,
     * `setTimeout` will be used in order to emulate a render loop running at
     * approximately 60 frames per second.
     *
     * @method  requestAnimationFrame
     *
     * @param   {Function}  callback function to be invoked on the next frame.
     * @return  {Number}    requestId to be used to cancel the request using
     *                      @link{cancelAnimationFrame}.
     */
    requestAnimationFrame: rAF,

    /**
     * Cross browser version of [cancelAnimationFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}.
     *
     * Cancels a previously using [requestAnimationFrame]{@link animationFrame#requestAnimationFrame}
     * scheduled request.
     *
     * Used for immediately stopping the render loop within the Engine.
     *
     * @method  cancelAnimationFrame
     *
     * @param   {Number}    requestId of the scheduled callback function
     *                      returned by [requestAnimationFrame]{@link animationFrame#requestAnimationFrame}.
     */
    cancelAnimationFrame: cAF
};

module.exports = animationFrame;

},{}],30:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

module.exports = {
    requestAnimationFrame: require('./animationFrame').requestAnimationFrame,
    cancelAnimationFrame: require('./animationFrame').cancelAnimationFrame
};

},{"./animationFrame":29}],31:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var polyfills = require('../polyfills');
var rAF = polyfills.requestAnimationFrame;
var cAF = polyfills.cancelAnimationFrame;

/**
 * Boolean constant indicating whether the RequestAnimationFrameLoop has access to the document.
 * The document is being used in order to subscribe for visibilitychange events
 * used for normalizing the RequestAnimationFrameLoop time when e.g. when switching tabs.
 * 
 * @constant
 * @type {Boolean}
 */ 
var DOCUMENT_ACCESS = typeof document !== 'undefined';

if (DOCUMENT_ACCESS) {
    var VENDOR_HIDDEN, VENDOR_VISIBILITY_CHANGE;

    // Opera 12.10 and Firefox 18 and later support
    if (typeof document.hidden !== 'undefined') {
        VENDOR_HIDDEN = 'hidden';
        VENDOR_VISIBILITY_CHANGE = 'visibilitychange';
    }
    else if (typeof document.mozHidden !== 'undefined') {
        VENDOR_HIDDEN = 'mozHidden';
        VENDOR_VISIBILITY_CHANGE = 'mozvisibilitychange';
    }
    else if (typeof document.msHidden !== 'undefined') {
        VENDOR_HIDDEN = 'msHidden';
        VENDOR_VISIBILITY_CHANGE = 'msvisibilitychange';
    }
    else if (typeof document.webkitHidden !== 'undefined') {
        VENDOR_HIDDEN = 'webkitHidden';
        VENDOR_VISIBILITY_CHANGE = 'webkitvisibilitychange';
    }
}

/**
 * RequestAnimationFrameLoop class used for updating objects on a frame-by-frame. Synchronizes the
 * `update` method invocations to the refresh rate of the screen. Manages
 * the `requestAnimationFrame`-loop by normalizing the passed in timestamp
 * when switching tabs.
 * 
 * @class RequestAnimationFrameLoop
 */
function RequestAnimationFrameLoop() {
    var _this = this;
    
    // References to objects to be updated on next frame.
    this._updates = [];
    
    this._looper = function(time) {
        _this.loop(time);
    };
    this._time = 0;
    this._stoppedAt = 0;
    this._sleep = 0;
    
    // Indicates whether the engine should be restarted when the tab/ window is
    // being focused again (visibility change).
    this._startOnVisibilityChange = true;
    
    // requestId as returned by requestAnimationFrame function;
    this._rAF = null;
    
    this._sleepDiff = true;
    
    // The engine is being started on instantiation.
    // TODO(alexanderGugel)
    this.start();

    // The RequestAnimationFrameLoop supports running in a non-browser environment (e.g. Worker).
    if (DOCUMENT_ACCESS) {
        document.addEventListener(VENDOR_VISIBILITY_CHANGE, function() {
            _this._onVisibilityChange();
        });
    }
}

/**
 * Handle the switching of tabs.
 *
 * @method
 * _private
 * 
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onVisibilityChange = function _onVisibilityChange() {
    if (document[VENDOR_HIDDEN]) {
        this._onUnfocus();
    }
    else {
        this._onFocus();
    }
};

/**
 * Internal helper function to be invoked as soon as the window/ tab is being
 * focused after a visibiltiy change.
 * 
 * @method
 * @private
 *
 * @return {undefined} undefined
 */ 
RequestAnimationFrameLoop.prototype._onFocus = function _onFocus() {
    if (this._startOnVisibilityChange) {
        this._start();
    }
};

/**
 * Internal helper function to be invoked as soon as the window/ tab is being
 * unfocused (hidden) after a visibiltiy change.
 * 
 * @method  _onFocus
 * @private
 *
 * @return {undefined} undefined
 */ 
RequestAnimationFrameLoop.prototype._onUnfocus = function _onUnfocus() {
    this._stop();
};

/**
 * Starts the RequestAnimationFrameLoop. When switching to a differnt tab/ window (changing the
 * visibiltiy), the engine will be retarted when switching back to a visible
 * state.
 *
 * @method
 * 
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.start = function start() {
    if (!this._running) {
        this._startOnVisibilityChange = true;
        this._start();
    }
    return this;
};

/**
 * Internal version of RequestAnimationFrameLoop's start function, not affecting behavior on visibilty
 * change.
 * 
 * @method
 * @private
*
 * @return {undefined} undefined
 */ 
RequestAnimationFrameLoop.prototype._start = function _start() {
    this._running = true;
    this._sleepDiff = true;
    this._rAF = rAF(this._looper);
};

/**
 * Stops the RequestAnimationFrameLoop.
 *
 * @method
 * 
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.stop = function stop() {
    if (this._running) {
        this._startOnVisibilityChange = false;
        this._stop();
    }
    return this;
};

/**
 * Internal version of RequestAnimationFrameLoop's stop function, not affecting behavior on visibilty
 * change.
 * 
 * @method
 * @private
 *
 * @return {undefined} undefined
 */ 
RequestAnimationFrameLoop.prototype._stop = function _stop() {
    this._running = false;
    this._stoppedAt = this._time;

    // Bug in old versions of Fx. Explicitly cancel.
    cAF(this._rAF);
};

/**
 * Determines whether the RequestAnimationFrameLoop is currently running or not.
 *
 * @method
 * 
 * @return {Boolean} boolean value indicating whether the RequestAnimationFrameLoop is currently running or not
 */
RequestAnimationFrameLoop.prototype.isRunning = function isRunning() {
    return this._running;
};

/**
 * Updates all registered objects.
 *
 * @method
 * 
 * @param {Number} time high resolution timstamp used for invoking the `update` method on all registered objects
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.step = function step (time) {
    this._time = time;
    if (this._sleepDiff) {
        this._sleep += time - this._stoppedAt;
        this._sleepDiff = false;
    }
    
    // The same timetamp will be emitted immediately before and after visibility
    // change.
    var normalizedTime = time - this._sleep;
    for (var i = 0, len = this._updates.length ; i < len ; i++) {
        this._updates[i].update(normalizedTime);
    }
    return this;
};

/**
 * Method being called by `requestAnimationFrame` on every paint. Indirectly
 * recursive by scheduling a future invocation of itself on the next paint.
 *
 * @method
 * 
 * @param {Number} time high resolution timstamp used for invoking the `update` method on all registered objects
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.loop = function loop(time) {
    this.step(time);
    this._rAF = rAF(this._looper);
    return this;
};

/**
 * Registeres an updateable object which `update` method should be invoked on
 * every paint, starting on the next paint (assuming the RequestAnimationFrameLoop is running).
 *
 * @method
 * 
 * @param {Object} updateable object to be updated
 * @param {Function} updateable.update update function to be called on the registered object
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.update = function update(updateable) {
    if (this._updates.indexOf(updateable) === -1) {
        this._updates.push(updateable);
    }
    return this;
};

/**
 * Deregisters an updateable object previously registered using `update` to be
 * no longer updated.
 *
 * @method
 * 
 * @param {Object} updateable updateable object previously registered using `update`
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.noLongerUpdate = function noLongerUpdate(updateable) {
    var index = this._updates.indexOf(updateable);
    if (index > -1) {
        this._updates.splice(index, 1);
    }
    return this;
};

module.exports = RequestAnimationFrameLoop;

},{"../polyfills":30}],32:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Context = require('./Context');
var injectCSS = require('./inject-css');

/**
 * Instantiates a new Compositor.
 * The Compositor receives draw commands frm the UIManager and routes the to the
 * respective context objects.
 *
 * Upon creation, it injects a stylesheet used for styling the individual
 * renderers used in the context objects.
 *
 * @class Compositor
 * @constructor
 * @return {undefined} undefined
 */
function Compositor() {
    injectCSS();

    this._contexts = {};
    this._outCommands = [];
    this._inCommands = [];
    this._time = null;

    this._resized = false;

    var _this = this;
    window.addEventListener('resize', function() {
        _this._resized = true;
    });
}

/**
 * Retrieves the time being used by the internal clock managed by
 * `FamousEngine`.
 *
 * The time is being passed into core by the Engine through the UIManager.
 * Since core has the ability to scale the time, the time needs to be passed
 * back to the rendering system.
 *
 * @method
 *
 * @return {Number} time The clock time used in core.
 */
Compositor.prototype.getTime = function getTime() {
    return this._time;
};

/**
 * Schedules an event to be sent the next time the out command queue is being
 * flushed.
 *
 * @method
 * @private
 *
 * @param  {String} path Render path to the node the event should be triggered
 * on (*targeted event*)
 * @param  {String} ev Event type
 * @param  {Object} payload Event object (serializable using structured cloning
 * algorithm)
 *
 * @return {undefined} undefined
 */
Compositor.prototype.sendEvent = function sendEvent(path, ev, payload) {
    this._outCommands.push('WITH', path, 'TRIGGER', ev, payload);
};

/**
 * Internal helper method used for notifying externally
 * resized contexts (e.g. by resizing the browser window).
 *
 * @method
 * @private
 *
 * @param  {String} selector render path to the node (context) that should be
 * resized
 * @param  {Array} size new context size
 *
 * @return {undefined} undefined
 */
Compositor.prototype.sendResize = function sendResize (selector, size) {
    this.sendEvent(selector, 'CONTEXT_RESIZE', size);
};

/**
 * Internal helper method used by `drawCommands`.
 * Subsequent commands are being associated with the node defined the the path
 * following the `WITH` command.
 *
 * @method
 * @private
 *
 * @param  {Number} iterator position index within the commands queue
 * @param  {Array} commands remaining message queue received, used to
 * shift single messages from
 *
 * @return {undefined} undefined
 */
Compositor.prototype.handleWith = function handleWith (iterator, commands) {
    var path = commands[iterator];
    var pathArr = path.split('/');
    var context = this.getOrSetContext(pathArr.shift());
    return context.receive(path, commands, iterator);
};

/**
 * Retrieves the top-level Context associated with the passed in document
 * query selector. If no such Context exists, a new one will be instantiated.
 *
 * @method
 * @private
 *
 * @param  {String} selector document query selector used for retrieving the
 * DOM node the VirtualElement should be attached to
 *
 * @return {Context} context
 */
Compositor.prototype.getOrSetContext = function getOrSetContext(selector) {
    if (this._contexts[selector]) {
        return this._contexts[selector];
    }
    else {
        var context = new Context(selector, this);
        this._contexts[selector] = context;
        return context;
    }
};

/**
 * Internal helper method used by `drawCommands`.
 *
 * @method
 * @private
 *
 * @param  {Number} iterator position index within the command queue
 * @param  {Array} commands remaining message queue received, used to
 * shift single messages
 *
 * @return {undefined} undefined
 */
Compositor.prototype.giveSizeFor = function giveSizeFor(iterator, commands) {
    var selector = commands[iterator];
    var size = this.getOrSetContext(selector).getRootSize();
    this.sendResize(selector, size);
};

/**
 * Processes the previously via `receiveCommands` updated incoming "in"
 * command queue.
 * Called by UIManager on a frame by frame basis.
 *
 * @method
 *
 * @return {Array} outCommands set of commands to be sent back
 */
Compositor.prototype.drawCommands = function drawCommands() {
    var commands = this._inCommands;
    var localIterator = 0;
    var command = commands[localIterator];
    while (command) {
        switch (command) {
            case 'TIME':
                this._time = commands[++localIterator];
                break;
            case 'WITH':
                localIterator = this.handleWith(++localIterator, commands);
                break;
            case 'NEED_SIZE_FOR':
                this.giveSizeFor(++localIterator, commands);
                break;
        }
        command = commands[++localIterator];
    }

    // TODO: Switch to associative arrays here...

    for (var key in this._contexts) {
        this._contexts[key].draw();
    }

    if (this._resized) {
        this.updateSize();
    }

    return this._outCommands;
};


/**
 * Updates the size of all previously registered context objects.
 * This results into CONTEXT_RESIZE events being sent and the root elements
 * used by the individual renderers being resized to the the DOMRenderer's root
 * size.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.updateSize = function updateSize() {
    for (var selector in this._contexts) {
        this._contexts[selector].updateSize();
    }
};

/**
 * Used by ThreadManager to update the internal queue of incoming commands.
 * Receiving commands does not immediately start the rendering process.
 *
 * @method
 *
 * @param  {Array} commands command queue to be processed by the compositor's
 * `drawCommands` method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.receiveCommands = function receiveCommands(commands) {
    var len = commands.length;
    for (var i = 0; i < len; i++) {
        this._inCommands.push(commands[i]);
    }
};

/**
 * Flushes the queue of outgoing "out" commands.
 * Called by ThreadManager.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.clearCommands = function clearCommands() {
    this._inCommands.length = 0;
    this._outCommands.length = 0;
    this._resized = false;
};

module.exports = Compositor;

},{"./Context":33,"./inject-css":35}],33:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var WebGLRenderer = require('../webgl-renderers/WebGLRenderer');
var Camera = require('../components/Camera');
var DOMRenderer = require('../dom-renderers/DOMRenderer');

/**
 * Context is a render layer with its own WebGLRenderer and DOMRenderer.
 * It is the interface between the Compositor which receives commands
 * and the renderers that interpret them. It also relays information to
 * the renderers about resizing.
 *
 * The DOMElement at the given query selector is used as the root. A
 * new DOMElement is appended to this root element, and used as the
 * parent element for all Famous DOM rendering at this context. A
 * canvas is added and used for all WebGL rendering at this context.
 *
 * @class Context
 * @constructor
 *
 * @param {String} selector Query selector used to locate root element of
 * context layer.
 * @param {Compositor} compositor Compositor reference to pass down to
 * WebGLRenderer.
 *
 * @return {undefined} undefined
 */
function Context(selector, compositor) {
    this._compositor = compositor;
    this._rootEl = document.querySelector(selector);

    this._selector = selector;

    // Create DOM element to be used as root for all famous DOM
    // rendering and append element to the root element.

    var DOMLayerEl = document.createElement('div');
    this._rootEl.appendChild(DOMLayerEl);

    // Instantiate renderers

    this.DOMRenderer = new DOMRenderer(DOMLayerEl, selector, compositor);
    this.WebGLRenderer = null;
    this.canvas = null;

    // State holders

    this._renderState = {
        projectionType: Camera.ORTHOGRAPHIC_PROJECTION,
        perspectiveTransform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        viewTransform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        viewDirty: false,
        perspectiveDirty: false
    };

    this._size = [];
    this._children = {};
    this._elementHash = {};

    this._meshTransform = [];
    this._meshSize = [0, 0, 0];
}

/**
 * Queries DOMRenderer size and updates canvas size. Relays size information to
 * WebGLRenderer.
 *
 * @return {Context} this
 */
Context.prototype.updateSize = function () {
    var newSize = this.DOMRenderer.getSize();
    this._compositor.sendResize(this._selector, newSize);

    var width = newSize[0];
    var height = newSize[1];

    this._size[0] = width;
    this._size[1] = height;
    this._size[2] = (width > height) ? width : height;

    if (this.canvas) {
        this.canvas.width  = width;
        this.canvas.height = height;
    }

    if (this.WebGLRenderer) this.WebGLRenderer.updateSize(this._size);

    return this;
};

/**
 * Draw function called after all commands have been handled for current frame.
 * Issues draw commands to all renderers with current renderState.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.draw = function draw() {
    this.DOMRenderer.draw(this._renderState);
    if (this.WebGLRenderer) this.WebGLRenderer.draw(this._renderState);

    if (this._renderState.perspectiveDirty) this._renderState.perspectiveDirty = false;
    if (this._renderState.viewDirty) this._renderState.viewDirty = false;
};

/**
 * Gets the size of the parent element of the DOMRenderer for this context.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.getRootSize = function getRootSize() {
    return this.DOMRenderer.getSize();
};

/**
 * Handles initialization of WebGLRenderer when necessary, including creation
 * of the canvas element and instantiation of the renderer. Also updates size
 * to pass size information to the renderer.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.initWebGL = function initWebGL() {
    this.canvas = document.createElement('canvas');
    this._rootEl.appendChild(this.canvas);
    this.WebGLRenderer = new WebGLRenderer(this.canvas, this._compositor);
    this.updateSize();
};

/**
 * Handles delegation of commands to renderers of this context.
 *
 * @method
 *
 * @param {String} path String used as identifier of a given node in the
 * scene graph.
 * @param {Array} commands List of all commands from this frame.
 * @param {Number} iterator Number indicating progress through the command
 * queue.
 *
 * @return {Number} iterator indicating progress through the command queue.
 */
Context.prototype.receive = function receive(path, commands, iterator) {
    var localIterator = iterator;

    var command = commands[++localIterator];
    this.DOMRenderer.loadPath(path);
    this.DOMRenderer.findTarget();
    while (command) {

        switch (command) {
            case 'INIT_DOM':
                this.DOMRenderer.insertEl(commands[++localIterator]);
                break;

            case 'DOM_RENDER_SIZE':
                this.DOMRenderer.getSizeOf(commands[++localIterator]);
                break;

            case 'CHANGE_TRANSFORM':
                for (var i = 0 ; i < 16 ; i++) this._meshTransform[i] = commands[++localIterator];

                this.DOMRenderer.setMatrix(this._meshTransform);

                if (this.WebGLRenderer)
                    this.WebGLRenderer.setCutoutUniform(path, 'u_transform', this._meshTransform);

                break;

            case 'CHANGE_SIZE':
                var width = commands[++localIterator];
                var height = commands[++localIterator];

                this.DOMRenderer.setSize(width, height);
                if (this.WebGLRenderer) {
                    this._meshSize[0] = width;
                    this._meshSize[1] = height;
                    this.WebGLRenderer.setCutoutUniform(path, 'u_size', this._meshSize);
                }
                break;

            case 'CHANGE_PROPERTY':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setProperty(commands[++localIterator], commands[++localIterator]);
                break;

            case 'CHANGE_CONTENT':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setContent(commands[++localIterator]);
                break;

            case 'CHANGE_ATTRIBUTE':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setAttribute(commands[++localIterator], commands[++localIterator]);
                break;

            case 'ADD_CLASS':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.addClass(commands[++localIterator]);
                break;

            case 'REMOVE_CLASS':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.removeClass(commands[++localIterator]);
                break;

            case 'SUBSCRIBE':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.subscribe(commands[++localIterator], commands[++localIterator]);
                break;

            case 'GL_SET_DRAW_OPTIONS':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshOptions(path, commands[++localIterator]);
                break;

            case 'GL_AMBIENT_LIGHT':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setAmbientLightColor(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_LIGHT_POSITION':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setLightPosition(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_LIGHT_COLOR':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setLightColor(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'MATERIAL_INPUT':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.handleMaterialInput(
                    path,
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_SET_GEOMETRY':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setGeometry(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_UNIFORMS':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshUniform(
                    path,
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_BUFFER_DATA':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.bufferData(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_CUTOUT_STATE':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setCutoutState(path, commands[++localIterator]);
                break;

            case 'GL_MESH_VISIBILITY':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshVisibility(path, commands[++localIterator]);
                break;

            case 'GL_REMOVE_MESH':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.removeMesh(path);
                break;

            case 'PINHOLE_PROJECTION':
                this._renderState.projectionType = Camera.PINHOLE_PROJECTION;
                this._renderState.perspectiveTransform[11] = -1 / commands[++localIterator];

                this._renderState.perspectiveDirty = true;
                break;

            case 'ORTHOGRAPHIC_PROJECTION':
                this._renderState.projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
                this._renderState.perspectiveTransform[11] = 0;

                this._renderState.perspectiveDirty = true;
                break;

            case 'CHANGE_VIEW_TRANSFORM':
                this._renderState.viewTransform[0] = commands[++localIterator];
                this._renderState.viewTransform[1] = commands[++localIterator];
                this._renderState.viewTransform[2] = commands[++localIterator];
                this._renderState.viewTransform[3] = commands[++localIterator];

                this._renderState.viewTransform[4] = commands[++localIterator];
                this._renderState.viewTransform[5] = commands[++localIterator];
                this._renderState.viewTransform[6] = commands[++localIterator];
                this._renderState.viewTransform[7] = commands[++localIterator];

                this._renderState.viewTransform[8] = commands[++localIterator];
                this._renderState.viewTransform[9] = commands[++localIterator];
                this._renderState.viewTransform[10] = commands[++localIterator];
                this._renderState.viewTransform[11] = commands[++localIterator];

                this._renderState.viewTransform[12] = commands[++localIterator];
                this._renderState.viewTransform[13] = commands[++localIterator];
                this._renderState.viewTransform[14] = commands[++localIterator];
                this._renderState.viewTransform[15] = commands[++localIterator];

                this._renderState.viewDirty = true;
                break;

            case 'WITH': return localIterator - 1;
        }

        command = commands[++localIterator];
    }

    return localIterator;
};

module.exports = Context;

},{"../components/Camera":1,"../dom-renderers/DOMRenderer":12,"../webgl-renderers/WebGLRenderer":49}],34:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The UIManager is being updated by an Engine by consecutively calling its
 * `update` method. It can either manage a real Web-Worker or the global
 * FamousEngine core singleton.
 *
 * @example
 * var compositor = new Compositor();
 * var engine = new Engine();
 *
 * // Using a Web Worker
 * var worker = new Worker('worker.bundle.js');
 * var threadmanger = new UIManager(worker, compositor, engine);
 *
 * // Without using a Web Worker
 * var threadmanger = new UIManager(Famous, compositor, engine);
 *
 * @class  UIManager
 * @constructor
 *
 * @param {Famous|Worker} thread The thread being used to receive messages
 * from and post messages to. Expected to expose a WebWorker-like API, which
 * means providing a way to listen for updates by setting its `onmessage`
 * property and sending updates using `postMessage`.
 * @param {Compositor} compositor an instance of Compositor used to extract
 * enqueued draw commands from to be sent to the thread.
 * @param {RenderLoop} renderLoop an instance of Engine used for executing
 * the `ENGINE` commands on.
 */
function UIManager (thread, compositor, renderLoop) {
    this._thread = thread;
    this._compositor = compositor;
    this._renderLoop = renderLoop;

    this._renderLoop.update(this);

    var _this = this;
    this._thread.onmessage = function (ev) {
        var message = ev.data ? ev.data : ev;
        if (message[0] === 'ENGINE') {
            switch (message[1]) {
                case 'START':
                    _this._renderLoop.start();
                    break;
                case 'STOP':
                    _this._renderLoop.stop();
                    break;
                default:
                    console.error(
                        'Unknown ENGINE command "' + message[1] + '"'
                    );
                    break;
            }
        }
        else {
            _this._compositor.receiveCommands(message);
        }
    };
    this._thread.onerror = function (error) {
        console.error(error);
    };
}

/**
 * Returns the thread being used by the UIManager.
 * This could either be an an actual web worker or a `FamousEngine` singleton.
 *
 * @method
 *
 * @return {Worker|FamousEngine} Either a web worker or a `FamousEngine` singleton.
 */
UIManager.prototype.getThread = function getThread() {
    return this._thread;
};

/**
 * Returns the compositor being used by this UIManager.
 *
 * @method
 *
 * @return {Compositor} The compositor used by the UIManager.
 */
UIManager.prototype.getCompositor = function getCompositor() {
    return this._compositor;
};

/**
 * Returns the engine being used by this UIManager.
 *
 * @method
 *
 * @return {Engine} The engine used by the UIManager.
 */
UIManager.prototype.getEngine = function getEngine() {
    return this._renderLoop;
};

/**
 * Update method being invoked by the Engine on every `requestAnimationFrame`.
 * Used for updating the notion of time within the managed thread by sending
 * a FRAME command and sending messages to
 *
 * @method
 *
 * @param  {Number} time unix timestamp to be passed down to the worker as a
 * FRAME command
 * @return {undefined} undefined
 */
UIManager.prototype.update = function update (time) {
    this._thread.postMessage(['FRAME', time]);
    var threadMessages = this._compositor.drawCommands();
    this._thread.postMessage(threadMessages);
    this._compositor.clearCommands();
};

module.exports = UIManager;

},{}],35:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var css = '.famous-dom-renderer {' +
    'width:100%;' +
    'height:100%;' +
    'transform-style:preserve-3d;' +
    '-webkit-transform-style:preserve-3d;' +
'}' +

'.famous-dom-element {' +
    '-webkit-transform-origin:0% 0%;' +
    'transform-origin:0% 0%;' +
    '-webkit-backface-visibility:visible;' +
    'backface-visibility:visible;' +
    '-webkit-transform-style:preserve-3d;' +
    'transform-style:preserve-3d;' +
    '-webkit-tap-highlight-color:transparent;' +
    'pointer-events:auto;' +
    'z-index:1;' +
'}' +

'.famous-dom-element-content,' +
'.famous-dom-element {' +
    'position:absolute;' +
    'box-sizing:border-box;' +
    '-moz-box-sizing:border-box;' +
    '-webkit-box-sizing:border-box;' +
'}' +

'.famous-webgl-renderer {' +
    '-webkit-transform: translateZ(1000000px);' +  /* TODO: Fix when Safari Fixes*/
    'transform: translateZ(1000000px)' +
    'pointer-events:none;' +
    'position:absolute;' +
    'z-index:1;' +
    'top:0;' +
    'left:0;' +
'}';

var INJECTED = typeof document === 'undefined';

function injectCSS() {
    if (INJECTED) return;
    INJECTED = true;
    if (document.createStyleSheet) {
        var sheet = document.createStyleSheet();
        sheet.cssText = css;
    }
    else {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        }
        else {
            style.appendChild(document.createTextNode(css));
        }

        (head ? head : document.documentElement).appendChild(style);
    }
}

module.exports = injectCSS;

},{}],36:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A lightweight, featureless EventEmitter.
 *
 * @class CallbackStore
 * @constructor
 */
function CallbackStore () {
    this._events = {};
}

/**
 * Adds a listener for the specified event (= key).
 *
 * @method on
 * @chainable
 *
 * @param  {String}   key       The event type (e.g. `click`).
 * @param  {Function} callback  A callback function to be invoked whenever `key`
 *                              event is being triggered.
 * @return {Function} destroy   A function to call if you want to remove the
 *                              callback.
 */
CallbackStore.prototype.on = function on (key, callback) {
    if (!this._events[key]) this._events[key] = [];
    var callbackList = this._events[key];
    callbackList.push(callback);
    return function () {
        callbackList.splice(callbackList.indexOf(callback), 1);
    };
};

/**
 * Removes a previously added event listener.
 *
 * @method off
 * @chainable
 *
 * @param  {String} key         The event type from which the callback function
 *                              should be removed.
 * @param  {Function} callback  The callback function to be removed from the
 *                              listeners for key.
 * @return {CallbackStore} this
 */
CallbackStore.prototype.off = function off (key, callback) {
    var events = this._events[key];
    if (events) events.splice(events.indexOf(callback), 1);
    return this;
};

/**
 * Invokes all the previously for this key registered callbacks.
 *
 * @method trigger
 * @chainable
 *
 * @param  {String}        key      The event type.
 * @param  {Object}        payload  The event payload (event object).
 * @return {CallbackStore} this
 */
CallbackStore.prototype.trigger = function trigger (key, payload) {
    var events = this._events[key];
    if (events) {
        var i = 0;
        var len = events.length;
        for (; i < len ; i++) events[i](payload);
    }
    return this;
};

module.exports = CallbackStore;

},{}],37:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Deep clone an object.
 *
 * @method  clone
 *
 * @param {Object} b       Object to be cloned.
 * @return {Object} a      Cloned object (deep equality).
 */
var clone = function clone(b) {
    var a;
    if (typeof b === 'object') {
        a = (b instanceof Array) ? [] : {};
        for (var key in b) {
            if (typeof b[key] === 'object' && b[key] !== null) {
                if (b[key] instanceof Array) {
                    a[key] = new Array(b[key].length);
                    for (var i = 0; i < b[key].length; i++) {
                        a[key][i] = clone(b[key][i]);
                    }
                }
                else {
                  a[key] = clone(b[key]);
                }
            }
            else {
                a[key] = b[key];
            }
        }
    }
    else {
        a = b;
    }
    return a;
};

module.exports = clone;

},{}],38:[function(require,module,exports){
'use strict';

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Takes an object containing keys and values and returns an object
 * comprising two "associate" arrays, one with the keys and the other
 * with the values.
 *
 * @method keyValuesToArrays
 *
 * @param {Object} obj                      Objects where to extract keys and values
 *                                          from.
 * @return {Object}         result
 *         {Array.<String>} result.keys     Keys of `result`, as returned by
 *                                          `Object.keys()`
 *         {Array}          result.values   Values of passed in object.
 */
module.exports = function keyValuesToArrays(obj) {
    var keysArray = [], valuesArray = [];
    var i = 0;
    for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keysArray[i] = key;
            valuesArray[i] = obj[key];
            i++;
        }
    }
    return {
        keys: keysArray,
        values: valuesArray
    };
};

},{}],39:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var PREFIXES = ['', '-ms-', '-webkit-', '-moz-', '-o-'];

/**
 * A helper function used for determining the vendor prefixed version of the
 * passed in CSS property.
 *
 * Vendor checks are being conducted in the following order:
 *
 * 1. (no prefix)
 * 2. `-mz-`
 * 3. `-webkit-`
 * 4. `-moz-`
 * 5. `-o-`
 *
 * @method vendorPrefix
 *
 * @param {String} property     CSS property (no camelCase), e.g.
 *                              `border-radius`.
 * @return {String} prefixed    Vendor prefixed version of passed in CSS
 *                              property (e.g. `-webkit-border-radius`).
 */
function vendorPrefix(property) {
    for (var i = 0; i < PREFIXES.length; i++) {
        var prefixed = PREFIXES[i] + property;
        if (document.documentElement.style[prefixed] === '') {
            return prefixed;
        }
    }
    return property;
}

module.exports = vendorPrefix;

},{}],40:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var GeometryIds = 0;

/**
 * Geometry is a component that defines and manages data
 * (vertex data and attributes) that is used to draw to WebGL.
 *
 * @class Geometry
 * @constructor
 *
 * @param {Object} options instantiation options
 * @return {undefined} undefined
 */
function Geometry(options) {
    this.options = options || {};
    this.DEFAULT_BUFFER_SIZE = 3;

    this.spec = {
        id: GeometryIds++,
        dynamic: false,
        type: this.options.type || 'TRIANGLES',
        bufferNames: [],
        bufferValues: [],
        bufferSpacings: [],
        invalidations: []
    };

    if (this.options.buffers) {
        var len = this.options.buffers.length;
        for (var i = 0; i < len;) {
            this.spec.bufferNames.push(this.options.buffers[i].name);
            this.spec.bufferValues.push(this.options.buffers[i].data);
            this.spec.bufferSpacings.push(this.options.buffers[i].size || this.DEFAULT_BUFFER_SIZE);
            this.spec.invalidations.push(i++);
        }
    }
}

module.exports = Geometry;

},{}],41:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Vec3 = require('../math/Vec3');
var Vec2 = require('../math/Vec2');

var outputs = [
    new Vec3(),
    new Vec3(),
    new Vec3(),
    new Vec2(),
    new Vec2()
];

/**
 * A helper object used to calculate buffers for complicated geometries.
 * Tailored for the WebGLRenderer, used by most primitives.
 *
 * @static
 * @class GeometryHelper
 * @return {undefined} undefined
 */
var GeometryHelper = {};

/**
 * A function that iterates through vertical and horizontal slices
 * based on input detail, and generates vertices and indices for each
 * subdivision.
 *
 * @static
 * @method
 *
 * @param  {Number} detailX Amount of slices to iterate through.
 * @param  {Number} detailY Amount of stacks to iterate through.
 * @param  {Function} func Function used to generate vertex positions at each point.
 * @param  {Boolean} wrap Optional parameter (default: Pi) for setting a custom wrap range
 *
 * @return {Object} Object containing generated vertices and indices.
 */
GeometryHelper.generateParametric = function generateParametric(detailX, detailY, func, wrap) {
    var vertices = [];
    var i;
    var theta;
    var phi;
    var j;

    // We can wrap around slightly more than once for uv coordinates to look correct.

    var Xrange = wrap ? Math.PI + (Math.PI / (detailX - 1)) : Math.PI;
    var out = [];

    for (i = 0; i < detailX + 1; i++) {
        theta = i * Xrange / detailX;
        for (j = 0; j < detailY; j++) {
            phi = j * 2.0 * Xrange / detailY;
            func(theta, phi, out);
            vertices.push(out[0], out[1], out[2]);
        }
    }

    var indices = [],
        v = 0,
        next;
    for (i = 0; i < detailX; i++) {
        for (j = 0; j < detailY; j++) {
            next = (j + 1) % detailY;
            indices.push(v + j, v + j + detailY, v + next);
            indices.push(v + next, v + j + detailY, v + next + detailY);
        }
        v += detailY;
    }

    return {
        vertices: vertices,
        indices: indices
    };
};

/**
 * Calculates normals belonging to each face of a geometry.
 * Assumes clockwise declaration of vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry.
 * @param {Array} indices Indices declaring faces of geometry.
 * @param {Array} out Array to be filled and returned.
 *
 * @return {Array} Calculated face normals.
 */
GeometryHelper.computeNormals = function computeNormals(vertices, indices, out) {
    var normals = out || [];
    var indexOne;
    var indexTwo;
    var indexThree;
    var normal;
    var j;
    var len = indices.length / 3;
    var i;
    var x;
    var y;
    var z;
    var length;

    for (i = 0; i < len; i++) {
        indexTwo = indices[i*3 + 0] * 3;
        indexOne = indices[i*3 + 1] * 3;
        indexThree = indices[i*3 + 2] * 3;

        outputs[0].set(vertices[indexOne], vertices[indexOne + 1], vertices[indexOne + 2]);
        outputs[1].set(vertices[indexTwo], vertices[indexTwo + 1], vertices[indexTwo + 2]);
        outputs[2].set(vertices[indexThree], vertices[indexThree + 1], vertices[indexThree + 2]);

        normal = outputs[2].subtract(outputs[0]).cross(outputs[1].subtract(outputs[0])).normalize();

        normals[indexOne + 0] = (normals[indexOne + 0] || 0) + normal.x;
        normals[indexOne + 1] = (normals[indexOne + 1] || 0) + normal.y;
        normals[indexOne + 2] = (normals[indexOne + 2] || 0) + normal.z;

        normals[indexTwo + 0] = (normals[indexTwo + 0] || 0) + normal.x;
        normals[indexTwo + 1] = (normals[indexTwo + 1] || 0) + normal.y;
        normals[indexTwo + 2] = (normals[indexTwo + 2] || 0) + normal.z;

        normals[indexThree + 0] = (normals[indexThree + 0] || 0) + normal.x;
        normals[indexThree + 1] = (normals[indexThree + 1] || 0) + normal.y;
        normals[indexThree + 2] = (normals[indexThree + 2] || 0) + normal.z;
    }

    for (i = 0; i < normals.length; i += 3) {
        x = normals[i];
        y = normals[i+1];
        z = normals[i+2];
        length = Math.sqrt(x * x + y * y + z * z);
        for(j = 0; j< 3; j++) {
            normals[i+j] /= length;
        }
    }

    return normals;
};

/**
 * Divides all inserted triangles into four sub-triangles. Alters the
 * passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} indices Indices declaring faces of geometry
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} textureCoords Texture coordinates of all points on the geometry
 * @return {undefined} undefined
 */
GeometryHelper.subdivide = function subdivide(indices, vertices, textureCoords) {
    var triangleIndex = indices.length / 3;
    var face;
    var i;
    var j;
    var k;
    var pos;
    var tex;

    while (triangleIndex--) {
        face = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);

        pos = face.map(function(vertIndex) {
            return new Vec3(vertices[vertIndex * 3], vertices[vertIndex * 3 + 1], vertices[vertIndex * 3 + 2]);
        });
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[0], pos[1], outputs[0]), 0.5, outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[1], pos[2], outputs[0]), 0.5, outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[0], pos[2], outputs[0]), 0.5, outputs[1]).toArray());

        if (textureCoords) {
            tex = face.map(function(vertIndex) {
                return new Vec2(textureCoords[vertIndex * 2], textureCoords[vertIndex * 2 + 1]);
            });
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[0], tex[1], outputs[3]), 0.5, outputs[4]).toArray());
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[1], tex[2], outputs[3]), 0.5, outputs[4]).toArray());
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[0], tex[2], outputs[3]), 0.5, outputs[4]).toArray());
        }

        i = vertices.length - 3;
        j = i + 1;
        k = i + 2;

        indices.push(i, j, k);
        indices.push(face[0], i, k);
        indices.push(i, face[1], j);
        indices[triangleIndex] = k;
        indices[triangleIndex + 1] = j;
        indices[triangleIndex + 2] = face[2];
    }
};

/**
 * Creates duplicate of vertices that are shared between faces.
 * Alters the input vertex and index arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} indices Indices declaring faces of geometry
 * @return {undefined} undefined
 */
GeometryHelper.getUniqueFaces = function getUniqueFaces(vertices, indices) {
    var triangleIndex = indices.length / 3,
        registered = [],
        index;

    while (triangleIndex--) {
        for (var i = 0; i < 3; i++) {

            index = indices[triangleIndex * 3 + i];

            if (registered[index]) {
                vertices.push(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
                indices[triangleIndex * 3 + i] = vertices.length / 3 - 1;
            }
            else {
                registered[index] = true;
            }
        }
    }
};

/**
 * Divides all inserted triangles into four sub-triangles while maintaining
 * a radius of one. Alters the passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} indices Indices declaring faces of geometry
 * @return {undefined} undefined
 */
GeometryHelper.subdivideSpheroid = function subdivideSpheroid(vertices, indices) {
    var triangleIndex = indices.length / 3,
        abc,
        face,
        i, j, k;

    while (triangleIndex--) {
        face = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);
        abc = face.map(function(vertIndex) {
            return new Vec3(vertices[vertIndex * 3], vertices[vertIndex * 3 + 1], vertices[vertIndex * 3 + 2]);
        });

        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[0], abc[1], outputs[0]), outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[1], abc[2], outputs[0]), outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[0], abc[2], outputs[0]), outputs[1]).toArray());

        i = vertices.length / 3 - 3;
        j = i + 1;
        k = i + 2;

        indices.push(i, j, k);
        indices.push(face[0], i, k);
        indices.push(i, face[1], j);
        indices[triangleIndex * 3] = k;
        indices[triangleIndex * 3 + 1] = j;
        indices[triangleIndex * 3 + 2] = face[2];
    }
};

/**
 * Divides all inserted triangles into four sub-triangles while maintaining
 * a radius of one. Alters the passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting normals.
 *
 * @return {Array} New list of calculated normals.
 */
GeometryHelper.getSpheroidNormals = function getSpheroidNormals(vertices, out) {
    out = out || [];
    var length = vertices.length / 3;
    var normalized;

    for (var i = 0; i < length; i++) {
        normalized = new Vec3(
            vertices[i * 3 + 0],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        ).normalize().toArray();

        out[i * 3 + 0] = normalized[0];
        out[i * 3 + 1] = normalized[1];
        out[i * 3 + 2] = normalized[2];
    }

    return out;
};

/**
 * Calculates texture coordinates for spheroid primitives based on
 * input vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting texture coordinates.
 *
 * @return {Array} New list of calculated texture coordinates
 */
GeometryHelper.getSpheroidUV = function getSpheroidUV(vertices, out) {
    out = out || [];
    var length = vertices.length / 3;
    var vertex;

    var uv = [];

    for(var i = 0; i < length; i++) {
        vertex = outputs[0].set(
            vertices[i * 3],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        )
        .normalize()
        .toArray();

        uv[0] = this.getAzimuth(vertex) * 0.5 / Math.PI + 0.5;
        uv[1] = this.getAltitude(vertex) / Math.PI + 0.5;

        out.push.apply(out, uv);
    }

    return out;
};

/**
 * Iterates through and normalizes a list of vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting normalized vectors.
 *
 * @return {Array} New list of normalized vertices
 */
GeometryHelper.normalizeAll = function normalizeAll(vertices, out) {
    out = out || [];
    var len = vertices.length / 3;

    for (var i = 0; i < len; i++) {
        Array.prototype.push.apply(out, new Vec3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]).normalize().toArray());
    }

    return out;
};

/**
 * Normalizes a set of vertices to model space.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with model space position vectors.
 *
 * @return {Array} Output vertices.
 */
GeometryHelper.normalizeVertices = function normalizeVertices(vertices, out) {
    out = out || [];
    var len = vertices.length / 3;
    var vectors = [];
    var minX;
    var maxX;
    var minY;
    var maxY;
    var minZ;
    var maxZ;
    var v;
    var i;

    for (i = 0; i < len; i++) {
        v = vectors[i] = new Vec3(
            vertices[i * 3],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        );

        if (minX == null || v.x < minX) minX = v.x;
        if (maxX == null || v.x > maxX) maxX = v.x;

        if (minY == null || v.y < minY) minY = v.y;
        if (maxY == null || v.y > maxY) maxY = v.y;

        if (minZ == null || v.z < minZ) minZ = v.z;
        if (maxZ == null || v.z > maxZ) maxZ = v.z;
    }

    var translation = new Vec3(
        getTranslationFactor(maxX, minX),
        getTranslationFactor(maxY, minY),
        getTranslationFactor(maxZ, minZ)
    );

    var scale = Math.min(
        getScaleFactor(maxX + translation.x, minX + translation.x),
        getScaleFactor(maxY + translation.y, minY + translation.y),
        getScaleFactor(maxZ + translation.z, minZ + translation.z)
    );

    for (i = 0; i < vectors.length; i++) {
        out.push.apply(out, vectors[i].add(translation).scale(scale).toArray());
    }

    return out;
};

/**
 * Determines translation amount for a given axis to normalize model coordinates.
 *
 * @method
 * @private
 *
 * @param {Number} max Maximum position value of given axis on the model.
 * @param {Number} min Minimum position value of given axis on the model.
 *
 * @return {Number} Number by which the given axis should be translated for all vertices.
 */
function getTranslationFactor(max, min) {
    return -(min + (max - min) / 2);
}

/**
 * Determines scale amount for a given axis to normalize model coordinates.
 *
 * @method
 * @private
 *
 * @param {Number} max Maximum scale value of given axis on the model.
 * @param {Number} min Minimum scale value of given axis on the model.
 *
 * @return {Number} Number by which the given axis should be scaled for all vertices.
 */
function getScaleFactor(max, min) {
    return 1 / ((max - min) / 2);
}

/**
 * Finds the azimuth, or angle above the XY plane, of a given vector.
 *
 * @static
 * @method
 *
 * @param {Array} v Vertex to retreive azimuth from.
 *
 * @return {Number} Azimuth value in radians.
 */
GeometryHelper.getAzimuth = function azimuth(v) {
    return Math.atan2(v[2], -v[0]);
};

/**
 * Finds the altitude, or angle above the XZ plane, of a given vector.
 *
 * @static
 * @method
 *
 * @param {Array} v Vertex to retreive altitude from.
 *
 * @return {Number} Altitude value in radians.
 */
GeometryHelper.getAltitude = function altitude(v) {
    return Math.atan2(-v[1], Math.sqrt((v[0] * v[0]) + (v[2] * v[2])));
};

/**
 * Converts a list of indices from 'triangle' to 'line' format.
 *
 * @static
 * @method
 *
 * @param {Array} indices Indices of all faces on the geometry
 * @param {Array} out Indices of all faces on the geometry
 *
 * @return {Array} New list of line-formatted indices
 */
GeometryHelper.trianglesToLines = function triangleToLines(indices, out) {
    var numVectors = indices.length / 3;
    out = out || [];
    var i;

    for (i = 0; i < numVectors; i++) {
        out.push(indices[i * 3 + 0], indices[i * 3 + 1]);
        out.push(indices[i * 3 + 1], indices[i * 3 + 2]);
        out.push(indices[i * 3 + 2], indices[i * 3 + 0]);
    }

    return out;
};

/**
 * Adds a reverse order triangle for every triangle in the mesh. Adds extra vertices
 * and indices to input arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices X, Y, Z positions of all vertices in the geometry
 * @param {Array} indices Indices of all faces on the geometry
 * @return {undefined} undefined
 */
GeometryHelper.addBackfaceTriangles = function addBackfaceTriangles(vertices, indices) {
    var nFaces = indices.length / 3;

    var maxIndex = 0;
    var i = indices.length;
    while (i--) if (indices[i] > maxIndex) maxIndex = indices[i];

    maxIndex++;

    for (i = 0; i < nFaces; i++) {
        var indexOne = indices[i * 3],
            indexTwo = indices[i * 3 + 1],
            indexThree = indices[i * 3 + 2];

        indices.push(indexOne + maxIndex, indexThree + maxIndex, indexTwo + maxIndex);
    }

    // Iterating instead of .slice() here to avoid max call stack issue.

    var nVerts = vertices.length;
    for (i = 0; i < nVerts; i++) {
        vertices.push(vertices[i]);
    }
};

module.exports = GeometryHelper;

},{"../math/Vec2":25,"../math/Vec3":26}],42:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Geometry = require('../Geometry');
var GeometryHelper = require('../GeometryHelper');

/**
 * This function returns a new static geometry, which is passed
 * custom buffer data.
 *
 * @class Plane
 * @constructor
 *
 * @param {Object} options Parameters that alter the
 * vertex buffers of the generated geometry.
 *
 * @return {Object} constructed geometry
 */
function Plane(options) {
    options = options || {};
    var detailX = options.detailX || options.detail || 1;
    var detailY = options.detailY || options.detail || 1;

    var vertices      = [];
    var textureCoords = [];
    var normals       = [];
    var indices       = [];

    var i;

    for (var y = 0; y <= detailY; y++) {
        var t = y / detailY;
        for (var x = 0; x <= detailX; x++) {
            var s = x / detailX;
            vertices.push(2. * (s - .5), 2 * (t - .5), 0);
            textureCoords.push(s, 1 - t);
            if (x < detailX && y < detailY) {
                i = x + y * (detailX + 1);
                indices.push(i, i + 1, i + detailX + 1);
                indices.push(i + detailX + 1, i + 1, i + detailX + 2);
            }
        }
    }

    if (options.backface !== false) {
        GeometryHelper.addBackfaceTriangles(vertices, indices);

        // duplicate texture coordinates as well

        var len = textureCoords.length;
        for (i = 0; i < len; i++) textureCoords.push(textureCoords[i]);
    }

    normals = GeometryHelper.computeNormals(vertices, indices);

    return new Geometry({
        buffers: [
            { name: 'a_pos', data: vertices },
            { name: 'a_texCoord', data: textureCoords, size: 2 },
            { name: 'a_normals', data: normals },
            { name: 'indices', data: indices, size: 1 }
        ]
    });
}

module.exports = Plane;

},{"../Geometry":40,"../GeometryHelper":41}],43:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Buffer is a private class that wraps the vertex data that defines
 * the the points of the triangles that webgl draws. Each buffer
 * maps to one attribute of a mesh.
 *
 * @class Buffer
 * @constructor
 *
 * @param {Number} target The bind target of the buffer to update: ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER
 * @param {Object} type Array type to be used in calls to gl.bufferData.
 * @param {WebGLContext} gl The WebGL context that the buffer is hosted by.
 *
 * @return {undefined} undefined
 */
function Buffer(target, type, gl) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
    this.gl = gl;
}

/**
 * Creates a WebGL buffer if one does not yet exist and binds the buffer to
 * to the context. Runs bufferData with appropriate data.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Buffer.prototype.subData = function subData() {
    var gl = this.gl;
    var data = [];

    // to prevent against maximum call-stack issue.
    for (var i = 0, chunk = 10000; i < this.data.length; i += chunk)
        data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));

    this.buffer = this.buffer || gl.createBuffer();
    gl.bindBuffer(this.target, this.buffer);
    gl.bufferData(this.target, new this.type(data), gl.STATIC_DRAW);
};

module.exports = Buffer;

},{}],44:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var INDICES = 'indices';

var Buffer = require('./Buffer');

/**
 * BufferRegistry is a class that manages allocation of buffers to
 * input geometries.
 *
 * @class BufferRegistry
 * @constructor
 *
 * @param {WebGLContext} context WebGL drawing context to be passed to buffers.
 *
 * @return {undefined} undefined
 */
function BufferRegistry(context) {
    this.gl = context;

    this.registry = {};
    this._dynamicBuffers = [];
    this._staticBuffers = [];

    this._arrayBufferMax = 30000;
    this._elementBufferMax = 30000;
}

/**
 * Binds and fills all the vertex data into webgl buffers.  Will reuse buffers if
 * possible.  Populates registry with the name of the buffer, the WebGL buffer
 * object, spacing of the attribute, the attribute's offset within the buffer,
 * and finally the length of the buffer.  This information is later accessed by
 * the root to draw the buffers.
 *
 * @method
 *
 * @param {Number} geometryId Id of the geometry instance that holds the buffers.
 * @param {String} name Key of the input buffer in the geometry.
 * @param {Array} value Flat array containing input data for buffer.
 * @param {Number} spacing The spacing, or itemSize, of the input buffer.
 * @param {Boolean} dynamic Boolean denoting whether a geometry is dynamic or static.
 *
 * @return {undefined} undefined
 */
BufferRegistry.prototype.allocate = function allocate(geometryId, name, value, spacing, dynamic) {
    var vertexBuffers = this.registry[geometryId] || (this.registry[geometryId] = { keys: [], values: [], spacing: [], offset: [], length: [] });

    var j = vertexBuffers.keys.indexOf(name);
    var isIndex = name === INDICES;
    var bufferFound = false;
    var newOffset;
    var offset = 0;
    var length;
    var buffer;
    var k;

    if (j === -1) {
        j = vertexBuffers.keys.length;
        length = isIndex ? value.length : Math.floor(value.length / spacing);

        if (!dynamic) {

            // Use a previously created buffer if available.

            for (k = 0; k < this._staticBuffers.length; k++) {

                if (isIndex === this._staticBuffers[k].isIndex) {
                    newOffset = this._staticBuffers[k].offset + value.length;
                    if ((!isIndex && newOffset < this._arrayBufferMax) || (isIndex && newOffset < this._elementBufferMax)) {
                        buffer = this._staticBuffers[k].buffer;
                        offset = this._staticBuffers[k].offset;
                        this._staticBuffers[k].offset += value.length;
                        bufferFound = true;
                        break;
                    }
                }
            }

            // Create a new static buffer in none were found.

            if (!bufferFound) {
                buffer = new Buffer(
                    isIndex ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER,
                    isIndex ? Uint16Array : Float32Array,
                    this.gl
                );

                this._staticBuffers.push({ buffer: buffer, offset: value.length, isIndex: isIndex });
            }
        }
        else {

            // For dynamic geometries, always create new buffer.

            buffer = new Buffer(
                isIndex ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER,
                isIndex ? Uint16Array : Float32Array,
                this.gl
            );

            this._dynamicBuffers.push({ buffer: buffer, offset: value.length, isIndex: isIndex });
        }

        // Update the registry for the spec with buffer information.

        vertexBuffers.keys.push(name);
        vertexBuffers.values.push(buffer);
        vertexBuffers.spacing.push(spacing);
        vertexBuffers.offset.push(offset);
        vertexBuffers.length.push(length);
    }

    var len = value.length;
    for (k = 0; k < len; k++) {
        vertexBuffers.values[j].data[offset + k] = value[k];
    }
    vertexBuffers.values[j].subData();
};

module.exports = BufferRegistry;

},{"./Buffer":43}],45:[function(require,module,exports){
'use strict';

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Takes the original rendering contexts' compiler function
 * and augments it with added functionality for parsing and
 * displaying errors.
 *
 * @method
 *
 * @returns {Function} Augmented function
 */
module.exports = function Debug() {
    return _augmentFunction(
        this.gl.compileShader,
        function(shader) {
            if (!this.getShaderParameter(shader, this.COMPILE_STATUS)) {
                var errors = this.getShaderInfoLog(shader);
                var source = this.getShaderSource(shader);
                _processErrors(errors, source);
            }
        }
    );
};

// Takes a function, keeps the reference and replaces it by a closure that
// executes the original function and the provided callback.
function _augmentFunction(func, callback) {
    return function() {
        var res = func.apply(this, arguments);
        callback.apply(this, arguments);
        return res;
    };
}

// Parses errors and failed source code from shaders in order
// to build displayable error blocks.
// Inspired by Jaume Sanchez Elias.
function _processErrors(errors, source) {

    var css = 'body,html{background:#e3e3e3;font-family:monaco,monospace;font-size:14px;line-height:1.7em}' +
              '#shaderReport{left:0;top:0;right:0;box-sizing:border-box;position:absolute;z-index:1000;color:' +
              '#222;padding:15px;white-space:normal;list-style-type:none;margin:50px auto;max-width:1200px}' +
              '#shaderReport li{background-color:#fff;margin:13px 0;box-shadow:0 1px 2px rgba(0,0,0,.15);' +
              'padding:20px 30px;border-radius:2px;border-left:20px solid #e01111}span{color:#e01111;' +
              'text-decoration:underline;font-weight:700}#shaderReport li p{padding:0;margin:0}' +
              '#shaderReport li:nth-child(even){background-color:#f4f4f4}' +
              '#shaderReport li p:first-child{margin-bottom:10px;color:#666}';

    var el = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(el);
    el.textContent = css;

    var report = document.createElement('ul');
    report.setAttribute('id', 'shaderReport');
    document.body.appendChild(report);

    var re = /ERROR: [\d]+:([\d]+): (.+)/gmi;
    var lines = source.split('\n');

    var m;
    while ((m = re.exec(errors)) != null) {
        if (m.index === re.lastIndex) re.lastIndex++;
        var li = document.createElement('li');
        var code = '<p><span>ERROR</span> "' + m[2] + '" in line ' + m[1] + '</p>';
        code += '<p><b>' + lines[m[1] - 1].replace(/^[ \t]+/g, '') + '</b></p>';
        li.innerHTML = code;
        report.appendChild(li);
    }
}

},{}],46:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var clone = require('../utilities/clone');
var keyValueToArrays = require('../utilities/keyValueToArrays');

var vertexWrapper = require('../webgl-shaders').vertex;
var fragmentWrapper = require('../webgl-shaders').fragment;
var Debug = require('./Debug');

var VERTEX_SHADER = 35633;
var FRAGMENT_SHADER = 35632;
var identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var header = 'precision mediump float;\n';

var TYPES = {
    undefined: 'float ',
    1: 'float ',
    2: 'vec2 ',
    3: 'vec3 ',
    4: 'vec4 ',
    16: 'mat4 '
};

var inputTypes = {
    u_baseColor: 'vec4',
    u_normals: 'vert',
    u_glossiness: 'vec4',
    u_positionOffset: 'vert'
};

var masks =  {
    vert: 1,
    vec3: 2,
    vec4: 4,
    float: 8
};

/**
 * Uniform keys and values
 */
var uniforms = keyValueToArrays({
    u_perspective: identityMatrix,
    u_view: identityMatrix,
    u_resolution: [0, 0, 0],
    u_transform: identityMatrix,
    u_size: [1, 1, 1],
    u_time: 0,
    u_opacity: 1,
    u_metalness: 0,
    u_glossiness: [0, 0, 0, 0],
    u_baseColor: [1, 1, 1, 1],
    u_normals: [1, 1, 1],
    u_positionOffset: [0, 0, 0],
    u_lightPosition: identityMatrix,
    u_lightColor: identityMatrix,
    u_ambientLight: [0, 0, 0],
    u_flatShading: 0,
    u_numLights: 0
});

/**
 * Attributes keys and values
 */
var attributes = keyValueToArrays({
    a_pos: [0, 0, 0],
    a_texCoord: [0, 0],
    a_normals: [0, 0, 0]
});

/**
 * Varyings keys and values
 */
var varyings = keyValueToArrays({
    v_textureCoordinate: [0, 0],
    v_normal: [0, 0, 0],
    v_position: [0, 0, 0],
    v_eyeVector: [0, 0, 0]
});

/**
 * A class that handles interactions with the WebGL shader program
 * used by a specific context.  It manages creation of the shader program
 * and the attached vertex and fragment shaders.  It is also in charge of
 * passing all uniforms to the WebGLContext.
 *
 * @class Program
 * @constructor
 *
 * @param {WebGL_Context} gl Context to be used to create the shader program
 * @param {Object} options Program options
 *
 * @return {undefined} undefined
 */
function Program(gl, options) {
    this.gl = gl;
    this.textureSlots = 1;
    this.options = options || {};

    this.registeredMaterials = {};
    this.flaggedUniforms = [];
    this.cachedUniforms  = {};
    this.uniformTypes = [];

    this.definitionVec4 = [];
    this.definitionVec3 = [];
    this.definitionFloat = [];
    this.applicationVec3 = [];
    this.applicationVec4 = [];
    this.applicationFloat = [];
    this.applicationVert = [];
    this.definitionVert = [];

    this.resetProgram();
}

/**
 * Determines whether a material has already been registered to
 * the shader program.
 *
 * @method
 *
 * @param {String} name Name of target input of material.
 * @param {Object} material Compiled material object being verified.
 *
 * @return {Program} this Current program.
 */
Program.prototype.registerMaterial = function registerMaterial(name, material) {
    var compiled = material;
    var type = inputTypes[name];
    var mask = masks[type];

    if ((this.registeredMaterials[material._id] & mask) === mask) return this;

    var k;

    for (k in compiled.uniforms) {
        if (uniforms.keys.indexOf(k) === -1) {
            uniforms.keys.push(k);
            uniforms.values.push(compiled.uniforms[k]);
        }
    }

    for (k in compiled.varyings) {
        if (varyings.keys.indexOf(k) === -1) {
            varyings.keys.push(k);
            varyings.values.push(compiled.varyings[k]);
        }
    }

    for (k in compiled.attributes) {
        if (attributes.keys.indexOf(k) === -1) {
            attributes.keys.push(k);
            attributes.values.push(compiled.attributes[k]);
        }
    }

    this.registeredMaterials[material._id] |= mask;

    if (type === 'float') {
        this.definitionFloat.push(material.defines);
        this.definitionFloat.push('float fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationFloat.push('if (int(abs(ID)) == ' + material._id + ') return fa_' + material._id  + '();');
    }

    if (type === 'vec3') {
        this.definitionVec3.push(material.defines);
        this.definitionVec3.push('vec3 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVec3.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    if (type === 'vec4') {
        this.definitionVec4.push(material.defines);
        this.definitionVec4.push('vec4 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVec4.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    if (type === 'vert') {
        this.definitionVert.push(material.defines);
        this.definitionVert.push('vec3 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVert.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    return this.resetProgram();
};

/**
 * Clears all cached uniforms and attribute locations.  Assembles
 * new fragment and vertex shaders and based on material from
 * currently registered materials.  Attaches said shaders to new
 * shader program and upon success links program to the WebGL
 * context.
 *
 * @method
 *
 * @return {Program} Current program.
 */
Program.prototype.resetProgram = function resetProgram() {
    var vertexHeader = [header];
    var fragmentHeader = [header];

    var fragmentSource;
    var vertexSource;
    var program;
    var name;
    var value;
    var i;

    this.uniformLocations   = [];
    this.attributeLocations = {};

    this.uniformTypes = {};

    this.attributeNames = clone(attributes.keys);
    this.attributeValues = clone(attributes.values);

    this.varyingNames = clone(varyings.keys);
    this.varyingValues = clone(varyings.values);

    this.uniformNames = clone(uniforms.keys);
    this.uniformValues = clone(uniforms.values);

    this.flaggedUniforms = [];
    this.cachedUniforms = {};

    fragmentHeader.push('uniform sampler2D u_textures[7];\n');

    if (this.applicationVert.length) {
        vertexHeader.push('uniform sampler2D u_textures[7];\n');
    }

    for(i = 0; i < this.uniformNames.length; i++) {
        name = this.uniformNames[i];
        value = this.uniformValues[i];
        vertexHeader.push('uniform ' + TYPES[value.length] + name + ';\n');
        fragmentHeader.push('uniform ' + TYPES[value.length] + name + ';\n');
    }

    for(i = 0; i < this.attributeNames.length; i++) {
        name = this.attributeNames[i];
        value = this.attributeValues[i];
        vertexHeader.push('attribute ' + TYPES[value.length] + name + ';\n');
    }

    for(i = 0; i < this.varyingNames.length; i++) {
        name = this.varyingNames[i];
        value = this.varyingValues[i];
        vertexHeader.push('varying ' + TYPES[value.length]  + name + ';\n');
        fragmentHeader.push('varying ' + TYPES[value.length] + name + ';\n');
    }

    vertexSource = vertexHeader.join('') + vertexWrapper
        .replace('#vert_definitions', this.definitionVert.join('\n'))
        .replace('#vert_applications', this.applicationVert.join('\n'));

    fragmentSource = fragmentHeader.join('') + fragmentWrapper
        .replace('#vec3_definitions', this.definitionVec3.join('\n'))
        .replace('#vec3_applications', this.applicationVec3.join('\n'))
        .replace('#vec4_definitions', this.definitionVec4.join('\n'))
        .replace('#vec4_applications', this.applicationVec4.join('\n'))
        .replace('#float_definitions', this.definitionFloat.join('\n'))
        .replace('#float_applications', this.applicationFloat.join('\n'));

    program = this.gl.createProgram();

    this.gl.attachShader(
        program,
        this.compileShader(this.gl.createShader(VERTEX_SHADER), vertexSource)
    );

    this.gl.attachShader(
        program,
        this.compileShader(this.gl.createShader(FRAGMENT_SHADER), fragmentSource)
    );

    this.gl.linkProgram(program);

    if (! this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error('link error: ' + this.gl.getProgramInfoLog(program));
        this.program = null;
    }
    else {
        this.program = program;
        this.gl.useProgram(this.program);
    }

    this.setUniforms(this.uniformNames, this.uniformValues);

    var textureLocation = this.gl.getUniformLocation(this.program, 'u_textures[0]');
    this.gl.uniform1iv(textureLocation, [0, 1, 2, 3, 4, 5, 6]);

    return this;
};

/**
 * Compares the value of the input uniform value against
 * the cached value stored on the Program class.  Updates and
 * creates new entries in the cache when necessary.
 *
 * @method
 * @param {String} targetName Key of uniform spec being evaluated.
 * @param {Number|Array} value Value of uniform spec being evaluated.
 *
 * @return {Boolean} boolean Indicating whether the uniform being set is cached.
 */
Program.prototype.uniformIsCached = function(targetName, value) {
    if(this.cachedUniforms[targetName] == null) {
        if (value.length) {
            this.cachedUniforms[targetName] = new Float32Array(value);
        }
        else {
            this.cachedUniforms[targetName] = value;
        }
        return false;
    }
    else if (value.length) {
        var i = value.length;
        while (i--) {
            if(value[i] !== this.cachedUniforms[targetName][i]) {
                i = value.length;
                while(i--) this.cachedUniforms[targetName][i] = value[i];
                return false;
            }
        }
    }

    else if (this.cachedUniforms[targetName] !== value) {
        this.cachedUniforms[targetName] = value;
        return false;
    }

    return true;
};

/**
 * Handles all passing of uniforms to WebGL drawing context.  This
 * function will find the uniform location and then, based on
 * a type inferred from the javascript value of the uniform, it will call
 * the appropriate function to pass the uniform to WebGL.  Finally,
 * setUniforms will iterate through the passed in shaderChunks (if any)
 * and set the appropriate uniforms to specify which chunks to use.
 *
 * @method
 * @param {Array} uniformNames Array containing the keys of all uniforms to be set.
 * @param {Array} uniformValue Array containing the values of all uniforms to be set.
 *
 * @return {Program} Current program.
 */
Program.prototype.setUniforms = function (uniformNames, uniformValue) {
    var gl = this.gl;
    var location;
    var value;
    var name;
    var len;
    var i;

    if (!this.program) return this;

    len = uniformNames.length;
    for (i = 0; i < len; i++) {
        name = uniformNames[i];
        value = uniformValue[i];

        // Retreive the cached location of the uniform,
        // requesting a new location from the WebGL context
        // if it does not yet exist.

        location = this.uniformLocations[name] || gl.getUniformLocation(this.program, name);
        if (!location) continue;

        this.uniformLocations[name] = location;

        // Check if the value is already set for the
        // given uniform.

        if (this.uniformIsCached(name, value)) continue;

        // Determine the correct function and pass the uniform
        // value to WebGL.

        if (!this.uniformTypes[name]) {
            this.uniformTypes[name] = this.getUniformTypeFromValue(value);
        }

        // Call uniform setter function on WebGL context with correct value

        switch (this.uniformTypes[name]) {
            case 'uniform4fv':  gl.uniform4fv(location, value); break;
            case 'uniform3fv':  gl.uniform3fv(location, value); break;
            case 'uniform2fv':  gl.uniform2fv(location, value); break;
            case 'uniform1fv':  gl.uniform1fv(location, value); break;
            case 'uniform1f' :  gl.uniform1f(location, value); break;
            case 'uniformMatrix3fv': gl.uniformMatrix3fv(location, false, value); break;
            case 'uniformMatrix4fv': gl.uniformMatrix4fv(location, false, value); break;
        }
    }

    return this;
};

/**
 * Infers uniform setter function to be called on the WebGL context, based
 * on an input value.
 *
 * @method
 *
 * @param {Number|Array} value Value from which uniform type is inferred.
 *
 * @return {String} Name of uniform function for given value.
 */
Program.prototype.getUniformTypeFromValue = function getUniformTypeFromValue(value) {
    if (Array.isArray(value) || value instanceof Float32Array) {
        switch (value.length) {
            case 1:  return 'uniform1fv';
            case 2:  return 'uniform2fv';
            case 3:  return 'uniform3fv';
            case 4:  return 'uniform4fv';
            case 9:  return 'uniformMatrix3fv';
            case 16: return 'uniformMatrix4fv';
        }
    }
    else if (!isNaN(parseFloat(value)) && isFinite(value)) {
        return 'uniform1f';
    }

    throw 'cant load uniform "' + name + '" with value:' + JSON.stringify(value);
};

/**
 * Adds shader source to shader and compiles the input shader.  Checks
 * compile status and logs error if necessary.
 *
 * @method
 *
 * @param {Object} shader Program to be compiled.
 * @param {String} source Source to be used in the shader.
 *
 * @return {Object} Compiled shader.
 */
Program.prototype.compileShader = function compileShader(shader, source) {
    var i = 1;

    if (this.options.debug) {
        this.gl.compileShader = Debug.call(this);
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error('compile error: ' + this.gl.getShaderInfoLog(shader));
        console.error('1: ' + source.replace(/\n/g, function () {
            return '\n' + (i+=1) + ': ';
        }));
    }

    return shader;
};

module.exports = Program;

},{"../utilities/clone":37,"../utilities/keyValueToArrays":38,"../webgl-shaders":53,"./Debug":45}],47:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Texture is a private class that stores image data
 * to be accessed from a shader or used as a render target.
 *
 * @class Texture
 * @constructor
 *
 * @param {GL} gl GL
 * @param {Object} options Options
 *
 * @return {undefined} undefined
 */
function Texture(gl, options) {
    options = options || {};
    this.id = gl.createTexture();
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.mipmap = options.mipmap;
    this.format = options.format || 'RGBA';
    this.type = options.type || 'UNSIGNED_BYTE';
    this.gl = gl;

    this.bind();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[options.magFilter] || gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[options.minFilter] || gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[options.wrapS] || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[options.wrapT] || gl.CLAMP_TO_EDGE);
}

/**
 * Binds this texture as the selected target.
 *
 * @method
 * @return {Object} Current texture instance.
 */
Texture.prototype.bind = function bind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    return this;
};

/**
 * Erases the texture data in the given texture slot.
 *
 * @method
 * @return {Object} Current texture instance.
 */
Texture.prototype.unbind = function unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return this;
};

/**
 * Replaces the image data in the texture with the given image.
 *
 * @method
 *
 * @param {Image}   img     The image object to upload pixel data from.
 * @return {Object}         Current texture instance.
 */
Texture.prototype.setImage = function setImage(img) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[this.format], this.gl[this.format], this.gl[this.type], img);
    if (this.mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D);
    return this;
};

/**
 * Replaces the image data in the texture with an array of arbitrary data.
 *
 * @method
 *
 * @param {Array}   input   Array to be set as data to texture.
 * @return {Object}         Current texture instance.
 */
Texture.prototype.setArray = function setArray(input) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[this.format], this.width, this.height, 0, this.gl[this.format], this.gl[this.type], input);
    return this;
};

/**
 * Dumps the rgb-pixel contents of a texture into an array for debugging purposes
 *
 * @method
 *
 * @param {Number} x        x-offset between texture coordinates and snapshot
 * @param {Number} y        y-offset between texture coordinates and snapshot
 * @param {Number} width    x-depth of the snapshot
 * @param {Number} height   y-depth of the snapshot
 *
 * @return {Array}          An array of the pixels contained in the snapshot.
 */
Texture.prototype.readBack = function readBack(x, y, width, height) {
    var gl = this.gl;
    var pixels;
    x = x || 0;
    y = y || 0;
    width = width || this.width;
    height = height || this.height;
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        pixels = new Uint8Array(width * height * 4);
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    }
    return pixels;
};

module.exports = Texture;

},{}],48:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var Texture = require('./Texture');
var createCheckerboard = require('./createCheckerboard');

/**
 * Handles loading, binding, and resampling of textures for WebGLRenderer.
 *
 * @class TextureManager
 * @constructor
 *
 * @param {WebGL_Context} gl Context used to create and bind textures.
 *
 * @return {undefined} undefined
 */
function TextureManager(gl) {
    this.registry = [];
    this._needsResample = [];

    this._activeTexture = 0;
    this._boundTexture = null;

    this._checkerboard = createCheckerboard();

    this.gl = gl;
}

/**
 * Update function used by WebGLRenderer to queue resamples on
 * registered textures.
 *
 * @method
 *
 * @param {Number}      time    Time in milliseconds according to the compositor.
 * @return {undefined}          undefined
 */
TextureManager.prototype.update = function update(time) {
    var registryLength = this.registry.length;

    for (var i = 1; i < registryLength; i++) {
        var texture = this.registry[i];

        if (texture && texture.isLoaded && texture.resampleRate) {
            if (!texture.lastResample || time - texture.lastResample > texture.resampleRate) {
                if (!this._needsResample[texture.id]) {
                    this._needsResample[texture.id] = true;
                    texture.lastResample = time;
                }
            }
        }
    }
};

/**
 * Creates a spec and creates a texture based on given texture data.
 * Handles loading assets if necessary.
 *
 * @method
 *
 * @param {Object}  input   Object containing texture id, texture data
 *                          and options used to draw texture.
 * @param {Number}  slot    Texture slot to bind generated texture to.
 * @return {undefined}      undefined
 */
TextureManager.prototype.register = function register(input, slot) {
    var source = input.data;
    var textureId = input.id;
    var options = input.options || {};
    var texture = this.registry[textureId];
    var spec;

    if (!texture) {

        texture = new Texture(this.gl, options);
        texture.setImage(this._checkerboard);

        // Add texture to registry

        spec = this.registry[textureId] = {
            resampleRate: options.resampleRate || null,
            lastResample: null,
            isLoaded: false,
            texture: texture,
            source: source,
            id: textureId,
            slot: slot
        };

        // Handle array

        if (Array.isArray(source) || source instanceof Uint8Array || source instanceof Float32Array) {
            this.bindTexture(textureId);
            texture.setArray(source);
            spec.isLoaded = true;
        }

        // Handle video

        else if (window && source instanceof window.HTMLVideoElement) {
            source.addEventListener('loadeddata', function() {
                this.bindTexture(textureId);
                texture.setImage(source);

                spec.isLoaded = true;
                spec.source = source;
            }.bind(this));
        }

        // Handle image url

        else if (typeof source === 'string') {
            loadImage(source, function (img) {
                this.bindTexture(textureId);
                texture.setImage(img);

                spec.isLoaded = true;
                spec.source = img;
            }.bind(this));
        }
    }

    return textureId;
};

/**
 * Loads an image from a string or Image object and executes a callback function.
 *
 * @method
 * @private
 *
 * @param {Object|String} input The input image data to load as an asset.
 * @param {Function} callback The callback function to be fired when the image has finished loading.
 *
 * @return {Object} Image object being loaded.
 */
function loadImage (input, callback) {
    var image = (typeof input === 'string' ? new Image() : input) || {};
        image.crossOrigin = 'anonymous';

    if (!image.src) image.src = input;
    if (!image.complete) {
        image.onload = function () {
            callback(image);
        };
    }
    else {
        callback(image);
    }

    return image;
}

/**
 * Sets active texture slot and binds target texture.  Also handles
 * resampling when necessary.
 *
 * @method
 *
 * @param {Number} id Identifier used to retreive texture spec
 *
 * @return {undefined} undefined
 */
TextureManager.prototype.bindTexture = function bindTexture(id) {
    var spec = this.registry[id];

    if (this._activeTexture !== spec.slot) {
        this.gl.activeTexture(this.gl.TEXTURE0 + spec.slot);
        this._activeTexture = spec.slot;
    }

    if (this._boundTexture !== id) {
        this._boundTexture = id;
        spec.texture.bind();
    }

    if (this._needsResample[spec.id]) {

        // TODO: Account for resampling of arrays.

        spec.texture.setImage(spec.source);
        this._needsResample[spec.id] = false;
    }
};

module.exports = TextureManager;

},{"./Texture":47,"./createCheckerboard":51}],49:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Program = require('./Program');
var BufferRegistry = require('./BufferRegistry');
var Plane = require('../webgl-geometries/primitives/Plane');
var sorter = require('./radixSort');
var keyValueToArrays = require('../utilities/keyValueToArrays');
var TextureManager = require('./TextureManager');
var compileMaterial = require('./compileMaterial');

var identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var globalUniforms = keyValueToArrays({
    'u_numLights': 0,
    'u_ambientLight': new Array(3),
    'u_lightPosition': new Array(3),
    'u_lightColor': new Array(3),
    'u_perspective': new Array(16),
    'u_time': 0,
    'u_view': new Array(16)
});

/**
 * WebGLRenderer is a private class that manages all interactions with the WebGL
 * API. Each frame it receives commands from the compositor and updates its
 * registries accordingly. Subsequently, the draw function is called and the
 * WebGLRenderer issues draw calls for all meshes in its registry.
 *
 * @class WebGLRenderer
 * @constructor
 *
 * @param {Element} canvas The DOM element that GL will paint itself onto.
 * @param {Compositor} compositor Compositor used for querying the time from.
 *
 * @return {undefined} undefined
 */
function WebGLRenderer(canvas, compositor) {
    canvas.classList.add('famous-webgl-renderer');

    this.canvas = canvas;
    this.compositor = compositor;

    for (var key in this.constructor.DEFAULT_STYLES) {
        this.canvas.style[key] = this.constructor.DEFAULT_STYLES[key];
    }

    var gl = this.gl = this.getWebGLContext(this.canvas);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.polygonOffset(0.1, 0.1);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.meshRegistry = {};
    this.meshRegistryKeys = [];

    this.cutoutRegistry = {};

    this.cutoutRegistryKeys = [];

    /**
     * Lights
     */
    this.numLights = 0;
    this.ambientLightColor = [0, 0, 0];
    this.lightRegistry = {};
    this.lightRegistryKeys = [];
    this.lightPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.lightColors = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.textureManager = new TextureManager(gl);
    this.texCache = {};
    this.bufferRegistry = new BufferRegistry(gl);
    this.program = new Program(gl, { debug: true });

    this.state = {
        boundArrayBuffer: null,
        boundElementBuffer: null,
        lastDrawn: null,
        enabledAttributes: {},
        enabledAttributesKeys: []
    };

    this.resolutionName = ['u_resolution'];
    this.resolutionValues = [];

    this.cachedSize = [];

    /*
    The projectionTransform has some constant components, i.e. the z scale, and the x and y translation.

    The z scale keeps the final z position of any vertex within the clip's domain by scaling it by an
    arbitrarily small coefficient. This has the advantage of being a useful default in the event of the
    user forgoing a near and far plane, an alien convention in dom space as in DOM overlapping is
    conducted via painter's algorithm.

    The x and y translation transforms the world space origin to the top left corner of the screen.

    The final component (this.projectionTransform[15]) is initialized as 1 because certain projection models,
    e.g. the WC3 specified model, keep the XY plane as the projection hyperplane.
    */
    this.projectionTransform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -0.000001, 0, -1, 1, 0, 1];

    // TODO: remove this hack

    var cutout = this.cutoutGeometry = new Plane();

    this.bufferRegistry.allocate(cutout.spec.id, 'a_pos', cutout.spec.bufferValues[0], 3);
    this.bufferRegistry.allocate(cutout.spec.id, 'a_texCoord', cutout.spec.bufferValues[1], 2);
    this.bufferRegistry.allocate(cutout.spec.id, 'a_normals', cutout.spec.bufferValues[2], 3);
    this.bufferRegistry.allocate(cutout.spec.id, 'indices', cutout.spec.bufferValues[3], 1);
}

/**
 * Attempts to retreive the WebGLRenderer context using several
 * accessors. For browser compatability. Throws on error.
 *
 * @method
 *
 * @param {Object} canvas Canvas element from which the context is retreived
 *
 * @return {Object} WebGLContext of canvas element
 */
WebGLRenderer.prototype.getWebGLContext = function getWebGLContext(canvas) {
    var names = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
    var context = null;
    for (var i = 0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        }
        catch (error) {
            var msg = 'Error creating WebGL context: ' + error.prototype.toString();
            console.error(msg);
        }
        if (context) {
            break;
        }
    }
    return context ? context : false;
};

/**
 * Adds a new base spec to the light registry at a given path.
 *
 * @method
 *
 * @param {String} path Path used as id of new light in lightRegistry
 *
 * @return {Object} Newly created light spec
 */
WebGLRenderer.prototype.createLight = function createLight(path) {
    this.numLights++;
    this.lightRegistryKeys.push(path);
    this.lightRegistry[path] = {
        color: [0, 0, 0],
        position: [0, 0, 0]
    };
    return this.lightRegistry[path];
};

/**
 * Adds a new base spec to the mesh registry at a given path.
 *
 * @method
 *
 * @param {String} path Path used as id of new mesh in meshRegistry.
 *
 * @return {Object} Newly created mesh spec.
 */
WebGLRenderer.prototype.createMesh = function createMesh(path) {
    this.meshRegistryKeys.push(path);

    var uniforms = keyValueToArrays({
        u_opacity: 1,
        u_transform: identity,
        u_size: [0, 0, 0],
        u_baseColor: [0.5, 0.5, 0.5, 1],
        u_positionOffset: [0, 0, 0],
        u_normals: [0, 0, 0],
        u_flatShading: 0,
        u_glossiness: [0, 0, 0, 0]
    });
    this.meshRegistry[path] = {
        depth: null,
        uniformKeys: uniforms.keys,
        uniformValues: uniforms.values,
        buffers: {},
        geometry: null,
        drawType: null,
        textures: [],
        visible: true
    };
    return this.meshRegistry[path];
};

/**
 * Sets flag on indicating whether to do skip draw phase for
 * cutout mesh at given path.
 *
 * @method
 *
 * @param {String} path Path used as id of target cutout mesh.
 * @param {Boolean} usesCutout Indicates the presence of a cutout mesh
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setCutoutState = function setCutoutState(path, usesCutout) {
    var cutout = this.getOrSetCutout(path);

    cutout.visible = usesCutout;
};

/**
 * Creates or retreives cutout
 *
 * @method
 *
 * @param {String} path Path used as id of target cutout mesh.
 *
 * @return {Object} Newly created cutout spec.
 */
WebGLRenderer.prototype.getOrSetCutout = function getOrSetCutout(path) {
    if (this.cutoutRegistry[path]) {
        return this.cutoutRegistry[path];
    }
    else {
        var uniforms = keyValueToArrays({
            u_opacity: 0,
            u_transform: identity.slice(),
            u_size: [0, 0, 0],
            u_origin: [0, 0, 0],
            u_baseColor: [0, 0, 0, 1]
        });

        this.cutoutRegistryKeys.push(path);

        this.cutoutRegistry[path] = {
            uniformKeys: uniforms.keys,
            uniformValues: uniforms.values,
            geometry: this.cutoutGeometry.spec.id,
            drawType: this.cutoutGeometry.spec.type,
            visible: true
        };

        return this.cutoutRegistry[path];
    }
};

/**
 * Sets flag on indicating whether to do skip draw phase for
 * mesh at given path.
 *
 * @method
 * @param {String} path Path used as id of target mesh.
 * @param {Boolean} visibility Indicates the visibility of target mesh.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setMeshVisibility = function setMeshVisibility(path, visibility) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.visible = visibility;
};

/**
 * Deletes a mesh from the meshRegistry.
 *
 * @method
 * @param {String} path Path used as id of target mesh.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.removeMesh = function removeMesh(path) {
    var keyLocation = this.meshRegistryKeys.indexOf(path);
    this.meshRegistryKeys.splice(keyLocation, 1);
    this.meshRegistry[path] = null;
};

/**
 * Creates or retreives cutout
 *
 * @method
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {String} uniformName Identifier used to upload value
 * @param {Array} uniformValue Value of uniform data
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setCutoutUniform = function setCutoutUniform(path, uniformName, uniformValue) {
    var cutout = this.getOrSetCutout(path);

    var index = cutout.uniformKeys.indexOf(uniformName);

    if (Array.isArray(uniformValue)) {
        for (var i = 0, len = uniformValue.length; i < len; i++) {
            cutout.uniformValues[index][i] = uniformValue[i];
        }
    }
    else {
        cutout.uniformValues[index] = uniformValue;
    }
};

/**
 * Edits the options field on a mesh
 *
 * @method
 * @param {String} path Path used as id of target mesh
 * @param {Object} options Map of draw options for mesh
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setMeshOptions = function(path, options) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.options = options;
    return this;
};

/**
 * Changes the color of the fixed intensity lighting in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light
 * @param {Number} r red channel
 * @param {Number} g green channel
 * @param {Number} b blue channel
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setAmbientLightColor = function setAmbientLightColor(path, r, g, b) {
    this.ambientLightColor[0] = r;
    this.ambientLightColor[1] = g;
    this.ambientLightColor[2] = b;
    return this;
};

/**
 * Changes the location of the light in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light
 * @param {Number} x x position
 * @param {Number} y y position
 * @param {Number} z z position
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setLightPosition = function setLightPosition(path, x, y, z) {
    var light = this.lightRegistry[path] || this.createLight(path);

    light.position[0] = x;
    light.position[1] = y;
    light.position[2] = z;
    return this;
};

/**
 * Changes the color of a dynamic intensity lighting in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light in light Registry.
 * @param {Number} r red channel
 * @param {Number} g green channel
 * @param {Number} b blue channel
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setLightColor = function setLightColor(path, r, g, b) {
    var light = this.lightRegistry[path] || this.createLight(path);

    light.color[0] = r;
    light.color[1] = g;
    light.color[2] = b;
    return this;
};

/**
 * Compiles material spec into program shader
 *
 * @method
 *
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {String} name Name that the rendering input the material is bound to
 * @param {Object} material Material spec
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.handleMaterialInput = function handleMaterialInput(path, name, material) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);
    material = compileMaterial(material, mesh.textures.length);

    // Set uniforms to enable texture!

    mesh.uniformValues[mesh.uniformKeys.indexOf(name)][0] = -material._id;

    // Register textures!

    var i = material.textures.length;
    while (i--) {
        mesh.textures.push(
            this.textureManager.register(material.textures[i], mesh.textures.length + i)
        );
    }

    // Register material!

    this.program.registerMaterial(name, material);

    return this.updateSize();
};

/**
 * Changes the geometry data of a mesh
 *
 * @method
 *
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {Object} geometry Geometry object containing vertex data to be drawn
 * @param {Number} drawType Primitive identifier
 * @param {Boolean} dynamic Whether geometry is dynamic
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setGeometry = function setGeometry(path, geometry, drawType, dynamic) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.geometry = geometry;
    mesh.drawType = drawType;
    mesh.dynamic = dynamic;

    return this;
};

/**
 * Uploads a new value for the uniform data when the mesh is being drawn
 *
 * @method
 *
 * @param {String} path Path used as id of mesh in mesh registry
 * @param {String} uniformName Identifier used to upload value
 * @param {Array} uniformValue Value of uniform data
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setMeshUniform = function setMeshUniform(path, uniformName, uniformValue) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    var index = mesh.uniformKeys.indexOf(uniformName);

    if (index === -1) {
        mesh.uniformKeys.push(uniformName);
        mesh.uniformValues.push(uniformValue);
    }
    else {
        mesh.uniformValues[index] = uniformValue;
    }
};

/**
 * Triggers the 'draw' phase of the WebGLRenderer. Iterates through registries
 * to set uniforms, set attributes and issue draw commands for renderables.
 *
 * @method
 *
 * @param {String} path Path used as id of mesh in mesh registry
 * @param {Number} geometryId Id of geometry in geometry registry
 * @param {String} bufferName Attribute location name
 * @param {Array} bufferValue Vertex data
 * @param {Number} bufferSpacing The dimensions of the vertex
 * @param {Boolean} isDynamic Whether geometry is dynamic
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.bufferData = function bufferData(path, geometryId, bufferName, bufferValue, bufferSpacing, isDynamic) {
    this.bufferRegistry.allocate(geometryId, bufferName, bufferValue, bufferSpacing, isDynamic);

    return this;
};

/**
 * Triggers the 'draw' phase of the WebGLRenderer. Iterates through registries
 * to set uniforms, set attributes and issue draw commands for renderables.
 *
 * @method
 *
 * @param {Object} renderState Parameters provided by the compositor, that affect the rendering of all renderables.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.draw = function draw(renderState) {
    var time = this.compositor.getTime();

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.textureManager.update(time);

    this.meshRegistryKeys = sorter(this.meshRegistryKeys, this.meshRegistry);

    this.setGlobalUniforms(renderState);
    this.drawCutouts();
    this.drawMeshes();
};

/**
 * Iterates through and draws all registered meshes. This includes
 * binding textures, handling draw options, setting mesh uniforms
 * and drawing mesh buffers.
 *
 * @method
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawMeshes = function drawMeshes() {
    var gl = this.gl;
    var buffers;
    var mesh;

    for(var i = 0; i < this.meshRegistryKeys.length; i++) {
        mesh = this.meshRegistry[this.meshRegistryKeys[i]];
        buffers = this.bufferRegistry.registry[mesh.geometry];

        if (!mesh.visible) continue;

        if (mesh.uniformValues[0] < 1) {
            gl.depthMask(false);
            gl.enable(gl.BLEND);
        }
        else {
            gl.depthMask(true);
            gl.disable(gl.BLEND);
        }

        if (!buffers) continue;

        var j = mesh.textures.length;
        while (j--) this.textureManager.bindTexture(mesh.textures[j]);

        if (mesh.options) this.handleOptions(mesh.options, mesh);

        this.program.setUniforms(mesh.uniformKeys, mesh.uniformValues);
        this.drawBuffers(buffers, mesh.drawType, mesh.geometry);

        if (mesh.options) this.resetOptions(mesh.options);
    }
};

/**
 * Iterates through and draws all registered cutout meshes. Blending
 * is disabled, cutout uniforms are set and finally buffers are drawn.
 *
 * @method
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawCutouts = function drawCutouts() {
    var cutout;
    var buffers;
    var len = this.cutoutRegistryKeys.length;

    if (len) {
        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(true);
    }

    for (var i = 0; i < len; i++) {
        cutout = this.cutoutRegistry[this.cutoutRegistryKeys[i]];
        buffers = this.bufferRegistry.registry[cutout.geometry];

        if (!cutout.visible) continue;

        this.program.setUniforms(cutout.uniformKeys, cutout.uniformValues);
        this.drawBuffers(buffers, cutout.drawType, cutout.geometry);
    }
};

/**
 * Sets uniforms to be shared by all meshes.
 *
 * @method
 *
 * @param {Object} renderState Draw state options passed down from compositor.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setGlobalUniforms = function setGlobalUniforms(renderState) {
    var light;
    var stride;

    for (var i = 0, len = this.lightRegistryKeys.length; i < len; i++) {
        light = this.lightRegistry[this.lightRegistryKeys[i]];
        stride = i * 4;

        // Build the light positions' 4x4 matrix

        this.lightPositions[0 + stride] = light.position[0];
        this.lightPositions[1 + stride] = light.position[1];
        this.lightPositions[2 + stride] = light.position[2];

        // Build the light colors' 4x4 matrix

        this.lightColors[0 + stride] = light.color[0];
        this.lightColors[1 + stride] = light.color[1];
        this.lightColors[2 + stride] = light.color[2];
    }

    globalUniforms.values[0] = this.numLights;
    globalUniforms.values[1] = this.ambientLightColor;
    globalUniforms.values[2] = this.lightPositions;
    globalUniforms.values[3] = this.lightColors;

    /*
     * Set time and projection uniforms
     * projecting world space into a 2d plane representation of the canvas.
     * The x and y scale (this.projectionTransform[0] and this.projectionTransform[5] respectively)
     * convert the projected geometry back into clipspace.
     * The perpective divide (this.projectionTransform[11]), adds the z value of the point
     * multiplied by the perspective divide to the w value of the point. In the process
     * of converting from homogenous coordinates to NDC (normalized device coordinates)
     * the x and y values of the point are divided by w, which implements perspective.
     */
    this.projectionTransform[0] = 1 / (this.cachedSize[0] * 0.5);
    this.projectionTransform[5] = -1 / (this.cachedSize[1] * 0.5);
    this.projectionTransform[11] = renderState.perspectiveTransform[11];

    globalUniforms.values[4] = this.projectionTransform;
    globalUniforms.values[5] = this.compositor.getTime() * 0.001;
    globalUniforms.values[6] = renderState.viewTransform;

    this.program.setUniforms(globalUniforms.keys, globalUniforms.values);
};

/**
 * Loads the buffers and issues the draw command for a geometry.
 *
 * @method
 *
 * @param {Object} vertexBuffers All buffers used to draw the geometry.
 * @param {Number} mode Enumerator defining what primitive to draw
 * @param {Number} id ID of geometry being drawn.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawBuffers = function drawBuffers(vertexBuffers, mode, id) {
    var gl = this.gl;
    var length = 0;
    var attribute;
    var location;
    var spacing;
    var offset;
    var buffer;
    var iter;
    var j;
    var i;

    iter = vertexBuffers.keys.length;
    for (i = 0; i < iter; i++) {
        attribute = vertexBuffers.keys[i];

        // Do not set vertexAttribPointer if index buffer.

        if (attribute === 'indices') {
            j = i; continue;
        }

        // Retreive the attribute location and make sure it is enabled.

        location = this.program.attributeLocations[attribute];

        if (location === -1) continue;
        if (location === undefined) {
            location = gl.getAttribLocation(this.program.program, attribute);
            this.program.attributeLocations[attribute] = location;
            if (location === -1) continue;
        }

        if (!this.state.enabledAttributes[attribute]) {
            gl.enableVertexAttribArray(location);
            this.state.enabledAttributes[attribute] = true;
            this.state.enabledAttributesKeys.push(attribute);
        }

        // Retreive buffer information used to set attribute pointer.

        buffer = vertexBuffers.values[i];
        spacing = vertexBuffers.spacing[i];
        offset = vertexBuffers.offset[i];
        length = vertexBuffers.length[i];

        // Skip bindBuffer if buffer is currently bound.

        if (this.state.boundArrayBuffer !== buffer) {
            gl.bindBuffer(buffer.target, buffer.buffer);
            this.state.boundArrayBuffer = buffer;
        }

        if (this.state.lastDrawn !== id) {
            gl.vertexAttribPointer(location, spacing, gl.FLOAT, gl.FALSE, 0, 4 * offset);
        }
    }

    // Disable any attributes that not currently being used.

    var len = this.state.enabledAttributesKeys.length;
    for (i = 0; i < len; i++) {
        var key = this.state.enabledAttributesKeys[i];
        if (this.state.enabledAttributes[key] && vertexBuffers.keys.indexOf(key) === -1) {
            gl.disableVertexAttribArray(this.program.attributeLocations[key]);
            this.state.enabledAttributes[key] = false;
        }
    }

    if (length) {

        // If index buffer, use drawElements.

        if (j !== undefined) {
            buffer = vertexBuffers.values[j];
            offset = vertexBuffers.offset[j];
            spacing = vertexBuffers.spacing[j];
            length = vertexBuffers.length[j];

            // Skip bindBuffer if buffer is currently bound.

            if (this.state.boundElementBuffer !== buffer) {
                gl.bindBuffer(buffer.target, buffer.buffer);
                this.state.boundElementBuffer = buffer;
            }

            gl.drawElements(gl[mode], length, gl.UNSIGNED_SHORT, 2 * offset);
        }
        else {
            gl.drawArrays(gl[mode], 0, length);
        }
    }

    this.state.lastDrawn = id;
};

/**
 * Updates the width and height of parent canvas, sets the viewport size on
 * the WebGL context and updates the resolution uniform for the shader program.
 * Size is retreived from the container object of the renderer.
 *
 * @method
 *
 * @param {Array} size width, height and depth of canvas
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.updateSize = function updateSize(size) {
    if (size) {
        this.cachedSize[0] = size[0];
        this.cachedSize[1] = size[1];
        this.cachedSize[2] = (size[0] > size[1]) ? size[0] : size[1];
    }

    this.gl.viewport(0, 0, this.cachedSize[0], this.cachedSize[1]);

    this.resolutionValues[0] = this.cachedSize;
    this.program.setUniforms(this.resolutionName, this.resolutionValues);

    return this;
};

/**
 * Updates the state of the WebGL drawing context based on custom parameters
 * defined on a mesh.
 *
 * @method
 *
 * @param {Object} options Draw state options to be set to the context.
 * @param {Mesh} mesh Associated Mesh
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.handleOptions = function handleOptions(options, mesh) {
    var gl = this.gl;
    if (!options) return;

    if (options.side === 'double') {
        this.gl.cullFace(this.gl.FRONT);
        this.drawBuffers(this.bufferRegistry.registry[mesh.geometry], mesh.drawType, mesh.geometry);
        this.gl.cullFace(this.gl.BACK);
    }

    if (options.blending) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    if (options.side === 'back') gl.cullFace(gl.FRONT);
};

/**
 * Resets the state of the WebGL drawing context to default values.
 *
 * @method
 *
 * @param {Object} options Draw state options to be set to the context.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.resetOptions = function resetOptions(options) {
    var gl = this.gl;
    if (!options) return;
    if (options.blending) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (options.side === 'back') gl.cullFace(gl.BACK);
};

WebGLRenderer.DEFAULT_STYLES = {
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 1,
    top: '0px',
    left: '0px'
};

module.exports = WebGLRenderer;

},{"../utilities/keyValueToArrays":38,"../webgl-geometries/primitives/Plane":42,"./BufferRegistry":44,"./Program":46,"./TextureManager":48,"./compileMaterial":50,"./radixSort":52}],50:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var types = {
    1: 'float ',
    2: 'vec2 ',
    3: 'vec3 ',
    4: 'vec4 '
};

/**
 * Traverses material to create a string of glsl code to be applied in
 * the vertex or fragment shader.
 *
 * @method
 * @protected
 *
 * @param {Object} material Material to be compiled.
 * @param {Number} textureSlot Next available texture slot for Mesh.
 *
 * @return {undefined} undefined
 */
function compileMaterial(material, textureSlot) {
    var glsl = '';
    var uniforms = {};
    var varyings = {};
    var attributes = {};
    var defines = [];
    var textures = [];

    _traverse(material, function (node, depth) {
        if (! node.chunk) return;

        var type = types[_getOutputLength(node)];
        var label = _makeLabel(node);
        var output = _processGLSL(node.chunk.glsl, node.inputs, textures.length + textureSlot);

        glsl += type + label + ' = ' + output + '\n ';

        if (node.uniforms) _extend(uniforms, node.uniforms);
        if (node.varyings) _extend(varyings, node.varyings);
        if (node.attributes) _extend(attributes, node.attributes);
        if (node.chunk.defines) defines.push(node.chunk.defines);
        if (node.texture) textures.push(node.texture);
    });

    return {
        _id: material._id,
        glsl: glsl + 'return ' + _makeLabel(material) + ';',
        defines: defines.join('\n'),
        uniforms: uniforms,
        varyings: varyings,
        attributes: attributes,
        textures: textures
    };
}

// Recursively iterates over a material's inputs, invoking a given callback
// with the current material
function _traverse(material, callback) {
	var inputs = material.inputs;
    var len = inputs && inputs.length;
    var idx = -1;

    while (++idx < len) _traverse(inputs[idx], callback);

    callback(material);

    return material;
}

// Helper function used to infer length of the output
// from a given material node.
function _getOutputLength(node) {

    // Handle constant values

    if (typeof node === 'number') return 1;
    if (Array.isArray(node)) return node.length;

    // Handle materials

    var output = node.chunk.output;
    if (typeof output === 'number') return output;

    // Handle polymorphic output

    var key = node.inputs.map(function recurse(node) {
        return _getOutputLength(node);
    }).join(',');

    return output[key];
}

// Helper function to run replace inputs and texture tags with
// correct glsl.
function _processGLSL(str, inputs, textureSlot) {
    return str
        .replace(/%\d/g, function (s) {
            return _makeLabel(inputs[s[1]-1]);
        })
        .replace(/\$TEXTURE/, 'u_textures[' + textureSlot + ']');
}

// Helper function used to create glsl definition of the
// input material node.
function _makeLabel (n) {
    if (Array.isArray(n)) return _arrayToVec(n);
    if (typeof n === 'object') return 'fa_' + (n._id);
    else return n.toFixed(6);
}

// Helper to copy the properties of an object onto another object.
function _extend (a, b) {
	for (var k in b) a[k] = b[k];
}

// Helper to create glsl vector representation of a javascript array.
function _arrayToVec(array) {
    var len = array.length;
    return 'vec' + len + '(' + array.join(',')  + ')';
}

module.exports = compileMaterial;

},{}],51:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

// Generates a checkerboard pattern to be used as a placeholder texture while an
// image loads over the network.
function createCheckerBoard() {
    var context = document.createElement('canvas').getContext('2d');
    context.canvas.width = context.canvas.height = 128;
    for (var y = 0; y < context.canvas.height; y += 16) {
        for (var x = 0; x < context.canvas.width; x += 16) {
            context.fillStyle = (x ^ y) & 16 ? '#FFF' : '#DDD';
            context.fillRect(x, y, 16, 16);
        }
    }

    return context.canvas;
}

module.exports = createCheckerBoard;

},{}],52:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var radixBits = 11,
    maxRadix = 1 << (radixBits),
    radixMask = maxRadix - 1,
    buckets = new Array(maxRadix * Math.ceil(64 / radixBits)),
    msbMask = 1 << ((32 - 1) % radixBits),
    lastMask = (msbMask << 1) - 1,
    passCount = ((32 / radixBits) + 0.999999999999999) | 0,
    maxOffset = maxRadix * (passCount - 1),
    normalizer = Math.pow(20, 6);

var buffer = new ArrayBuffer(4);
var floatView = new Float32Array(buffer, 0, 1);
var intView = new Int32Array(buffer, 0, 1);

// comparator pulls relevant sorting keys out of mesh
function comp(list, registry, i) {
    var key = list[i];
    var item = registry[key];
    return (item.depth ? item.depth : registry[key].uniformValues[1][14]) + normalizer;
}

//mutator function records mesh's place in previous pass
function mutator(list, registry, i, value) {
    var key = list[i];
    registry[key].depth = intToFloat(value) - normalizer;
    return key;
}

//clean function removes mutator function's record
function clean(list, registry, i) {
    registry[list[i]].depth = null;
}

//converts a javascript float to a 32bit integer using an array buffer
//of size one
function floatToInt(k) {
    floatView[0] = k;
    return intView[0];
}
//converts a 32 bit integer to a regular javascript float using an array buffer
//of size one
function intToFloat(k) {
    intView[0] = k;
    return floatView[0];
}

//sorts a list of mesh IDs according to their z-depth
function radixSort(list, registry) {
    var pass = 0;
    var out = [];

    var i, j, k, n, div, offset, swap, id, sum, tsum, size;

    passCount = ((32 / radixBits) + 0.999999999999999) | 0;

    for (i = 0, n = maxRadix * passCount; i < n; i++) buckets[i] = 0;

    for (i = 0, n = list.length; i < n; i++) {
        div = floatToInt(comp(list, registry, i));
        div ^= div >> 31 | 0x80000000;
        for (j = 0, k = 0; j < maxOffset; j += maxRadix, k += radixBits) {
            buckets[j + (div >>> k & radixMask)]++;
        }
        buckets[j + (div >>> k & lastMask)]++;
    }

    for (j = 0; j <= maxOffset; j += maxRadix) {
        for (id = j, sum = 0; id < j + maxRadix; id++) {
            tsum = buckets[id] + sum;
            buckets[id] = sum - 1;
            sum = tsum;
        }
    }
    if (--passCount) {
        for (i = 0, n = list.length; i < n; i++) {
            div = floatToInt(comp(list, registry, i));
            out[++buckets[div & radixMask]] = mutator(list, registry, i, div ^= div >> 31 | 0x80000000);
        }
        
        swap = out;
        out = list;
        list = swap;
        while (++pass < passCount) {
            for (i = 0, n = list.length, offset = pass * maxRadix, size = pass * radixBits; i < n; i++) {
                div = floatToInt(comp(list, registry, i));
                out[++buckets[offset + (div >>> size & radixMask)]] = list[i];
            }

            swap = out;
            out = list;
            list = swap;
        }
    }

    for (i = 0, n = list.length, offset = pass * maxRadix, size = pass * radixBits; i < n; i++) {
        div = floatToInt(comp(list, registry, i));
        out[++buckets[offset + (div >>> size & lastMask)]] = mutator(list, registry, i, div ^ (~div >> 31 | 0x80000000));
        clean(list, registry, i);
    }

    return out;
}

module.exports = radixSort;

},{}],53:[function(require,module,exports){
"use strict";
var glslify = require("glslify");
var shaders = require("glslify/simple-adapter.js")("\n#define GLSLIFY 1\n\nmat3 a_x_getNormalMatrix(in mat4 t) {\n  mat3 matNorm;\n  mat4 a = t;\n  float a00 = a[0][0], a01 = a[0][1], a02 = a[0][2], a03 = a[0][3], a10 = a[1][0], a11 = a[1][1], a12 = a[1][2], a13 = a[1][3], a20 = a[2][0], a21 = a[2][1], a22 = a[2][2], a23 = a[2][3], a30 = a[3][0], a31 = a[3][1], a32 = a[3][2], a33 = a[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n  det = 1.0 / det;\n  matNorm[0][0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;\n  matNorm[0][1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;\n  matNorm[0][2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;\n  matNorm[1][0] = (a02 * b10 - a01 * b11 - a03 * b09) * det;\n  matNorm[1][1] = (a00 * b11 - a02 * b08 + a03 * b07) * det;\n  matNorm[1][2] = (a01 * b08 - a00 * b10 - a03 * b06) * det;\n  matNorm[2][0] = (a31 * b05 - a32 * b04 + a33 * b03) * det;\n  matNorm[2][1] = (a32 * b02 - a30 * b05 - a33 * b01) * det;\n  matNorm[2][2] = (a30 * b04 - a31 * b02 + a33 * b00) * det;\n  return matNorm;\n}\nfloat b_x_inverse(float m) {\n  return 1.0 / m;\n}\nmat2 b_x_inverse(mat2 m) {\n  return mat2(m[1][1], -m[0][1], -m[1][0], m[0][0]) / (m[0][0] * m[1][1] - m[0][1] * m[1][0]);\n}\nmat3 b_x_inverse(mat3 m) {\n  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n  float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n  float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n  float b01 = a22 * a11 - a12 * a21;\n  float b11 = -a22 * a10 + a12 * a20;\n  float b21 = a21 * a10 - a11 * a20;\n  float det = a00 * b01 + a01 * b11 + a02 * b21;\n  return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11), b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10), b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\nmat4 b_x_inverse(mat4 m) {\n  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n  return mat4(a11 * b11 - a12 * b10 + a13 * b09, a02 * b10 - a01 * b11 - a03 * b09, a31 * b05 - a32 * b04 + a33 * b03, a22 * b04 - a21 * b05 - a23 * b03, a12 * b08 - a10 * b11 - a13 * b07, a00 * b11 - a02 * b08 + a03 * b07, a32 * b02 - a30 * b05 - a33 * b01, a20 * b05 - a22 * b02 + a23 * b01, a10 * b10 - a11 * b08 + a13 * b06, a01 * b08 - a00 * b10 - a03 * b06, a30 * b04 - a31 * b02 + a33 * b00, a21 * b02 - a20 * b04 - a23 * b00, a11 * b07 - a10 * b09 - a12 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b01 - a30 * b03 - a32 * b00, a20 * b03 - a21 * b01 + a22 * b00) / det;\n}\nfloat c_x_transpose(float m) {\n  return m;\n}\nmat2 c_x_transpose(mat2 m) {\n  return mat2(m[0][0], m[1][0], m[0][1], m[1][1]);\n}\nmat3 c_x_transpose(mat3 m) {\n  return mat3(m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]);\n}\nmat4 c_x_transpose(mat4 m) {\n  return mat4(m[0][0], m[1][0], m[2][0], m[3][0], m[0][1], m[1][1], m[2][1], m[3][1], m[0][2], m[1][2], m[2][2], m[3][2], m[0][3], m[1][3], m[2][3], m[3][3]);\n}\nvec4 applyTransform(vec4 pos) {\n  mat4 MVMatrix = u_view * u_transform;\n  pos.x += 1.0;\n  pos.y -= 1.0;\n  pos.xyz *= u_size * 0.5;\n  pos.y *= -1.0;\n  v_position = (MVMatrix * pos).xyz;\n  v_eyeVector = (u_resolution * 0.5) - v_position;\n  pos = u_perspective * MVMatrix * pos;\n  return pos;\n}\n#vert_definitions\n\nvec3 calculateOffset(vec3 ID) {\n  \n  #vert_applications\n  return vec3(0.0);\n}\nvoid main() {\n  v_textureCoordinate = a_texCoord;\n  vec3 invertedNormals = a_normals + (u_normals.x < 0.0 ? calculateOffset(u_normals) * 2.0 - 1.0 : vec3(0.0));\n  invertedNormals.y *= -1.0;\n  v_normal = c_x_transpose(mat3(b_x_inverse(u_transform))) * invertedNormals;\n  vec3 offsetPos = a_pos + calculateOffset(u_positionOffset);\n  gl_Position = applyTransform(vec4(offsetPos, 1.0));\n}", "\n#define GLSLIFY 1\n\n#float_definitions\n\nfloat a_x_applyMaterial(float ID) {\n  \n  #float_applications\n  return 1.;\n}\n#vec3_definitions\n\nvec3 a_x_applyMaterial(vec3 ID) {\n  \n  #vec3_applications\n  return vec3(0);\n}\n#vec4_definitions\n\nvec4 a_x_applyMaterial(vec4 ID) {\n  \n  #vec4_applications\n  return vec4(0);\n}\nvec4 b_x_applyLight(in vec4 baseColor, in vec3 normal, in vec4 glossiness) {\n  int numLights = int(u_numLights);\n  vec3 ambientColor = u_ambientLight * baseColor.rgb;\n  vec3 eyeVector = normalize(v_eyeVector);\n  vec3 diffuse = vec3(0.0);\n  bool hasGlossiness = glossiness.a > 0.0;\n  bool hasSpecularColor = length(glossiness.rgb) > 0.0;\n  for(int i = 0; i < 4; i++) {\n    if(i >= numLights)\n      break;\n    vec3 lightDirection = normalize(u_lightPosition[i].xyz - v_position);\n    float lambertian = max(dot(lightDirection, normal), 0.0);\n    if(lambertian > 0.0) {\n      diffuse += u_lightColor[i].rgb * baseColor.rgb * lambertian;\n      if(hasGlossiness) {\n        vec3 halfVector = normalize(lightDirection + eyeVector);\n        float specularWeight = pow(max(dot(halfVector, normal), 0.0), glossiness.a);\n        vec3 specularColor = hasSpecularColor ? glossiness.rgb : u_lightColor[i].rgb;\n        diffuse += specularColor * specularWeight * lambertian;\n      }\n    }\n  }\n  return vec4(ambientColor + diffuse, baseColor.a);\n}\nvoid main() {\n  vec4 material = u_baseColor.r >= 0.0 ? u_baseColor : a_x_applyMaterial(u_baseColor);\n  bool lightsEnabled = (u_flatShading == 0.0) && (u_numLights > 0.0 || length(u_ambientLight) > 0.0);\n  vec3 normal = normalize(v_normal);\n  vec4 glossiness = u_glossiness.x < 0.0 ? a_x_applyMaterial(u_glossiness) : u_glossiness;\n  vec4 color = lightsEnabled ? b_x_applyLight(material, normalize(v_normal), glossiness) : material;\n  gl_FragColor = color;\n  gl_FragColor.a *= u_opacity;\n}", [], []);
module.exports = shaders;
},{"glslify":27,"glslify/simple-adapter.js":28}],54:[function(require,module,exports){
// 'use strict';

// Famous dependencies
'use strict';

var DOMElement = require('famous/dom-renderables/DOMElement');
var FamousEngine = require('famous/core/FamousEngine');
var Clock = require('famous/core/Clock');

var main = FamousEngine.createScene();
var node = main.addChild();

var light = node.addChild();
var center = node.addChild();

new DOMElement(node, { tagName: 'div' }).setAttribute('id', 'background').setContent('/==||========>');

new DOMElement(node, { tagName: 'div' }).setAttribute('id', 'center-dot');

// var time = new Clock()._time

node
// Set size mode to 'absolute' to use absolute pixel values: (width 250px, height 250px)
.setSizeMode('absolute', 'absolute', 'absolute').setAbsoluteSize(125, 125)
// Center the 'node' to the parent (the screen, in this instance)
.setAlign(0.5, 0.5)
// Set the translational origin to the center of the 'node'
.setMountPoint(0.5, 0.5)
// Set the rotational origin to the center of the 'node'
.setOrigin(0.5, 0.5);

light.setSizeMode('absolute', 'absolute', 'absolute').setAbsoluteSize(125, 125).setAlign(0.5, 0.5)
// Set the translational origin to the center of the 'node'
.setMountPoint(0.5, 0.5)
// Set the rotational origin to the center of the 'node'
.setOrigin(0.5, 0.5);

center.setSizeMode('absolute', 'absolute', 'absolute').setAbsoluteSize(62, 62).setAlign(0.5, 0.5)
// Set the translational origin to the center of the 'node'
.setMountPoint(0.5, 0.5)
// Set the rotational origin to the center of the 'node'
.setOrigin(0.5, 0.5);

var spinner = node.addComponent({
    onUpdate: function onUpdate(time) {
        node.setRotation(time / 500, time / 1000, time / 250);
        node.requestUpdateOnNextTick(spinner);
    }
});

var light_spinner = light.addComponent({
    onUpdate: function onUpdate(time) {
        light.setRotation(time / 1000, 0.2, 0);
        light.requestUpdateOnNextTick(light_spinner);
    }
});

new DOMElement(light, { tagName: 'div' }).setAttribute('id', 'light');

node.requestUpdate(spinner);
light.requestUpdate(light_spinner);

// Boilerplate code to make your life easier
FamousEngine.init();

},{"famous/core/Clock":3,"famous/core/FamousEngine":6,"famous/dom-renderables/DOMElement":11}]},{},[54])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvbXBvbmVudHMvQ2FtZXJhLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9jb3JlL0NoYW5uZWwuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvQ2xvY2suanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRGlzcGF0Y2guanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRmFtb3VzRW5naW5lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9jb3JlL05vZGUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvU2NlbmUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvU2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvY29yZS9UcmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJhYmxlcy9ET01FbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL0RPTVJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL0VsZW1lbnRDYWNoZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvZG9tLXJlbmRlcmVycy9NYXRoLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL2V2ZW50cy9Db21wb3NpdGlvbkV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL2V2ZW50cy9FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvZG9tLXJlbmRlcmVycy9ldmVudHMvRXZlbnRNYXAuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0ZvY3VzRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0lucHV0RXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0tleWJvYXJkRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL01vdXNlRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1RvdWNoRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1VJRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1doZWVsRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL21hdGgvVmVjMi5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvbWF0aC9WZWMzLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9ub2RlX21vZHVsZXMvZ2xzbGlmeS9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9ub2RlX21vZHVsZXMvZ2xzbGlmeS9zaW1wbGUtYWRhcHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvcG9seWZpbGxzL2FuaW1hdGlvbkZyYW1lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9wb2x5ZmlsbHMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlci1sb29wcy9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9yZW5kZXJlcnMvQ29tcG9zaXRvci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvcmVuZGVyZXJzL0NvbnRleHQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlcmVycy9VSU1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlcmVycy9pbmplY3QtY3NzLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy91dGlsaXRpZXMvQ2FsbGJhY2tTdG9yZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvdXRpbGl0aWVzL2Nsb25lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy91dGlsaXRpZXMva2V5VmFsdWVUb0FycmF5cy5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvdXRpbGl0aWVzL3ZlbmRvclByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9HZW9tZXRyeS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9HZW9tZXRyeUhlbHBlci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9wcmltaXRpdmVzL1BsYW5lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvQnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvQnVmZmVyUmVnaXN0cnkuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9EZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtcmVuZGVyZXJzL1Byb2dyYW0uanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9UZXh0dXJlLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvVGV4dHVyZU1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9XZWJHTFJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvY29tcGlsZU1hdGVyaWFsLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvY3JlYXRlQ2hlY2tlcmJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvcmFkaXhTb3J0LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1zaGFkZXJzL2luZGV4LmpzIiwiL1VzZXJzL2ZheWFkaGFsLW1vc2F3aS9Db2RlTGFiL3NrZXRjaGVzL2ZhbW91cy90ZXN0L3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMW9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbHFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOXFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5bEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzkwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDQUEsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7QUFDOUQsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDdkQsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRXpDLElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNyQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7O0FBRTFCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtBQUMzQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7O0FBRTVCLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUNuQyxZQUFZLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBRSxDQUNqQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTs7QUFFakMsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQ25DLFlBQVksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFFLENBQUE7Ozs7QUFJdEMsSUFBSTs7Q0FFQyxXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FDL0MsZUFBZSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7O0NBRXpCLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDOztDQUVsQixhQUFhLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQzs7Q0FFdkIsU0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzs7QUFFekIsS0FBSyxDQUNBLFdBQVcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUMvQyxlQUFlLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUN6QixRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQzs7Q0FFbEIsYUFBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7O0NBRXZCLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRXpCLE1BQU0sQ0FDRCxXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FDL0MsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FDdkIsUUFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7O0NBRWxCLGFBQWEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDOztDQUV2QixTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDOztBQUV6QixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQzVCLFlBQVEsRUFBRSxrQkFBUyxJQUFJLEVBQUU7QUFDckIsWUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0FBQ3JELFlBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUN6QztDQUNKLENBQUMsQ0FBQTs7QUFFRixJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0FBQ25DLFlBQVEsRUFBRSxrQkFBUyxJQUFJLEVBQUU7QUFDckIsYUFBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUN0QyxhQUFLLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDaEQ7Q0FDSixDQUFDLENBQUE7O0FBRUYsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQ2xDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7O0FBR2hDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDM0IsS0FBSyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQTs7O0FBR2xDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENhbWVyYSBpcyBhIGNvbXBvbmVudCB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBzZW5kaW5nIGluZm9ybWF0aW9uIHRvIHRoZSByZW5kZXJlciBhYm91dCB3aGVyZVxuICogdGhlIGNhbWVyYSBpcyBpbiB0aGUgc2NlbmUuICBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBzZXQgdGhlIHR5cGUgb2YgcHJvamVjdGlvbiwgdGhlIGZvY2FsIGRlcHRoLFxuICogYW5kIG90aGVyIHByb3BlcnRpZXMgdG8gYWRqdXN0IHRoZSB3YXkgdGhlIHNjZW5lcyBhcmUgcmVuZGVyZWQuXG4gKlxuICogQGNsYXNzIENhbWVyYVxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSB0byB3aGljaCB0aGUgaW5zdGFuY2Ugb2YgQ2FtZXJhIHdpbGwgYmUgYSBjb21wb25lbnQgb2ZcbiAqL1xuZnVuY3Rpb24gQ2FtZXJhKG5vZGUpIHtcbiAgICB0aGlzLl9ub2RlID0gbm9kZTtcbiAgICB0aGlzLl9wcm9qZWN0aW9uVHlwZSA9IENhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTjtcbiAgICB0aGlzLl9mb2NhbERlcHRoID0gMDtcbiAgICB0aGlzLl9uZWFyID0gMDtcbiAgICB0aGlzLl9mYXIgPSAwO1xuICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSBmYWxzZTtcbiAgICB0aGlzLl9pZCA9IG5vZGUuYWRkQ29tcG9uZW50KHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm0gPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG4gICAgdGhpcy5fdmlld0RpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5fcGVyc3BlY3RpdmVEaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuc2V0RmxhdCgpO1xufVxuXG5DYW1lcmEuRlJVU1RVTV9QUk9KRUNUSU9OID0gMDtcbkNhbWVyYS5QSU5IT0xFX1BST0pFQ1RJT04gPSAxO1xuQ2FtZXJhLk9SVEhPR1JBUEhJQ19QUk9KRUNUSU9OID0gMjtcblxuLyoqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBjb21wb25lbnRcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiAnQ2FtZXJhJztcbn07XG5cbi8qKlxuICogR2V0cyBvYmplY3QgY29udGFpbmluZyBzZXJpYWxpemVkIGRhdGEgZm9yIHRoZSBjb21wb25lbnRcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSB0aGUgc3RhdGUgb2YgdGhlIGNvbXBvbmVudFxuICovXG5DYW1lcmEucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gZ2V0VmFsdWUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29tcG9uZW50OiB0aGlzLnRvU3RyaW5nKCksXG4gICAgICAgIHByb2plY3Rpb25UeXBlOiB0aGlzLl9wcm9qZWN0aW9uVHlwZSxcbiAgICAgICAgZm9jYWxEZXB0aDogdGhpcy5fZm9jYWxEZXB0aCxcbiAgICAgICAgbmVhcjogdGhpcy5fbmVhcixcbiAgICAgICAgZmFyOiB0aGlzLl9mYXJcbiAgICB9O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgc3RhdGUgYmFzZWQgb24gc29tZSBzZXJpYWxpemVkIGRhdGFcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHN0YXRlIGFuIG9iamVjdCBkZWZpbmluZyB3aGF0IHRoZSBzdGF0ZSBvZiB0aGUgY29tcG9uZW50IHNob3VsZCBiZVxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHN0YXR1cyBvZiB0aGUgc2V0XG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbiBzZXRWYWx1ZShzdGF0ZSkge1xuICAgIGlmICh0aGlzLnRvU3RyaW5nKCkgPT09IHN0YXRlLmNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLnNldChzdGF0ZS5wcm9qZWN0aW9uVHlwZSwgc3RhdGUuZm9jYWxEZXB0aCwgc3RhdGUubmVhciwgc3RhdGUuZmFyKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBpbnRlcm5hbHMgb2YgdGhlIGNvbXBvbmVudFxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdHlwZSBhbiBpZCBjb3JyZXNwb25kaW5nIHRvIHRoZSB0eXBlIG9mIHByb2plY3Rpb24gdG8gdXNlXG4gKiBAcGFyYW0ge051bWJlcn0gZGVwdGggdGhlIGRlcHRoIGZvciB0aGUgcGluaG9sZSBwcm9qZWN0aW9uIG1vZGVsXG4gKiBAcGFyYW0ge051bWJlcn0gbmVhciB0aGUgZGlzdGFuY2Ugb2YgdGhlIG5lYXIgY2xpcHBpbmcgcGxhbmUgZm9yIGEgZnJ1c3R1bSBwcm9qZWN0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0gZmFyIHRoZSBkaXN0YW5jdCBvZiB0aGUgZmFyIGNsaXBwaW5nIHBsYW5lIGZvciBhIGZydXN0dW0gcHJvamVjdGlvblxuICogXG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF0dXMgb2YgdGhlIHNldFxuICovXG5DYW1lcmEucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh0eXBlLCBkZXB0aCwgbmVhciwgZmFyKSB7XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX25vZGUucmVxdWVzdFVwZGF0ZSh0aGlzLl9pZCk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLl9wcm9qZWN0aW9uVHlwZSA9IHR5cGU7XG4gICAgdGhpcy5fZm9jYWxEZXB0aCA9IGRlcHRoO1xuICAgIHRoaXMuX25lYXIgPSBuZWFyO1xuICAgIHRoaXMuX2ZhciA9IGZhcjtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjYW1lcmEgZGVwdGggZm9yIGEgcGluaG9sZSBwcm9qZWN0aW9uIG1vZGVsXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBkZXB0aCB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgQ2FtZXJhIGFuZCB0aGUgb3JpZ2luXG4gKlxuICogQHJldHVybiB7Q2FtZXJhfSB0aGlzXG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuc2V0RGVwdGggPSBmdW5jdGlvbiBzZXREZXB0aChkZXB0aCkge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5fcGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fcHJvamVjdGlvblR5cGUgPSBDYW1lcmEuUElOSE9MRV9QUk9KRUNUSU9OO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSBkZXB0aDtcbiAgICB0aGlzLl9uZWFyID0gMDtcbiAgICB0aGlzLl9mYXIgPSAwO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldHMgb2JqZWN0IGNvbnRhaW5pbmcgc2VyaWFsaXplZCBkYXRhIGZvciB0aGUgY29tcG9uZW50XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBuZWFyIGRpc3RhbmNlIGZyb20gdGhlIG5lYXIgY2xpcHBpbmcgcGxhbmUgdG8gdGhlIGNhbWVyYVxuICogQHBhcmFtIHtOdW1iZXJ9IGZhciBkaXN0YW5jZSBmcm9tIHRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgdG8gdGhlIGNhbWVyYVxuICogXG4gKiBAcmV0dXJuIHtDYW1lcmF9IHRoaXNcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5zZXRGcnVzdHVtID0gZnVuY3Rpb24gc2V0RnJ1c3R1bShuZWFyLCBmYXIpIHtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fcGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fcHJvamVjdGlvblR5cGUgPSBDYW1lcmEuRlJVU1RVTV9QUk9KRUNUSU9OO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSAwO1xuICAgIHRoaXMuX25lYXIgPSBuZWFyO1xuICAgIHRoaXMuX2ZhciA9IGZhcjtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIENhbWVyYSB0byBoYXZlIG9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0NhbWVyYX0gdGhpc1xuICovXG5DYW1lcmEucHJvdG90eXBlLnNldEZsYXQgPSBmdW5jdGlvbiBzZXRGbGF0KCkge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9wZXJzcGVjdGl2ZURpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9wcm9qZWN0aW9uVHlwZSA9IENhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTjtcbiAgICB0aGlzLl9mb2NhbERlcHRoID0gMDtcbiAgICB0aGlzLl9uZWFyID0gMDtcbiAgICB0aGlzLl9mYXIgPSAwO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFdoZW4gdGhlIG5vZGUgdGhpcyBjb21wb25lbnQgaXMgYXR0YWNoZWQgdG8gdXBkYXRlcywgdGhlIENhbWVyYSB3aWxsXG4gKiBzZW5kIG5ldyBjYW1lcmEgaW5mb3JtYXRpb24gdG8gdGhlIENvbXBvc2l0b3IgdG8gdXBkYXRlIHRoZSByZW5kZXJpbmdcbiAqIG9mIHRoZSBzY2VuZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5vblVwZGF0ZSA9IGZ1bmN0aW9uIG9uVXBkYXRlKCkge1xuICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSBmYWxzZTtcblxuICAgIHZhciBwYXRoID0gdGhpcy5fbm9kZS5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5fbm9kZVxuICAgICAgICAuc2VuZERyYXdDb21tYW5kKCdXSVRIJylcbiAgICAgICAgLnNlbmREcmF3Q29tbWFuZChwYXRoKTtcblxuICAgIGlmICh0aGlzLl9wZXJzcGVjdGl2ZURpcnR5KSB7XG4gICAgICAgIHRoaXMuX3BlcnNwZWN0aXZlRGlydHkgPSBmYWxzZTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMuX3Byb2plY3Rpb25UeXBlKSB7XG4gICAgICAgICAgICBjYXNlIENhbWVyYS5GUlVTVFVNX1BST0pFQ1RJT046XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ0ZSVVNUVU1fUFJPSkVDVElPTicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX25lYXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX2Zhcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIENhbWVyYS5QSU5IT0xFX1BST0pFQ1RJT046XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ1BJTkhPTEVfUFJPSkVDVElPTicpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX2ZvY2FsRGVwdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBDYW1lcmEuT1JUSE9HUkFQSElDX1BST0pFQ1RJT046XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ09SVEhPR1JBUEhJQ19QUk9KRUNUSU9OJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdmlld0RpcnR5KSB7XG4gICAgICAgIHRoaXMuX3ZpZXdEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKCdDSEFOR0VfVklFV19UUkFOU0ZPUk0nKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVswXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMV0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzJdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVszXSk7XG5cbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs0XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bNV0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzZdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs3XSk7XG5cbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs4XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bOV0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzEwXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTFdKTtcblxuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzEyXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTNdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVsxNF0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzE1XSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBXaGVuIHRoZSB0cmFuc2Zvcm0gb2YgdGhlIG5vZGUgdGhpcyBjb21wb25lbnQgaXMgYXR0YWNoZWQgdG9cbiAqIGNoYW5nZXMsIGhhdmUgdGhlIENhbWVyYSB1cGRhdGUgaXRzIHByb2plY3Rpb24gbWF0cml4IGFuZFxuICogaWYgbmVlZGVkLCBmbGFnIHRvIG5vZGUgdG8gdXBkYXRlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB0cmFuc2Zvcm0gYW4gYXJyYXkgZGVub3RpbmcgdGhlIHRyYW5zZm9ybSBtYXRyaXggb2YgdGhlIG5vZGVcbiAqXG4gKiBAcmV0dXJuIHtDYW1lcmF9IHRoaXNcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5vblRyYW5zZm9ybUNoYW5nZSA9IGZ1bmN0aW9uIG9uVHJhbnNmb3JtQ2hhbmdlKHRyYW5zZm9ybSkge1xuICAgIHZhciBhID0gdHJhbnNmb3JtO1xuICAgIHRoaXMuX3ZpZXdEaXJ0eSA9IHRydWU7XG5cbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgIGRldCA9IDEvKGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNik7XG5cbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzNdID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVs0XSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzZdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVs3XSA9IChhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzldID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDaGFubmVscyBhcmUgYmVpbmcgdXNlZCBmb3IgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgVUkgVGhyZWFkIHdoZW4gcnVubmluZyBpblxuICogYSBXZWIgV29ya2VyIG9yIHdpdGggdGhlIFVJTWFuYWdlci8gQ29tcG9zaXRvciB3aGVuIHJ1bm5pbmcgaW4gc2luZ2xlXG4gKiB0aHJlYWRlZCBtb2RlIChubyBXZWIgV29ya2VyKS5cbiAqXG4gKiBAY2xhc3MgQ2hhbm5lbFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENoYW5uZWwoKSB7XG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmLndpbmRvdyAhPT0gc2VsZikge1xuICAgICAgICB0aGlzLl9lbnRlcldvcmtlck1vZGUoKTtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBDYWxsZWQgZHVyaW5nIGNvbnN0cnVjdGlvbi4gU3Vic2NyaWJlcyBmb3IgYG1lc3NhZ2VgIGV2ZW50IGFuZCByb3V0ZXMgYWxsXG4gKiBmdXR1cmUgYHNlbmRNZXNzYWdlYCBtZXNzYWdlcyB0byB0aGUgTWFpbiBUaHJlYWQgKFwiVUkgVGhyZWFkXCIpLlxuICpcbiAqIFByaW1hcmlseSB1c2VkIGZvciB0ZXN0aW5nLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5DaGFubmVsLnByb3RvdHlwZS5fZW50ZXJXb3JrZXJNb2RlID0gZnVuY3Rpb24gX2VudGVyV29ya2VyTW9kZSgpIHtcbiAgICB0aGlzLl93b3JrZXJNb2RlID0gdHJ1ZTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIG9ubWVzc2FnZShldikge1xuICAgICAgICBfdGhpcy5vbk1lc3NhZ2UoZXYuZGF0YSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIE1lYW50IHRvIGJlIG92ZXJyaWRlbiBieSBgRmFtb3VzYC5cbiAqIEFzc2lnbmVkIG1ldGhvZCB3aWxsIGJlIGludm9rZWQgZm9yIGV2ZXJ5IHJlY2VpdmVkIG1lc3NhZ2UuXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICogQG92ZXJyaWRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUub25NZXNzYWdlID0gbnVsbDtcblxuLyoqXG4gKiBTZW5kcyBhIG1lc3NhZ2UgdG8gdGhlIFVJTWFuYWdlci5cbiAqXG4gKiBAcGFyYW0gIHtBbnl9ICAgIG1lc3NhZ2UgQXJiaXRyYXJ5IG1lc3NhZ2Ugb2JqZWN0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNoYW5uZWwucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24gc2VuZE1lc3NhZ2UgKG1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy5fd29ya2VyTW9kZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5vbm1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBNZWFudCB0byBiZSBvdmVycmlkZW4gYnkgdGhlIFVJTWFuYWdlciB3aGVuIHJ1bm5pbmcgaW4gdGhlIFVJIFRocmVhZC5cbiAqIFVzZWQgZm9yIHByZXNlcnZpbmcgQVBJIGNvbXBhdGliaWxpdHkgd2l0aCBXZWIgV29ya2Vycy5cbiAqIFdoZW4gcnVubmluZyBpbiBXZWIgV29ya2VyIG1vZGUsIHRoaXMgcHJvcGVydHkgd29uJ3QgYmUgbXV0YXRlZC5cbiAqXG4gKiBBc3NpZ25lZCBtZXRob2Qgd2lsbCBiZSBpbnZva2VkIGZvciBldmVyeSBtZXNzYWdlIHBvc3RlZCBieSBgZmFtb3VzLWNvcmVgLlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqIEBvdmVycmlkZVxuICovXG5DaGFubmVsLnByb3RvdHlwZS5vbm1lc3NhZ2UgPSBudWxsO1xuXG4vKipcbiAqIFNlbmRzIGEgbWVzc2FnZSB0byB0aGUgbWFuYWdlciBvZiB0aGlzIGNoYW5uZWwgKHRoZSBgRmFtb3VzYCBzaW5nbGV0b24pIGJ5XG4gKiBpbnZva2luZyBgb25NZXNzYWdlYC5cbiAqIFVzZWQgZm9yIHByZXNlcnZpbmcgQVBJIGNvbXBhdGliaWxpdHkgd2l0aCBXZWIgV29ya2Vycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGFsaWFzIG9uTWVzc2FnZVxuICpcbiAqIEBwYXJhbSB7QW55fSBtZXNzYWdlIGEgbWVzc2FnZSB0byBzZW5kIG92ZXIgdGhlIGNoYW5uZWxcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5DaGFubmVsLnByb3RvdHlwZS5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5vbk1lc3NhZ2UobWVzc2FnZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYW5uZWw7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEVxdWl2YWxlbnQgb2YgYW4gRW5naW5lIGluIHRoZSBXb3JrZXIgVGhyZWFkLiBVc2VkIHRvIHN5bmNocm9uaXplIGFuZCBtYW5hZ2VcbiAqIHRpbWUgYWNyb3NzIGRpZmZlcmVudCBUaHJlYWRzLlxuICpcbiAqIEBjbGFzcyAgQ2xvY2tcbiAqIEBjb25zdHJ1Y3RvclxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gQ2xvY2sgKCkge1xuICAgIHRoaXMuX3RpbWUgPSAwO1xuICAgIHRoaXMuX2ZyYW1lID0gMDtcbiAgICB0aGlzLl90aW1lclF1ZXVlID0gW107XG4gICAgdGhpcy5fdXBkYXRpbmdJbmRleCA9IDA7XG5cbiAgICB0aGlzLl9zY2FsZSA9IDE7XG4gICAgdGhpcy5fc2NhbGVkVGltZSA9IHRoaXMuX3RpbWU7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgc2NhbGUgYXQgd2hpY2ggdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZy5cbiAqIFVzZWZ1bCBmb3Igc2xvdy1tb3Rpb24gb3IgZmFzdC1mb3J3YXJkIGVmZmVjdHMuXG4gKiBcbiAqIGAxYCBtZWFucyBubyB0aW1lIHNjYWxpbmcgKFwicmVhbHRpbWVcIiksXG4gKiBgMmAgbWVhbnMgdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZyB0d2ljZSBhcyBmYXN0LFxuICogYDAuNWAgbWVhbnMgdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZyB0d28gdGltZXMgc2xvd2VyIHRoYW4gdGhlIFwiYWN0dWFsXCJcbiAqIHRpbWUgYXQgd2hpY2ggdGhlIENsb2NrIGlzIGJlaW5nIHVwZGF0ZWQgdmlhIGAuc3RlcGAuXG4gKlxuICogSW5pdGFsbHkgdGhlIGNsb2NrIHRpbWUgaXMgbm90IGJlaW5nIHNjYWxlZCAoZmFjdG9yIGAxYCkuXG4gKiBcbiAqIEBtZXRob2QgIHNldFNjYWxlXG4gKiBAY2hhaW5hYmxlXG4gKiBcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSAgICBUaGUgc2NhbGUgYXQgd2hpY2ggdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZy5cbiAqXG4gKiBAcmV0dXJuIHtDbG9ja30gdGhpc1xuICovXG5DbG9jay5wcm90b3R5cGUuc2V0U2NhbGUgPSBmdW5jdGlvbiBzZXRTY2FsZSAoc2NhbGUpIHtcbiAgICB0aGlzLl9zY2FsZSA9IHNjYWxlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kICBnZXRTY2FsZVxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHNjYWxlICAgIFRoZSBzY2FsZSBhdCB3aGljaCB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nLlxuICovXG5DbG9jay5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiBnZXRTY2FsZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NjYWxlO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBjbG9jayB0aW1lLlxuICpcbiAqIEBtZXRob2QgIHN0ZXBcbiAqIEBjaGFpbmFibGVcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1zdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICBgdXBkYXRlYCBtZXRob2Qgb24gYWxsIHJlZ2lzdGVyZWQgb2JqZWN0c1xuICogQHJldHVybiB7Q2xvY2t9ICAgICAgIHRoaXNcbiAqL1xuQ2xvY2sucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiBzdGVwICh0aW1lKSB7XG4gICAgdGhpcy5fZnJhbWUrKztcblxuICAgIHRoaXMuX3NjYWxlZFRpbWUgPSB0aGlzLl9zY2FsZWRUaW1lICsgKHRpbWUgLSB0aGlzLl90aW1lKSp0aGlzLl9zY2FsZTtcbiAgICB0aGlzLl90aW1lID0gdGltZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fdGltZXJRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5fdGltZXJRdWV1ZVtpXSh0aGlzLl9zY2FsZWRUaW1lKSkge1xuICAgICAgICAgICAgdGhpcy5fdGltZXJRdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludGVybmFsIGNsb2NrIHRpbWUuXG4gKlxuICogQG1ldGhvZCAgbm93XG4gKiBcbiAqIEByZXR1cm4gIHtOdW1iZXJ9IHRpbWUgaGlnaCByZXNvbHV0aW9uIHRpbXN0YW1wIHVzZWQgZm9yIGludm9raW5nIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgIGB1cGRhdGVgIG1ldGhvZCBvbiBhbGwgcmVnaXN0ZXJlZCBvYmplY3RzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5ub3cgPSBmdW5jdGlvbiBub3cgKCkge1xuICAgIHJldHVybiB0aGlzLl9zY2FsZWRUaW1lO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnRlcm5hbCBjbG9jayB0aW1lLlxuICpcbiAqIEBtZXRob2QgIGdldFRpbWVcbiAqIEBkZXByZWNhdGVkIFVzZSAjbm93IGluc3RlYWRcbiAqIFxuICogQHJldHVybiAge051bWJlcn0gdGltZSBoaWdoIHJlc29sdXRpb24gdGltc3RhbXAgdXNlZCBmb3IgaW52b2tpbmcgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgYHVwZGF0ZWAgbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqL1xuQ2xvY2sucHJvdG90eXBlLmdldFRpbWUgPSBDbG9jay5wcm90b3R5cGUubm93O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiBmcmFtZXMgZWxhcHNlZCBzbyBmYXIuXG4gKlxuICogQG1ldGhvZCBnZXRGcmFtZVxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGZyYW1lc1xuICovXG5DbG9jay5wcm90b3R5cGUuZ2V0RnJhbWUgPSBmdW5jdGlvbiBnZXRGcmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZyYW1lO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxuICogQWZ0ZXIgYSBzZXQgZHVyYXRpb24gaGFzIHBhc3NlZCwgaXQgZXhlY3V0ZXMgdGhlIGZ1bmN0aW9uIGFuZFxuICogcmVtb3ZlcyBpdCBhcyBhIGxpc3RlbmVyIHRvICdwcmVyZW5kZXInLlxuICpcbiAqIEBtZXRob2Qgc2V0VGltZW91dFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIHJ1biBhZnRlciBhIHNwZWNpZmllZCBkdXJhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IG1pbGxpc2Vjb25kcyBmcm9tIG5vdyB0byBleGVjdXRlIHRoZSBmdW5jdGlvblxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aW1lciBmdW5jdGlvbiB1c2VkIGZvciBDbG9jayNjbGVhclRpbWVyXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBzdGFydGVkQXQgPSB0aGlzLl90aW1lO1xuICAgIHZhciB0aW1lciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgLSBzdGFydGVkQXQgPj0gZGVsYXkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHBhcmFtcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICB0aGlzLl90aW1lclF1ZXVlLnB1c2godGltZXIpO1xuICAgIHJldHVybiB0aW1lcjtcbn07XG5cblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxuICogIEFmdGVyIGEgc2V0IGR1cmF0aW9uIGhhcyBwYXNzZWQsIGl0IGV4ZWN1dGVzIHRoZSBmdW5jdGlvbiBhbmRcbiAqICByZXNldHMgdGhlIGV4ZWN1dGlvbiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0SW50ZXJ2YWxcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBydW4gYWZ0ZXIgYSBzcGVjaWZpZWQgZHVyYXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSBpbnRlcnZhbCB0byBleGVjdXRlIGZ1bmN0aW9uIGluIG1pbGxpc2Vjb25kc1xuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aW1lciBmdW5jdGlvbiB1c2VkIGZvciBDbG9jayNjbGVhclRpbWVyXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uIHNldEludGVydmFsKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBzdGFydGVkQXQgPSB0aGlzLl90aW1lO1xuICAgIHZhciB0aW1lciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgLSBzdGFydGVkQXQgPj0gZGVsYXkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHBhcmFtcyk7XG4gICAgICAgICAgICBzdGFydGVkQXQgPSB0aW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHRoaXMuX3RpbWVyUXVldWUucHVzaCh0aW1lcik7XG4gICAgcmV0dXJuIHRpbWVyO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIHByZXZpb3VzbHkgdmlhIGBDbG9jayNzZXRUaW1lb3V0YCBvciBgQ2xvY2sjc2V0SW50ZXJ2YWxgXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKlxuICogQG1ldGhvZCBjbGVhclRpbWVyXG4gKiBAY2hhaW5hYmxlXG4gKiBcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSB0aW1lciAgcHJldmlvdXNseSBieSBgQ2xvY2sjc2V0VGltZW91dGAgb3JcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYENsb2NrI3NldEludGVydmFsYCByZXR1cm5lZCBjYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybiB7Q2xvY2t9ICAgICAgICAgICAgICB0aGlzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5jbGVhclRpbWVyID0gZnVuY3Rpb24gKHRpbWVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fdGltZXJRdWV1ZS5pbmRleE9mKHRpbWVyKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyUXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENsb2NrO1xuXG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKmpzaGludCAtVzA3OSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFRPRE86IERpc3BhdGNoIHNob3VsZCBiZSBnZW5lcmFsaXplZCBzbyB0aGF0IGl0IGNhbiB3b3JrIG9uIGFueSBOb2RlXG4vLyBub3QganVzdCBDb250ZXh0cy5cblxudmFyIEV2ZW50ID0gcmVxdWlyZSgnLi9FdmVudCcpO1xuXG4vKipcbiAqIFRoZSBEaXNwYXRjaCBjbGFzcyBpcyB1c2VkIHRvIHByb3BvZ2F0ZSBldmVudHMgZG93biB0aGVcbiAqIHNjZW5lIGdyYXBoLlxuICpcbiAqIEBjbGFzcyBEaXNwYXRjaFxuICogQHBhcmFtIHtTY2VuZX0gY29udGV4dCBUaGUgY29udGV4dCBvbiB3aGljaCBpdCBvcGVyYXRlc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERpc3BhdGNoIChjb250ZXh0KSB7XG5cbiAgICBpZiAoIWNvbnRleHQpIHRocm93IG5ldyBFcnJvcignRGlzcGF0Y2ggbmVlZHMgdG8gYmUgaW5zdGFudGlhdGVkIG9uIGEgbm9kZScpO1xuXG4gICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7IC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9uIHdoaWNoIHRoZSBkaXNwYXRjaGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9wZXJhdGVzXG5cbiAgICB0aGlzLl9xdWV1ZSA9IFtdOyAvLyBUaGUgcXVldWUgaXMgdXNlZCBmb3IgdHdvIHB1cnBvc2VzXG4gICAgICAgICAgICAgICAgICAgICAgLy8gMS4gSXQgaXMgdXNlZCB0byBsaXN0IGluZGljaWVzIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgIC8vICAgIE5vZGVzIHBhdGggd2hpY2ggYXJlIHRoZW4gdXNlZCB0byBsb29rdXBcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgICBhIG5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICAgICAgICAgICAgICAgICAgICAgIC8vIDIuIEl0IGlzIHVzZWQgdG8gYXNzaXN0IGRpc3BhdGNoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgLy8gICAgc3VjaCB0aGF0IGl0IGlzIHBvc3NpYmxlIHRvIGRvIGEgYnJlYWR0aCBmaXJzdFxuICAgICAgICAgICAgICAgICAgICAgIC8vICAgIHRyYXZlcnNhbCBvZiB0aGUgc2NlbmUgZ3JhcGguXG59XG5cbi8qKlxuICogbG9va3VwTm9kZSB0YWtlcyBhIHBhdGggYW5kIHJldHVybnMgdGhlIG5vZGUgYXQgdGhlIGxvY2F0aW9uIHNwZWNpZmllZFxuICogYnkgdGhlIHBhdGgsIGlmIG9uZSBleGlzdHMuIElmIG5vdCwgaXQgcmV0dXJucyB1bmRlZmluZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGxvY2F0aW9uIFRoZSBsb2NhdGlvbiBvZiB0aGUgbm9kZSBzcGVjaWZpZWQgYnkgaXRzIHBhdGhcbiAqXG4gKiBAcmV0dXJuIHtOb2RlIHwgdW5kZWZpbmVkfSBUaGUgbm9kZSBhdCB0aGUgcmVxdWVzdGVkIHBhdGhcbiAqL1xuRGlzcGF0Y2gucHJvdG90eXBlLmxvb2t1cE5vZGUgPSBmdW5jdGlvbiBsb29rdXBOb2RlIChsb2NhdGlvbikge1xuICAgIGlmICghbG9jYXRpb24pIHRocm93IG5ldyBFcnJvcignbG9va3VwTm9kZSBtdXN0IGJlIGNhbGxlZCB3aXRoIGEgcGF0aCcpO1xuXG4gICAgdmFyIHBhdGggPSB0aGlzLl9xdWV1ZTtcblxuICAgIF9zcGxpdFRvKGxvY2F0aW9uLCBwYXRoKTtcblxuICAgIGlmIChwYXRoWzBdICE9PSB0aGlzLl9jb250ZXh0LmdldFNlbGVjdG9yKCkpIHJldHVybiB2b2lkIDA7XG5cbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLl9jb250ZXh0LmdldENoaWxkcmVuKCk7XG4gICAgdmFyIGNoaWxkO1xuICAgIHZhciBpID0gMTtcbiAgICBwYXRoWzBdID0gdGhpcy5fY29udGV4dDtcblxuICAgIHdoaWxlIChpIDwgcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltwYXRoW2ldXTtcbiAgICAgICAgcGF0aFtpXSA9IGNoaWxkO1xuICAgICAgICBpZiAoY2hpbGQpIGNoaWxkcmVuID0gY2hpbGQuZ2V0Q2hpbGRyZW4oKTtcbiAgICAgICAgZWxzZSByZXR1cm4gdm9pZCAwO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxuLyoqXG4gKiBkaXNwYXRjaCB0YWtlcyBhbiBldmVudCBuYW1lIGFuZCBhIHBheWxvYWQgYW5kIGRpc3BhdGNoZXMgaXQgdG8gdGhlXG4gKiBlbnRpcmUgc2NlbmUgZ3JhcGggYmVsb3cgdGhlIG5vZGUgdGhhdCB0aGUgZGlzcGF0Y2hlciBpcyBvbi4gVGhlIG5vZGVzXG4gKiByZWNlaXZlIHRoZSBldmVudHMgaW4gYSBicmVhZHRoIGZpcnN0IHRyYXZlcnNhbCwgbWVhbmluZyB0aGF0IHBhcmVudHNcbiAqIGhhdmUgdGhlIG9wcG9ydHVuaXR5IHRvIHJlYWN0IHRvIHRoZSBldmVudCBiZWZvcmUgY2hpbGRyZW4uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IG5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0ge0FueX0gcGF5bG9hZCB0aGUgZXZlbnQgcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRpc3BhdGNoLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIGRpc3BhdGNoIChldmVudCwgcGF5bG9hZCkge1xuICAgIGlmICghZXZlbnQpIHRocm93IG5ldyBFcnJvcignZGlzcGF0Y2ggcmVxdWlyZXMgYW4gZXZlbnQgbmFtZSBhcyBpdFxcJ3MgZmlyc3QgYXJndW1lbnQnKTtcblxuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3F1ZXVlO1xuICAgIHZhciBpdGVtO1xuICAgIHZhciBpO1xuICAgIHZhciBsZW47XG4gICAgdmFyIGNoaWxkcmVuO1xuXG4gICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICBxdWV1ZS5wdXNoKHRoaXMuX2NvbnRleHQpO1xuXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBpdGVtID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgaWYgKGl0ZW0ub25SZWNlaXZlKSBpdGVtLm9uUmVjZWl2ZShldmVudCwgcGF5bG9hZCk7XG4gICAgICAgIGNoaWxkcmVuID0gaXRlbS5nZXRDaGlsZHJlbigpO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBjaGlsZHJlbi5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKSBxdWV1ZS5wdXNoKGNoaWxkcmVuW2ldKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIGRpc3BhdGNoVUlldmVudCB0YWtlcyBhIHBhdGgsIGFuIGV2ZW50IG5hbWUsIGFuZCBhIHBheWxvYWQgYW5kIGRpc3BhdGNoZXMgdGhlbSBpblxuICogYSBtYW5uZXIgYW5vbG9nb3VzIHRvIERPTSBidWJibGluZy4gSXQgZmlyc3QgdHJhdmVyc2VzIGRvd24gdG8gdGhlIG5vZGUgc3BlY2lmaWVkIGF0XG4gKiB0aGUgcGF0aC4gVGhhdCBub2RlIHJlY2VpdmVzIHRoZSBldmVudCBmaXJzdCwgYW5kIHRoZW4gZXZlcnkgYW5jZXN0b3IgcmVjZWl2ZXMgdGhlIGV2ZW50XG4gKiB1bnRpbCB0aGUgY29udGV4dC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCB0aGUgcGF0aCBvZiB0aGUgbm9kZVxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IHRoZSBldmVudCBuYW1lXG4gKiBAcGFyYW0ge0FueX0gcGF5bG9hZCB0aGUgcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRpc3BhdGNoLnByb3RvdHlwZS5kaXNwYXRjaFVJRXZlbnQgPSBmdW5jdGlvbiBkaXNwYXRjaFVJRXZlbnQgKHBhdGgsIGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgRXJyb3IoJ2Rpc3BhdGNoVUlFdmVudCBuZWVkcyBhIHZhbGlkIHBhdGggdG8gZGlzcGF0Y2ggdG8nKTtcbiAgICBpZiAoIWV2ZW50KSB0aHJvdyBuZXcgRXJyb3IoJ2Rpc3BhdGNoVUlFdmVudCBuZWVkcyBhbiBldmVudCBuYW1lIGFzIGl0cyBzZWNvbmQgYXJndW1lbnQnKTtcblxuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3F1ZXVlO1xuICAgIHZhciBub2RlO1xuXG4gICAgRXZlbnQuY2FsbChwYXlsb2FkKTtcbiAgICBwYXlsb2FkLm5vZGUgPSB0aGlzLmxvb2t1cE5vZGUocGF0aCk7IC8vIEFmdGVyIHRoaXMgY2FsbCwgdGhlIHBhdGggaXMgbG9hZGVkIGludG8gdGhlIHF1ZXVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAobG9va1VwIG5vZGUgZG9lc24ndCBjbGVhciB0aGUgcXVldWUgYWZ0ZXIgdGhlIGxvb2t1cClcblxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgbm9kZSA9IHF1ZXVlLnBvcCgpOyAvLyBwb3Agbm9kZXMgb2ZmIG9mIHRoZSBxdWV1ZSB0byBtb3ZlIHVwIHRoZSBhbmNlc3RvciBjaGFpbi5cbiAgICAgICAgaWYgKG5vZGUub25SZWNlaXZlKSBub2RlLm9uUmVjZWl2ZShldmVudCwgcGF5bG9hZCk7XG4gICAgICAgIGlmIChwYXlsb2FkLnByb3BhZ2F0aW9uU3RvcHBlZCkgYnJlYWs7XG4gICAgfVxufTtcblxuLyoqXG4gKiBfc3BsaXRUbyBpcyBhIHByaXZhdGUgbWV0aG9kIHdoaWNoIHRha2VzIGEgcGF0aCBhbmQgc3BsaXRzIGl0IGF0IGV2ZXJ5ICcvJ1xuICogcHVzaGluZyB0aGUgcmVzdWx0IGludG8gdGhlIHN1cHBsaWVkIGFycmF5LiBUaGlzIGlzIGEgZGVzdHJ1Y3RpdmUgY2hhbmdlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIHRoZSBzcGVjaWZpZWQgcGF0aFxuICogQHBhcmFtIHtBcnJheX0gdGFyZ2V0IHRoZSBhcnJheSB0byB3aGljaCB0aGUgcmVzdWx0IHNob3VsZCBiZSB3cml0dGVuXG4gKlxuICogQHJldHVybiB7QXJyYXl9IHRoZSB0YXJnZXQgYWZ0ZXIgaGF2aW5nIGJlZW4gd3JpdHRlbiB0b1xuICovXG5mdW5jdGlvbiBfc3BsaXRUbyAoc3RyaW5nLCB0YXJnZXQpIHtcbiAgICB0YXJnZXQubGVuZ3RoID0gMDsgLy8gY2xlYXJzIHRoZSBhcnJheSBmaXJzdC5cbiAgICB2YXIgbGFzdCA9IDA7XG4gICAgdmFyIGk7XG4gICAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGg7XG5cbiAgICBmb3IgKGkgPSAwIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpZiAoc3RyaW5nW2ldID09PSAnLycpIHtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKHN0cmluZy5zdWJzdHJpbmcobGFzdCwgaSkpO1xuICAgICAgICAgICAgbGFzdCA9IGkgKyAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgLSBsYXN0ID4gMCkgdGFyZ2V0LnB1c2goc3RyaW5nLnN1YnN0cmluZyhsYXN0LCBpKSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERpc3BhdGNoO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgRXZlbnQgY2xhc3MgYWRkcyB0aGUgc3RvcFByb3BhZ2F0aW9uIGZ1bmN0aW9uYWxpdHlcbiAqIHRvIHRoZSBVSUV2ZW50cyB3aXRoaW4gdGhlIHNjZW5lIGdyYXBoLlxuICpcbiAqIEBjb25zdHJ1Y3RvciBFdmVudFxuICovXG5mdW5jdGlvbiBFdmVudCAoKSB7XG4gICAgdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZTtcbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHN0b3BQcm9wYWdhdGlvbjtcbn1cblxuLyoqXG4gKiBzdG9wUHJvcGFnYXRpb24gZW5kcyB0aGUgYnViYmxpbmcgb2YgdGhlIGV2ZW50IGluIHRoZVxuICogc2NlbmUgZ3JhcGguXG4gKlxuICogQG1ldGhvZCBzdG9wUHJvcGFnYXRpb25cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkge1xuICAgIHRoaXMucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudDtcblxuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENsb2NrID0gcmVxdWlyZSgnLi9DbG9jaycpO1xudmFyIFNjZW5lID0gcmVxdWlyZSgnLi9TY2VuZScpO1xudmFyIENoYW5uZWwgPSByZXF1aXJlKCcuL0NoYW5uZWwnKTtcbnZhciBVSU1hbmFnZXIgPSByZXF1aXJlKCcuLi9yZW5kZXJlcnMvVUlNYW5hZ2VyJyk7XG52YXIgQ29tcG9zaXRvciA9IHJlcXVpcmUoJy4uL3JlbmRlcmVycy9Db21wb3NpdG9yJyk7XG52YXIgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCA9IHJlcXVpcmUoJy4uL3JlbmRlci1sb29wcy9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wJyk7XG5cbnZhciBFTkdJTkVfU1RBUlQgPSBbJ0VOR0lORScsICdTVEFSVCddO1xudmFyIEVOR0lORV9TVE9QID0gWydFTkdJTkUnLCAnU1RPUCddO1xudmFyIFRJTUVfVVBEQVRFID0gWydUSU1FJywgbnVsbF07XG5cbi8qKlxuICogRmFtb3VzIGhhcyB0d28gcmVzcG9uc2liaWxpdGllcywgb25lIHRvIGFjdCBhcyB0aGUgaGlnaGVzdCBsZXZlbFxuICogdXBkYXRlciBhbmQgYW5vdGhlciB0byBzZW5kIG1lc3NhZ2VzIG92ZXIgdG8gdGhlIHJlbmRlcmVycy4gSXQgaXNcbiAqIGEgc2luZ2xldG9uLlxuICpcbiAqIEBjbGFzcyBGYW1vdXNFbmdpbmVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBGYW1vdXNFbmdpbmUoKSB7XG4gICAgdGhpcy5fdXBkYXRlUXVldWUgPSBbXTsgLy8gVGhlIHVwZGF0ZVF1ZXVlIGlzIGEgcGxhY2Ugd2hlcmUgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYW4gcGxhY2UgdGhlbXNlbHZlcyBpbiBvcmRlciB0byBiZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZWQgb24gdGhlIGZyYW1lLlxuXG4gICAgdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlID0gW107IC8vIHRoZSBuZXh0VXBkYXRlUXVldWUgaXMgdXNlZCB0byBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGVzIGZvciB0aGUgbmV4dCB0aWNrLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHByZXZlbnRzIGluZmluaXRlIGxvb3BzIHdoZXJlIGR1cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbiB1cGRhdGUgYSBub2RlIGNvbnRpbnVvdXNseSBwdXRzIGl0c2VsZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBiYWNrIGluIHRoZSB1cGRhdGUgcXVldWUuXG5cbiAgICB0aGlzLl9zY2VuZXMgPSB7fTsgLy8gYSBoYXNoIG9mIGFsbCBvZiB0aGUgc2NlbmVzJ3MgdGhhdCB0aGUgRmFtb3VzRW5naW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgcmVzcG9uc2libGUgZm9yLlxuXG4gICAgdGhpcy5fbWVzc2FnZXMgPSBUSU1FX1VQREFURTsgICAvLyBhIHF1ZXVlIG9mIGFsbCBvZiB0aGUgZHJhdyBjb21tYW5kcyB0b1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VuZCB0byB0aGUgdGhlIHJlbmRlcmVycyB0aGlzIGZyYW1lLlxuXG4gICAgdGhpcy5faW5VcGRhdGUgPSBmYWxzZTsgLy8gd2hlbiB0aGUgZmFtb3VzIGlzIHVwZGF0aW5nIHRoaXMgaXMgdHJ1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbGwgcmVxdWVzdHMgZm9yIHVwZGF0ZXMgd2lsbCBnZXQgcHV0IGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRVcGRhdGVRdWV1ZVxuXG4gICAgdGhpcy5fY2xvY2sgPSBuZXcgQ2xvY2soKTsgLy8gYSBjbG9jayB0byBrZWVwIHRyYWNrIG9mIHRpbWUgZm9yIHRoZSBzY2VuZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdyYXBoLlxuXG4gICAgdGhpcy5fY2hhbm5lbCA9IG5ldyBDaGFubmVsKCk7XG4gICAgdGhpcy5fY2hhbm5lbC5vbk1lc3NhZ2UgPSB0aGlzLmhhbmRsZU1lc3NhZ2UuYmluZCh0aGlzKTtcbn1cblxuXG4vKipcbiAqIEFuIGluaXQgc2NyaXB0IHRoYXQgaW5pdGlhbGl6ZXMgdGhlIEZhbW91c0VuZ2luZSB3aXRoIG9wdGlvbnNcbiAqIG9yIGRlZmF1bHQgcGFyYW1ldGVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgYSBzZXQgb2Ygb3B0aW9ucyBjb250YWluaW5nIGEgY29tcG9zaXRvciBhbmQgYSByZW5kZXIgbG9vcFxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KG9wdGlvbnMpIHtcbiAgICB0aGlzLmNvbXBvc2l0b3IgPSBvcHRpb25zICYmIG9wdGlvbnMuY29tcG9zaXRvciB8fCBuZXcgQ29tcG9zaXRvcigpO1xuICAgIHRoaXMucmVuZGVyTG9vcCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5yZW5kZXJMb29wIHx8IG5ldyBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wKCk7XG4gICAgdGhpcy51aU1hbmFnZXIgPSBuZXcgVUlNYW5hZ2VyKHRoaXMuZ2V0Q2hhbm5lbCgpLCB0aGlzLmNvbXBvc2l0b3IsIHRoaXMucmVuZGVyTG9vcCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGNoYW5uZWwgdGhhdCB0aGUgZW5naW5lIHdpbGwgdXNlIHRvIGNvbW11bmljYXRlIHRvXG4gKiB0aGUgcmVuZGVyZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0NoYW5uZWx9IGNoYW5uZWwgICAgIFRoZSBjaGFubmVsIHRvIGJlIHVzZWQgZm9yIGNvbW11bmljYXRpbmcgd2l0aFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYFVJTWFuYWdlcmAvIGBDb21wb3NpdG9yYC5cbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5zZXRDaGFubmVsID0gZnVuY3Rpb24gc2V0Q2hhbm5lbChjaGFubmVsKSB7XG4gICAgdGhpcy5fY2hhbm5lbCA9IGNoYW5uZWw7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGNoYW5uZWwgdGhhdCB0aGUgZW5naW5lIGlzIGN1cnJlbnRseSB1c2luZ1xuICogdG8gY29tbXVuaWNhdGUgd2l0aCB0aGUgcmVuZGVyZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtDaGFubmVsfSBjaGFubmVsICAgIFRoZSBjaGFubmVsIHRvIGJlIHVzZWQgZm9yIGNvbW11bmljYXRpbmcgd2l0aFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYFVJTWFuYWdlcmAvIGBDb21wb3NpdG9yYC5cbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5nZXRDaGFubmVsID0gZnVuY3Rpb24gZ2V0Q2hhbm5lbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYW5uZWw7XG59O1xuXG4vKipcbiAqIF91cGRhdGUgaXMgdGhlIGJvZHkgb2YgdGhlIHVwZGF0ZSBsb29wLiBUaGUgZnJhbWUgY29uc2lzdHMgb2ZcbiAqIHB1bGxpbmcgaW4gYXBwZW5kaW5nIHRoZSBuZXh0VXBkYXRlUXVldWUgdG8gdGhlIGN1cnJlbnRVcGRhdGUgcXVldWVcbiAqIHRoZW4gbW92aW5nIHRocm91Z2ggdGhlIHVwZGF0ZVF1ZXVlIGFuZCBjYWxsaW5nIG9uVXBkYXRlIHdpdGggdGhlIGN1cnJlbnRcbiAqIHRpbWUgb24gYWxsIG5vZGVzLiBXaGlsZSBfdXBkYXRlIGlzIGNhbGxlZCBfaW5VcGRhdGUgaXMgc2V0IHRvIHRydWUgYW5kXG4gKiBhbGwgcmVxdWVzdHMgdG8gYmUgcGxhY2VkIGluIHRoZSB1cGRhdGUgcXVldWUgd2lsbCBiZSBmb3J3YXJkZWQgdG8gdGhlXG4gKiBuZXh0VXBkYXRlUXVldWUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuX3VwZGF0ZSA9IGZ1bmN0aW9uIF91cGRhdGUgKCkge1xuICAgIHRoaXMuX2luVXBkYXRlID0gdHJ1ZTtcbiAgICB2YXIgdGltZSA9IHRoaXMuX2Nsb2NrLm5vdygpO1xuICAgIHZhciBuZXh0UXVldWUgPSB0aGlzLl9uZXh0VXBkYXRlUXVldWU7XG4gICAgdmFyIHF1ZXVlID0gdGhpcy5fdXBkYXRlUXVldWU7XG4gICAgdmFyIGl0ZW07XG5cbiAgICB0aGlzLl9tZXNzYWdlc1sxXSA9IHRpbWU7XG5cbiAgICB3aGlsZSAobmV4dFF1ZXVlLmxlbmd0aCkgcXVldWUudW5zaGlmdChuZXh0UXVldWUucG9wKCkpO1xuXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBpdGVtID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblVwZGF0ZSkgaXRlbS5vblVwZGF0ZSh0aW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pblVwZGF0ZSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiByZXF1ZXN0VXBkYXRlcyB0YWtlcyBhIGNsYXNzIHRoYXQgaGFzIGFuIG9uVXBkYXRlIG1ldGhvZCBhbmQgcHV0cyBpdFxuICogaW50byB0aGUgdXBkYXRlUXVldWUgdG8gYmUgdXBkYXRlZCBhdCB0aGUgbmV4dCBmcmFtZS5cbiAqIElmIEZhbW91c0VuZ2luZSBpcyBjdXJyZW50bHkgaW4gYW4gdXBkYXRlLCByZXF1ZXN0VXBkYXRlXG4gKiBwYXNzZXMgaXRzIGFyZ3VtZW50IHRvIHJlcXVlc3RVcGRhdGVPbk5leHRUaWNrLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdGVyIGFuIG9iamVjdCB3aXRoIGFuIG9uVXBkYXRlIG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUucmVxdWVzdFVwZGF0ZSA9IGZ1bmN0aW9uIHJlcXVlc3RVcGRhdGUgKHJlcXVlc3Rlcikge1xuICAgIGlmICghcmVxdWVzdGVyKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAncmVxdWVzdFVwZGF0ZSBtdXN0IGJlIGNhbGxlZCB3aXRoIGEgY2xhc3MgdG8gYmUgdXBkYXRlZCdcbiAgICAgICAgKTtcblxuICAgIGlmICh0aGlzLl9pblVwZGF0ZSkgdGhpcy5yZXF1ZXN0VXBkYXRlT25OZXh0VGljayhyZXF1ZXN0ZXIpO1xuICAgIGVsc2UgdGhpcy5fdXBkYXRlUXVldWUucHVzaChyZXF1ZXN0ZXIpO1xufTtcblxuLyoqXG4gKiByZXF1ZXN0VXBkYXRlT25OZXh0VGljayBpcyByZXF1ZXN0cyBhbiB1cGRhdGUgb24gdGhlIG5leHQgZnJhbWUuXG4gKiBJZiBGYW1vdXNFbmdpbmUgaXMgbm90IGN1cnJlbnRseSBpbiBhbiB1cGRhdGUgdGhhbiBpdCBpcyBmdW5jdGlvbmFsbHkgZXF1aXZhbGVudFxuICogdG8gcmVxdWVzdFVwZGF0ZS4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIHVzZWQgdG8gcHJldmVudCBpbmZpbml0ZSBsb29wcyB3aGVyZVxuICogYSBjbGFzcyBpcyB1cGRhdGVkIG9uIHRoZSBmcmFtZSBidXQgbmVlZHMgdG8gYmUgdXBkYXRlZCBhZ2FpbiBuZXh0IGZyYW1lLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdGVyIGFuIG9iamVjdCB3aXRoIGFuIG9uVXBkYXRlIG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUucmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sgPSBmdW5jdGlvbiByZXF1ZXN0VXBkYXRlT25OZXh0VGljayAocmVxdWVzdGVyKSB7XG4gICAgdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlLnB1c2gocmVxdWVzdGVyKTtcbn07XG5cbi8qKlxuICogcG9zdE1lc3NhZ2Ugc2VuZHMgYSBtZXNzYWdlIHF1ZXVlIGludG8gRmFtb3VzRW5naW5lIHRvIGJlIHByb2Nlc3NlZC5cbiAqIFRoZXNlIG1lc3NhZ2VzIHdpbGwgYmUgaW50ZXJwcmV0ZWQgYW5kIHNlbnQgaW50byB0aGUgc2NlbmUgZ3JhcGhcbiAqIGFzIGV2ZW50cyBpZiBuZWNlc3NhcnkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG1lc3NhZ2VzIGFuIGFycmF5IG9mIGNvbW1hbmRzLlxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmhhbmRsZU1lc3NhZ2UgPSBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlIChtZXNzYWdlcykge1xuICAgIGlmICghbWVzc2FnZXMpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdvbk1lc3NhZ2UgbXVzdCBiZSBjYWxsZWQgd2l0aCBhbiBhcnJheSBvZiBtZXNzYWdlcydcbiAgICAgICAgKTtcblxuICAgIHZhciBjb21tYW5kO1xuXG4gICAgd2hpbGUgKG1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29tbWFuZCA9IG1lc3NhZ2VzLnNoaWZ0KCk7XG4gICAgICAgIHN3aXRjaCAoY29tbWFuZCkge1xuICAgICAgICAgICAgY2FzZSAnV0lUSCc6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVXaXRoKG1lc3NhZ2VzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0ZSQU1FJzpcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUZyYW1lKG1lc3NhZ2VzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZWNlaXZlZCB1bmtub3duIGNvbW1hbmQ6ICcgKyBjb21tYW5kKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogaGFuZGxlV2l0aCBpcyBhIG1ldGhvZCB0aGF0IHRha2VzIGFuIGFycmF5IG9mIG1lc3NhZ2VzIGZvbGxvd2luZyB0aGVcbiAqIFdJVEggY29tbWFuZC4gSXQnbGwgdGhlbiBpc3N1ZSB0aGUgbmV4dCBjb21tYW5kcyB0byB0aGUgcGF0aCBzcGVjaWZpZWRcbiAqIGJ5IHRoZSBXSVRIIGNvbW1hbmQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG1lc3NhZ2VzIGFycmF5IG9mIG1lc3NhZ2VzLlxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmhhbmRsZVdpdGggPSBmdW5jdGlvbiBoYW5kbGVXaXRoIChtZXNzYWdlcykge1xuICAgIHZhciBwYXRoID0gbWVzc2FnZXMuc2hpZnQoKTtcbiAgICB2YXIgY29tbWFuZCA9IG1lc3NhZ2VzLnNoaWZ0KCk7XG5cbiAgICBzd2l0Y2ggKGNvbW1hbmQpIHtcbiAgICAgICAgY2FzZSAnVFJJR0dFUic6IC8vIHRoZSBUUklHR0VSIGNvbW1hbmQgc2VuZHMgYSBVSUV2ZW50IHRvIHRoZSBzcGVjaWZpZWQgcGF0aFxuICAgICAgICAgICAgdmFyIHR5cGUgPSBtZXNzYWdlcy5zaGlmdCgpO1xuICAgICAgICAgICAgdmFyIGV2ID0gbWVzc2FnZXMuc2hpZnQoKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRDb250ZXh0KHBhdGgpLmdldERpc3BhdGNoKCkuZGlzcGF0Y2hVSUV2ZW50KHBhdGgsIHR5cGUsIGV2KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZWNlaXZlZCB1bmtub3duIGNvbW1hbmQ6ICcgKyBjb21tYW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIGhhbmRsZUZyYW1lIGlzIGNhbGxlZCB3aGVuIHRoZSByZW5kZXJlcnMgaXNzdWUgYSBGUkFNRSBjb21tYW5kIHRvXG4gKiBGYW1vdXNFbmdpbmUuIEZhbW91c0VuZ2luZSB3aWxsIHRoZW4gc3RlcCB1cGRhdGluZyB0aGUgc2NlbmUgZ3JhcGggdG8gdGhlIGN1cnJlbnQgdGltZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gbWVzc2FnZXMgYXJyYXkgb2YgbWVzc2FnZXMuXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuaGFuZGxlRnJhbWUgPSBmdW5jdGlvbiBoYW5kbGVGcmFtZSAobWVzc2FnZXMpIHtcbiAgICBpZiAoIW1lc3NhZ2VzKSB0aHJvdyBuZXcgRXJyb3IoJ2hhbmRsZUZyYW1lIG11c3QgYmUgY2FsbGVkIHdpdGggYW4gYXJyYXkgb2YgbWVzc2FnZXMnKTtcbiAgICBpZiAoIW1lc3NhZ2VzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdGUkFNRSBtdXN0IGJlIHNlbnQgd2l0aCBhIHRpbWUnKTtcblxuICAgIHRoaXMuc3RlcChtZXNzYWdlcy5zaGlmdCgpKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogc3RlcCB1cGRhdGVzIHRoZSBjbG9jayBhbmQgdGhlIHNjZW5lIGdyYXBoIGFuZCB0aGVuIHNlbmRzIHRoZSBkcmF3IGNvbW1hbmRzXG4gKiB0aGF0IGFjY3VtdWxhdGVkIGluIHRoZSB1cGRhdGUgdG8gdGhlIHJlbmRlcmVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgY3VycmVudCBlbmdpbmUgdGltZVxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiBzdGVwICh0aW1lKSB7XG4gICAgaWYgKHRpbWUgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdzdGVwIG11c3QgYmUgY2FsbGVkIHdpdGggYSB0aW1lJyk7XG5cbiAgICB0aGlzLl9jbG9jay5zdGVwKHRpbWUpO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuXG4gICAgaWYgKHRoaXMuX21lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9jaGFubmVsLnNlbmRNZXNzYWdlKHRoaXMuX21lc3NhZ2VzKTtcbiAgICAgICAgdGhpcy5fbWVzc2FnZXMubGVuZ3RoID0gMjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogcmV0dXJucyB0aGUgY29udGV4dCBvZiBhIHBhcnRpY3VsYXIgcGF0aC4gVGhlIGNvbnRleHQgaXMgbG9va2VkIHVwIGJ5IHRoZSBzZWxlY3RvclxuICogcG9ydGlvbiBvZiB0aGUgcGF0aCBhbmQgaXMgbGlzdGVkIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBzdHJpbmcgdG8gdGhlIGZpcnN0XG4gKiAnLycuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciB0aGUgcGF0aCB0byBsb29rIHVwIHRoZSBjb250ZXh0IGZvci5cbiAqXG4gKiBAcmV0dXJuIHtDb250ZXh0IHwgVW5kZWZpbmVkfSB0aGUgY29udGV4dCBpZiBmb3VuZCwgZWxzZSB1bmRlZmluZWQuXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuZ2V0Q29udGV4dCA9IGZ1bmN0aW9uIGdldENvbnRleHQgKHNlbGVjdG9yKSB7XG4gICAgaWYgKCFzZWxlY3RvcikgdGhyb3cgbmV3IEVycm9yKCdnZXRDb250ZXh0IG11c3QgYmUgY2FsbGVkIHdpdGggYSBzZWxlY3RvcicpO1xuXG4gICAgdmFyIGluZGV4ID0gc2VsZWN0b3IuaW5kZXhPZignLycpO1xuICAgIHNlbGVjdG9yID0gaW5kZXggPT09IC0xID8gc2VsZWN0b3IgOiBzZWxlY3Rvci5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX3NjZW5lc1tzZWxlY3Rvcl07XG59O1xuXG4vKipcbiAqIHJldHVybnMgdGhlIGluc3RhbmNlIG9mIGNsb2NrIHdpdGhpbiBmYW1vdXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Nsb2NrfSBGYW1vdXNFbmdpbmUncyBjbG9ja1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmdldENsb2NrID0gZnVuY3Rpb24gZ2V0Q2xvY2sgKCkge1xuICAgIHJldHVybiB0aGlzLl9jbG9jaztcbn07XG5cbi8qKlxuICogcXVldWVzIGEgbWVzc2FnZSB0byBiZSB0cmFuc2ZlcmVkIHRvIHRoZSByZW5kZXJlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QW55fSBjb21tYW5kIERyYXcgQ29tbWFuZFxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLm1lc3NhZ2UgPSBmdW5jdGlvbiBtZXNzYWdlIChjb21tYW5kKSB7XG4gICAgdGhpcy5fbWVzc2FnZXMucHVzaChjb21tYW5kKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNjZW5lIHVuZGVyIHdoaWNoIGEgc2NlbmUgZ3JhcGggY291bGQgYmUgYnVpbHQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIGRvbSBzZWxlY3RvciBmb3Igd2hlcmUgdGhlIHNjZW5lIHNob3VsZCBiZSBwbGFjZWRcbiAqXG4gKiBAcmV0dXJuIHtTY2VuZX0gYSBuZXcgaW5zdGFuY2Ugb2YgU2NlbmUuXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuY3JlYXRlU2NlbmUgPSBmdW5jdGlvbiBjcmVhdGVTY2VuZSAoc2VsZWN0b3IpIHtcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICdib2R5JztcblxuICAgIGlmICh0aGlzLl9zY2VuZXNbc2VsZWN0b3JdKSB0aGlzLl9zY2VuZXNbc2VsZWN0b3JdLmRpc21vdW50KCk7XG4gICAgdGhpcy5fc2NlbmVzW3NlbGVjdG9yXSA9IG5ldyBTY2VuZShzZWxlY3RvciwgdGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuX3NjZW5lc1tzZWxlY3Rvcl07XG59O1xuXG4vKipcbiAqIFN0YXJ0cyB0aGUgZW5naW5lIHJ1bm5pbmcgaW4gdGhlIE1haW4tVGhyZWFkLlxuICogVGhpcyBlZmZlY3RzICoqZXZlcnkqKiB1cGRhdGVhYmxlIG1hbmFnZWQgYnkgdGhlIEVuZ2luZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuc3RhcnRFbmdpbmUgPSBmdW5jdGlvbiBzdGFydEVuZ2luZSAoKSB7XG4gICAgdGhpcy5fY2hhbm5lbC5zZW5kTWVzc2FnZShFTkdJTkVfU1RBUlQpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wcyB0aGUgZW5naW5lIHJ1bm5pbmcgaW4gdGhlIE1haW4tVGhyZWFkLlxuICogVGhpcyBlZmZlY3RzICoqZXZlcnkqKiB1cGRhdGVhYmxlIG1hbmFnZWQgYnkgdGhlIEVuZ2luZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuc3RvcEVuZ2luZSA9IGZ1bmN0aW9uIHN0b3BFbmdpbmUgKCkge1xuICAgIHRoaXMuX2NoYW5uZWwuc2VuZE1lc3NhZ2UoRU5HSU5FX1NUT1ApO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRmFtb3VzRW5naW5lKCk7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKmpzaGludCAtVzA3OSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpO1xudmFyIFNpemUgPSByZXF1aXJlKCcuL1NpemUnKTtcblxudmFyIFRSQU5TRk9STV9QUk9DRVNTT1IgPSBuZXcgVHJhbnNmb3JtKCk7XG52YXIgU0laRV9QUk9DRVNTT1IgPSBuZXcgU2l6ZSgpO1xuXG52YXIgSURFTlQgPSBbXG4gICAgMSwgMCwgMCwgMCxcbiAgICAwLCAxLCAwLCAwLFxuICAgIDAsIDAsIDEsIDAsXG4gICAgMCwgMCwgMCwgMVxuXTtcblxudmFyIE9ORVMgPSBbMSwgMSwgMV07XG52YXIgUVVBVCA9IFswLCAwLCAwLCAxXTtcblxuLyoqXG4gKiBOb2RlcyBkZWZpbmUgaGllcmFyY2h5IGFuZCBnZW9tZXRyaWNhbCB0cmFuc2Zvcm1hdGlvbnMuIFRoZXkgY2FuIGJlIG1vdmVkXG4gKiAodHJhbnNsYXRlZCksIHNjYWxlZCBhbmQgcm90YXRlZC5cbiAqXG4gKiBBIE5vZGUgaXMgZWl0aGVyIG1vdW50ZWQgb3IgdW5tb3VudGVkLiBVbm1vdW50ZWQgbm9kZXMgYXJlIGRldGFjaGVkIGZyb20gdGhlXG4gKiBzY2VuZSBncmFwaC4gVW5tb3VudGVkIG5vZGVzIGhhdmUgbm8gcGFyZW50IG5vZGUsIHdoaWxlIGVhY2ggbW91bnRlZCBub2RlIGhhc1xuICogZXhhY3RseSBvbmUgcGFyZW50LiBOb2RlcyBoYXZlIGFuIGFyYml0YXJ5IG51bWJlciBvZiBjaGlsZHJlbiwgd2hpY2ggY2FuIGJlXG4gKiBkeW5hbWljYWxseSBhZGRlZCB1c2luZyBAe0BsaW5rIGFkZENoaWxkfS5cbiAqXG4gKiBFYWNoIE5vZGVzIGhhdmUgYW4gYXJiaXRyYXJ5IG51bWJlciBvZiBgY29tcG9uZW50c2AuIFRob3NlIGNvbXBvbmVudHMgY2FuXG4gKiBzZW5kIGBkcmF3YCBjb21tYW5kcyB0byB0aGUgcmVuZGVyZXIgb3IgbXV0YXRlIHRoZSBub2RlIGl0c2VsZiwgaW4gd2hpY2ggY2FzZVxuICogdGhleSBkZWZpbmUgYmVoYXZpb3IgaW4gdGhlIG1vc3QgZXhwbGljaXQgd2F5LiBDb21wb25lbnRzIHRoYXQgc2VuZCBgZHJhd2BcbiAqIGNvbW1hbmRzIGFhcmUgY29uc2lkZXJlZCBgcmVuZGVyYWJsZXNgLiBGcm9tIHRoZSBub2RlJ3MgcGVyc3BlY3RpdmUsIHRoZXJlIGlzXG4gKiBubyBkaXN0aW5jdGlvbiBiZXR3ZWVuIG5vZGVzIHRoYXQgc2VuZCBkcmF3IGNvbW1hbmRzIGFuZCBub2RlcyB0aGF0IGRlZmluZVxuICogYmVoYXZpb3IuXG4gKlxuICogQmVjYXVzZSBvZiB0aGUgZmFjdCB0aGF0IE5vZGVzIHRoZW1zZWxmIGFyZSB2ZXJ5IHVub3BpbmlvdGVkICh0aGV5IGRvbid0XG4gKiBcInJlbmRlclwiIHRvIGFueXRoaW5nKSwgdGhleSBhcmUgb2Z0ZW4gYmVpbmcgc3ViY2xhc3NlZCBpbiBvcmRlciB0byBhZGQgZS5nLlxuICogY29tcG9uZW50cyBhdCBpbml0aWFsaXphdGlvbiB0byB0aGVtLiBCZWNhdXNlIG9mIHRoaXMgZmxleGliaWxpdHksIHRoZXkgbWlnaHRcbiAqIGFzIHdlbGwgaGF2ZSBiZWVuIGNhbGxlZCBgRW50aXRpZXNgLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBjcmVhdGUgdGhyZWUgZGV0YWNoZWQgKHVubW91bnRlZCkgbm9kZXNcbiAqIHZhciBwYXJlbnQgPSBuZXcgTm9kZSgpO1xuICogdmFyIGNoaWxkMSA9IG5ldyBOb2RlKCk7XG4gKiB2YXIgY2hpbGQyID0gbmV3IE5vZGUoKTtcbiAqXG4gKiAvLyBidWlsZCBhbiB1bm1vdW50ZWQgc3VidHJlZSAocGFyZW50IGlzIHN0aWxsIGRldGFjaGVkKVxuICogcGFyZW50LmFkZENoaWxkKGNoaWxkMSk7XG4gKiBwYXJlbnQuYWRkQ2hpbGQoY2hpbGQyKTtcbiAqXG4gKiAvLyBtb3VudCBwYXJlbnQgYnkgYWRkaW5nIGl0IHRvIHRoZSBjb250ZXh0XG4gKiB2YXIgY29udGV4dCA9IEZhbW91cy5jcmVhdGVDb250ZXh0KFwiYm9keVwiKTtcbiAqIGNvbnRleHQuYWRkQ2hpbGQocGFyZW50KTtcbiAqXG4gKiBAY2xhc3MgTm9kZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE5vZGUgKCkge1xuICAgIHRoaXMuX2NhbGN1bGF0ZWRWYWx1ZXMgPSB7XG4gICAgICAgIHRyYW5zZm9ybTogbmV3IEZsb2F0MzJBcnJheShJREVOVCksXG4gICAgICAgIHNpemU6IG5ldyBGbG9hdDMyQXJyYXkoMylcbiAgICB9O1xuXG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX2luVXBkYXRlID0gZmFsc2U7XG5cbiAgICB0aGlzLl91cGRhdGVRdWV1ZSA9IFtdO1xuICAgIHRoaXMuX25leHRVcGRhdGVRdWV1ZSA9IFtdO1xuXG4gICAgdGhpcy5fZnJlZWRDb21wb25lbnRJbmRpY2llcyA9IFtdO1xuICAgIHRoaXMuX2NvbXBvbmVudHMgPSBbXTtcblxuICAgIHRoaXMuX2ZyZWVkQ2hpbGRJbmRpY2llcyA9IFtdO1xuICAgIHRoaXMuX2NoaWxkcmVuID0gW107XG5cbiAgICB0aGlzLl9wYXJlbnQgPSBudWxsO1xuICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIgPSBudWxsO1xuXG4gICAgdGhpcy5fbGFzdEV1bGVyWCA9IDA7XG4gICAgdGhpcy5fbGFzdEV1bGVyWSA9IDA7XG4gICAgdGhpcy5fbGFzdEV1bGVyWiA9IDA7XG4gICAgdGhpcy5fbGFzdEV1bGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLnZhbHVlID0gbmV3IE5vZGUuU3BlYygpO1xufVxuXG5Ob2RlLlJFTEFUSVZFX1NJWkUgPSBTaXplLlJFTEFUSVZFO1xuTm9kZS5BQlNPTFVURV9TSVpFID0gU2l6ZS5BQlNPTFVURTtcbk5vZGUuUkVOREVSX1NJWkUgPSBTaXplLlJFTkRFUjtcbk5vZGUuREVGQVVMVF9TSVpFID0gU2l6ZS5ERUZBVUxUO1xuXG4vKipcbiAqIEEgTm9kZSBzcGVjIGhvbGRzIHRoZSBcImRhdGFcIiBhc3NvY2lhdGVkIHdpdGggYSBOb2RlLlxuICpcbiAqIEBjbGFzcyBTcGVjXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcHJvcGVydHkge1N0cmluZ30gbG9jYXRpb24gcGF0aCB0byB0aGUgbm9kZSAoZS5nLiBcImJvZHkvMC8xXCIpXG4gKiBAcHJvcGVydHkge09iamVjdH0gc2hvd1N0YXRlXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHNob3dTdGF0ZS5tb3VudGVkXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHNob3dTdGF0ZS5zaG93blxuICogQHByb3BlcnR5IHtOdW1iZXJ9IHNob3dTdGF0ZS5vcGFjaXR5XG4gKiBAcHJvcGVydHkge09iamVjdH0gb2Zmc2V0c1xuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IG9mZnNldHMubW91bnRQb2ludFxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IG9mZnNldHMuYWxpZ25cbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBvZmZzZXRzLm9yaWdpblxuICogQHByb3BlcnR5IHtPYmplY3R9IHZlY3RvcnNcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSB2ZWN0b3JzLnBvc2l0aW9uXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gdmVjdG9ycy5yb3RhdGlvblxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IHZlY3RvcnMuc2NhbGVcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBzaXplXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5zaXplTW9kZVxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IHNpemUucHJvcG9ydGlvbmFsXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5kaWZmZXJlbnRpYWxcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBzaXplLmFic29sdXRlXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5yZW5kZXJcbiAqL1xuTm9kZS5TcGVjID0gZnVuY3Rpb24gU3BlYyAoKSB7XG4gICAgdGhpcy5sb2NhdGlvbiA9IG51bGw7XG4gICAgdGhpcy5zaG93U3RhdGUgPSB7XG4gICAgICAgIG1vdW50ZWQ6IGZhbHNlLFxuICAgICAgICBzaG93bjogZmFsc2UsXG4gICAgICAgIG9wYWNpdHk6IDFcbiAgICB9O1xuICAgIHRoaXMub2Zmc2V0cyA9IHtcbiAgICAgICAgbW91bnRQb2ludDogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgYWxpZ246IG5ldyBGbG9hdDMyQXJyYXkoMyksXG4gICAgICAgIG9yaWdpbjogbmV3IEZsb2F0MzJBcnJheSgzKVxuICAgIH07XG4gICAgdGhpcy52ZWN0b3JzID0ge1xuICAgICAgICBwb3NpdGlvbjogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgcm90YXRpb246IG5ldyBGbG9hdDMyQXJyYXkoUVVBVCksXG4gICAgICAgIHNjYWxlOiBuZXcgRmxvYXQzMkFycmF5KE9ORVMpXG4gICAgfTtcbiAgICB0aGlzLnNpemUgPSB7XG4gICAgICAgIHNpemVNb2RlOiBuZXcgRmxvYXQzMkFycmF5KFtTaXplLlJFTEFUSVZFLCBTaXplLlJFTEFUSVZFLCBTaXplLlJFTEFUSVZFXSksXG4gICAgICAgIHByb3BvcnRpb25hbDogbmV3IEZsb2F0MzJBcnJheShPTkVTKSxcbiAgICAgICAgZGlmZmVyZW50aWFsOiBuZXcgRmxvYXQzMkFycmF5KDMpLFxuICAgICAgICBhYnNvbHV0ZTogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgcmVuZGVyOiBuZXcgRmxvYXQzMkFycmF5KDMpXG4gICAgfTtcbiAgICB0aGlzLlVJRXZlbnRzID0gW107XG59O1xuXG4vKipcbiAqIERldGVybWluZSB0aGUgbm9kZSdzIGxvY2F0aW9uIGluIHRoZSBzY2VuZSBncmFwaCBoaWVyYXJjaHkuXG4gKiBBIGxvY2F0aW9uIG9mIGBib2R5LzAvMWAgY2FuIGJlIGludGVycHJldGVkIGFzIHRoZSBmb2xsb3dpbmcgc2NlbmUgZ3JhcGhcbiAqIGhpZXJhcmNoeSAoaWdub3Jpbmcgc2libGluZ3Mgb2YgYW5jZXN0b3JzIGFuZCBhZGRpdGlvbmFsIGNoaWxkIG5vZGVzKTpcbiAqXG4gKiBgQ29udGV4dDpib2R5YCAtPiBgTm9kZTowYCAtPiBgTm9kZToxYCwgd2hlcmUgYE5vZGU6MWAgaXMgdGhlIG5vZGUgdGhlXG4gKiBgZ2V0TG9jYXRpb25gIG1ldGhvZCBoYXMgYmVlbiBpbnZva2VkIG9uLlxuICpcbiAqIEBtZXRob2QgZ2V0TG9jYXRpb25cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IGxvY2F0aW9uIChwYXRoKSwgZS5nLiBgYm9keS8wLzFgXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldExvY2F0aW9uID0gZnVuY3Rpb24gZ2V0TG9jYXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLmxvY2F0aW9uO1xufTtcblxuLyoqXG4gKiBAYWxpYXMgZ2V0SWRcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBwYXRoIG9mIHRoZSBOb2RlXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldElkID0gTm9kZS5wcm90b3R5cGUuZ2V0TG9jYXRpb247XG5cbi8qKlxuICogR2xvYmFsbHkgZGlzcGF0Y2hlcyB0aGUgZXZlbnQgdXNpbmcgdGhlIFNjZW5lJ3MgRGlzcGF0Y2guIEFsbCBub2RlcyB3aWxsXG4gKiByZWNlaXZlIHRoZSBkaXNwYXRjaGVkIGV2ZW50LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgICBFdmVudCB0eXBlLlxuICogQHBhcmFtICB7T2JqZWN0fSBwYXlsb2FkIEV2ZW50IG9iamVjdCB0byBiZSBkaXNwYXRjaGVkLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQgKGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzO1xuXG4gICAgd2hpbGUgKGN1cnJlbnQgIT09IGN1cnJlbnQuZ2V0UGFyZW50KCkpIHtcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnQuZ2V0UGFyZW50KCk7XG4gICAgfVxuXG4gICAgY3VycmVudC5nZXREaXNwYXRjaCgpLmRpc3BhdGNoKGV2ZW50LCBwYXlsb2FkKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIFRISVMgV0lMTCBCRSBERVBSSUNBVEVEXG5Ob2RlLnByb3RvdHlwZS5zZW5kRHJhd0NvbW1hbmQgPSBmdW5jdGlvbiBzZW5kRHJhd0NvbW1hbmQgKG1lc3NhZ2UpIHtcbiAgICB0aGlzLl9nbG9iYWxVcGRhdGVyLm1lc3NhZ2UobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZXMgdGhlIE5vZGUsIGluY2x1ZGluZyBhbGwgcHJldmlvdXNseSBhZGRlZCBjb21wb25lbnRzLlxuICpcbiAqIEBtZXRob2QgZ2V0VmFsdWVcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICBTZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBub2RlLCBpbmNsdWRpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHMuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gZ2V0VmFsdWUgKCkge1xuICAgIHZhciBudW1iZXJPZkNoaWxkcmVuID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xuICAgIHZhciBudW1iZXJPZkNvbXBvbmVudHMgPSB0aGlzLl9jb21wb25lbnRzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB2YXIgdmFsdWUgPSB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLnZhbHVlLmxvY2F0aW9uLFxuICAgICAgICBzcGVjOiB0aGlzLnZhbHVlLFxuICAgICAgICBjb21wb25lbnRzOiBuZXcgQXJyYXkobnVtYmVyT2ZDb21wb25lbnRzKSxcbiAgICAgICAgY2hpbGRyZW46IG5ldyBBcnJheShudW1iZXJPZkNoaWxkcmVuKVxuICAgIH07XG5cbiAgICBmb3IgKDsgaSA8IG51bWJlck9mQ2hpbGRyZW4gOyBpKyspXG4gICAgICAgIGlmICh0aGlzLl9jaGlsZHJlbltpXSAmJiB0aGlzLl9jaGlsZHJlbltpXS5nZXRWYWx1ZSlcbiAgICAgICAgICAgIHZhbHVlLmNoaWxkcmVuW2ldID0gdGhpcy5fY2hpbGRyZW5baV0uZ2V0VmFsdWUoKTtcblxuICAgIGZvciAoaSA9IDAgOyBpIDwgbnVtYmVyT2ZDb21wb25lbnRzIDsgaSsrKVxuICAgICAgICBpZiAodGhpcy5fY29tcG9uZW50c1tpXSAmJiB0aGlzLl9jb21wb25lbnRzW2ldLmdldFZhbHVlKVxuICAgICAgICAgICAgdmFsdWUuY29tcG9uZW50c1tpXSA9IHRoaXMuX2NvbXBvbmVudHNbaV0uZ2V0VmFsdWUoKTtcblxuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cbi8qKlxuICogU2ltaWxhciB0byBAe0BsaW5rIGdldFZhbHVlfSwgYnV0IHJldHVybnMgdGhlIGFjdHVhbCBcImNvbXB1dGVkXCIgdmFsdWUuIEUuZy5cbiAqIGEgcHJvcG9ydGlvbmFsIHNpemUgb2YgMC41IG1pZ2h0IHJlc29sdmUgaW50byBhIFwiY29tcHV0ZWRcIiBzaXplIG9mIDIwMHB4XG4gKiAoYXNzdW1pbmcgdGhlIHBhcmVudCBoYXMgYSB3aWR0aCBvZiA0MDBweCkuXG4gKlxuICogQG1ldGhvZCBnZXRDb21wdXRlZFZhbHVlXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSAgICAgU2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgbm9kZSwgaW5jbHVkaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbiwgZXhjbHVkaW5nIGNvbXBvbmVudHMuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldENvbXB1dGVkVmFsdWUgPSBmdW5jdGlvbiBnZXRDb21wdXRlZFZhbHVlICgpIHtcbiAgICB2YXIgbnVtYmVyT2ZDaGlsZHJlbiA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcblxuICAgIHZhciB2YWx1ZSA9IHtcbiAgICAgICAgbG9jYXRpb246IHRoaXMudmFsdWUubG9jYXRpb24sXG4gICAgICAgIGNvbXB1dGVkVmFsdWVzOiB0aGlzLl9jYWxjdWxhdGVkVmFsdWVzLFxuICAgICAgICBjaGlsZHJlbjogbmV3IEFycmF5KG51bWJlck9mQ2hpbGRyZW4pXG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IG51bWJlck9mQ2hpbGRyZW4gOyBpKyspXG4gICAgICAgIHZhbHVlLmNoaWxkcmVuW2ldID0gdGhpcy5fY2hpbGRyZW5baV0uZ2V0Q29tcHV0ZWRWYWx1ZSgpO1xuXG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYWxsIGNoaWxkcmVuIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogQG1ldGhvZCBnZXRDaGlsZHJlblxuICpcbiAqIEByZXR1cm4ge0FycmF5LjxOb2RlPn0gICBBbiBhcnJheSBvZiBjaGlsZHJlbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbiBnZXRDaGlsZHJlbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLiBVbm1vdW50ZWQgbm9kZXMgZG8gbm90IGhhdmUgYVxuICogcGFyZW50IG5vZGUuXG4gKlxuICogQG1ldGhvZCBnZXRQYXJlbnRcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSAgICAgICBQYXJlbnQgbm9kZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24gZ2V0UGFyZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xufTtcblxuLyoqXG4gKiBTY2hlZHVsZXMgdGhlIEB7QGxpbmsgdXBkYXRlfSBmdW5jdGlvbiBvZiB0aGUgbm9kZSB0byBiZSBpbnZva2VkIG9uIHRoZSBuZXh0XG4gKiBmcmFtZSAoaWYgbm8gdXBkYXRlIGR1cmluZyB0aGlzIGZyYW1lIGhhcyBiZWVuIHNjaGVkdWxlZCBhbHJlYWR5KS5cbiAqIElmIHRoZSBub2RlIGlzIGN1cnJlbnRseSBiZWluZyB1cGRhdGVkICh3aGljaCBtZWFucyBvbmUgb2YgdGhlIHJlcXVlc3RlcnNcbiAqIGludm9rZWQgcmVxdWVzdHNVcGRhdGUgd2hpbGUgYmVpbmcgdXBkYXRlZCBpdHNlbGYpLCBhbiB1cGRhdGUgd2lsbCBiZVxuICogc2NoZWR1bGVkIG9uIHRoZSBuZXh0IGZyYW1lLlxuICpcbiAqIEBtZXRob2QgcmVxdWVzdFVwZGF0ZVxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gcmVxdWVzdGVyICAgSWYgdGhlIHJlcXVlc3RlciBoYXMgYW4gYG9uVXBkYXRlYCBtZXRob2QsIGl0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgYmUgaW52b2tlZCBkdXJpbmcgdGhlIG5leHQgdXBkYXRlIHBoYXNlIG9mXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBub2RlLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVxdWVzdFVwZGF0ZSA9IGZ1bmN0aW9uIHJlcXVlc3RVcGRhdGUgKHJlcXVlc3Rlcikge1xuICAgIGlmICh0aGlzLl9pblVwZGF0ZSB8fCAhdGhpcy5pc01vdW50ZWQoKSlcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2socmVxdWVzdGVyKTtcbiAgICB0aGlzLl91cGRhdGVRdWV1ZS5wdXNoKHJlcXVlc3Rlcik7XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNjaGVkdWxlcyBhbiB1cGRhdGUgb24gdGhlIG5leHQgdGljay4gU2ltaWxhcmlseSB0byBAe0BsaW5rIHJlcXVlc3RVcGRhdGV9LFxuICogYHJlcXVlc3RVcGRhdGVPbk5leHRUaWNrYCBzY2hlZHVsZXMgdGhlIG5vZGUncyBgb25VcGRhdGVgIGZ1bmN0aW9uIHRvIGJlXG4gKiBpbnZva2VkIG9uIHRoZSBmcmFtZSBhZnRlciB0aGUgbmV4dCBpbnZvY2F0aW9uIG9uIHRoZSBub2RlJ3Mgb25VcGRhdGUgZnVuY3Rpb24uXG4gKlxuICogQG1ldGhvZCByZXF1ZXN0VXBkYXRlT25OZXh0VGlja1xuICpcbiAqIEBwYXJhbSAge09iamVjdH0gcmVxdWVzdGVyICAgSWYgdGhlIHJlcXVlc3RlciBoYXMgYW4gYG9uVXBkYXRlYCBtZXRob2QsIGl0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgYmUgaW52b2tlZCBkdXJpbmcgdGhlIG5leHQgdXBkYXRlIHBoYXNlIG9mXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBub2RlLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sgPSBmdW5jdGlvbiByZXF1ZXN0VXBkYXRlT25OZXh0VGljayAocmVxdWVzdGVyKSB7XG4gICAgdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlLnB1c2gocmVxdWVzdGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0IHRoZSBvYmplY3QgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIHRoaXMgbm9kZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZ2xvYmFsIHVwZGF0ZXIuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFVwZGF0ZXIgPSBmdW5jdGlvbiBnZXRVcGRhdGVyICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2xvYmFsVXBkYXRlcjtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBub2RlIGlzIG1vdW50ZWQuIFVubW91bnRlZCBub2RlcyBhcmUgZGV0YWNoZWQgZnJvbSB0aGUgc2NlbmVcbiAqIGdyYXBoLlxuICpcbiAqIEBtZXRob2QgaXNNb3VudGVkXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgQm9vbGVhbiBpbmRpY2F0aW5nIHdlYXRoZXIgdGhlIG5vZGUgaXMgbW91bnRlZCBvciBub3QuXG4gKi9cbk5vZGUucHJvdG90eXBlLmlzTW91bnRlZCA9IGZ1bmN0aW9uIGlzTW91bnRlZCAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2hvd1N0YXRlLm1vdW50ZWQ7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgbm9kZSBpcyB2aXNpYmxlIChcInNob3duXCIpLlxuICpcbiAqIEBtZXRob2QgaXNTaG93blxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgIEJvb2xlYW4gaW5kaWNhdGluZyB3ZWF0aGVyIHRoZSBub2RlIGlzIHZpc2libGVcbiAqICAgICAgICAgICAgICAgICAgICAgIChcInNob3duXCIpIG9yIG5vdC5cbiAqL1xuTm9kZS5wcm90b3R5cGUuaXNTaG93biA9IGZ1bmN0aW9uIGlzU2hvd24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNob3dTdGF0ZS5zaG93bjtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHJlbGF0aXZlIG9wYWNpdHkuXG4gKiBUaGUgb3BhY2l0eSBuZWVkcyB0byBiZSB3aXRoaW4gWzAsIDFdLCB3aGVyZSAwIGluZGljYXRlcyBhIGNvbXBsZXRlbHlcbiAqIHRyYW5zcGFyZW50LCB0aGVyZWZvcmUgaW52aXNpYmxlIG5vZGUsIHdoZXJlYXMgYW4gb3BhY2l0eSBvZiAxIG1lYW5zIHRoZVxuICogbm9kZSBpcyBjb21wbGV0ZWx5IHNvbGlkLlxuICpcbiAqIEBtZXRob2QgZ2V0T3BhY2l0eVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICBSZWxhdGl2ZSBvcGFjaXR5IG9mIHRoZSBub2RlLlxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRPcGFjaXR5ID0gZnVuY3Rpb24gZ2V0T3BhY2l0eSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2hvd1N0YXRlLm9wYWNpdHk7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5vZGUncyBwcmV2aW91c2x5IHNldCBtb3VudCBwb2ludC5cbiAqXG4gKiBAbWV0aG9kIGdldE1vdW50UG9pbnRcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBtb3VudCBwb2ludC5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0TW91bnRQb2ludCA9IGZ1bmN0aW9uIGdldE1vdW50UG9pbnQgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLm9mZnNldHMubW91bnRQb2ludDtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHByZXZpb3VzbHkgc2V0IGFsaWduLlxuICpcbiAqIEBtZXRob2QgZ2V0QWxpZ25cbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBhbGlnbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0QWxpZ24gPSBmdW5jdGlvbiBnZXRBbGlnbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUub2Zmc2V0cy5hbGlnbjtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHByZXZpb3VzbHkgc2V0IG9yaWdpbi5cbiAqXG4gKiBAbWV0aG9kIGdldE9yaWdpblxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gICBBbiBhcnJheSByZXByZXNlbnRpbmcgdGhlIG9yaWdpbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5vZmZzZXRzLm9yaWdpbjtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHByZXZpb3VzbHkgc2V0IHBvc2l0aW9uLlxuICpcbiAqIEBtZXRob2QgZ2V0UG9zaXRpb25cbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBwb3NpdGlvbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbiBnZXRQb3NpdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUudmVjdG9ycy5wb3NpdGlvbjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbm9kZSdzIGN1cnJlbnQgcm90YXRpb25cbiAqXG4gKiBAbWV0aG9kIGdldFJvdGF0aW9uXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhbiBhcnJheSBvZiBmb3VyIHZhbHVlcywgc2hvd2luZyB0aGUgcm90YXRpb24gYXMgYSBxdWF0ZXJuaW9uXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFJvdGF0aW9uID0gZnVuY3Rpb24gZ2V0Um90YXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnZlY3RvcnMucm90YXRpb247XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHNjYWxlIG9mIHRoZSBub2RlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYW4gYXJyYXkgc2hvd2luZyB0aGUgY3VycmVudCBzY2FsZSB2ZWN0b3JcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiBnZXRTY2FsZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUudmVjdG9ycy5zY2FsZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBzaXplIG1vZGUgb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhbiBhcnJheSBvZiBudW1iZXJzIHNob3dpbmcgdGhlIGN1cnJlbnQgc2l6ZSBtb2RlXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFNpemVNb2RlID0gZnVuY3Rpb24gZ2V0U2l6ZU1vZGUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUuc2l6ZU1vZGU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgcHJvcG9ydGlvbmFsIHNpemVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIHZlY3RvciAzIHNob3dpbmcgdGhlIGN1cnJlbnQgcHJvcG9ydGlvbmFsIHNpemVcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0UHJvcG9ydGlvbmFsU2l6ZSA9IGZ1bmN0aW9uIGdldFByb3BvcnRpb25hbFNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUucHJvcG9ydGlvbmFsO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBkaWZmZXJlbnRpYWwgc2l6ZSBvZiB0aGUgbm9kZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IGEgdmVjdG9yIDMgc2hvd2luZyB0aGUgY3VycmVudCBkaWZmZXJlbnRpYWwgc2l6ZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXREaWZmZXJlbnRpYWxTaXplID0gZnVuY3Rpb24gZ2V0RGlmZmVyZW50aWFsU2l6ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2l6ZS5kaWZmZXJlbnRpYWw7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGFic29sdXRlIHNpemUgb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIHZlY3RvciAzIHNob3dpbmcgdGhlIGN1cnJlbnQgYWJzb2x1dGUgc2l6ZSBvZiB0aGUgbm9kZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRBYnNvbHV0ZVNpemUgPSBmdW5jdGlvbiBnZXRBYnNvbHV0ZVNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUuYWJzb2x1dGU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgUmVuZGVyIFNpemUgb2YgdGhlIG5vZGUuIE5vdGUgdGhhdCB0aGUgcmVuZGVyIHNpemVcbiAqIGlzIGFzeW5jaHJvbm91cyAod2lsbCBhbHdheXMgYmUgb25lIGZyYW1lIGJlaGluZCkgYW5kIG5lZWRzIHRvIGJlIGV4cGxpY2l0ZWx5XG4gKiBjYWxjdWxhdGVkIGJ5IHNldHRpbmcgdGhlIHByb3BlciBzaXplIG1vZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYSB2ZWN0b3IgMyBzaG93aW5nIHRoZSBjdXJyZW50IHJlbmRlciBzaXplXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFJlbmRlclNpemUgPSBmdW5jdGlvbiBnZXRSZW5kZXJTaXplICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5zaXplLnJlbmRlcjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZXh0ZXJuYWwgc2l6ZSBvZiB0aGUgbm9kZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IGEgdmVjdG9yIDMgb2YgdGhlIGZpbmFsIGNhbGN1bGF0ZWQgc2lkZSBvZiB0aGUgbm9kZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24gZ2V0U2l6ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGN1bGF0ZWRWYWx1ZXMuc2l6ZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCB3b3JsZCB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIDE2IHZhbHVlIHRyYW5zZm9ybVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbiBnZXRUcmFuc2Zvcm0gKCkge1xuICAgIHJldHVybiB0aGlzLl9jYWxjdWxhdGVkVmFsdWVzLnRyYW5zZm9ybTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsaXN0IG9mIHRoZSBVSSBFdmVudHMgdGhhdCBhcmUgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFuIGFycmF5IG9mIHN0cmluZ3MgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IHN1YnNjcmliZWQgVUkgZXZlbnQgb2YgdGhpcyBub2RlXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFVJRXZlbnRzID0gZnVuY3Rpb24gZ2V0VUlFdmVudHMgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLlVJRXZlbnRzO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbmV3IGNoaWxkIHRvIHRoaXMgbm9kZS4gSWYgdGhpcyBtZXRob2QgaXMgY2FsbGVkIHdpdGggbm8gYXJndW1lbnQgaXQgd2lsbFxuICogY3JlYXRlIGEgbmV3IG5vZGUsIGhvd2V2ZXIgaXQgY2FuIGFsc28gYmUgY2FsbGVkIHdpdGggYW4gZXhpc3Rpbmcgbm9kZSB3aGljaCBpdCB3aWxsXG4gKiBhcHBlbmQgdG8gdGhlIG5vZGUgdGhhdCB0aGlzIG1ldGhvZCBpcyBiZWluZyBjYWxsZWQgb24uIFJldHVybnMgdGhlIG5ldyBvciBwYXNzZWQgaW4gbm9kZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOb2RlIHwgdm9pZH0gY2hpbGQgdGhlIG5vZGUgdG8gYXBwZW5kZWQgb3Igbm8gbm9kZSB0byBjcmVhdGUgYSBuZXcgbm9kZS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGUgYXBwZW5kZWQgbm9kZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbiBhZGRDaGlsZCAoY2hpbGQpIHtcbiAgICB2YXIgaW5kZXggPSBjaGlsZCA/IHRoaXMuX2NoaWxkcmVuLmluZGV4T2YoY2hpbGQpIDogLTE7XG4gICAgY2hpbGQgPSBjaGlsZCA/IGNoaWxkIDogbmV3IE5vZGUoKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLl9mcmVlZENoaWxkSW5kaWNpZXMubGVuZ3RoID8gdGhpcy5fZnJlZWRDaGlsZEluZGljaWVzLnBvcCgpIDogdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbltpbmRleF0gPSBjaGlsZDtcblxuICAgICAgICBpZiAodGhpcy5pc01vdW50ZWQoKSAmJiBjaGlsZC5vbk1vdW50KSB7XG4gICAgICAgICAgICB2YXIgbXlJZCA9IHRoaXMuZ2V0SWQoKTtcbiAgICAgICAgICAgIHZhciBjaGlsZElkID0gbXlJZCArICcvJyArIGluZGV4O1xuICAgICAgICAgICAgY2hpbGQub25Nb3VudCh0aGlzLCBjaGlsZElkKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgY2hpbGQgbm9kZSBmcm9tIGFub3RoZXIgbm9kZS4gVGhlIHBhc3NlZCBpbiBub2RlIG11c3QgYmVcbiAqIGEgY2hpbGQgb2YgdGhlIG5vZGUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgdXBvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOb2RlfSBjaGlsZCBub2RlIHRvIGJlIHJlbW92ZWRcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCB0aGUgbm9kZSB3YXMgc3VjY2Vzc2Z1bGx5IHJlbW92ZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbiByZW1vdmVDaGlsZCAoY2hpbGQpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jaGlsZHJlbi5pbmRleE9mKGNoaWxkKTtcbiAgICB2YXIgYWRkZWQgPSBpbmRleCAhPT0gLTE7XG4gICAgaWYgKGFkZGVkKSB7XG4gICAgICAgIHRoaXMuX2ZyZWVkQ2hpbGRJbmRpY2llcy5wdXNoKGluZGV4KTtcblxuICAgICAgICB0aGlzLl9jaGlsZHJlbltpbmRleF0gPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW91bnRlZCgpICYmIGNoaWxkLm9uRGlzbW91bnQpXG4gICAgICAgICAgICBjaGlsZC5vbkRpc21vdW50KCk7XG4gICAgfVxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbi8qKlxuICogRWFjaCBjb21wb25lbnQgY2FuIG9ubHkgYmUgYWRkZWQgb25jZSBwZXIgbm9kZS5cbiAqXG4gKiBAbWV0aG9kIGFkZENvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgICAgQW4gY29tcG9uZW50IHRvIGJlIGFkZGVkLlxuICogQHJldHVybiB7TnVtYmVyfSBpbmRleCAgICAgICBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIGNvbXBvbmVudCBoYXMgYmVlblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWdpc3RlcmVkLiBJbmRpY2VzIGFyZW4ndCBuZWNlc3NhcmlseVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zZWN1dGl2ZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuYWRkQ29tcG9uZW50ID0gZnVuY3Rpb24gYWRkQ29tcG9uZW50IChjb21wb25lbnQpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KTtcbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5fZnJlZWRDb21wb25lbnRJbmRpY2llcy5sZW5ndGggPyB0aGlzLl9mcmVlZENvbXBvbmVudEluZGljaWVzLnBvcCgpIDogdGhpcy5fY29tcG9uZW50cy5sZW5ndGg7XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50O1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW91bnRlZCgpICYmIGNvbXBvbmVudC5vbk1vdW50KVxuICAgICAgICAgICAgY29tcG9uZW50Lm9uTW91bnQodGhpcywgaW5kZXgpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzU2hvd24oKSAmJiBjb21wb25lbnQub25TaG93KVxuICAgICAgICAgICAgY29tcG9uZW50Lm9uU2hvdygpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRleDtcbn07XG5cbi8qKlxuICogQG1ldGhvZCAgZ2V0Q29tcG9uZW50XG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBpbmRleCAgIEluZGV4IGF0IHdoaWNoIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gcmVnc2l0ZXJlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICh1c2luZyBgTm9kZSNhZGRDb21wb25lbnRgKS5cbiAqIEByZXR1cm4geyp9ICAgICAgICAgICAgICBUaGUgY29tcG9uZW50IHJlZ2lzdGVyZWQgYXQgdGhlIHBhc3NlZCBpbiBpbmRleCAoaWZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBhbnkpLlxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRDb21wb25lbnQgPSBmdW5jdGlvbiBnZXRDb21wb25lbnQgKGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudHNbaW5kZXhdO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgcHJldmlvdXNseSB2aWEgQHtAbGluayBhZGRDb21wb25lbnR9IGFkZGVkIGNvbXBvbmVudC5cbiAqXG4gKiBAbWV0aG9kIHJlbW92ZUNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gY29tcG9uZW50ICAgQW4gY29tcG9uZW50IHRoYXQgaGFzIHByZXZpb3VzbHkgYmVlbiBhZGRlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2luZyBAe0BsaW5rIGFkZENvbXBvbmVudH0uXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5yZW1vdmVDb21wb25lbnQgPSBmdW5jdGlvbiByZW1vdmVDb21wb25lbnQgKGNvbXBvbmVudCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX2NvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5fZnJlZWRDb21wb25lbnRJbmRpY2llcy5wdXNoKGluZGV4KTtcbiAgICAgICAgaWYgKHRoaXMuaXNTaG93bigpICYmIGNvbXBvbmVudC5vbkhpZGUpXG4gICAgICAgICAgICBjb21wb25lbnQub25IaWRlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNNb3VudGVkKCkgJiYgY29tcG9uZW50Lm9uRGlzbW91bnQpXG4gICAgICAgICAgICBjb21wb25lbnQub25EaXNtb3VudCgpO1xuXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudHNbaW5kZXhdID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn07XG5cbi8qKlxuICogU3Vic2NyaWJlcyBhIG5vZGUgdG8gYSBVSSBFdmVudC4gQWxsIGNvbXBvbmVudHMgb24gdGhlIG5vZGVcbiAqIHdpbGwgaGF2ZSB0aGUgb3Bwb3J0dW5pdHkgdG8gYmVnaW4gbGlzdGVuaW5nIHRvIHRoYXQgZXZlbnRcbiAqIGFuZCBhbGVydGluZyB0aGUgc2NlbmUgZ3JhcGguXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgdGhlIG5hbWUgb2YgdGhlIGV2ZW50XG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUuYWRkVUlFdmVudCA9IGZ1bmN0aW9uIGFkZFVJRXZlbnQgKGV2ZW50TmFtZSkge1xuICAgIHZhciBVSUV2ZW50cyA9IHRoaXMuZ2V0VUlFdmVudHMoKTtcbiAgICB2YXIgY29tcG9uZW50cyA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGNvbXBvbmVudDtcblxuICAgIHZhciBhZGRlZCA9IFVJRXZlbnRzLmluZGV4T2YoZXZlbnROYW1lKSAhPT0gLTE7XG4gICAgaWYgKCFhZGRlZCkge1xuICAgICAgICBVSUV2ZW50cy5wdXNoKGV2ZW50TmFtZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb21wb25lbnRzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5vbkFkZFVJRXZlbnQpIGNvbXBvbmVudC5vbkFkZFVJRXZlbnQoZXZlbnROYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2QgZm9yIHRoZSBOb2RlIHRvIHJlcXVlc3QgYW4gdXBkYXRlIGZvciBpdHNlbGYuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlIHdoZXRoZXIgb3Igbm90IHRvIGZvcmNlIHRoZSB1cGRhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5fcmVxdWVzdFVwZGF0ZSA9IGZ1bmN0aW9uIF9yZXF1ZXN0VXBkYXRlIChmb3JjZSkge1xuICAgIGlmIChmb3JjZSB8fCAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgJiYgdGhpcy5fZ2xvYmFsVXBkYXRlcikpIHtcbiAgICAgICAgdGhpcy5fZ2xvYmFsVXBkYXRlci5yZXF1ZXN0VXBkYXRlKHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIHRvIHNldCBhbiBvcHRpb25hbCB2YWx1ZSBpbiBhbiBhcnJheSwgYW5kXG4gKiByZXF1ZXN0IGFuIHVwZGF0ZSBpZiB0aGlzIGNoYW5nZXMgdGhlIHZhbHVlIG9mIHRoZSBhcnJheS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVjIHRoZSBhcnJheSB0byBpbnNlcnQgdGhlIHZhbHVlIGludG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCB0aGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2YWx1ZVxuICogQHBhcmFtIHtBbnl9IHZhbCB0aGUgdmFsdWUgdG8gcG90ZW50aWFsbHkgaW5zZXJ0IChpZiBub3QgbnVsbCBvciB1bmRlZmluZWQpXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3QgYSBuZXcgdmFsdWUgd2FzIGluc2VydGVkLlxuICovXG5Ob2RlLnByb3RvdHlwZS5fdmVjT3B0aW9uYWxTZXQgPSBmdW5jdGlvbiBfdmVjT3B0aW9uYWxTZXQgKHZlYywgaW5kZXgsIHZhbCkge1xuICAgIGlmICh2YWwgIT0gbnVsbCAmJiB2ZWNbaW5kZXhdICE9PSB2YWwpIHtcbiAgICAgICAgdmVjW2luZGV4XSA9IHZhbDtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIFNob3dzIHRoZSBub2RlLCB3aGljaCBpcyB0byBzYXksIGNhbGxzIG9uU2hvdyBvbiBhbGwgb2YgdGhlXG4gKiBub2RlJ3MgY29tcG9uZW50cy4gUmVuZGVyYWJsZSBjb21wb25lbnRzIGNhbiB0aGVuIGlzc3VlIHRoZVxuICogZHJhdyBjb21tYW5kcyBuZWNlc3NhcnkgdG8gYmUgc2hvd24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cgKCkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICB0aGlzLnZhbHVlLnNob3dTdGF0ZS5zaG93biA9IHRydWU7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25TaG93KSBpdGVtLm9uU2hvdygpO1xuICAgIH1cblxuICAgIGkgPSAwO1xuICAgIGl0ZW1zID0gdGhpcy5fY2hpbGRyZW47XG4gICAgbGVuID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUGFyZW50U2hvdykgaXRlbS5vblBhcmVudFNob3coKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEhpZGVzIHRoZSBub2RlLCB3aGljaCBpcyB0byBzYXksIGNhbGxzIG9uSGlkZSBvbiBhbGwgb2YgdGhlXG4gKiBub2RlJ3MgY29tcG9uZW50cy4gUmVuZGVyYWJsZSBjb21wb25lbnRzIGNhbiB0aGVuIGlzc3VlXG4gKiB0aGUgZHJhdyBjb21tYW5kcyBuZWNlc3NhcnkgdG8gYmUgaGlkZGVuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIGhpZGUgKCkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICB0aGlzLnZhbHVlLnNob3dTdGF0ZS5zaG93biA9IGZhbHNlO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uSGlkZSkgaXRlbS5vbkhpZGUoKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBpdGVtcyA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGl0ZW1zLmxlbmd0aDtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudEhpZGUpIGl0ZW0ub25QYXJlbnRIaWRlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBhbGlnbiB2YWx1ZSBvZiB0aGUgbm9kZS4gV2lsbCBjYWxsIG9uQWxpZ25DaGFuZ2VcbiAqIG9uIGFsbCBvZiB0aGUgTm9kZSdzIGNvbXBvbmVudHMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IEFsaWduIHZhbHVlIGluIHRoZSB4IGRpbWVuc2lvbi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IEFsaWduIHZhbHVlIGluIHRoZSB5IGRpbWVuc2lvbi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IEFsaWduIHZhbHVlIGluIHRoZSB6IGRpbWVuc2lvbi5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldEFsaWduID0gZnVuY3Rpb24gc2V0QWxpZ24gKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUub2Zmc2V0cy5hbGlnbjtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIGlmICh6ICE9IG51bGwpIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsICh6IC0gMC41KSkgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbkFsaWduQ2hhbmdlKSBpdGVtLm9uQWxpZ25DaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIG1vdW50IHBvaW50IHZhbHVlIG9mIHRoZSBub2RlLiBXaWxsIGNhbGwgb25Nb3VudFBvaW50Q2hhbmdlXG4gKiBvbiBhbGwgb2YgdGhlIG5vZGUncyBjb21wb25lbnRzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBNb3VudFBvaW50IHZhbHVlIGluIHggZGltZW5zaW9uXG4gKiBAcGFyYW0ge051bWJlcn0geSBNb3VudFBvaW50IHZhbHVlIGluIHkgZGltZW5zaW9uXG4gKiBAcGFyYW0ge051bWJlcn0geiBNb3VudFBvaW50IHZhbHVlIGluIHogZGltZW5zaW9uXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRNb3VudFBvaW50ID0gZnVuY3Rpb24gc2V0TW91bnRQb2ludCAoeCwgeSwgeikge1xuICAgIHZhciB2ZWMzID0gdGhpcy52YWx1ZS5vZmZzZXRzLm1vdW50UG9pbnQ7XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBpZiAoeiAhPSBudWxsKSBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCAoeiAtIDAuNSkpIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25Nb3VudFBvaW50Q2hhbmdlKSBpdGVtLm9uTW91bnRQb2ludENoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgb3JpZ2luIHZhbHVlIG9mIHRoZSBub2RlLiBXaWxsIGNhbGwgb25PcmlnaW5DaGFuZ2VcbiAqIG9uIGFsbCBvZiB0aGUgbm9kZSdzIGNvbXBvbmVudHMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IE9yaWdpbiB2YWx1ZSBpbiB4IGRpbWVuc2lvblxuICogQHBhcmFtIHtOdW1iZXJ9IHkgT3JpZ2luIHZhbHVlIGluIHkgZGltZW5zaW9uXG4gKiBAcGFyYW0ge051bWJlcn0geiBPcmlnaW4gdmFsdWUgaW4geiBkaW1lbnNpb25cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldE9yaWdpbiA9IGZ1bmN0aW9uIHNldE9yaWdpbiAoeCwgeSwgeikge1xuICAgIHZhciB2ZWMzID0gdGhpcy52YWx1ZS5vZmZzZXRzLm9yaWdpbjtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIGlmICh6ICE9IG51bGwpIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsICh6IC0gMC41KSkgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbk9yaWdpbkNoYW5nZSkgaXRlbS5vbk9yaWdpbkNoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIG5vZGUuIFdpbGwgY2FsbCBvblBvc2l0aW9uQ2hhbmdlXG4gKiBvbiBhbGwgb2YgdGhlIG5vZGUncyBjb21wb25lbnRzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBQb3NpdGlvbiBpbiB4XG4gKiBAcGFyYW0ge051bWJlcn0geSBQb3NpdGlvbiBpbiB5XG4gKiBAcGFyYW0ge051bWJlcn0geiBQb3NpdGlvbiBpbiB6XG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uIHNldFBvc2l0aW9uICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnZlY3RvcnMucG9zaXRpb247XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCB6KSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUG9zaXRpb25DaGFuZ2UpIGl0ZW0ub25Qb3NpdGlvbkNoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSByb3RhdGlvbiBvZiB0aGUgbm9kZS4gV2lsbCBjYWxsIG9uUm90YXRpb25DaGFuZ2VcbiAqIG9uIGFsbCBvZiB0aGUgbm9kZSdzIGNvbXBvbmVudHMuIFRoaXMgbWV0aG9kIHRha2VzIGVpdGhlclxuICogRXVsZXIgYW5nbGVzIG9yIGEgcXVhdGVybmlvbi4gSWYgdGhlIGZvdXJ0aCBhcmd1bWVudCBpcyB1bmRlZmluZWRcbiAqIEV1bGVyIGFuZ2xlcyBhcmUgYXNzdW1lZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggRWl0aGVyIHRoZSByb3RhdGlvbiBhcm91bmQgdGhlIHggYXhpcyBvciB0aGUgbWFnbml0dWRlIGluIHggb2YgdGhlIGF4aXMgb2Ygcm90YXRpb24uXG4gKiBAcGFyYW0ge051bWJlcn0geSBFaXRoZXIgdGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeSBheGlzIG9yIHRoZSBtYWduaXR1ZGUgaW4geSBvZiB0aGUgYXhpcyBvZiByb3RhdGlvbi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IEVpdGhlciB0aGUgcm90YXRpb24gYXJvdW5kIHRoZSB6IGF4aXMgb3IgdGhlIG1hZ25pdHVkZSBpbiB6IG9mIHRoZSBheGlzIG9mIHJvdGF0aW9uLlxuICogQHBhcmFtIHtOdW1iZXJ8dW5kZWZpbmVkfSB3IHRoZSBhbW91bnQgb2Ygcm90YXRpb24gYXJvdW5kIHRoZSBheGlzIG9mIHJvdGF0aW9uLCBpZiBhIHF1YXRlcm5pb24gaXMgc3BlY2lmaWVkLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24gc2V0Um90YXRpb24gKHgsIHksIHosIHcpIHtcbiAgICB2YXIgcXVhdCA9IHRoaXMudmFsdWUudmVjdG9ycy5yb3RhdGlvbjtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG4gICAgdmFyIHF4LCBxeSwgcXosIHF3O1xuXG4gICAgaWYgKHcgIT0gbnVsbCkge1xuICAgICAgICBxeCA9IHg7XG4gICAgICAgIHF5ID0geTtcbiAgICAgICAgcXogPSB6O1xuICAgICAgICBxdyA9IHc7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlclggPSBudWxsO1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXJZID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyWiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCB8fCB5ID09IG51bGwgfHwgeiA9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGFzdEV1bGVyKSB7XG4gICAgICAgICAgICAgICAgeCA9IHggPT0gbnVsbCA/IHRoaXMuX2xhc3RFdWxlclggOiB4O1xuICAgICAgICAgICAgICAgIHkgPSB5ID09IG51bGwgPyB0aGlzLl9sYXN0RXVsZXJZIDogeTtcbiAgICAgICAgICAgICAgICB6ID0geiA9PSBudWxsID8gdGhpcy5fbGFzdEV1bGVyWiA6IHo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc3AgPSAtMiAqIChxdWF0WzFdICogcXVhdFsyXSAtIHF1YXRbM10gKiBxdWF0WzBdKTtcblxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzcCkgPiAwLjk5OTk5KSB7XG4gICAgICAgICAgICAgICAgICAgIHkgPSB5ID09IG51bGwgPyBNYXRoLlBJICogMC41ICogc3AgOiB5O1xuICAgICAgICAgICAgICAgICAgICB4ID0geCA9PSBudWxsID8gTWF0aC5hdGFuMigtcXVhdFswXSAqIHF1YXRbMl0gKyBxdWF0WzNdICogcXVhdFsxXSwgMC41IC0gcXVhdFsxXSAqIHF1YXRbMV0gLSBxdWF0WzJdICogcXVhdFsyXSkgOiB4O1xuICAgICAgICAgICAgICAgICAgICB6ID0geiA9PSBudWxsID8gMCA6IHo7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB5ID0geSA9PSBudWxsID8gTWF0aC5hc2luKHNwKSA6IHk7XG4gICAgICAgICAgICAgICAgICAgIHggPSB4ID09IG51bGwgPyBNYXRoLmF0YW4yKHF1YXRbMF0gKiBxdWF0WzJdICsgcXVhdFszXSAqIHF1YXRbMV0sIDAuNSAtIHF1YXRbMF0gKiBxdWF0WzBdIC0gcXVhdFsxXSAqIHF1YXRbMV0pIDogeDtcbiAgICAgICAgICAgICAgICAgICAgeiA9IHogPT0gbnVsbCA/IE1hdGguYXRhbjIocXVhdFswXSAqIHF1YXRbMV0gKyBxdWF0WzNdICogcXVhdFsyXSwgMC41IC0gcXVhdFswXSAqIHF1YXRbMF0gLSBxdWF0WzJdICogcXVhdFsyXSkgOiB6O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoeCA9IHggKiAwLjU7XG4gICAgICAgIHZhciBoeSA9IHkgKiAwLjU7XG4gICAgICAgIHZhciBoeiA9IHogKiAwLjU7XG5cbiAgICAgICAgdmFyIHN4ID0gTWF0aC5zaW4oaHgpO1xuICAgICAgICB2YXIgc3kgPSBNYXRoLnNpbihoeSk7XG4gICAgICAgIHZhciBzeiA9IE1hdGguc2luKGh6KTtcbiAgICAgICAgdmFyIGN4ID0gTWF0aC5jb3MoaHgpO1xuICAgICAgICB2YXIgY3kgPSBNYXRoLmNvcyhoeSk7XG4gICAgICAgIHZhciBjeiA9IE1hdGguY29zKGh6KTtcblxuICAgICAgICB2YXIgc3lzeiA9IHN5ICogc3o7XG4gICAgICAgIHZhciBjeXN6ID0gY3kgKiBzejtcbiAgICAgICAgdmFyIHN5Y3ogPSBzeSAqIGN6O1xuICAgICAgICB2YXIgY3ljeiA9IGN5ICogY3o7XG5cbiAgICAgICAgcXggPSBzeCAqIGN5Y3ogKyBjeCAqIHN5c3o7XG4gICAgICAgIHF5ID0gY3ggKiBzeWN6IC0gc3ggKiBjeXN6O1xuICAgICAgICBxeiA9IGN4ICogY3lzeiArIHN4ICogc3ljejtcbiAgICAgICAgcXcgPSBjeCAqIGN5Y3ogLSBzeCAqIHN5c3o7XG5cbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyWCA9IHg7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlclkgPSB5O1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXJaID0gejtcbiAgICB9XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldChxdWF0LCAwLCBxeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHF1YXQsIDEsIHF5KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQocXVhdCwgMiwgcXopIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldChxdWF0LCAzLCBxdykgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHF1YXRbMF07XG4gICAgICAgIHkgPSBxdWF0WzFdO1xuICAgICAgICB6ID0gcXVhdFsyXTtcbiAgICAgICAgdyA9IHF1YXRbM107XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25Sb3RhdGlvbkNoYW5nZSkgaXRlbS5vblJvdGF0aW9uQ2hhbmdlKHgsIHksIHosIHcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBzY2FsZSBvZiB0aGUgbm9kZS4gVGhlIGRlZmF1bHQgdmFsdWUgaXMgMSBpbiBhbGwgZGltZW5zaW9ucy5cbiAqIFRoZSBub2RlJ3MgY29tcG9uZW50cyB3aWxsIGhhdmUgb25TY2FsZUNoYW5nZWQgY2FsbGVkIG9uIHRoZW0uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFNjYWxlIHZhbHVlIGluIHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFNjYWxlIHZhbHVlIGluIHlcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFNjYWxlIHZhbHVlIGluIHpcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gc2V0U2NhbGUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUudmVjdG9ycy5zY2FsZTtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25TY2FsZUNoYW5nZSkgaXRlbS5vblNjYWxlQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgb3BhY2l0eSBvZiB0aGlzIG5vZGUuIEFsbCBvZiB0aGUgbm9kZSdzXG4gKiBjb21wb25lbnRzIHdpbGwgaGF2ZSBvbk9wYWNpdHlDaGFuZ2UgY2FsbGVkIG9uIHRoZW0vXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgVmFsdWUgb2YgdGhlIG9wYWNpdHkuIDEgaXMgdGhlIGRlZmF1bHQuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRPcGFjaXR5ID0gZnVuY3Rpb24gc2V0T3BhY2l0eSAodmFsKSB7XG4gICAgaWYgKHZhbCAhPT0gdGhpcy52YWx1ZS5zaG93U3RhdGUub3BhY2l0eSkge1xuICAgICAgICB0aGlzLnZhbHVlLnNob3dTdGF0ZS5vcGFjaXR5ID0gdmFsO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcblxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbk9wYWNpdHlDaGFuZ2UpIGl0ZW0ub25PcGFjaXR5Q2hhbmdlKHZhbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHNpemUgbW9kZSBiZWluZyB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgbm9kZXMgZmluYWwgd2lkdGgsIGhlaWdodFxuICogYW5kIGRlcHRoLlxuICogU2l6ZSBtb2RlcyBhcmUgYSB3YXkgdG8gZGVmaW5lIHRoZSB3YXkgdGhlIG5vZGUncyBzaXplIGlzIGJlaW5nIGNhbGN1bGF0ZWQuXG4gKiBTaXplIG1vZGVzIGFyZSBlbnVtcyBzZXQgb24gdGhlIEB7QGxpbmsgU2l6ZX0gY29uc3RydWN0b3IgKGFuZCBhbGlhc2VkIG9uXG4gKiB0aGUgTm9kZSkuXG4gKlxuICogQGV4YW1wbGVcbiAqIG5vZGUuc2V0U2l6ZU1vZGUoTm9kZS5SRUxBVElWRV9TSVpFLCBOb2RlLkFCU09MVVRFX1NJWkUsIE5vZGUuQUJTT0xVVEVfU0laRSk7XG4gKiAvLyBJbnN0ZWFkIG9mIG51bGwsIGFueSBwcm9wb3Jpb25hbCBoZWlnaHQgb3IgZGVwdGggY2FuIGJlIHBhc3NlZCBpbiwgc2luY2VcbiAqIC8vIGl0IHdvdWxkIGJlIGlnbm9yZWQgaW4gYW55IGNhc2UuXG4gKiBub2RlLnNldFByb3BvcnRpb25hbFNpemUoMC41LCBudWxsLCBudWxsKTtcbiAqIG5vZGUuc2V0QWJzb2x1dGVTaXplKG51bGwsIDEwMCwgMjAwKTtcbiAqXG4gKiBAbWV0aG9kIHNldFNpemVNb2RlXG4gKlxuICogQHBhcmFtIHtTaXplTW9kZX0geCAgICBUaGUgc2l6ZSBtb2RlIGJlaW5nIHVzZWQgZm9yIGRldGVybWluaW5nIHRoZSBzaXplIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHggZGlyZWN0aW9uIChcIndpZHRoXCIpLlxuICogQHBhcmFtIHtTaXplTW9kZX0geSAgICBUaGUgc2l6ZSBtb2RlIGJlaW5nIHVzZWQgZm9yIGRldGVybWluaW5nIHRoZSBzaXplIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHkgZGlyZWN0aW9uIChcImhlaWdodFwiKS5cbiAqIEBwYXJhbSB7U2l6ZU1vZGV9IHogICAgVGhlIHNpemUgbW9kZSBiZWluZyB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgc2l6ZSBpblxuICogICAgICAgICAgICAgICAgICAgICAgICB6IGRpcmVjdGlvbiAoXCJkZXB0aFwiKS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFNpemVNb2RlID0gZnVuY3Rpb24gc2V0U2l6ZU1vZGUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUuc2l6ZS5zaXplTW9kZTtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBpZiAoeCAhPSBudWxsKSBwcm9wb2dhdGUgPSB0aGlzLl9yZXNvbHZlU2l6ZU1vZGUodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIGlmICh5ICE9IG51bGwpIHByb3BvZ2F0ZSA9IHRoaXMuX3Jlc29sdmVTaXplTW9kZSh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgaWYgKHogIT0gbnVsbCkgcHJvcG9nYXRlID0gdGhpcy5fcmVzb2x2ZVNpemVNb2RlKHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25TaXplTW9kZUNoYW5nZSkgaXRlbS5vblNpemVNb2RlQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBIHByb3RlY3RlZCBtZXRob2QgdGhhdCByZXNvbHZlcyBzdHJpbmcgcmVwcmVzZW50YXRpb25zIG9mIHNpemUgbW9kZVxuICogdG8gbnVtZXJpYyB2YWx1ZXMgYW5kIGFwcGxpZXMgdGhlbS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVjIHRoZSBhcnJheSB0byB3cml0ZSBzaXplIG1vZGUgdG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCB0aGUgaW5kZXggdG8gd3JpdGUgdG8gaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbCB0aGUgdmFsdWUgdG8gd3JpdGVcbiAqXG4gKiBAcmV0dXJuIHtCb29sfSB3aGV0aGVyIG9yIG5vdCB0aGUgc2l6ZW1vZGUgaGFzIGJlZW4gY2hhbmdlZCBmb3IgdGhpcyBpbmRleC5cbiAqL1xuTm9kZS5wcm90b3R5cGUuX3Jlc29sdmVTaXplTW9kZSA9IGZ1bmN0aW9uIF9yZXNvbHZlU2l6ZU1vZGUgKHZlYywgaW5kZXgsIHZhbCkge1xuICAgIGlmICh2YWwuY29uc3RydWN0b3IgPT09IFN0cmluZykge1xuICAgICAgICBzd2l0Y2ggKHZhbC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBjYXNlICdyZWxhdGl2ZSc6XG4gICAgICAgICAgICBjYXNlICdkZWZhdWx0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjLCBpbmRleCwgMCk7XG4gICAgICAgICAgICBjYXNlICdhYnNvbHV0ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYywgaW5kZXgsIDEpO1xuICAgICAgICAgICAgY2FzZSAncmVuZGVyJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjLCBpbmRleCwgMik7XG4gICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gc2l6ZSBtb2RlOiAnICsgdmFsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHJldHVybiB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMsIGluZGV4LCB2YWwpO1xufTtcblxuLyoqXG4gKiBBIHByb3BvcnRpb25hbCBzaXplIGRlZmluZXMgdGhlIG5vZGUncyBkaW1lbnNpb25zIHJlbGF0aXZlIHRvIGl0cyBwYXJlbnRzXG4gKiBmaW5hbCBzaXplLlxuICogUHJvcG9ydGlvbmFsIHNpemVzIG5lZWQgdG8gYmUgd2l0aGluIHRoZSByYW5nZSBvZiBbMCwgMV0uXG4gKlxuICogQG1ldGhvZCBzZXRQcm9wb3J0aW9uYWxTaXplXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggICAgeC1TaXplIGluIHBpeGVscyAoXCJ3aWR0aFwiKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5ICAgIHktU2l6ZSBpbiBwaXhlbHMgKFwiaGVpZ2h0XCIpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHogICAgei1TaXplIGluIHBpeGVscyAoXCJkZXB0aFwiKS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFByb3BvcnRpb25hbFNpemUgPSBmdW5jdGlvbiBzZXRQcm9wb3J0aW9uYWxTaXplICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnNpemUucHJvcG9ydGlvbmFsO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgeikgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblByb3BvcnRpb25hbFNpemVDaGFuZ2UpIGl0ZW0ub25Qcm9wb3J0aW9uYWxTaXplQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEaWZmZXJlbnRpYWwgc2l6aW5nIGNhbiBiZSB1c2VkIHRvIGFkZCBvciBzdWJ0cmFjdCBhbiBhYnNvbHV0ZSBzaXplIGZyb20gYVxuICogb3RoZXJ3aXNlIHByb3BvcnRpb25hbGx5IHNpemVkIG5vZGUuXG4gKiBFLmcuIGEgZGlmZmVyZW50aWFsIHdpZHRoIG9mIGAtMTBgIGFuZCBhIHByb3BvcnRpb25hbCB3aWR0aCBvZiBgMC41YCBpc1xuICogYmVpbmcgaW50ZXJwcmV0ZWQgYXMgc2V0dGluZyB0aGUgbm9kZSdzIHNpemUgdG8gNTAlIG9mIGl0cyBwYXJlbnQncyB3aWR0aFxuICogKm1pbnVzKiAxMCBwaXhlbHMuXG4gKlxuICogQG1ldGhvZCBzZXREaWZmZXJlbnRpYWxTaXplXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggICAgeC1TaXplIHRvIGJlIGFkZGVkIHRvIHRoZSByZWxhdGl2ZWx5IHNpemVkIG5vZGUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgIHBpeGVscyAoXCJ3aWR0aFwiKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5ICAgIHktU2l6ZSB0byBiZSBhZGRlZCB0byB0aGUgcmVsYXRpdmVseSBzaXplZCBub2RlIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICBwaXhlbHMgKFwiaGVpZ2h0XCIpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHogICAgei1TaXplIHRvIGJlIGFkZGVkIHRvIHRoZSByZWxhdGl2ZWx5IHNpemVkIG5vZGUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgIHBpeGVscyAoXCJkZXB0aFwiKS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldERpZmZlcmVudGlhbFNpemUgPSBmdW5jdGlvbiBzZXREaWZmZXJlbnRpYWxTaXplICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnNpemUuZGlmZmVyZW50aWFsO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgeikgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbkRpZmZlcmVudGlhbFNpemVDaGFuZ2UpIGl0ZW0ub25EaWZmZXJlbnRpYWxTaXplQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBub2RlcyBzaXplIGluIHBpeGVscywgaW5kZXBlbmRlbnQgb2YgaXRzIHBhcmVudC5cbiAqXG4gKiBAbWV0aG9kIHNldEFic29sdXRlU2l6ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4ICAgIHgtU2l6ZSBpbiBwaXhlbHMgKFwid2lkdGhcIikuXG4gKiBAcGFyYW0ge051bWJlcn0geSAgICB5LVNpemUgaW4gcGl4ZWxzIChcImhlaWdodFwiKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6ICAgIHotU2l6ZSBpbiBwaXhlbHMgKFwiZGVwdGhcIikuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRBYnNvbHV0ZVNpemUgPSBmdW5jdGlvbiBzZXRBYnNvbHV0ZVNpemUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUuc2l6ZS5hYnNvbHV0ZTtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25BYnNvbHV0ZVNpemVDaGFuZ2UpIGl0ZW0ub25BYnNvbHV0ZVNpemVDaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIGZvciBhbGVydGluZyBhbGwgY29tcG9uZW50cyBhbmQgY2hpbGRyZW4gdGhhdFxuICogdGhpcyBub2RlJ3MgdHJhbnNmb3JtIGhhcyBjaGFuZ2VkLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gdHJhbnNmb3JtIFRoZSB0cmFuc2Zvcm0gdGhhdCBoYXMgY2hhbmdlZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLl90cmFuc2Zvcm1DaGFuZ2VkID0gZnVuY3Rpb24gX3RyYW5zZm9ybUNoYW5nZWQgKHRyYW5zZm9ybSkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25UcmFuc2Zvcm1DaGFuZ2UpIGl0ZW0ub25UcmFuc2Zvcm1DaGFuZ2UodHJhbnNmb3JtKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBpdGVtcyA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGl0ZW1zLmxlbmd0aDtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudFRyYW5zZm9ybUNoYW5nZSkgaXRlbS5vblBhcmVudFRyYW5zZm9ybUNoYW5nZSh0cmFuc2Zvcm0pO1xuICAgIH1cbn07XG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2QgZm9yIGFsZXJ0aW5nIGFsbCBjb21wb25lbnRzIGFuZCBjaGlsZHJlbiB0aGF0XG4gKiB0aGlzIG5vZGUncyBzaXplIGhhcyBjaGFuZ2VkLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gc2l6ZSB0aGUgc2l6ZSB0aGF0IGhhcyBjaGFuZ2VkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUuX3NpemVDaGFuZ2VkID0gZnVuY3Rpb24gX3NpemVDaGFuZ2VkIChzaXplKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBpdGVtcyA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblNpemVDaGFuZ2UpIGl0ZW0ub25TaXplQ2hhbmdlKHNpemUpO1xuICAgIH1cblxuICAgIGkgPSAwO1xuICAgIGl0ZW1zID0gdGhpcy5fY2hpbGRyZW47XG4gICAgbGVuID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUGFyZW50U2l6ZUNoYW5nZSkgaXRlbS5vblBhcmVudFNpemVDaGFuZ2Uoc2l6ZSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBNZXRob2QgZm9yIGdldHRpbmcgdGhlIGN1cnJlbnQgZnJhbWUuIFdpbGwgYmUgZGVwcmljYXRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBjdXJyZW50IGZyYW1lXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldEZyYW1lID0gZnVuY3Rpb24gZ2V0RnJhbWUgKCkge1xuICAgIHJldHVybiB0aGlzLl9nbG9iYWxVcGRhdGVyLmdldEZyYW1lKCk7XG59O1xuXG4vKipcbiAqIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIGNvbXBvbmVudHMgY3VycmVudGx5IGF0dGFjaGVkIHRvIHRoaXNcbiAqIG5vZGUuXG4gKlxuICogQG1ldGhvZCBnZXRDb21wb25lbnRzXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGxpc3Qgb2YgY29tcG9uZW50cy5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50cyA9IGZ1bmN0aW9uIGdldENvbXBvbmVudHMgKCkge1xuICAgIHJldHVybiB0aGlzLl9jb21wb25lbnRzO1xufTtcblxuLyoqXG4gKiBFbnRlcnMgdGhlIG5vZGUncyB1cGRhdGUgcGhhc2Ugd2hpbGUgdXBkYXRpbmcgaXRzIG93biBzcGVjIGFuZCB1cGRhdGluZyBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZVxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gdGltZSAgICBoaWdoLXJlc29sdXRpb24gdGltc3RhbXAsIHVzdWFsbHkgcmV0cmlldmVkIHVzaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUgKHRpbWUpe1xuICAgIHRoaXMuX2luVXBkYXRlID0gdHJ1ZTtcbiAgICB2YXIgbmV4dFF1ZXVlID0gdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlO1xuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3VwZGF0ZVF1ZXVlO1xuICAgIHZhciBpdGVtO1xuXG4gICAgd2hpbGUgKG5leHRRdWV1ZS5sZW5ndGgpIHF1ZXVlLnVuc2hpZnQobmV4dFF1ZXVlLnBvcCgpKTtcblxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgaXRlbSA9IHRoaXMuX2NvbXBvbmVudHNbcXVldWUuc2hpZnQoKV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25VcGRhdGUpIGl0ZW0ub25VcGRhdGUodGltZSk7XG4gICAgfVxuXG4gICAgdmFyIG15U2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpO1xuICAgIHZhciBteVRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNmb3JtKCk7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50KCk7XG4gICAgdmFyIHBhcmVudFNpemUgPSBwYXJlbnQuZ2V0U2l6ZSgpO1xuICAgIHZhciBwYXJlbnRUcmFuc2Zvcm0gPSBwYXJlbnQuZ2V0VHJhbnNmb3JtKCk7XG4gICAgdmFyIHNpemVDaGFuZ2VkID0gU0laRV9QUk9DRVNTT1IuZnJvbVNwZWNXaXRoUGFyZW50KHBhcmVudFNpemUsIHRoaXMsIG15U2l6ZSk7XG5cbiAgICB2YXIgdHJhbnNmb3JtQ2hhbmdlZCA9IFRSQU5TRk9STV9QUk9DRVNTT1IuZnJvbVNwZWNXaXRoUGFyZW50KHBhcmVudFRyYW5zZm9ybSwgdGhpcy52YWx1ZSwgbXlTaXplLCBwYXJlbnRTaXplLCBteVRyYW5zZm9ybSk7XG4gICAgaWYgKHRyYW5zZm9ybUNoYW5nZWQpIHRoaXMuX3RyYW5zZm9ybUNoYW5nZWQobXlUcmFuc2Zvcm0pO1xuICAgIGlmIChzaXplQ2hhbmdlZCkgdGhpcy5fc2l6ZUNoYW5nZWQobXlTaXplKTtcblxuICAgIHRoaXMuX2luVXBkYXRlID0gZmFsc2U7XG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICAgIC8vIGxhc3QgdXBkYXRlXG4gICAgICAgIHRoaXMuX3BhcmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMudmFsdWUubG9jYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLl9nbG9iYWxVcGRhdGVyID0gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5fbmV4dFVwZGF0ZVF1ZXVlLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9nbG9iYWxVcGRhdGVyLnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrKHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1vdW50cyB0aGUgbm9kZSBhbmQgdGhlcmVmb3JlIGl0cyBzdWJ0cmVlIGJ5IHNldHRpbmcgaXQgYXMgYSBjaGlsZCBvZiB0aGVcbiAqIHBhc3NlZCBpbiBwYXJlbnQuXG4gKlxuICogQG1ldGhvZCBtb3VudFxuICpcbiAqIEBwYXJhbSAge05vZGV9IHBhcmVudCAgICBwYXJlbnQgbm9kZVxuICogQHBhcmFtICB7U3RyaW5nfSBteUlkICAgIHBhdGggdG8gbm9kZSAoZS5nLiBgYm9keS8wLzFgKVxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUubW91bnQgPSBmdW5jdGlvbiBtb3VudCAocGFyZW50LCBteUlkKSB7XG4gICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHJldHVybiB0aGlzO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIHZhciBpdGVtO1xuXG4gICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIgPSBwYXJlbnQuZ2V0VXBkYXRlcigpO1xuICAgIHRoaXMudmFsdWUubG9jYXRpb24gPSBteUlkO1xuICAgIHRoaXMudmFsdWUuc2hvd1N0YXRlLm1vdW50ZWQgPSB0cnVlO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25Nb3VudCkgaXRlbS5vbk1vdW50KHRoaXMsIGkpO1xuICAgIH1cblxuICAgIGkgPSAwO1xuICAgIGxpc3QgPSB0aGlzLl9jaGlsZHJlbjtcbiAgICBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudE1vdW50KSBpdGVtLm9uUGFyZW50TW91bnQodGhpcywgbXlJZCwgaSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEaXNtb3VudHMgKGRldGFjaGVzKSB0aGUgbm9kZSBmcm9tIHRoZSBzY2VuZSBncmFwaCBieSByZW1vdmluZyBpdCBhcyBhXG4gKiBjaGlsZCBvZiBpdHMgcGFyZW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLmRpc21vdW50ID0gZnVuY3Rpb24gZGlzbW91bnQgKCkge1xuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkgcmV0dXJuIHRoaXM7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICB0aGlzLnZhbHVlLnNob3dTdGF0ZS5tb3VudGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9wYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbkRpc21vdW50KSBpdGVtLm9uRGlzbW91bnQoKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBsaXN0ID0gdGhpcy5fY2hpbGRyZW47XG4gICAgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25QYXJlbnREaXNtb3VudCkgaXRlbS5vblBhcmVudERpc21vdW50KCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYnkgdGhlIHBhcmVudCBhcyBzb29uIGFzIHRoZSBwYXJlbnQgaXNcbiAqIGJlaW5nIG1vdW50ZWQuXG4gKlxuICogQG1ldGhvZCBvblBhcmVudE1vdW50XG4gKlxuICogQHBhcmFtICB7Tm9kZX0gcGFyZW50ICAgICAgICBUaGUgcGFyZW50IG5vZGUuXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHBhcmVudElkICAgIFRoZSBwYXJlbnQgaWQgKHBhdGggdG8gcGFyZW50KS5cbiAqIEBwYXJhbSAge051bWJlcn0gaW5kZXggICAgICAgSWQgdGhlIG5vZGUgc2hvdWxkIGJlIG1vdW50ZWQgdG8uXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vblBhcmVudE1vdW50ID0gZnVuY3Rpb24gb25QYXJlbnRNb3VudCAocGFyZW50LCBwYXJlbnRJZCwgaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5tb3VudChwYXJlbnQsIHBhcmVudElkICsgJy8nICsgaW5kZXgpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBpbnZva2VkIGJ5IHRoZSBwYXJlbnQgYXMgc29vbiBhcyB0aGUgcGFyZW50IGlzIGJlaW5nXG4gKiB1bm1vdW50ZWQuXG4gKlxuICogQG1ldGhvZCBvblBhcmVudERpc21vdW50XG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vblBhcmVudERpc21vdW50ID0gZnVuY3Rpb24gb25QYXJlbnREaXNtb3VudCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzbW91bnQoKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGNhbGxlZCBpbiBvcmRlciB0byBkaXNwYXRjaCBhbiBldmVudCB0byB0aGUgbm9kZSBhbmQgYWxsIGl0c1xuICogY29tcG9uZW50cy4gTm90ZSB0aGF0IHRoaXMgZG9lc24ndCByZWN1cnNlIHRoZSBzdWJ0cmVlLlxuICpcbiAqIEBtZXRob2QgcmVjZWl2ZVxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gdHlwZSAgIFRoZSBldmVudCB0eXBlIChlLmcuIFwiY2xpY2tcIikuXG4gKiBAcGFyYW0gIHtPYmplY3R9IGV2ICAgICBUaGUgZXZlbnQgcGF5bG9hZCBvYmplY3QgdG8gYmUgZGlzcGF0Y2hlZC5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbiByZWNlaXZlICh0eXBlLCBldikge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIHZhciBpdGVtO1xuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUmVjZWl2ZSkgaXRlbS5vblJlY2VpdmUodHlwZSwgZXYpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBQcml2YXRlIG1ldGhvZCB0byBhdm9pZCBhY2NpZGVudGFsbHkgcGFzc2luZyBhcmd1bWVudHNcbiAqIHRvIHVwZGF0ZSBldmVudHMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLl9yZXF1ZXN0VXBkYXRlV2l0aG91dEFyZ3MgPSBmdW5jdGlvbiBfcmVxdWVzdFVwZGF0ZVdpdGhvdXRBcmdzICgpIHtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbn07XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyBvbiB1cGRhdGUuIERlZmF1bHRzIHRvIHRoZVxuICogbm9kZSdzIC51cGRhdGUgbWV0aG9kLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gY3VycmVudCB0aW1lXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUub25VcGRhdGUgPSBOb2RlLnByb3RvdHlwZS51cGRhdGU7XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyB3aGVuIGEgcGFyZW50IG5vZGUgaXMgc2hvd24uIERlbGVnYXRlc1xuICogdG8gTm9kZS5zaG93LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUGFyZW50U2hvdyA9IE5vZGUucHJvdG90eXBlLnNob3c7XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoZSBwYXJlbnQgaXMgaGlkZGVuLiBEZWxlZ2F0ZXNcbiAqIHRvIE5vZGUuaGlkZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vblBhcmVudEhpZGUgPSBOb2RlLnByb3RvdHlwZS5oaWRlO1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGUgcGFyZW50IHRyYW5zZm9ybSBjaGFuZ2VzLlxuICogRGVsZWdhdGVzIHRvIE5vZGUuX3JlcXVlc3RVcGRhdGVXaXRob3V0QXJncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUub25QYXJlbnRUcmFuc2Zvcm1DaGFuZ2UgPSBOb2RlLnByb3RvdHlwZS5fcmVxdWVzdFVwZGF0ZVdpdGhvdXRBcmdzO1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGUgcGFyZW50IHNpemUgY2hhbmdlcy5cbiAqIERlbGVnYXRlcyB0byBOb2RlLl9yZXF1ZXN0VXBkYXRlV0l0aG91dEFyZ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUGFyZW50U2l6ZUNoYW5nZSA9IE5vZGUucHJvdG90eXBlLl9yZXF1ZXN0VXBkYXRlV2l0aG91dEFyZ3M7XG5cbi8qKlxuICogQSBtZXRob2QgdG8gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoZSBub2RlIHNvbWV0aGluZyB3YW50c1xuICogdG8gc2hvdyB0aGUgbm9kZS4gRGVsZWdhdGVzIHRvIE5vZGUuc2hvdy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vblNob3cgPSBOb2RlLnByb3RvdHlwZS5zaG93O1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgd2hlbiBzb21ldGhpbmcgd2FudHMgdG8gaGlkZSB0aGlzXG4gKiBub2RlLiBEZWxlZ2F0ZXMgdG8gTm9kZS5oaWRlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uSGlkZSA9IE5vZGUucHJvdG90eXBlLmhpZGU7XG5cbi8qKlxuICogQSBtZXRob2Qgd2hpY2ggY2FuIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGlzIG5vZGUgaXMgYWRkZWQgdG9cbiAqIHRvIHRoZSBzY2VuZSBncmFwaC4gRGVsZWdhdGVzIHRvIG1vdW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uTW91bnQgPSBOb2RlLnByb3RvdHlwZS5tb3VudDtcblxuLyoqXG4gKiBBIG1ldGhvZCB3aGljaCBjYW4gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoaXMgbm9kZSBpcyByZW1vdmVkIGZyb21cbiAqIHRoZSBzY2VuZSBncmFwaC4gRGVsZWdhdGVzIHRvIE5vZGUuZGlzbW91bnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25EaXNtb3VudCA9IE5vZGUucHJvdG90eXBlLmRpc21vdW50O1xuXG4vKipcbiAqIEEgbWV0aG9kIHdoaWNoIGNhbiBleGVjdXRlIGxvZ2ljIHdoZW4gdGhpcyBub2RlIHJlY2VpdmVzXG4gKiBhbiBldmVudCBmcm9tIHRoZSBzY2VuZSBncmFwaC4gRGVsZWdhdGVzIHRvIE5vZGUucmVjZWl2ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXlsb2FkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUub25SZWNlaXZlID0gTm9kZS5wcm90b3R5cGUucmVjZWl2ZTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qanNoaW50IC1XMDc5ICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIERpc3BhdGNoID0gcmVxdWlyZSgnLi9EaXNwYXRjaCcpO1xudmFyIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKTtcbnZhciBTaXplID0gcmVxdWlyZSgnLi9TaXplJyk7XG5cbi8qKlxuICogU2NlbmUgaXMgdGhlIGJvdHRvbSBvZiB0aGUgc2NlbmUgZ3JhcGguIEl0IGlzIGl0J3Mgb3duXG4gKiBwYXJlbnQgYW5kIHByb3ZpZGVzIHRoZSBnbG9iYWwgdXBkYXRlciB0byB0aGUgc2NlbmUgZ3JhcGguXG4gKlxuICogQGNsYXNzIFNjZW5lXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBzdHJpbmcgd2hpY2ggaXMgYSBkb20gc2VsZWN0b3JcbiAqICAgICAgICAgICAgICAgICBzaWduaWZ5aW5nIHdoaWNoIGRvbSBlbGVtZW50IHRoZSBjb250ZXh0XG4gKiAgICAgICAgICAgICAgICAgc2hvdWxkIGJlIHNldCB1cG9uXG4gKiBAcGFyYW0ge0ZhbW91c30gdXBkYXRlciBhIGNsYXNzIHdoaWNoIGNvbmZvcm1zIHRvIEZhbW91cycgaW50ZXJmYWNlXG4gKiAgICAgICAgICAgICAgICAgaXQgbmVlZHMgdG8gYmUgYWJsZSB0byBzZW5kIG1ldGhvZHMgdG9cbiAqICAgICAgICAgICAgICAgICB0aGUgcmVuZGVyZXJzIGFuZCB1cGRhdGUgbm9kZXMgaW4gdGhlIHNjZW5lIGdyYXBoXG4gKi9cbmZ1bmN0aW9uIFNjZW5lIChzZWxlY3RvciwgdXBkYXRlcikge1xuICAgIGlmICghc2VsZWN0b3IpIHRocm93IG5ldyBFcnJvcignU2NlbmUgbmVlZHMgdG8gYmUgY3JlYXRlZCB3aXRoIGEgRE9NIHNlbGVjdG9yJyk7XG4gICAgaWYgKCF1cGRhdGVyKSB0aHJvdyBuZXcgRXJyb3IoJ1NjZW5lIG5lZWRzIHRvIGJlIGNyZWF0ZWQgd2l0aCBhIGNsYXNzIGxpa2UgRmFtb3VzJyk7XG5cbiAgICBOb2RlLmNhbGwodGhpcyk7ICAgICAgICAgLy8gU2NlbmUgaW5oZXJpdHMgZnJvbSBub2RlXG5cbiAgICB0aGlzLl91cGRhdGVyID0gdXBkYXRlcjsgLy8gVGhlIHVwZGF0ZXIgdGhhdCB3aWxsIGJvdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VuZCBtZXNzYWdlcyB0byB0aGUgcmVuZGVyZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCB1cGRhdGUgZGlydHkgbm9kZXMgXG5cbiAgICB0aGlzLl9kaXNwYXRjaCA9IG5ldyBEaXNwYXRjaCh0aGlzKTsgLy8gaW5zdGFudGlhdGVzIGEgZGlzcGF0Y2hlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBzZW5kIGV2ZW50cyB0byB0aGUgc2NlbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ3JhcGggYmVsb3cgdGhpcyBjb250ZXh0XG4gICAgXG4gICAgdGhpcy5fc2VsZWN0b3IgPSBzZWxlY3RvcjsgLy8gcmVmZXJlbmNlIHRvIHRoZSBET00gc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0IHJlcHJlc2VudHMgdGhlIGVsZW1uZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvbSB0aGF0IHRoaXMgY29udGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluaGFiaXRzXG5cbiAgICB0aGlzLm9uTW91bnQodGhpcywgc2VsZWN0b3IpOyAvLyBNb3VudCB0aGUgY29udGV4dCB0byBpdHNlbGZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoaXQgaXMgaXRzIG93biBwYXJlbnQpXG4gICAgXG4gICAgdGhpcy5fdXBkYXRlciAgICAgICAgICAgICAgICAgIC8vIG1lc3NhZ2UgYSByZXF1ZXN0IGZvciB0aGUgZG9tXG4gICAgICAgIC5tZXNzYWdlKCdORUVEX1NJWkVfRk9SJykgIC8vIHNpemUgb2YgdGhlIGNvbnRleHQgc28gdGhhdFxuICAgICAgICAubWVzc2FnZShzZWxlY3Rvcik7ICAgICAgICAvLyB0aGUgc2NlbmUgZ3JhcGggaGFzIGEgdG90YWwgc2l6ZVxuXG4gICAgdGhpcy5zaG93KCk7IC8vIHRoZSBjb250ZXh0IGJlZ2lucyBzaG93biAoaXQncyBhbHJlYWR5IHByZXNlbnQgaW4gdGhlIGRvbSlcblxufVxuXG4vLyBTY2VuZSBpbmhlcml0cyBmcm9tIG5vZGVcblNjZW5lLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTm9kZS5wcm90b3R5cGUpO1xuU2NlbmUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU2NlbmU7XG5cbi8qKlxuICogU2NlbmUgZ2V0VXBkYXRlciBmdW5jdGlvbiByZXR1cm5zIHRoZSBwYXNzZWQgaW4gdXBkYXRlclxuICpcbiAqIEByZXR1cm4ge0ZhbW91c30gdGhlIHVwZGF0ZXIgZm9yIHRoaXMgU2NlbmVcbiAqL1xuU2NlbmUucHJvdG90eXBlLmdldFVwZGF0ZXIgPSBmdW5jdGlvbiBnZXRVcGRhdGVyICgpIHtcbiAgICByZXR1cm4gdGhpcy5fdXBkYXRlcjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc2VsZWN0b3IgdGhhdCB0aGUgY29udGV4dCB3YXMgaW5zdGFudGlhdGVkIHdpdGhcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IGRvbSBzZWxlY3RvclxuICovXG5TY2VuZS5wcm90b3R5cGUuZ2V0U2VsZWN0b3IgPSBmdW5jdGlvbiBnZXRTZWxlY3RvciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBkaXNwYXRjaGVyIG9mIHRoZSBjb250ZXh0LiBVc2VkIHRvIHNlbmQgZXZlbnRzXG4gKiB0byB0aGUgbm9kZXMgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICpcbiAqIEByZXR1cm4ge0Rpc3BhdGNofSB0aGUgU2NlbmUncyBEaXNwYXRjaFxuICovXG5TY2VuZS5wcm90b3R5cGUuZ2V0RGlzcGF0Y2ggPSBmdW5jdGlvbiBnZXREaXNwYXRjaCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc3BhdGNoO1xufTtcblxuLyoqXG4gKiBSZWNlaXZlcyBhbiBldmVudC4gSWYgdGhlIGV2ZW50IGlzICdDT05URVhUX1JFU0laRScgaXQgc2V0cyB0aGUgc2l6ZSBvZiB0aGUgc2NlbmVcbiAqIGdyYXBoIHRvIHRoZSBwYXlsb2FkLCB3aGljaCBtdXN0IGJlIGFuIGFycmF5IG9mIG51bWJlcnMgb2YgYXQgbGVhc3RcbiAqIGxlbmd0aCB0aHJlZSByZXByZXNlbnRpbmcgdGhlIHBpeGVsIHNpemUgaW4gMyBkaW1lbnNpb25zLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgYmVpbmcgcmVjZWl2ZWRcbiAqIEBwYXJhbSB7Kn0gcGF5bG9hZCB0aGUgb2JqZWN0IGJlaW5nIHNlbnRcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5TY2VuZS5wcm90b3R5cGUub25SZWNlaXZlID0gZnVuY3Rpb24gb25SZWNlaXZlIChldmVudCwgcGF5bG9hZCkge1xuICAgIC8vIFRPRE86IEluIHRoZSBmdXR1cmUgdGhlIGRvbSBlbGVtZW50IHRoYXQgdGhlIGNvbnRleHQgaXMgYXR0YWNoZWQgdG9cbiAgICAvLyBzaG91bGQgaGF2ZSBhIHJlcHJlc2VudGF0aW9uIGFzIGEgY29tcG9uZW50LiBJdCB3b3VsZCBiZSByZW5kZXIgc2l6ZWRcbiAgICAvLyBhbmQgdGhlIGNvbnRleHQgd291bGQgcmVjZWl2ZSBpdHMgc2l6ZSB0aGUgc2FtZSB3YXkgdGhhdCBhbnkgcmVuZGVyIHNpemVcbiAgICAvLyBjb21wb25lbnQgcmVjZWl2ZXMgaXRzIHNpemUuXG4gICAgaWYgKGV2ZW50ID09PSAnQ09OVEVYVF9SRVNJWkUnKSB7XG4gICAgICAgIFxuICAgICAgICBpZiAocGF5bG9hZC5sZW5ndGggPCAyKSBcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgJ0NPTlRFWFRfUkVTSVpFXFwncyBwYXlsb2FkIG5lZWRzIHRvIGJlIGF0IGxlYXN0IGEgcGFpcicgK1xuICAgICAgICAgICAgICAgICAgICAnIG9mIHBpeGVsIHNpemVzJ1xuICAgICAgICAgICAgKTtcblxuICAgICAgICB0aGlzLnNldFNpemVNb2RlKFNpemUuQUJTT0xVVEUsIFNpemUuQUJTT0xVVEUsIFNpemUuQUJTT0xVVEUpO1xuICAgICAgICB0aGlzLnNldEFic29sdXRlU2l6ZShwYXlsb2FkWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWzJdID8gcGF5bG9hZFsyXSA6IDApO1xuXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTtcblxuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgU2l6ZSBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgcHJvY2Vzc2luZyBTaXplIGZyb20gYSBub2RlXG4gKiBAY29uc3RydWN0b3IgU2l6ZVxuICovXG5mdW5jdGlvbiBTaXplICgpIHtcbiAgICB0aGlzLl9zaXplID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbn1cblxuLy8gYW4gZW51bWVyYXRpb24gb2YgdGhlIGRpZmZlcmVudCB0eXBlcyBvZiBzaXplIG1vZGVzXG5TaXplLlJFTEFUSVZFID0gMDtcblNpemUuQUJTT0xVVEUgPSAxO1xuU2l6ZS5SRU5ERVIgPSAyO1xuU2l6ZS5ERUZBVUxUID0gU2l6ZS5SRUxBVElWRTtcblxuLyoqXG4gKiBmcm9tU3BlY1dpdGhQYXJlbnQgdGFrZXMgdGhlIHBhcmVudCBub2RlJ3Mgc2l6ZSwgdGhlIHRhcmdldCBub2RlcyBzcGVjLFxuICogYW5kIGEgdGFyZ2V0IGFycmF5IHRvIHdyaXRlIHRvLiBVc2luZyB0aGUgbm9kZSdzIHNpemUgbW9kZSBpdCBjYWxjdWxhdGVzIFxuICogYSBmaW5hbCBzaXplIGZvciB0aGUgbm9kZSBmcm9tIHRoZSBub2RlJ3Mgc3BlYy4gUmV0dXJucyB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGZpbmFsIHNpemUgaGFzIGNoYW5nZWQgZnJvbSBpdHMgbGFzdCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwYXJlbnRTaXplIHBhcmVudCBub2RlJ3MgY2FsY3VsYXRlZCBzaXplXG4gKiBAcGFyYW0ge05vZGUuU3BlY30gbm9kZSB0aGUgdGFyZ2V0IG5vZGUncyBzcGVjXG4gKiBAcGFyYW0ge0FycmF5fSB0YXJnZXQgYW4gYXJyYXkgdG8gd3JpdGUgdGhlIHJlc3VsdCB0b1xuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhlIHNpemUgb2YgdGhlIG5vZGUgaGFzIGNoYW5nZWQuXG4gKi9cblNpemUucHJvdG90eXBlLmZyb21TcGVjV2l0aFBhcmVudCA9IGZ1bmN0aW9uIGZyb21TcGVjV2l0aFBhcmVudCAocGFyZW50U2l6ZSwgbm9kZSwgdGFyZ2V0KSB7XG4gICAgdmFyIHNwZWMgPSBub2RlLmdldFZhbHVlKCkuc3BlYztcbiAgICB2YXIgY29tcG9uZW50cyA9IG5vZGUuZ2V0Q29tcG9uZW50cygpO1xuICAgIHZhciBtb2RlID0gc3BlYy5zaXplLnNpemVNb2RlO1xuICAgIHZhciBwcmV2O1xuICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdmFyIGxlbiA9IGNvbXBvbmVudHMubGVuZ3RoO1xuICAgIHZhciBqO1xuICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IDMgOyBpKyspIHtcbiAgICAgICAgc3dpdGNoIChtb2RlW2ldKSB7XG4gICAgICAgICAgICBjYXNlIFNpemUuUkVMQVRJVkU6XG4gICAgICAgICAgICAgICAgcHJldiA9IHRhcmdldFtpXTtcbiAgICAgICAgICAgICAgICB0YXJnZXRbaV0gPSBwYXJlbnRTaXplW2ldICogc3BlYy5zaXplLnByb3BvcnRpb25hbFtpXSArIHNwZWMuc2l6ZS5kaWZmZXJlbnRpYWxbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNpemUuQUJTT0xVVEU6XG4gICAgICAgICAgICAgICAgcHJldiA9IHRhcmdldFtpXTtcbiAgICAgICAgICAgICAgICB0YXJnZXRbaV0gPSBzcGVjLnNpemUuYWJzb2x1dGVbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNpemUuUkVOREVSOlxuICAgICAgICAgICAgICAgIHZhciBjYW5kaWRhdGU7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxlbiA7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50c1tqXS5nZXRSZW5kZXJTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGUgPSBjb21wb25lbnRzW2pdLmdldFJlbmRlclNpemUoKVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYgPSB0YXJnZXRbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbaV0gPSB0YXJnZXRbaV0gPCBjYW5kaWRhdGUgfHwgdGFyZ2V0W2ldID09PSAwID8gY2FuZGlkYXRlIDogdGFyZ2V0W2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNoYW5nZWQgPSBjaGFuZ2VkIHx8IHByZXYgIT09IHRhcmdldFtpXTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpemU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZSB0cmFuc2Zvcm0gY2xhc3MgaXMgcmVzcG9uc2libGUgZm9yIGNhbGN1bGF0aW5nIHRoZSB0cmFuc2Zvcm0gb2YgYSBwYXJ0aWN1bGFyXG4gKiBub2RlIGZyb20gdGhlIGRhdGEgb24gdGhlIG5vZGUgYW5kIGl0cyBwYXJlbnRcbiAqXG4gKiBAY29uc3RydWN0b3IgVHJhbnNmb3JtXG4gKi9cbmZ1bmN0aW9uIFRyYW5zZm9ybSAoKSB7XG4gICAgdGhpcy5fbWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbGFzdCBjYWxjdWxhdGVkIHRyYW5zZm9ybVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhIHRyYW5zZm9ybVxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21hdHJpeDtcbn07XG5cbi8qKlxuICogVXNlcyB0aGUgcGFyZW50IHRyYW5zZm9ybSwgdGhlIG5vZGUncyBzcGVjLCB0aGUgbm9kZSdzIHNpemUsIGFuZCB0aGUgcGFyZW50J3Mgc2l6ZVxuICogdG8gY2FsY3VsYXRlIGEgZmluYWwgdHJhbnNmb3JtIGZvciB0aGUgbm9kZS4gUmV0dXJucyB0cnVlIGlmIHRoZSB0cmFuc2Zvcm0gaGFzIGNoYW5nZWQuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcGFyZW50TWF0cml4IHRoZSBwYXJlbnQgbWF0cml4XG4gKiBAcGFyYW0ge05vZGUuU3BlY30gc3BlYyB0aGUgdGFyZ2V0IG5vZGUncyBzcGVjXG4gKiBAcGFyYW0ge0FycmF5fSBteVNpemUgdGhlIHNpemUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSB7QXJyYXl9IHBhcmVudFNpemUgdGhlIHNpemUgb2YgdGhlIHBhcmVudFxuICogQHBhcmFtIHtBcnJheX0gdGFyZ2V0IHRoZSB0YXJnZXQgYXJyYXkgdG8gd3JpdGUgdGhlIHJlc3VsdGluZyB0cmFuc2Zvcm0gdG9cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCB0aGUgdHJhbnNmb3JtIGNoYW5nZWRcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5mcm9tU3BlY1dpdGhQYXJlbnQgPSBmdW5jdGlvbiBmcm9tU3BlY1dpdGhQYXJlbnQgKHBhcmVudE1hdHJpeCwgc3BlYywgbXlTaXplLCBwYXJlbnRTaXplLCB0YXJnZXQpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQgPyB0YXJnZXQgOiB0aGlzLl9tYXRyaXg7XG5cbiAgICAvLyBsb2NhbCBjYWNoZSBvZiBldmVyeXRoaW5nXG4gICAgdmFyIHQwMCAgICAgICAgID0gdGFyZ2V0WzBdO1xuICAgIHZhciB0MDEgICAgICAgICA9IHRhcmdldFsxXTtcbiAgICB2YXIgdDAyICAgICAgICAgPSB0YXJnZXRbMl07XG4gICAgdmFyIHQxMCAgICAgICAgID0gdGFyZ2V0WzRdO1xuICAgIHZhciB0MTEgICAgICAgICA9IHRhcmdldFs1XTtcbiAgICB2YXIgdDEyICAgICAgICAgPSB0YXJnZXRbNl07XG4gICAgdmFyIHQyMCAgICAgICAgID0gdGFyZ2V0WzhdO1xuICAgIHZhciB0MjEgICAgICAgICA9IHRhcmdldFs5XTtcbiAgICB2YXIgdDIyICAgICAgICAgPSB0YXJnZXRbMTBdO1xuICAgIHZhciB0MzAgICAgICAgICA9IHRhcmdldFsxMl07XG4gICAgdmFyIHQzMSAgICAgICAgID0gdGFyZ2V0WzEzXTtcbiAgICB2YXIgdDMyICAgICAgICAgPSB0YXJnZXRbMTRdO1xuICAgIHZhciBwMDAgICAgICAgICA9IHBhcmVudE1hdHJpeFswXTtcbiAgICB2YXIgcDAxICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMV07XG4gICAgdmFyIHAwMiAgICAgICAgID0gcGFyZW50TWF0cml4WzJdO1xuICAgIHZhciBwMTAgICAgICAgICA9IHBhcmVudE1hdHJpeFs0XTtcbiAgICB2YXIgcDExICAgICAgICAgPSBwYXJlbnRNYXRyaXhbNV07XG4gICAgdmFyIHAxMiAgICAgICAgID0gcGFyZW50TWF0cml4WzZdO1xuICAgIHZhciBwMjAgICAgICAgICA9IHBhcmVudE1hdHJpeFs4XTtcbiAgICB2YXIgcDIxICAgICAgICAgPSBwYXJlbnRNYXRyaXhbOV07XG4gICAgdmFyIHAyMiAgICAgICAgID0gcGFyZW50TWF0cml4WzEwXTtcbiAgICB2YXIgcDMwICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMTJdO1xuICAgIHZhciBwMzEgICAgICAgICA9IHBhcmVudE1hdHJpeFsxM107XG4gICAgdmFyIHAzMiAgICAgICAgID0gcGFyZW50TWF0cml4WzE0XTtcbiAgICB2YXIgcG9zWCAgICAgICAgPSBzcGVjLnZlY3RvcnMucG9zaXRpb25bMF07XG4gICAgdmFyIHBvc1kgICAgICAgID0gc3BlYy52ZWN0b3JzLnBvc2l0aW9uWzFdO1xuICAgIHZhciBwb3NaICAgICAgICA9IHNwZWMudmVjdG9ycy5wb3NpdGlvblsyXTtcbiAgICB2YXIgcm90WCAgICAgICAgPSBzcGVjLnZlY3RvcnMucm90YXRpb25bMF07XG4gICAgdmFyIHJvdFkgICAgICAgID0gc3BlYy52ZWN0b3JzLnJvdGF0aW9uWzFdO1xuICAgIHZhciByb3RaICAgICAgICA9IHNwZWMudmVjdG9ycy5yb3RhdGlvblsyXTtcbiAgICB2YXIgcm90VyAgICAgICAgPSBzcGVjLnZlY3RvcnMucm90YXRpb25bM107XG4gICAgdmFyIHNjYWxlWCAgICAgID0gc3BlYy52ZWN0b3JzLnNjYWxlWzBdO1xuICAgIHZhciBzY2FsZVkgICAgICA9IHNwZWMudmVjdG9ycy5zY2FsZVsxXTtcbiAgICB2YXIgc2NhbGVaICAgICAgPSBzcGVjLnZlY3RvcnMuc2NhbGVbMl07XG4gICAgdmFyIGFsaWduWCAgICAgID0gc3BlYy5vZmZzZXRzLmFsaWduWzBdICogcGFyZW50U2l6ZVswXTtcbiAgICB2YXIgYWxpZ25ZICAgICAgPSBzcGVjLm9mZnNldHMuYWxpZ25bMV0gKiBwYXJlbnRTaXplWzFdO1xuICAgIHZhciBhbGlnblogICAgICA9IHNwZWMub2Zmc2V0cy5hbGlnblsyXSAqIHBhcmVudFNpemVbMl07XG4gICAgdmFyIG1vdW50UG9pbnRYID0gc3BlYy5vZmZzZXRzLm1vdW50UG9pbnRbMF0gKiBteVNpemVbMF07XG4gICAgdmFyIG1vdW50UG9pbnRZID0gc3BlYy5vZmZzZXRzLm1vdW50UG9pbnRbMV0gKiBteVNpemVbMV07XG4gICAgdmFyIG1vdW50UG9pbnRaID0gc3BlYy5vZmZzZXRzLm1vdW50UG9pbnRbMl0gKiBteVNpemVbMl07XG4gICAgdmFyIG9yaWdpblggICAgID0gc3BlYy5vZmZzZXRzLm9yaWdpblswXSAqIG15U2l6ZVswXTtcbiAgICB2YXIgb3JpZ2luWSAgICAgPSBzcGVjLm9mZnNldHMub3JpZ2luWzFdICogbXlTaXplWzFdO1xuICAgIHZhciBvcmlnaW5aICAgICA9IHNwZWMub2Zmc2V0cy5vcmlnaW5bMl0gKiBteVNpemVbMl07XG5cbiAgICB2YXIgd3ggPSByb3RXICogcm90WDtcbiAgICB2YXIgd3kgPSByb3RXICogcm90WTtcbiAgICB2YXIgd3ogPSByb3RXICogcm90WjtcbiAgICB2YXIgeHggPSByb3RYICogcm90WDtcbiAgICB2YXIgeXkgPSByb3RZICogcm90WTtcbiAgICB2YXIgenogPSByb3RaICogcm90WjtcbiAgICB2YXIgeHkgPSByb3RYICogcm90WTtcbiAgICB2YXIgeHogPSByb3RYICogcm90WjtcbiAgICB2YXIgeXogPSByb3RZICogcm90WjtcblxuICAgIHZhciByczAgPSAoMSAtIDIgKiAoeXkgKyB6eikpICogc2NhbGVYO1xuICAgIHZhciByczEgPSAoMiAqICh4eSArIHd6KSkgKiBzY2FsZVg7XG4gICAgdmFyIHJzMiA9ICgyICogKHh6IC0gd3kpKSAqIHNjYWxlWDtcbiAgICB2YXIgcnMzID0gKDIgKiAoeHkgLSB3eikpICogc2NhbGVZO1xuICAgIHZhciByczQgPSAoMSAtIDIgKiAoeHggKyB6eikpICogc2NhbGVZO1xuICAgIHZhciByczUgPSAoMiAqICh5eiArIHd4KSkgKiBzY2FsZVk7XG4gICAgdmFyIHJzNiA9ICgyICogKHh6ICsgd3kpKSAqIHNjYWxlWjtcbiAgICB2YXIgcnM3ID0gKDIgKiAoeXogLSB3eCkpICogc2NhbGVaO1xuICAgIHZhciByczggPSAoMSAtIDIgKiAoeHggKyB5eSkpICogc2NhbGVaO1xuXG4gICAgdmFyIHR4ID0gYWxpZ25YICsgcG9zWCAtIG1vdW50UG9pbnRYICsgb3JpZ2luWCAtIChyczAgKiBvcmlnaW5YICsgcnMzICogb3JpZ2luWSArIHJzNiAqIG9yaWdpblopO1xuICAgIHZhciB0eSA9IGFsaWduWSArIHBvc1kgLSBtb3VudFBvaW50WSArIG9yaWdpblkgLSAocnMxICogb3JpZ2luWCArIHJzNCAqIG9yaWdpblkgKyByczcgKiBvcmlnaW5aKTtcbiAgICB2YXIgdHogPSBhbGlnblogKyBwb3NaIC0gbW91bnRQb2ludFogKyBvcmlnaW5aIC0gKHJzMiAqIG9yaWdpblggKyByczUgKiBvcmlnaW5ZICsgcnM4ICogb3JpZ2luWik7XG5cbiAgICB0YXJnZXRbMF0gPSBwMDAgKiByczAgKyBwMTAgKiByczEgKyBwMjAgKiByczI7XG4gICAgdGFyZ2V0WzFdID0gcDAxICogcnMwICsgcDExICogcnMxICsgcDIxICogcnMyO1xuICAgIHRhcmdldFsyXSA9IHAwMiAqIHJzMCArIHAxMiAqIHJzMSArIHAyMiAqIHJzMjtcbiAgICB0YXJnZXRbM10gPSAwO1xuICAgIHRhcmdldFs0XSA9IHAwMCAqIHJzMyArIHAxMCAqIHJzNCArIHAyMCAqIHJzNTtcbiAgICB0YXJnZXRbNV0gPSBwMDEgKiByczMgKyBwMTEgKiByczQgKyBwMjEgKiByczU7XG4gICAgdGFyZ2V0WzZdID0gcDAyICogcnMzICsgcDEyICogcnM0ICsgcDIyICogcnM1O1xuICAgIHRhcmdldFs3XSA9IDA7XG4gICAgdGFyZ2V0WzhdID0gcDAwICogcnM2ICsgcDEwICogcnM3ICsgcDIwICogcnM4O1xuICAgIHRhcmdldFs5XSA9IHAwMSAqIHJzNiArIHAxMSAqIHJzNyArIHAyMSAqIHJzODtcbiAgICB0YXJnZXRbMTBdID0gcDAyICogcnM2ICsgcDEyICogcnM3ICsgcDIyICogcnM4O1xuICAgIHRhcmdldFsxMV0gPSAwO1xuICAgIHRhcmdldFsxMl0gPSBwMDAgKiB0eCArIHAxMCAqIHR5ICsgcDIwICogdHogKyBwMzA7XG4gICAgdGFyZ2V0WzEzXSA9IHAwMSAqIHR4ICsgcDExICogdHkgKyBwMjEgKiB0eiArIHAzMTtcbiAgICB0YXJnZXRbMTRdID0gcDAyICogdHggKyBwMTIgKiB0eSArIHAyMiAqIHR6ICsgcDMyO1xuICAgIHRhcmdldFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIHQwMCAhPT0gdGFyZ2V0WzBdIHx8XG4gICAgICAgIHQwMSAhPT0gdGFyZ2V0WzFdIHx8XG4gICAgICAgIHQwMiAhPT0gdGFyZ2V0WzJdIHx8XG4gICAgICAgIHQxMCAhPT0gdGFyZ2V0WzRdIHx8XG4gICAgICAgIHQxMSAhPT0gdGFyZ2V0WzVdIHx8XG4gICAgICAgIHQxMiAhPT0gdGFyZ2V0WzZdIHx8XG4gICAgICAgIHQyMCAhPT0gdGFyZ2V0WzhdIHx8XG4gICAgICAgIHQyMSAhPT0gdGFyZ2V0WzldIHx8XG4gICAgICAgIHQyMiAhPT0gdGFyZ2V0WzEwXSB8fFxuICAgICAgICB0MzAgIT09IHRhcmdldFsxMl0gfHxcbiAgICAgICAgdDMxICE9PSB0YXJnZXRbMTNdIHx8XG4gICAgICAgIHQzMiAhPT0gdGFyZ2V0WzE0XTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDYWxsYmFja1N0b3JlID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL0NhbGxiYWNrU3RvcmUnKTtcblxudmFyIFJFTkRFUl9TSVpFID0gMjtcblxuLyoqXG4gKiBBIERPTUVsZW1lbnQgaXMgYSBjb21wb25lbnQgdGhhdCBjYW4gYmUgYWRkZWQgdG8gYSBOb2RlIHdpdGggdGhlXG4gKiBwdXJwb3NlIG9mIHNlbmRpbmcgZHJhdyBjb21tYW5kcyB0byB0aGUgcmVuZGVyZXIuIFJlbmRlcmFibGVzIHNlbmQgZHJhdyBjb21tYW5kc1xuICogdG8gdGhyb3VnaCB0aGVpciBOb2RlcyB0byB0aGUgQ29tcG9zaXRvciB3aGVyZSB0aGV5IGFyZSBhY3RlZCB1cG9uLlxuICpcbiAqIEBjbGFzcyBET01FbGVtZW50XG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlICAgICAgICAgICAgICAgICAgIFRoZSBOb2RlIHRvIHdoaWNoIHRoZSBgRE9NRWxlbWVudGBcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJhYmxlIHNob3VsZCBiZSBhdHRhY2hlZCB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgICAgICAgICAgICBJbml0aWFsIG9wdGlvbnMgdXNlZCBmb3IgaW5zdGFudGlhdGluZ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBOb2RlLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMucHJvcGVydGllcyAgIENTUyBwcm9wZXJ0aWVzIHRoYXQgc2hvdWxkIGJlIGFkZGVkIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGFjdHVhbCBET01FbGVtZW50IG9uIHRoZSBpbml0aWFsIGRyYXcuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5hdHRyaWJ1dGVzICAgRWxlbWVudCBhdHRyaWJ1dGVzIHRoYXQgc2hvdWxkIGJlIGFkZGVkIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGFjdHVhbCBET01FbGVtZW50LlxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuaWQgICAgICAgICAgIFN0cmluZyB0byBiZSBhcHBsaWVkIGFzICdpZCcgb2YgdGhlIGFjdHVhbFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERPTUVsZW1lbnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5jb250ZW50ICAgICAgU3RyaW5nIHRvIGJlIGFwcGxpZWQgYXMgdGhlIGNvbnRlbnQgb2YgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsIERPTUVsZW1lbnQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuY3V0b3V0ICAgICAgU3BlY2lmaWVzIHRoZSBwcmVzZW5jZSBvZiBhICdjdXRvdXQnIGluIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFdlYkdMIGNhbnZhcyBvdmVyIHRoaXMgZWxlbWVudCB3aGljaCBhbGxvd3NcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgRE9NIGFuZCBXZWJHTCBsYXllcmluZy4gIE9uIGJ5IGRlZmF1bHQuXG4gKi9cbmZ1bmN0aW9uIERPTUVsZW1lbnQobm9kZSwgb3B0aW9ucykge1xuICAgIGlmICghbm9kZSkgdGhyb3cgbmV3IEVycm9yKCdET01FbGVtZW50IG11c3QgYmUgaW5zdGFudGlhdGVkIG9uIGEgbm9kZScpO1xuXG4gICAgdGhpcy5fbm9kZSA9IG5vZGU7XG4gICAgdGhpcy5fcGFyZW50ID0gbnVsbDtcbiAgICB0aGlzLl9jaGlsZHJlbiA9IFtdO1xuXG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX3JlbmRlclNpemVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSBmYWxzZTtcblxuICAgIHRoaXMuX2NoYW5nZVF1ZXVlID0gW107XG5cbiAgICB0aGlzLl9VSUV2ZW50cyA9IG5vZGUuZ2V0VUlFdmVudHMoKS5zbGljZSgwKTtcbiAgICB0aGlzLl9jbGFzc2VzID0gWydmYW1vdXMtZG9tLWVsZW1lbnQnXTtcbiAgICB0aGlzLl9yZXF1ZXN0aW5nRXZlbnRMaXN0ZW5lcnMgPSBbXTtcbiAgICB0aGlzLl9zdHlsZXMgPSB7fTtcblxuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCBub2RlLmlzU2hvd24oKSA/ICdub25lJyA6ICdibG9jaycpO1xuICAgIHRoaXMub25PcGFjaXR5Q2hhbmdlKG5vZGUuZ2V0T3BhY2l0eSgpKTtcblxuICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLl9jb250ZW50ID0gJyc7XG5cbiAgICB0aGlzLl90YWdOYW1lID0gb3B0aW9ucyAmJiBvcHRpb25zLnRhZ05hbWUgPyBvcHRpb25zLnRhZ05hbWUgOiAnZGl2JztcbiAgICB0aGlzLl9pZCA9IG5vZGUgPyBub2RlLmFkZENvbXBvbmVudCh0aGlzKSA6IG51bGw7XG5cbiAgICB0aGlzLl9yZW5kZXJTaXplID0gWzAsIDAsIDBdO1xuXG4gICAgdGhpcy5fY2FsbGJhY2tzID0gbmV3IENhbGxiYWNrU3RvcmUoKTtcblxuXG4gICAgaWYgKCFvcHRpb25zKSByZXR1cm47XG5cbiAgICB2YXIgaTtcbiAgICB2YXIga2V5O1xuXG4gICAgaWYgKG9wdGlvbnMuY2xhc3NlcylcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnMuY2xhc3Nlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzW2ldKTtcblxuICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpXG4gICAgICAgIGZvciAoa2V5IGluIG9wdGlvbnMuYXR0cmlidXRlcylcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgb3B0aW9ucy5hdHRyaWJ1dGVzW2tleV0pO1xuXG4gICAgaWYgKG9wdGlvbnMucHJvcGVydGllcylcbiAgICAgICAgZm9yIChrZXkgaW4gb3B0aW9ucy5wcm9wZXJ0aWVzKVxuICAgICAgICAgICAgdGhpcy5zZXRQcm9wZXJ0eShrZXksIG9wdGlvbnMucHJvcGVydGllc1trZXldKTtcblxuICAgIGlmIChvcHRpb25zLmlkKSB0aGlzLnNldElkKG9wdGlvbnMuaWQpO1xuICAgIGlmIChvcHRpb25zLmNvbnRlbnQpIHRoaXMuc2V0Q29udGVudChvcHRpb25zLmNvbnRlbnQpO1xuICAgIGlmIChvcHRpb25zLmN1dG91dCA9PT0gZmFsc2UpIHRoaXMuc2V0Q3V0b3V0U3RhdGUob3B0aW9ucy5jdXRvdXQpO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgdGhlIHN0YXRlIG9mIHRoZSBET01FbGVtZW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHNlcmlhbGl6ZWQgaW50ZXJhbCBzdGF0ZVxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uIGdldFZhbHVlKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNsYXNzZXM6IHRoaXMuX2NsYXNzZXMsXG4gICAgICAgIHN0eWxlczogdGhpcy5fc3R5bGVzLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0aGlzLl9hdHRyaWJ1dGVzLFxuICAgICAgICBjb250ZW50OiB0aGlzLl9jb250ZW50LFxuICAgICAgICBpZDogdGhpcy5fYXR0cmlidXRlcy5pZCxcbiAgICAgICAgdGFnTmFtZTogdGhpcy5fdGFnTmFtZVxuICAgIH07XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgYW4gdXBkYXRlIG9jY3Vycy4gVGhpcyBhbGxvd3NcbiAqIHRoZSBET01FbGVtZW50IHJlbmRlcmFibGUgdG8gZHluYW1pY2FsbHkgcmVhY3QgdG8gc3RhdGUgY2hhbmdlcyBvbiB0aGUgTm9kZS5cbiAqXG4gKiBUaGlzIGZsdXNoZXMgdGhlIGludGVybmFsIGRyYXcgY29tbWFuZCBxdWV1ZSBieSBzZW5kaW5nIGluZGl2aWR1YWwgY29tbWFuZHNcbiAqIHRvIHRoZSBub2RlIHVzaW5nIGBzZW5kRHJhd0NvbW1hbmRgLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblVwZGF0ZSA9IGZ1bmN0aW9uIG9uVXBkYXRlKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZTtcbiAgICB2YXIgcXVldWUgPSB0aGlzLl9jaGFuZ2VRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuXG4gICAgaWYgKGxlbiAmJiBub2RlKSB7XG4gICAgICAgIG5vZGUuc2VuZERyYXdDb21tYW5kKCdXSVRIJyk7XG4gICAgICAgIG5vZGUuc2VuZERyYXdDb21tYW5kKG5vZGUuZ2V0TG9jYXRpb24oKSk7XG5cbiAgICAgICAgd2hpbGUgKGxlbi0tKSBub2RlLnNlbmREcmF3Q29tbWFuZChxdWV1ZS5zaGlmdCgpKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplKSB7XG4gICAgICAgICAgICBub2RlLnNlbmREcmF3Q29tbWFuZCgnRE9NX1JFTkRFUl9TSVpFJyk7XG4gICAgICAgICAgICBub2RlLnNlbmREcmF3Q29tbWFuZChub2RlLmdldExvY2F0aW9uKCkpO1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBQcml2YXRlIG1ldGhvZCB3aGljaCBzZXRzIHRoZSBwYXJlbnQgb2YgdGhlIGVsZW1lbnQgaW4gdGhlIERPTVxuICogaGllcmFyY2h5LlxuICpcbiAqIEBtZXRob2QgX3NldFBhcmVudFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBvZiB0aGUgcGFyZW50XG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuX3NldFBhcmVudCA9IGZ1bmN0aW9uIF9zZXRQYXJlbnQocGF0aCkge1xuICAgIGlmICh0aGlzLl9ub2RlKSB7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuX25vZGUuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSBwYXRoIHx8IGxvY2F0aW9uLmluZGV4T2YocGF0aCkgPT09IC0xKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZ2l2ZW4gcGF0aCBpc25cXCd0IGFuIGFuY2VzdG9yJyk7XG4gICAgICAgIHRoaXMuX3BhcmVudCA9IHBhdGg7XG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignX3NldFBhcmVudCBjYWxsZWQgb24gYW4gRWxlbWVudCB0aGF0IGlzblxcJ3QgaW4gdGhlIHNjZW5lIGdyYXBoJyk7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIHdoaWNoIGFkZHMgYSBjaGlsZCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgRE9NXG4gKiBoaWVyYXJjaHkuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBvZiB0aGUgY2hpbGRcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5fYWRkQ2hpbGQgPSBmdW5jdGlvbiBfYWRkQ2hpbGQocGF0aCkge1xuICAgIGlmICh0aGlzLl9ub2RlKSB7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuX25vZGUuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgaWYgKHBhdGggPT09IGxvY2F0aW9uIHx8IHBhdGguaW5kZXhPZihsb2NhdGlvbikgPT09IC0xKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZ2l2ZW4gcGF0aCBpc25cXCd0IGEgZGVzY2VuZGVudCcpO1xuICAgICAgICBpZiAodGhpcy5fY2hpbGRyZW4uaW5kZXhPZihwYXRoKSA9PT0gLTEpIHRoaXMuX2NoaWxkcmVuLnB1c2gocGF0aCk7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKCdUaGUgZ2l2ZW4gcGF0aCBpcyBhbHJlYWR5IGEgY2hpbGQgb2YgdGhpcyBlbGVtZW50Jyk7XG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignX2FkZENoaWxkIGNhbGxlZCBvbiBhbiBFbGVtZW50IHRoYXQgaXNuXFwndCBpbiB0aGUgc2NlbmUgZ3JhcGgnKTtcbn07XG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2Qgd2hpY2ggcmV0dXJucyB0aGUgcGF0aCBvZiB0aGUgcGFyZW50IG9mIHRoaXMgZWxlbWVudFxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBwYXRoIG9mIHRoZSBwYXJlbnQgZWxlbWVudFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5fZ2V0UGFyZW50ID0gZnVuY3Rpb24gX2dldFBhcmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xufTtcblxuLyoqXG4gKiBQcml2YXRlIG1ldGhvZCB3aGljaCByZXR1cm5zIGFuIGFycmF5IG9mIHBhdGhzIG9mIHRoZSBjaGlsZHJlbiBlbGVtZW50c1xuICogb2YgdGhpcyBlbGVtZW50XG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYW4gYXJyYXkgb2YgdGhlIHBhdGhzIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLl9nZXRDaGlsZHJlbiA9IGZ1bmN0aW9uIF9nZXRDaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBOb2RlIGFzIHNvb24gYXMgdGhlIG5vZGUgKG9yIGFueSBvZiBpdHNcbiAqIGFuY2VzdG9ycykgaXMgYmVpbmcgbW91bnRlZC5cbiAqXG4gKiBAbWV0aG9kIG9uTW91bnRcbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgICAgICBQYXJlbnQgbm9kZSB0byB3aGljaCB0aGUgY29tcG9uZW50IHNob3VsZCBiZSBhZGRlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCAgICAgIFBhdGggYXQgd2hpY2ggdGhlIGNvbXBvbmVudCAob3Igbm9kZSkgaXMgYmVpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2hlZC4gVGhlIHBhdGggaXMgYmVpbmcgc2V0IG9uIHRoZSBhY3R1YWxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBET01FbGVtZW50IGFzIGEgYGRhdGEtZmEtcGF0aGAtYXR0cmlidXRlLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uTW91bnQgPSBmdW5jdGlvbiBvbk1vdW50KG5vZGUsIGlkKSB7XG4gICAgdGhpcy5fbm9kZSA9IG5vZGU7XG4gICAgdGhpcy5faWQgPSBpZDtcbiAgICB0aGlzLl9VSUV2ZW50cyA9IG5vZGUuZ2V0VUlFdmVudHMoKS5zbGljZSgwKTtcbiAgICB0aGlzLmRyYXcoKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgnZGF0YS1mYS1wYXRoJywgbm9kZS5nZXRMb2NhdGlvbigpKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIE5vZGUgYXMgc29vbiBhcyB0aGUgbm9kZSBpcyBiZWluZyBkaXNtb3VudGVkXG4gKiBlaXRoZXIgZGlyZWN0bHkgb3IgYnkgZGlzbW91bnRpbmcgb25lIG9mIGl0cyBhbmNlc3RvcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uRGlzbW91bnQgPSBmdW5jdGlvbiBvbkRpc21vdW50KCkge1xuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKCdkYXRhLWZhLXBhdGgnLCAnJyk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyB0aGUgRE9NRWxlbWVudCBpcyBiZWluZyBzaG93bi5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIHRoZSBET01FbGVtZW50IHNldHRpbmcgdGhlIGBkaXNwbGF5YCBwcm9wZXJ0eSB0byBgYmxvY2tgXG4gKiBhbmQgdGhlcmVmb3JlIHZpc3VhbGx5IHNob3dpbmcgdGhlIGNvcnJlc3BvbmRpbmcgRE9NRWxlbWVudCAoYWdhaW4pLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblNob3cgPSBmdW5jdGlvbiBvblNob3coKSB7XG4gICAgdGhpcy5zZXRQcm9wZXJ0eSgnZGlzcGxheScsICdibG9jaycpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgaW52b2tlZCBieSB0aGUgbm9kZSBhcyBzb29uIGFzIHRoZSBET01FbGVtZW50IGlzIGJlaW5nIGhpZGRlbi5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIHRoZSBET01FbGVtZW50IHNldHRpbmcgdGhlIGBkaXNwbGF5YCBwcm9wZXJ0eSB0byBgbm9uZWBcbiAqIGFuZCB0aGVyZWZvcmUgdmlzdWFsbHkgaGlkaW5nIHRoZSBjb3JyZXNwb25kaW5nIERPTUVsZW1lbnQgKGFnYWluKS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25IaWRlID0gZnVuY3Rpb24gb25IaWRlKCkge1xuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCAnbm9uZScpO1xufTtcblxuLyoqXG4gKiBFbmFibGVzIG9yIGRpc2FibGVzIFdlYkdMICdjdXRvdXQnIGZvciB0aGlzIGVsZW1lbnQsIHdoaWNoIGFmZmVjdHNcbiAqIGhvdyB0aGUgZWxlbWVudCBpcyBsYXllcmVkIHdpdGggV2ViR0wgb2JqZWN0cyBpbiB0aGUgc2NlbmUuICBUaGlzIGlzIGRlc2lnbmVkXG4gKiBtYWlubHkgYXMgYSB3YXkgdG8gYWNoZWl2ZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHVzZXNDdXRvdXQgIFRoZSBwcmVzZW5jZSBvZiBhIFdlYkdMICdjdXRvdXQnIGZvciB0aGlzIGVsZW1lbnQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0Q3V0b3V0U3RhdGUgPSBmdW5jdGlvbiBzZXRDdXRvdXRTdGF0ZSh1c2VzQ3V0b3V0KSB7XG4gICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnR0xfQ1VUT1VUX1NUQVRFJywgdXNlc0N1dG91dCk7XG5cbiAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyB0aGUgdHJhbnNmb3JtIG1hdHJpeCBhc3NvY2lhdGVkXG4gKiB3aXRoIHRoZSBub2RlIGNoYW5nZXMuIFRoZSBET01FbGVtZW50IHdpbGwgcmVhY3QgdG8gdHJhbnNmb3JtIGNoYW5nZXMgYnkgc2VuZGluZ1xuICogYENIQU5HRV9UUkFOU0ZPUk1gIGNvbW1hbmRzIHRvIHRoZSBgRE9NUmVuZGVyZXJgLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gdHJhbnNmb3JtIFRoZSBmaW5hbCB0cmFuc2Zvcm0gbWF0cml4XG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25UcmFuc2Zvcm1DaGFuZ2UgPSBmdW5jdGlvbiBvblRyYW5zZm9ybUNoYW5nZSAodHJhbnNmb3JtKSB7XG4gICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX1RSQU5TRk9STScpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0cmFuc2Zvcm0ubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKylcbiAgICAgICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCh0cmFuc2Zvcm1baV0pO1xuXG4gICAgdGhpcy5vblVwZGF0ZSgpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgaW52b2tlZCBieSB0aGUgbm9kZSBhcyBzb29uIGFzIGl0cyBjb21wdXRlZCBzaXplIGNoYW5nZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBzaXplIFNpemUgb2YgdGhlIE5vZGUgaW4gcGl4ZWxzXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblNpemVDaGFuZ2UgPSBmdW5jdGlvbiBvblNpemVDaGFuZ2Uoc2l6ZSkge1xuICAgIHZhciBzaXplTW9kZSA9IHRoaXMuX25vZGUuZ2V0U2l6ZU1vZGUoKTtcbiAgICB2YXIgc2l6ZWRYID0gc2l6ZU1vZGVbMF0gIT09IFJFTkRFUl9TSVpFO1xuICAgIHZhciBzaXplZFkgPSBzaXplTW9kZVsxXSAhPT0gUkVOREVSX1NJWkU7XG4gICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKVxuICAgICAgICB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdDSEFOR0VfU0laRScsXG4gICAgICAgICAgICBzaXplZFggPyBzaXplWzBdIDogc2l6ZWRYLFxuICAgICAgICAgICAgc2l6ZWRZID8gc2l6ZVsxXSA6IHNpemVkWSk7XG5cbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyBpdHMgb3BhY2l0eSBjaGFuZ2VzXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBvcGFjaXR5IFRoZSBuZXcgb3BhY2l0eSwgYXMgYSBzY2FsYXIgZnJvbSAwIHRvIDFcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uT3BhY2l0eUNoYW5nZSA9IGZ1bmN0aW9uIG9uT3BhY2l0eUNoYW5nZShvcGFjaXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ29wYWNpdHknLCBvcGFjaXR5KTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyBhIG5ldyBVSUV2ZW50IGlzIGJlaW5nIGFkZGVkLlxuICogVGhpcyByZXN1bHRzIGludG8gYW4gYEFERF9FVkVOVF9MSVNURU5FUmAgY29tbWFuZCBiZWluZyBzZW5kLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBVSUV2ZW50IFVJRXZlbnQgdG8gYmUgc3Vic2NyaWJlZCB0byAoZS5nLiBgY2xpY2tgKVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uQWRkVUlFdmVudCA9IGZ1bmN0aW9uIG9uQWRkVUlFdmVudChVSUV2ZW50KSB7XG4gICAgaWYgKHRoaXMuX1VJRXZlbnRzLmluZGV4T2YoVUlFdmVudCkgPT09IC0xKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZShVSUV2ZW50KTtcbiAgICAgICAgdGhpcy5fVUlFdmVudHMucHVzaChVSUV2ZW50KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5faW5EcmF3KSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZShVSUV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGVuZHMgYW4gYEFERF9FVkVOVF9MSVNURU5FUmAgY29tbWFuZCB0byB0aGUgY29tbWFuZCBxdWV1ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBVSUV2ZW50IEV2ZW50IHR5cGUgKGUuZy4gYGNsaWNrYClcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24gX3N1YnNjcmliZSAoVUlFdmVudCkge1xuICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkge1xuICAgICAgICB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdTVUJTQ1JJQkUnLCBVSUV2ZW50LCB0cnVlKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgdGhlIHVuZGVybHlpbmcgc2l6ZSBtb2RlXG4gKiBjaGFuZ2VzLiBUaGlzIHJlc3VsdHMgaW50byB0aGUgc2l6ZSBiZWluZyBmZXRjaGVkIGZyb20gdGhlIG5vZGUgaW5cbiAqIG9yZGVyIHRvIHVwZGF0ZSB0aGUgYWN0dWFsLCByZW5kZXJlZCBzaXplLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCB0aGUgc2l6aW5nIG1vZGUgaW4gdXNlIGZvciBkZXRlcm1pbmluZyBzaXplIGluIHRoZSB4IGRpcmVjdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IHkgdGhlIHNpemluZyBtb2RlIGluIHVzZSBmb3IgZGV0ZXJtaW5pbmcgc2l6ZSBpbiB0aGUgeSBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IHRoZSBzaXppbmcgbW9kZSBpbiB1c2UgZm9yIGRldGVybWluaW5nIHNpemUgaW4gdGhlIHogZGlyZWN0aW9uXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25TaXplTW9kZUNoYW5nZSA9IGZ1bmN0aW9uIG9uU2l6ZU1vZGVDaGFuZ2UoeCwgeSwgeikge1xuICAgIGlmICh4ID09PSBSRU5ERVJfU0laRSB8fCB5ID09PSBSRU5ERVJfU0laRSB8fCB6ID09PSBSRU5ERVJfU0laRSkge1xuICAgICAgICB0aGlzLl9yZW5kZXJTaXplZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5vblNpemVDaGFuZ2UodGhpcy5fbm9kZS5nZXRTaXplKCkpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgcmV0cmlldmUgdGhlIHJlbmRlcmVkIHNpemUgb2YgdGhlIERPTSBlbGVtZW50IHRoYXQgaXNcbiAqIGRyYXduIGZvciB0aGlzIG5vZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBzaXplIG9mIHRoZSByZW5kZXJlZCBET00gZWxlbWVudCBpbiBwaXhlbHNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuZ2V0UmVuZGVyU2l6ZSA9IGZ1bmN0aW9uIGdldFJlbmRlclNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlclNpemU7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBoYXZlIHRoZSBjb21wb25lbnQgcmVxdWVzdCBhbiB1cGRhdGUgZnJvbSBpdHMgTm9kZVxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuX3JlcXVlc3RVcGRhdGUgPSBmdW5jdGlvbiBfcmVxdWVzdFVwZGF0ZSgpIHtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgRE9NRWxlbWVudCBieSBzZW5kaW5nIHRoZSBgSU5JVF9ET01gIGNvbW1hbmQuIFRoaXMgY3JlYXRlc1xuICogb3IgcmVhbGxvY2F0ZXMgYSBuZXcgRWxlbWVudCBpbiB0aGUgYWN0dWFsIERPTSBoaWVyYXJjaHkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0lOSVRfRE9NJywgdGhpcy5fdGFnTmFtZSk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHRoaXMub25UcmFuc2Zvcm1DaGFuZ2UodGhpcy5fbm9kZS5nZXRUcmFuc2Zvcm0oKSk7XG4gICAgdGhpcy5vblNpemVDaGFuZ2UodGhpcy5fbm9kZS5nZXRTaXplKCkpO1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBpZCBhdHRyaWJ1dGUgb2YgdGhlIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCBOZXcgaWQgdG8gYmUgc2V0XG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5zZXRJZCA9IGZ1bmN0aW9uIHNldElkIChpZCkge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhIG5ldyBjbGFzcyB0byB0aGUgaW50ZXJuYWwgY2xhc3MgbGlzdCBvZiB0aGUgdW5kZXJseWluZyBFbGVtZW50IGluIHRoZVxuICogRE9NLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgTmV3IGNsYXNzIG5hbWUgdG8gYmUgYWRkZWRcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gYWRkQ2xhc3MgKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2NsYXNzZXMuaW5kZXhPZih2YWx1ZSkgPCAwKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQUREX0NMQVNTJywgdmFsdWUpO1xuICAgICAgICB0aGlzLl9jbGFzc2VzLnB1c2godmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlclNpemVkKSB0aGlzLl9yZXF1ZXN0UmVuZGVyU2l6ZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9pbkRyYXcpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdBRERfQ0xBU1MnLCB2YWx1ZSk7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhIGNsYXNzIGZyb20gdGhlIERPTUVsZW1lbnQncyBjbGFzc0xpc3QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBDbGFzcyBuYW1lIHRvIGJlIHJlbW92ZWRcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gcmVtb3ZlQ2xhc3MgKHZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fY2xhc3Nlcy5pbmRleE9mKHZhbHVlKTtcblxuICAgIGlmIChpbmRleCA8IDApIHJldHVybiB0aGlzO1xuXG4gICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnUkVNT1ZFX0NMQVNTJywgdmFsdWUpO1xuXG4gICAgdGhpcy5fY2xhc3Nlcy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBET01FbGVtZW50IGhhcyB0aGUgcGFzc2VkIGluIGNsYXNzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgVGhlIGNsYXNzIG5hbWVcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGluZGljYXRpbmcgd2hldGhlciB0aGUgcGFzc2VkIGluIGNsYXNzIG5hbWUgaXMgaW4gdGhlIERPTUVsZW1lbnQncyBjbGFzcyBsaXN0LlxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uIGhhc0NsYXNzICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9jbGFzc2VzLmluZGV4T2YodmFsdWUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogU2V0cyBhbiBhdHRyaWJ1dGUgb2YgdGhlIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIEF0dHJpYnV0ZSBrZXkgKGUuZy4gYHNyY2ApXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgQXR0cmlidXRlIHZhbHVlIChlLmcuIGBodHRwOi8vZmFtby51c2ApXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUgKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2F0dHJpYnV0ZXNbbmFtZV0gIT09IHZhbHVlIHx8IHRoaXMuX2luRHJhdykge1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX0FUVFJJQlVURScsIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0VXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgYSBDU1MgcHJvcGVydHlcbiAqXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgIE5hbWUgb2YgdGhlIENTUyBydWxlIChlLmcuIGBiYWNrZ3JvdW5kLWNvbG9yYClcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBWYWx1ZSBvZiBDU1MgcHJvcGVydHkgKGUuZy4gYHJlZGApXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5zZXRQcm9wZXJ0eSA9IGZ1bmN0aW9uIHNldFByb3BlcnR5IChuYW1lLCB2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9zdHlsZXNbbmFtZV0gIT09IHZhbHVlIHx8IHRoaXMuX2luRHJhdykge1xuICAgICAgICB0aGlzLl9zdHlsZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdDSEFOR0VfUFJPUEVSVFknLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyU2l6ZWQpIHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgY29udGVudCBvZiB0aGUgRE9NRWxlbWVudC4gVGhpcyBpcyB1c2luZyBgaW5uZXJIVE1MYCwgZXNjYXBpbmcgdXNlclxuICogZ2VuZXJhdGVkIGNvbnRlbnQgaXMgdGhlcmVmb3JlIGVzc2VudGlhbCBmb3Igc2VjdXJpdHkgcHVycG9zZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50IENvbnRlbnQgdG8gYmUgc2V0IHVzaW5nIGAuaW5uZXJIVE1MID0gLi4uYFxuICpcbiAqIEByZXR1cm4ge0RPTUVsZW1lbnR9IHRoaXNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uIHNldENvbnRlbnQgKGNvbnRlbnQpIHtcbiAgICBpZiAodGhpcy5fY29udGVudCAhPT0gY29udGVudCB8fCB0aGlzLl9pbkRyYXcpIHtcbiAgICAgICAgdGhpcy5fY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX0NPTlRFTlQnLCBjb250ZW50KTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJTaXplZCkgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIGEgRE9NRWxlbWVudCB1c2luZy5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50ICAgICAgIFRoZSBldmVudCB0eXBlIChlLmcuIGBjbGlja2ApLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgIEhhbmRsZXIgZnVuY3Rpb24gZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgdHlwZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiB3aGljaCB0aGUgcGF5bG9hZCBldmVudCBvYmplY3Qgd2lsbCBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgaW50by5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0byBjYWxsIGlmIHlvdSB3YW50IHRvIHJlbW92ZSB0aGUgY2FsbGJhY2tcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrcy5vbihldmVudCwgbGlzdGVuZXIpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBpbnZva2VkIGJ5IHRoZSBOb2RlIHdoZW5ldmVyIGFuIGV2ZW50IGlzIGJlaW5nIHJlY2VpdmVkLlxuICogVGhlcmUgYXJlIHR3byBkaWZmZXJlbnQgd2F5cyB0byBzdWJzY3JpYmUgZm9yIHRob3NlIGV2ZW50czpcbiAqXG4gKiAxLiBCeSBvdmVycmlkaW5nIHRoZSBvblJlY2VpdmUgbWV0aG9kIChhbmQgcG9zc2libHkgdXNpbmcgYHN3aXRjaGAgaW4gb3JkZXJcbiAqICAgICB0byBkaWZmZXJlbnRpYXRlIGJldHdlZW4gdGhlIGRpZmZlcmVudCBldmVudCB0eXBlcykuXG4gKiAyLiBCeSB1c2luZyBET01FbGVtZW50IGFuZCB1c2luZyB0aGUgYnVpbHQtaW4gQ2FsbGJhY2tTdG9yZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IEV2ZW50IHR5cGUgKGUuZy4gYGNsaWNrYClcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXlsb2FkIEV2ZW50IG9iamVjdC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblJlY2VpdmUgPSBmdW5jdGlvbiBvblJlY2VpdmUgKGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgaWYgKGV2ZW50ID09PSAncmVzaXplJykge1xuICAgICAgICB0aGlzLl9yZW5kZXJTaXplWzBdID0gcGF5bG9hZC52YWxbMF07XG4gICAgICAgIHRoaXMuX3JlbmRlclNpemVbMV0gPSBwYXlsb2FkLnZhbFsxXTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgfVxuICAgIHRoaXMuX2NhbGxiYWNrcy50cmlnZ2VyKGV2ZW50LCBwYXlsb2FkKTtcbn07XG5cbi8qKlxuICogVGhlIGRyYXcgZnVuY3Rpb24gaXMgYmVpbmcgdXNlZCBpbiBvcmRlciB0byBhbGxvdyBtdXRhdGluZyB0aGUgRE9NRWxlbWVudFxuICogYmVmb3JlIGFjdHVhbGx5IG1vdW50aW5nIHRoZSBjb3JyZXNwb25kaW5nIG5vZGUuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdygpIHtcbiAgICB2YXIga2V5O1xuICAgIHZhciBpO1xuICAgIHZhciBsZW47XG5cbiAgICB0aGlzLl9pbkRyYXcgPSB0cnVlO1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9jbGFzc2VzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5fY2xhc3Nlc1tpXSk7XG5cbiAgICBpZiAodGhpcy5fY29udGVudCkgdGhpcy5zZXRDb250ZW50KHRoaXMuX2NvbnRlbnQpO1xuXG4gICAgZm9yIChrZXkgaW4gdGhpcy5fc3R5bGVzKVxuICAgICAgICBpZiAodGhpcy5fc3R5bGVzW2tleV0pXG4gICAgICAgICAgICB0aGlzLnNldFByb3BlcnR5KGtleSwgdGhpcy5fc3R5bGVzW2tleV0pO1xuXG4gICAgZm9yIChrZXkgaW4gdGhpcy5fYXR0cmlidXRlcylcbiAgICAgICAgaWYgKHRoaXMuX2F0dHJpYnV0ZXNba2V5XSlcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdGhpcy5fYXR0cmlidXRlc1trZXldKTtcblxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuX1VJRXZlbnRzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIHRoaXMub25BZGRVSUV2ZW50KHRoaXMuX1VJRXZlbnRzW2ldKTtcblxuICAgIHRoaXMuX2luRHJhdyA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBET01FbGVtZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRWxlbWVudENhY2hlID0gcmVxdWlyZSgnLi9FbGVtZW50Q2FjaGUnKTtcbnZhciBtYXRoID0gcmVxdWlyZSgnLi9NYXRoJyk7XG52YXIgdmVuZG9yUHJlZml4ID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL3ZlbmRvclByZWZpeCcpO1xudmFyIGV2ZW50TWFwID0gcmVxdWlyZSgnLi9ldmVudHMvRXZlbnRNYXAnKTtcblxudmFyIFRSQU5TRk9STSA9IG51bGw7XG5cbi8qKlxuICogRE9NUmVuZGVyZXIgaXMgYSBjbGFzcyByZXNwb25zaWJsZSBmb3IgYWRkaW5nIGVsZW1lbnRzXG4gKiB0byB0aGUgRE9NIGFuZCB3cml0aW5nIHRvIHRob3NlIGVsZW1lbnRzLlxuICogVGhlcmUgaXMgYSBET01SZW5kZXJlciBwZXIgY29udGV4dCwgcmVwcmVzZW50ZWQgYXMgYW5cbiAqIGVsZW1lbnQgYW5kIGEgc2VsZWN0b3IuIEl0IGlzIGluc3RhbnRpYXRlZCBpbiB0aGVcbiAqIGNvbnRleHQgY2xhc3MuXG4gKlxuICogQGNsYXNzIERPTVJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBhbiBlbGVtZW50LlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIHRoZSBzZWxlY3RvciBvZiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSB7Q29tcG9zaXRvcn0gY29tcG9zaXRvciB0aGUgY29tcG9zaXRvciBjb250cm9sbGluZyB0aGUgcmVuZGVyZXJcbiAqL1xuZnVuY3Rpb24gRE9NUmVuZGVyZXIgKGVsZW1lbnQsIHNlbGVjdG9yLCBjb21wb3NpdG9yKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmYW1vdXMtZG9tLXJlbmRlcmVyJyk7XG5cbiAgICBUUkFOU0ZPUk0gPSBUUkFOU0ZPUk0gfHwgdmVuZG9yUHJlZml4KCd0cmFuc2Zvcm0nKTtcbiAgICB0aGlzLl9jb21wb3NpdG9yID0gY29tcG9zaXRvcjsgLy8gYSByZWZlcmVuY2UgdG8gdGhlIGNvbXBvc2l0b3JcblxuICAgIHRoaXMuX3RhcmdldCA9IG51bGw7IC8vIGEgcmVnaXN0ZXIgZm9yIGhvbGRpbmcgdGhlIGN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbGVtZW50IHRoYXQgdGhlIFJlbmRlcmVyIGlzIG9wZXJhdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwb25cblxuICAgIHRoaXMuX3BhcmVudCA9IG51bGw7IC8vIGEgcmVnaXN0ZXIgZm9yIGhvbGRpbmcgdGhlIHBhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSB0YXJnZXRcblxuICAgIHRoaXMuX3BhdGggPSBudWxsOyAvLyBhIHJlZ2lzdGVyIGZvciBob2xkaW5nIHRoZSBwYXRoIG9mIHRoZSB0YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyByZWdpc3RlciBtdXN0IGJlIHNldCBmaXJzdCwgYW5kIHRoZW5cbiAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hpbGRyZW4sIHRhcmdldCwgYW5kIHBhcmVudCBhcmUgYWxsIGxvb2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAvLyB1cCBmcm9tIHRoYXQuXG5cbiAgICB0aGlzLl9jaGlsZHJlbiA9IFtdOyAvLyBhIHJlZ2lzdGVyIGZvciBob2xkaW5nIHRoZSBjaGlsZHJlbiBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjdXJyZW50IHRhcmdldC5cblxuICAgIHRoaXMuX3Jvb3QgPSBuZXcgRWxlbWVudENhY2hlKGVsZW1lbnQsIHNlbGVjdG9yKTsgLy8gdGhlIHJvb3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSBkb20gdHJlZSB0aGF0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbmRlcmVyIGlzIHJlc3BvbnNpYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3JcblxuICAgIHRoaXMuX2JvdW5kVHJpZ2dlckV2ZW50ID0gdGhpcy5fdHJpZ2dlckV2ZW50LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLl9zZWxlY3RvciA9IHNlbGVjdG9yO1xuXG4gICAgdGhpcy5fZWxlbWVudHMgPSB7fTtcblxuICAgIHRoaXMuX2VsZW1lbnRzW3NlbGVjdG9yXSA9IHRoaXMuX3Jvb3Q7XG5cbiAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuICAgIHRoaXMuX1ZQdHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuXG4gICAgdGhpcy5fc2l6ZSA9IFtudWxsLCBudWxsXTtcbn1cblxuXG4vKipcbiAqIEF0dGFjaGVzIGFuIEV2ZW50TGlzdGVuZXIgdG8gdGhlIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQgaW4gcGF0aC5cbiAqIFByZXZlbnRzIHRoZSBkZWZhdWx0IGJyb3dzZXIgYWN0aW9uIG9uIGFsbCBzdWJzZXF1ZW50IGV2ZW50cyBpZlxuICogYHByZXZlbnREZWZhdWx0YCBpcyB0cnV0aHkuXG4gKiBBbGwgaW5jb21pbmcgZXZlbnRzIHdpbGwgYmUgZm9yd2FyZGVkIHRvIHRoZSBjb21wb3NpdG9yIGJ5IGludm9raW5nIHRoZVxuICogYHNlbmRFdmVudGAgbWV0aG9kLlxuICogRGVsZWdhdGVzIGV2ZW50cyBpZiBwb3NzaWJsZSBieSBhdHRhY2hpbmcgdGhlIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBET00gZXZlbnQgdHlwZSAoZS5nLiBjbGljaywgbW91c2VvdmVyKS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJldmVudERlZmF1bHQgV2hldGhlciBvciBub3QgdGhlIGRlZmF1bHQgYnJvd3NlciBhY3Rpb24gc2hvdWxkIGJlIHByZXZlbnRlZC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHR5cGUsIHByZXZlbnREZWZhdWx0KSB7XG4gICAgLy8gVE9ETyBwcmV2ZW50RGVmYXVsdCBzaG91bGQgYmUgYSBzZXBhcmF0ZSBjb21tYW5kXG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG5cbiAgICB0aGlzLl90YXJnZXQucHJldmVudERlZmF1bHRbdHlwZV0gPSBwcmV2ZW50RGVmYXVsdDtcbiAgICB0aGlzLl90YXJnZXQuc3Vic2NyaWJlW3R5cGVdID0gdHJ1ZTtcblxuICAgIGlmIChcbiAgICAgICAgIXRoaXMuX3RhcmdldC5saXN0ZW5lcnNbdHlwZV0gJiYgIXRoaXMuX3Jvb3QubGlzdGVuZXJzW3R5cGVdXG4gICAgKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBldmVudE1hcFt0eXBlXVsxXSA/IHRoaXMuX3Jvb3QgOiB0aGlzLl90YXJnZXQ7XG4gICAgICAgIHRhcmdldC5saXN0ZW5lcnNbdHlwZV0gPSB0aGlzLl9ib3VuZFRyaWdnZXJFdmVudDtcbiAgICAgICAgdGFyZ2V0LmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCB0aGlzLl9ib3VuZFRyaWdnZXJFdmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBhZGRlZCB1c2luZyBgYWRkRXZlbnRMaXN0ZW5lcmAgdG8gdGhlIGNvcnJlc3BvbmRpbmdcbiAqIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBET00gRXZlbnQgcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fdHJpZ2dlckV2ZW50ID0gZnVuY3Rpb24gX3RyaWdnZXJFdmVudChldikge1xuICAgIC8vIFVzZSBldi5wYXRoLCB3aGljaCBpcyBhbiBhcnJheSBvZiBFbGVtZW50cyAocG9seWZpbGxlZCBpZiBuZWVkZWQpLlxuICAgIHZhciBldlBhdGggPSBldi5wYXRoID8gZXYucGF0aCA6IF9nZXRQYXRoKGV2KTtcbiAgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBwYXRoIGlzIHRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBldmVudCBoYXMgYWN0dWFsbHlcbiAgICAvLyBiZWVuIGVtaXR0ZWQuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldlBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gU2tpcCBub2RlcyB0aGF0IGRvbid0IGhhdmUgYSBkYXRhc2V0IHByb3BlcnR5IG9yIGRhdGEtZmEtcGF0aFxuICAgICAgICAvLyBhdHRyaWJ1dGUuXG4gICAgICAgIGlmICghZXZQYXRoW2ldLmRhdGFzZXQpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgcGF0aCA9IGV2UGF0aFtpXS5kYXRhc2V0LmZhUGF0aDtcbiAgICAgICAgaWYgKCFwYXRoKSBjb250aW51ZTtcblxuICAgICAgICAvLyBTdG9wIGZ1cnRoZXIgZXZlbnQgcHJvcG9nYXRpb24gYW5kIHBhdGggdHJhdmVyc2FsIGFzIHNvb24gYXMgdGhlXG4gICAgICAgIC8vIGZpcnN0IEVsZW1lbnRDYWNoZSBzdWJzY3JpYmluZyBmb3IgdGhlIGVtaXR0ZWQgZXZlbnQgaGFzIGJlZW4gZm91bmQuXG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50c1twYXRoXS5zdWJzY3JpYmVbZXYudHlwZV0pIHtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5IHByZXZlbnREZWZhdWx0LiBUaGlzIG5lZWRzIGZvcnRoZXIgY29uc2lkZXJhdGlvbiBhbmRcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBvcHRpb25hbC4gRXZlbnR1YWxseSB0aGlzIHNob3VsZCBiZSBhIHNlcGFyYXRlIGNvbW1hbmQvXG4gICAgICAgICAgICAvLyBtZXRob2QuXG4gICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudHNbcGF0aF0ucHJldmVudERlZmF1bHRbZXYudHlwZV0pIHtcbiAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgTm9ybWFsaXplZEV2ZW50Q29uc3RydWN0b3IgPSBldmVudE1hcFtldi50eXBlXVswXTtcblxuICAgICAgICAgICAgLy8gRmluYWxseSBzZW5kIHRoZSBldmVudCB0byB0aGUgV29ya2VyIFRocmVhZCB0aHJvdWdoIHRoZVxuICAgICAgICAgICAgLy8gY29tcG9zaXRvci5cbiAgICAgICAgICAgIHRoaXMuX2NvbXBvc2l0b3Iuc2VuZEV2ZW50KHBhdGgsIGV2LnR5cGUsIG5ldyBOb3JtYWxpemVkRXZlbnRDb25zdHJ1Y3RvcihldikpO1xuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLyoqXG4gKiBnZXRTaXplT2YgZ2V0cyB0aGUgZG9tIHNpemUgb2YgYSBwYXJ0aWN1bGFyIERPTSBlbGVtZW50LiAgVGhpcyBpc1xuICogbmVlZGVkIGZvciByZW5kZXIgc2l6aW5nIGluIHRoZSBzY2VuZSBncmFwaC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggcGF0aCBvZiB0aGUgTm9kZSBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSB2ZWMzIG9mIHRoZSBvZmZzZXQgc2l6ZSBvZiB0aGUgZG9tIGVsZW1lbnRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLmdldFNpemVPZiA9IGZ1bmN0aW9uIGdldFNpemVPZihwYXRoKSB7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50c1twYXRoXTtcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBudWxsO1xuXG4gICAgdmFyIHJlcyA9IHt2YWw6IGVsZW1lbnQuc2l6ZX07XG4gICAgdGhpcy5fY29tcG9zaXRvci5zZW5kRXZlbnQocGF0aCwgJ3Jlc2l6ZScsIHJlcyk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbmZ1bmN0aW9uIF9nZXRQYXRoKGV2KSB7XG4gICAgLy8gVE9ETyBtb3ZlIGludG8gX3RyaWdnZXJFdmVudCwgYXZvaWQgb2JqZWN0IGFsbG9jYXRpb25cbiAgICB2YXIgcGF0aCA9IFtdO1xuICAgIHZhciBub2RlID0gZXYudGFyZ2V0O1xuICAgIHdoaWxlIChub2RlICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG59XG5cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBzaXplIG9mIHRoZSBjb250ZXh0IGJ5IHF1ZXJ5aW5nIHRoZSBET00gZm9yIGBvZmZzZXRXaWR0aGAgYW5kXG4gKiBgb2Zmc2V0SGVpZ2h0YC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IE9mZnNldCBzaXplLlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uIGdldFNpemUoKSB7XG4gICAgdGhpcy5fc2l6ZVswXSA9IHRoaXMuX3Jvb3QuZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICB0aGlzLl9zaXplWzFdID0gdGhpcy5fcm9vdC5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcbn07XG5cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fZ2V0U2l6ZSA9IERPTVJlbmRlcmVyLnByb3RvdHlwZS5nZXRTaXplO1xuXG5cbi8qKlxuICogRXhlY3V0ZXMgdGhlIHJldHJpZXZlZCBkcmF3IGNvbW1hbmRzLiBEcmF3IGNvbW1hbmRzIG9ubHkgcmVmZXIgdG8gdGhlXG4gKiBjcm9zcy1icm93c2VyIG5vcm1hbGl6ZWQgYHRyYW5zZm9ybWAgcHJvcGVydHkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJTdGF0ZSBkZXNjcmlwdGlvblxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdyhyZW5kZXJTdGF0ZSkge1xuICAgIGlmIChyZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5KSB7XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVswXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzBdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzFdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMV07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMl0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsyXTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVszXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzNdO1xuXG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bNF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs0XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs1XSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzVdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzZdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bNl07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bN10gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs3XTtcblxuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzhdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bOF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bOV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs5XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdO1xuXG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTJdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTJdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzEzXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzEzXTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxNF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxNF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTVdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTVdO1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJTdGF0ZS52aWV3RGlydHkgfHwgcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVEaXJ0eSkge1xuICAgICAgICBtYXRoLm11bHRpcGx5KHRoaXMuX1ZQdHJhbnNmb3JtLCB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtLCByZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtKTtcbiAgICAgICAgdGhpcy5fcm9vdC5lbGVtZW50LnN0eWxlW1RSQU5TRk9STV0gPSB0aGlzLl9zdHJpbmdpZnlNYXRyaXgodGhpcy5fVlB0cmFuc2Zvcm0pO1xuICAgIH1cbn07XG5cblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgZnVuY3Rpb24gdXNlZCBmb3IgZW5zdXJpbmcgdGhhdCBhIHBhdGggaXMgY3VycmVudGx5IGxvYWRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fYXNzZXJ0UGF0aExvYWRlZCA9IGZ1bmN0aW9uIF9hc3NlclBhdGhMb2FkZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXRoKSB0aHJvdyBuZXcgRXJyb3IoJ3BhdGggbm90IGxvYWRlZCcpO1xufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgZnVuY3Rpb24gdXNlZCBmb3IgZW5zdXJpbmcgdGhhdCBhIHBhcmVudCBpcyBjdXJyZW50bHkgbG9hZGVkLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9hc3NlcnRQYXJlbnRMb2FkZWQgPSBmdW5jdGlvbiBfYXNzZXJ0UGFyZW50TG9hZGVkKCkge1xuICAgIGlmICghdGhpcy5fcGFyZW50KSB0aHJvdyBuZXcgRXJyb3IoJ3BhcmVudCBub3QgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBlbnN1cmluZyB0aGF0IGNoaWxkcmVuIGFyZSBjdXJyZW50bHlcbiAqIGxvYWRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fYXNzZXJ0Q2hpbGRyZW5Mb2FkZWQgPSBmdW5jdGlvbiBfYXNzZXJ0Q2hpbGRyZW5Mb2FkZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9jaGlsZHJlbikgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiBub3QgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBlbnN1cmluZyB0aGF0IGEgdGFyZ2V0IGlzIGN1cnJlbnRseSBsb2FkZWQuXG4gKlxuICogQG1ldGhvZCAgX2Fzc2VydFRhcmdldExvYWRlZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5fYXNzZXJ0VGFyZ2V0TG9hZGVkID0gZnVuY3Rpb24gX2Fzc2VydFRhcmdldExvYWRlZCgpIHtcbiAgICBpZiAoIXRoaXMuX3RhcmdldCkgdGhyb3cgbmV3IEVycm9yKCdObyB0YXJnZXQgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEZpbmRzIGFuZCBzZXRzIHRoZSBwYXJlbnQgb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgZWxlbWVudCAocGF0aCkuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHtFbGVtZW50Q2FjaGV9IFBhcmVudCBlbGVtZW50LlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZmluZFBhcmVudCA9IGZ1bmN0aW9uIGZpbmRQYXJlbnQgKCkge1xuICAgIHRoaXMuX2Fzc2VydFBhdGhMb2FkZWQoKTtcblxuICAgIHZhciBwYXRoID0gdGhpcy5fcGF0aDtcbiAgICB2YXIgcGFyZW50O1xuXG4gICAgd2hpbGUgKCFwYXJlbnQgJiYgcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIHBhdGgubGFzdEluZGV4T2YoJy8nKSk7XG4gICAgICAgIHBhcmVudCA9IHRoaXMuX2VsZW1lbnRzW3BhdGhdO1xuICAgIH1cbiAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgcmV0dXJuIHBhcmVudDtcbn07XG5cblxuLyoqXG4gKiBGaW5kcyBhbGwgY2hpbGRyZW4gb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgZWxlbWVudC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IE91dHB1dC1BcnJheSB1c2VkIGZvciB3cml0aW5nIHRvIChzdWJzZXF1ZW50bHkgYXBwZW5kaW5nIGNoaWxkcmVuKVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiBjaGlsZHJlbiBlbGVtZW50c1xuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZmluZENoaWxkcmVuID0gZnVuY3Rpb24gZmluZENoaWxkcmVuKGFycmF5KSB7XG4gICAgLy8gVE9ETzogT3B0aW1pemUgbWUuXG4gICAgdGhpcy5fYXNzZXJ0UGF0aExvYWRlZCgpO1xuXG4gICAgdmFyIHBhdGggPSB0aGlzLl9wYXRoICsgJy8nO1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcy5fZWxlbWVudHMpO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgbGVuO1xuICAgIGFycmF5ID0gYXJyYXkgPyBhcnJheSA6IHRoaXMuX2NoaWxkcmVuO1xuXG4gICAgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoID0gMDtcblxuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGtleXNbaV0uaW5kZXhPZihwYXRoKSA9PT0gLTEgfHwga2V5c1tpXSA9PT0gcGF0aCkga2V5cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGVsc2UgaSsrO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFBhdGg7XG4gICAgdmFyIGogPSAwO1xuICAgIGZvciAoaSA9IDAgOyBpIDwga2V5cy5sZW5ndGggOyBpKyspIHtcbiAgICAgICAgY3VycmVudFBhdGggPSBrZXlzW2ldO1xuICAgICAgICBmb3IgKGogPSAwIDsgaiA8IGtleXMubGVuZ3RoIDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoaSAhPT0gaiAmJiBrZXlzW2pdLmluZGV4T2YoY3VycmVudFBhdGgpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGtleXMuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIGFycmF5W2ldID0gdGhpcy5fZWxlbWVudHNba2V5c1tpXV07XG5cbiAgICByZXR1cm4gYXJyYXk7XG59O1xuXG5cbi8qKlxuICogVXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlIHRhcmdldCBsb2FkZWQgdW5kZXIgdGhlIGN1cnJlbnQgcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RWxlbWVudENhY2hlfHVuZGVmaW5lZH0gRWxlbWVudCBsb2FkZWQgdW5kZXIgZGVmaW5lZCBwYXRoLlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZmluZFRhcmdldCA9IGZ1bmN0aW9uIGZpbmRUYXJnZXQoKSB7XG4gICAgdGhpcy5fdGFyZ2V0ID0gdGhpcy5fZWxlbWVudHNbdGhpcy5fcGF0aF07XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldDtcbn07XG5cblxuLyoqXG4gKiBMb2FkcyB0aGUgcGFzc2VkIGluIHBhdGguXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdG8gYmUgbG9hZGVkXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBMb2FkZWQgcGF0aFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUubG9hZFBhdGggPSBmdW5jdGlvbiBsb2FkUGF0aCAocGF0aCkge1xuICAgIHRoaXMuX3BhdGggPSBwYXRoO1xuICAgIHJldHVybiB0aGlzLl9wYXRoO1xufTtcblxuXG4vKipcbiAqIEluc2VydHMgYSBET01FbGVtZW50IGF0IHRoZSBjdXJyZW50bHkgbG9hZGVkIHBhdGgsIGFzc3VtaW5nIG5vIHRhcmdldCBpc1xuICogbG9hZGVkLiBPbmx5IG9uZSBET01FbGVtZW50IGNhbiBiZSBhc3NvY2lhdGVkIHdpdGggZWFjaCBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFnTmFtZSBUYWcgbmFtZSAoY2FwaXRhbGl6YXRpb24gd2lsbCBiZSBub3JtYWxpemVkKS5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuaW5zZXJ0RWwgPSBmdW5jdGlvbiBpbnNlcnRFbCAodGFnTmFtZSkge1xuICAgIGlmICghdGhpcy5fdGFyZ2V0IHx8XG4gICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHRhZ05hbWUudG9Mb3dlckNhc2UoKSkge1xuXG4gICAgICAgIHRoaXMuZmluZFBhcmVudCgpO1xuICAgICAgICB0aGlzLmZpbmRDaGlsZHJlbigpO1xuXG4gICAgICAgIHRoaXMuX2Fzc2VydFBhcmVudExvYWRlZCgpO1xuICAgICAgICB0aGlzLl9hc3NlcnRDaGlsZHJlbkxvYWRlZCgpO1xuXG4gICAgICAgIGlmICh0aGlzLl90YXJnZXQpIHRoaXMuX3BhcmVudC5lbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuX3RhcmdldC5lbGVtZW50KTtcblxuICAgICAgICB0aGlzLl90YXJnZXQgPSBuZXcgRWxlbWVudENhY2hlKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSksIHRoaXMuX3BhdGgpO1xuICAgICAgICB0aGlzLl9wYXJlbnQuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl90YXJnZXQuZWxlbWVudCk7XG4gICAgICAgIHRoaXMuX2VsZW1lbnRzW3RoaXMuX3BhdGhdID0gdGhpcy5fdGFyZ2V0O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9jaGlsZHJlbltpXS5lbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuLyoqXG4gKiBTZXRzIGEgcHJvcGVydHkgb24gdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBQcm9wZXJ0eSBuYW1lIChlLmcuIGJhY2tncm91bmQsIGNvbG9yLCBmb250KVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIFByb3BydHkgdmFsdWUgKGUuZy4gYmxhY2ssIDIwcHgpXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldFByb3BlcnR5ID0gZnVuY3Rpb24gc2V0UHJvcGVydHkgKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG4gICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc3R5bGVbbmFtZV0gPSB2YWx1ZTtcbn07XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBzaXplIG9mIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqIFJlbW92ZXMgYW55IGV4cGxpY2l0IHNpemluZyBjb25zdHJhaW50cyB3aGVuIHBhc3NlZCBpbiBgZmFsc2VgXG4gKiAoXCJ0cnVlLXNpemluZ1wiKS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8ZmFsc2V9IHdpZHRoICAgV2lkdGggdG8gYmUgc2V0LlxuICogQHBhcmFtIHtOdW1iZXJ8ZmFsc2V9IGhlaWdodCAgSGVpZ2h0IHRvIGJlIHNldC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uIHNldFNpemUgKHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcblxuICAgIHRoaXMuc2V0V2lkdGgod2lkdGgpO1xuICAgIHRoaXMuc2V0SGVpZ2h0KGhlaWdodCk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHdpZHRoIG9mIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqIFJlbW92ZXMgYW55IGV4cGxpY2l0IHNpemluZyBjb25zdHJhaW50cyB3aGVuIHBhc3NlZCBpbiBgZmFsc2VgXG4gKiAoXCJ0cnVlLXNpemluZ1wiKS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8ZmFsc2V9IHdpZHRoIFdpZHRoIHRvIGJlIHNldC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0V2lkdGggPSBmdW5jdGlvbiBzZXRXaWR0aCh3aWR0aCkge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuXG4gICAgdmFyIGNvbnRlbnRXcmFwcGVyID0gdGhpcy5fdGFyZ2V0LmNvbnRlbnQ7XG5cbiAgICBpZiAod2lkdGggPT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuX3RhcmdldC5leHBsaWNpdFdpZHRoID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNvbnRlbnRXcmFwcGVyKSBjb250ZW50V3JhcHBlci5zdHlsZS53aWR0aCA9ICcnO1xuICAgICAgICB3aWR0aCA9IGNvbnRlbnRXcmFwcGVyID8gY29udGVudFdyYXBwZXIub2Zmc2V0V2lkdGggOiAwO1xuICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuX3RhcmdldC5leHBsaWNpdFdpZHRoID0gZmFsc2U7XG4gICAgICAgIGlmIChjb250ZW50V3JhcHBlcikgY29udGVudFdyYXBwZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIH1cblxuICAgIHRoaXMuX3RhcmdldC5zaXplWzBdID0gd2lkdGg7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGhlaWdodCBvZiB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKiBSZW1vdmVzIGFueSBleHBsaWNpdCBzaXppbmcgY29uc3RyYWludHMgd2hlbiBwYXNzZWQgaW4gYGZhbHNlYFxuICogKFwidHJ1ZS1zaXppbmdcIikuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfGZhbHNlfSBoZWlnaHQgSGVpZ2h0IHRvIGJlIHNldC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0SGVpZ2h0ID0gZnVuY3Rpb24gc2V0SGVpZ2h0KGhlaWdodCkge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuXG4gICAgdmFyIGNvbnRlbnRXcmFwcGVyID0gdGhpcy5fdGFyZ2V0LmNvbnRlbnQ7XG5cbiAgICBpZiAoaGVpZ2h0ID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLl90YXJnZXQuZXhwbGljaXRIZWlnaHQgPSB0cnVlO1xuICAgICAgICBpZiAoY29udGVudFdyYXBwZXIpIGNvbnRlbnRXcmFwcGVyLnN0eWxlLmhlaWdodCA9ICcnO1xuICAgICAgICBoZWlnaHQgPSBjb250ZW50V3JhcHBlciA/IGNvbnRlbnRXcmFwcGVyLm9mZnNldEhlaWdodCA6IDA7XG4gICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLl90YXJnZXQuZXhwbGljaXRIZWlnaHQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGNvbnRlbnRXcmFwcGVyKSBjb250ZW50V3JhcHBlci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgIH1cblxuICAgIHRoaXMuX3RhcmdldC5zaXplWzFdID0gaGVpZ2h0O1xufTtcblxuLyoqXG4gKiBTZXRzIGFuIGF0dHJpYnV0ZSBvbiB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIEF0dHJpYnV0ZSBuYW1lIChlLmcuIGhyZWYpXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgQXR0cmlidXRlIHZhbHVlIChlLmcuIGh0dHA6Ly9mYW1vdXMub3JnKVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcbiAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBgaW5uZXJIVE1MYCBjb250ZW50IG9mIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGNvbnRlbnQgQ29udGVudCB0byBiZSBzZXQgYXMgYGlubmVySFRNTGBcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uIHNldENvbnRlbnQoY29udGVudCkge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuICAgIHRoaXMuZmluZENoaWxkcmVuKCk7XG5cbiAgICBpZiAoIXRoaXMuX3RhcmdldC5jb250ZW50KSB7XG4gICAgICAgIHRoaXMuX3RhcmdldC5jb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3RhcmdldC5jb250ZW50LmNsYXNzTGlzdC5hZGQoJ2ZhbW91cy1kb20tZWxlbWVudC1jb250ZW50Jyk7XG4gICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50Lmluc2VydEJlZm9yZShcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldC5jb250ZW50LFxuICAgICAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuZmlyc3RDaGlsZFxuICAgICAgICApO1xuICAgIH1cbiAgICB0aGlzLl90YXJnZXQuY29udGVudC5pbm5lckhUTUwgPSBjb250ZW50O1xuXG4gICAgdGhpcy5zZXRTaXplKFxuICAgICAgICB0aGlzLl90YXJnZXQuZXhwbGljaXRXaWR0aCA/IGZhbHNlIDogdGhpcy5fdGFyZ2V0LnNpemVbMF0sXG4gICAgICAgIHRoaXMuX3RhcmdldC5leHBsaWNpdEhlaWdodCA/IGZhbHNlIDogdGhpcy5fdGFyZ2V0LnNpemVbMV1cbiAgICApO1xufTtcblxuXG4vKipcbiAqIFNldHMgdGhlIHBhc3NlZCBpbiB0cmFuc2Zvcm0gbWF0cml4ICh3b3JsZCBzcGFjZSkuIEludmVydHMgdGhlIHBhcmVudCdzIHdvcmxkXG4gKiB0cmFuc2Zvcm0uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSB0cmFuc2Zvcm0gVGhlIHRyYW5zZm9ybSBmb3IgdGhlIGxvYWRlZCBET00gRWxlbWVudCBpbiB3b3JsZCBzcGFjZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRNYXRyaXggPSBmdW5jdGlvbiBzZXRNYXRyaXgodHJhbnNmb3JtKSB7XG4gICAgLy8gVE9ETyBEb24ndCBtdWx0aXBseSBtYXRyaWNzIGluIHRoZSBmaXJzdCBwbGFjZS5cbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcbiAgICB0aGlzLmZpbmRQYXJlbnQoKTtcbiAgICB2YXIgd29ybGRUcmFuc2Zvcm0gPSB0aGlzLl90YXJnZXQud29ybGRUcmFuc2Zvcm07XG4gICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcblxuICAgIHZhciBpO1xuICAgIHZhciBsZW47XG5cbiAgICBpZiAodHJhbnNmb3JtKVxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSAxNiA7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGNoYW5nZWQgPSBjaGFuZ2VkID8gY2hhbmdlZCA6IHdvcmxkVHJhbnNmb3JtW2ldID09PSB0cmFuc2Zvcm1baV07XG4gICAgICAgICAgICB3b3JsZFRyYW5zZm9ybVtpXSA9IHRyYW5zZm9ybVtpXTtcbiAgICAgICAgfVxuICAgIGVsc2UgY2hhbmdlZCA9IHRydWU7XG5cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICBtYXRoLmludmVydCh0aGlzLl90YXJnZXQuaW52ZXJ0ZWRQYXJlbnQsIHRoaXMuX3BhcmVudC53b3JsZFRyYW5zZm9ybSk7XG4gICAgICAgIG1hdGgubXVsdGlwbHkodGhpcy5fdGFyZ2V0LmZpbmFsVHJhbnNmb3JtLCB0aGlzLl90YXJnZXQuaW52ZXJ0ZWRQYXJlbnQsIHdvcmxkVHJhbnNmb3JtKTtcblxuICAgICAgICAvLyBUT0RPOiB0aGlzIGlzIGEgdGVtcG9yYXJ5IGZpeCBmb3IgZHJhdyBjb21tYW5kc1xuICAgICAgICAvLyBjb21pbmcgaW4gb3V0IG9mIG9yZGVyXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZmluZENoaWxkcmVuKFtdKTtcbiAgICAgICAgdmFyIHByZXZpb3VzUGF0aCA9IHRoaXMuX3BhdGg7XG4gICAgICAgIHZhciBwcmV2aW91c1RhcmdldCA9IHRoaXMuX3RhcmdldDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gY2hpbGRyZW4ubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5fdGFyZ2V0ID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICB0aGlzLl9wYXRoID0gdGhpcy5fdGFyZ2V0LnBhdGg7XG4gICAgICAgICAgICB0aGlzLnNldE1hdHJpeCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhdGggPSBwcmV2aW91c1BhdGg7XG4gICAgICAgIHRoaXMuX3RhcmdldCA9IHByZXZpb3VzVGFyZ2V0O1xuICAgIH1cblxuICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnN0eWxlW1RSQU5TRk9STV0gPSB0aGlzLl9zdHJpbmdpZnlNYXRyaXgodGhpcy5fdGFyZ2V0LmZpbmFsVHJhbnNmb3JtKTtcbn07XG5cblxuLyoqXG4gKiBBZGRzIGEgY2xhc3MgdG8gdGhlIGNsYXNzTGlzdCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZG9tQ2xhc3MgQ2xhc3MgbmFtZSB0byBiZSBhZGRlZCB0byB0aGUgY3VycmVudCB0YXJnZXQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gYWRkQ2xhc3MoZG9tQ2xhc3MpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcbiAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGRvbUNsYXNzKTtcbn07XG5cblxuLyoqXG4gKiBSZW1vdmVzIGEgY2xhc3MgZnJvbSB0aGUgY2xhc3NMaXN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudGx5IGxvYWRlZFxuICogdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZG9tQ2xhc3MgQ2xhc3MgbmFtZSB0byBiZSByZW1vdmVkIGZyb20gY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZG9tQ2xhc3MpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcbiAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGRvbUNsYXNzKTtcbn07XG5cblxuLyoqXG4gKiBTdHJpbmdpZmllcyB0aGUgcGFzc2VkIGluIG1hdHJpeCBmb3Igc2V0dGluZyB0aGUgYHRyYW5zZm9ybWAgcHJvcGVydHkuXG4gKlxuICogQG1ldGhvZCAgX3N0cmluZ2lmeU1hdHJpeFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBtICAgIE1hdHJpeCBhcyBhbiBhcnJheSBvciBhcnJheS1saWtlIG9iamVjdC5cbiAqIEByZXR1cm4ge1N0cmluZ30gICAgIFN0cmluZ2lmaWVkIG1hdHJpeCBhcyBgbWF0cml4M2RgLXByb3BlcnR5LlxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuX3N0cmluZ2lmeU1hdHJpeCA9IGZ1bmN0aW9uIF9zdHJpbmdpZnlNYXRyaXgobSkge1xuICAgIHZhciByID0gJ21hdHJpeDNkKCc7XG5cbiAgICByICs9IChtWzBdIDwgMC4wMDAwMDEgJiYgbVswXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVswXSArICcsJztcbiAgICByICs9IChtWzFdIDwgMC4wMDAwMDEgJiYgbVsxXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsxXSArICcsJztcbiAgICByICs9IChtWzJdIDwgMC4wMDAwMDEgJiYgbVsyXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsyXSArICcsJztcbiAgICByICs9IChtWzNdIDwgMC4wMDAwMDEgJiYgbVszXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVszXSArICcsJztcbiAgICByICs9IChtWzRdIDwgMC4wMDAwMDEgJiYgbVs0XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVs0XSArICcsJztcbiAgICByICs9IChtWzVdIDwgMC4wMDAwMDEgJiYgbVs1XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVs1XSArICcsJztcbiAgICByICs9IChtWzZdIDwgMC4wMDAwMDEgJiYgbVs2XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVs2XSArICcsJztcbiAgICByICs9IChtWzddIDwgMC4wMDAwMDEgJiYgbVs3XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVs3XSArICcsJztcbiAgICByICs9IChtWzhdIDwgMC4wMDAwMDEgJiYgbVs4XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVs4XSArICcsJztcbiAgICByICs9IChtWzldIDwgMC4wMDAwMDEgJiYgbVs5XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVs5XSArICcsJztcbiAgICByICs9IChtWzEwXSA8IDAuMDAwMDAxICYmIG1bMTBdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzEwXSArICcsJztcbiAgICByICs9IChtWzExXSA8IDAuMDAwMDAxICYmIG1bMTFdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzExXSArICcsJztcbiAgICByICs9IChtWzEyXSA8IDAuMDAwMDAxICYmIG1bMTJdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzEyXSArICcsJztcbiAgICByICs9IChtWzEzXSA8IDAuMDAwMDAxICYmIG1bMTNdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzEzXSArICcsJztcbiAgICByICs9IChtWzE0XSA8IDAuMDAwMDAxICYmIG1bMTRdID4gLTAuMDAwMDAxKSA/ICcwLCcgOiBtWzE0XSArICcsJztcblxuICAgIHIgKz0gbVsxNV0gKyAnKSc7XG4gICAgcmV0dXJuIHI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERPTVJlbmRlcmVyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gVHJhbnNmb3JtIGlkZW50aXR5IG1hdHJpeC4gXG52YXIgaWRlbnQgPSBbXG4gICAgMSwgMCwgMCwgMCxcbiAgICAwLCAxLCAwLCAwLFxuICAgIDAsIDAsIDEsIDAsXG4gICAgMCwgMCwgMCwgMVxuXTtcblxuLyoqXG4gKiBFbGVtZW50Q2FjaGUgaXMgYmVpbmcgdXNlZCBmb3Iga2VlcGluZyB0cmFjayBvZiBhbiBlbGVtZW50J3MgRE9NIEVsZW1lbnQsXG4gKiBwYXRoLCB3b3JsZCB0cmFuc2Zvcm0sIGludmVydGVkIHBhcmVudCwgZmluYWwgdHJhbnNmb3JtIChhcyBiZWluZyB1c2VkIGZvclxuICogc2V0dGluZyB0aGUgYWN0dWFsIGB0cmFuc2Zvcm1gLXByb3BlcnR5KSBhbmQgcG9zdCByZW5kZXIgc2l6ZSAoZmluYWwgc2l6ZSBhc1xuICogYmVpbmcgcmVuZGVyZWQgdG8gdGhlIERPTSkuXG4gKiBcbiAqIEBjbGFzcyBFbGVtZW50Q2FjaGVcbiAqICBcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBET01FbGVtZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgZm9yIHVuaXF1ZWx5IGlkZW50aWZ5aW5nIHRoZSBsb2NhdGlvbiBpbiB0aGUgc2NlbmUgZ3JhcGguXG4gKi8gXG5mdW5jdGlvbiBFbGVtZW50Q2FjaGUgKGVsZW1lbnQsIHBhdGgpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5jb250ZW50ID0gbnVsbDtcbiAgICB0aGlzLnNpemUgPSBuZXcgSW50MTZBcnJheSgzKTtcbiAgICB0aGlzLmV4cGxpY2l0SGVpZ2h0ID0gZmFsc2U7XG4gICAgdGhpcy5leHBsaWNpdFdpZHRoID0gZmFsc2U7XG4gICAgdGhpcy53b3JsZFRyYW5zZm9ybSA9IG5ldyBGbG9hdDMyQXJyYXkoaWRlbnQpO1xuICAgIHRoaXMuaW52ZXJ0ZWRQYXJlbnQgPSBuZXcgRmxvYXQzMkFycmF5KGlkZW50KTtcbiAgICB0aGlzLmZpbmFsVHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShpZGVudCk7XG4gICAgdGhpcy5wb3N0UmVuZGVyU2l6ZSA9IG5ldyBGbG9hdDMyQXJyYXkoMik7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLnByZXZlbnREZWZhdWx0ID0ge307XG4gICAgdGhpcy5zdWJzY3JpYmUgPSB7fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbGVtZW50Q2FjaGU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSBtZXRob2QgZm9yIGludmVydGluZyBhIHRyYW5zZm9ybSBtYXRyaXhcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gb3V0IGFycmF5IHRvIHN0b3JlIHRoZSByZXR1cm4gb2YgdGhlIGludmVyc2lvblxuICogQHBhcmFtIHtBcnJheX0gYSB0cmFuc2Zvcm0gbWF0cml4IHRvIGludmVyc2VcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gb3V0XG4gKiAgIG91dHB1dCBhcnJheSB0aGF0IGlzIHN0b3JpbmcgdGhlIHRyYW5zZm9ybSBtYXRyaXhcbiAqL1xuZnVuY3Rpb24gaW52ZXJ0IChvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDkpICogZGV0O1xuICAgIG91dFsxXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFsyXSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xuICAgIG91dFszXSA9IChhMjIgKiBiMDQgLSBhMjEgKiBiMDUgLSBhMjMgKiBiMDMpICogZGV0O1xuICAgIG91dFs0XSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs2XSA9IChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogZGV0O1xuICAgIG91dFs3XSA9IChhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEpICogZGV0O1xuICAgIG91dFs4XSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0O1xuICAgIG91dFs5XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuICAgIG91dFsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzEyXSA9IChhMTEgKiBiMDcgLSBhMTAgKiBiMDkgLSBhMTIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzE1XSA9IChhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApICogZGV0O1xuXG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBBIG1ldGhvZCBmb3IgbXVsdGlwbHlpbmcgdHdvIG1hdHJpY2llc1xuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBvdXQgYXJyYXkgdG8gc3RvcmUgdGhlIHJldHVybiBvZiB0aGUgbXVsdGlwbGljYXRpb25cbiAqIEBwYXJhbSB7QXJyYXl9IGEgdHJhbnNmb3JtIG1hdHJpeCB0byBtdWx0aXBseVxuICogQHBhcmFtIHtBcnJheX0gYiB0cmFuc2Zvcm0gbWF0cml4IHRvIG11bHRpcGx5XG4gKlxuICogQHJldHVybiB7QXJyYXl9IG91dFxuICogICBvdXRwdXQgYXJyYXkgdGhhdCBpcyBzdG9yaW5nIHRoZSB0cmFuc2Zvcm0gbWF0cml4XG4gKi9cbmZ1bmN0aW9uIG11bHRpcGx5IChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM10sXG4gICAgICAgIGI0ID0gYls0XSwgYjUgPSBiWzVdLCBiNiA9IGJbNl0sIGI3ID0gYls3XSxcbiAgICAgICAgYjggPSBiWzhdLCBiOSA9IGJbOV0sIGIxMCA9IGJbMTBdLCBiMTEgPSBiWzExXSxcbiAgICAgICAgYjEyID0gYlsxMl0sIGIxMyA9IGJbMTNdLCBiMTQgPSBiWzE0XSwgYjE1ID0gYlsxNV07XG5cbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgIHZhciBvdXQwLCBvdXQxLCBvdXQyLCBvdXQzO1xuXG4gICAgb3V0MCA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXQxID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dDIgPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0MyA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGNoYW5nZWQgPSBjaGFuZ2VkID9cbiAgICAgICAgICAgICAgY2hhbmdlZCA6IG91dDAgPT09IG91dFswXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MSA9PT0gb3V0WzFdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQyID09PSBvdXRbMl0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDMgPT09IG91dFszXTtcblxuICAgIG91dFswXSA9IG91dDA7XG4gICAgb3V0WzFdID0gb3V0MTtcbiAgICBvdXRbMl0gPSBvdXQyO1xuICAgIG91dFszXSA9IG91dDM7XG5cbiAgICBiMCA9IGI0OyBiMSA9IGI1OyBiMiA9IGI2OyBiMyA9IGI3O1xuICAgIG91dDAgPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0MSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXQyID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dDMgPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBjaGFuZ2VkID0gY2hhbmdlZCA/XG4gICAgICAgICAgICAgIGNoYW5nZWQgOiBvdXQwID09PSBvdXRbNF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDEgPT09IG91dFs1XSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MiA9PT0gb3V0WzZdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQzID09PSBvdXRbN107XG5cbiAgICBvdXRbNF0gPSBvdXQwO1xuICAgIG91dFs1XSA9IG91dDE7XG4gICAgb3V0WzZdID0gb3V0MjtcbiAgICBvdXRbN10gPSBvdXQzO1xuXG4gICAgYjAgPSBiODsgYjEgPSBiOTsgYjIgPSBiMTA7IGIzID0gYjExO1xuICAgIG91dDAgPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0MSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXQyID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dDMgPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBjaGFuZ2VkID0gY2hhbmdlZCA/XG4gICAgICAgICAgICAgIGNoYW5nZWQgOiBvdXQwID09PSBvdXRbOF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDEgPT09IG91dFs5XSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MiA9PT0gb3V0WzEwXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MyA9PT0gb3V0WzExXTtcblxuICAgIG91dFs4XSA9IG91dDA7XG4gICAgb3V0WzldID0gb3V0MTtcbiAgICBvdXRbMTBdID0gb3V0MjtcbiAgICBvdXRbMTFdID0gb3V0MztcblxuICAgIGIwID0gYjEyOyBiMSA9IGIxMzsgYjIgPSBiMTQ7IGIzID0gYjE1O1xuICAgIG91dDAgPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0MSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXQyID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dDMgPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBjaGFuZ2VkID0gY2hhbmdlZCA/XG4gICAgICAgICAgICAgIGNoYW5nZWQgOiBvdXQwID09PSBvdXRbMTJdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQxID09PSBvdXRbMTNdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQyID09PSBvdXRbMTRdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQzID09PSBvdXRbMTVdO1xuXG4gICAgb3V0WzEyXSA9IG91dDA7XG4gICAgb3V0WzEzXSA9IG91dDE7XG4gICAgb3V0WzE0XSA9IG91dDI7XG4gICAgb3V0WzE1XSA9IG91dDM7XG5cbiAgICByZXR1cm4gb3V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtdWx0aXBseTogbXVsdGlwbHksXG4gICAgaW52ZXJ0OiBpbnZlcnRcbn07XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgvI2V2ZW50cy1jb21wb3NpdGlvbmV2ZW50cykuXG4gKlxuICogQGNsYXNzIENvbXBvc2l0aW9uRXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIENvbXBvc2l0aW9uRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGVBcmcsIG9wdGlvbmFsIENvbXBvc2l0aW9uRXZlbnRJbml0IGNvbXBvc2l0aW9uRXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIENvbXBvc2l0aW9uRXZlbnQgOiBVSUV2ZW50IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIERPTVN0cmluZyBkYXRhO1xuICAgIC8vIH07XG5cbiAgICBVSUV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgQ29tcG9zaXRpb25FdmVudCNkYXRhXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgdGhpcy5kYXRhID0gZXYuZGF0YTtcbn1cblxuQ29tcG9zaXRpb25FdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcbkNvbXBvc2l0aW9uRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29tcG9zaXRpb25FdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbkNvbXBvc2l0aW9uRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnQ29tcG9zaXRpb25FdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvc2l0aW9uRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVGhlIEV2ZW50IGNsYXNzIGlzIGJlaW5nIHVzZWQgaW4gb3JkZXIgdG8gbm9ybWFsaXplIG5hdGl2ZSBET00gZXZlbnRzLlxuICogRXZlbnRzIG5lZWQgdG8gYmUgbm9ybWFsaXplZCBpbiBvcmRlciB0byBiZSBzZXJpYWxpemVkIHRocm91Z2ggdGhlIHN0cnVjdHVyZWRcbiAqIGNsb25pbmcgYWxnb3JpdGhtIHVzZWQgYnkgdGhlIGBwb3N0TWVzc2FnZWAgbWV0aG9kIChXZWIgV29ya2VycykuXG4gKlxuICogV3JhcHBpbmcgRE9NIGV2ZW50cyBhbHNvIGhhcyB0aGUgYWR2YW50YWdlIG9mIHByb3ZpZGluZyBhIGNvbnNpc3RlbnRcbiAqIGludGVyZmFjZSBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBET00gZXZlbnRzIGFjcm9zcyBicm93c2VycyBieSBjb3B5aW5nIG92ZXIgYVxuICogc3Vic2V0IG9mIHRoZSBleHBvc2VkIHByb3BlcnRpZXMgdGhhdCBpcyBndWFyYW50ZWVkIHRvIGJlIGNvbnNpc3RlbnQgYWNyb3NzXG4gKiBicm93c2Vycy5cbiAqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOC8jaW50ZXJmYWNlLUV2ZW50KS5cbiAqXG4gKiBAY2xhc3MgRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGUsIG9wdGlvbmFsIEV2ZW50SW5pdCBldmVudEluaXREaWN0KSxcbiAgICAvLyAgRXhwb3NlZD1XaW5kb3csV29ya2VyXVxuICAgIC8vIGludGVyZmFjZSBFdmVudCB7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgRE9NU3RyaW5nIHR5cGU7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgRXZlbnRUYXJnZXQ/IHRhcmdldDtcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBFdmVudFRhcmdldD8gY3VycmVudFRhcmdldDtcblxuICAgIC8vICAgY29uc3QgdW5zaWduZWQgc2hvcnQgTk9ORSA9IDA7XG4gICAgLy8gICBjb25zdCB1bnNpZ25lZCBzaG9ydCBDQVBUVVJJTkdfUEhBU0UgPSAxO1xuICAgIC8vICAgY29uc3QgdW5zaWduZWQgc2hvcnQgQVRfVEFSR0VUID0gMjtcbiAgICAvLyAgIGNvbnN0IHVuc2lnbmVkIHNob3J0IEJVQkJMSU5HX1BIQVNFID0gMztcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSB1bnNpZ25lZCBzaG9ydCBldmVudFBoYXNlO1xuXG4gICAgLy8gICB2b2lkIHN0b3BQcm9wYWdhdGlvbigpO1xuICAgIC8vICAgdm9pZCBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblxuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIGJvb2xlYW4gYnViYmxlcztcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBib29sZWFuIGNhbmNlbGFibGU7XG4gICAgLy8gICB2b2lkIHByZXZlbnREZWZhdWx0KCk7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgYm9vbGVhbiBkZWZhdWx0UHJldmVudGVkO1xuXG4gICAgLy8gICBbVW5mb3JnZWFibGVdIHJlYWRvbmx5IGF0dHJpYnV0ZSBib29sZWFuIGlzVHJ1c3RlZDtcbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBET01UaW1lU3RhbXAgdGltZVN0YW1wO1xuXG4gICAgLy8gICB2b2lkIGluaXRFdmVudChET01TdHJpbmcgdHlwZSwgYm9vbGVhbiBidWJibGVzLCBib29sZWFuIGNhbmNlbGFibGUpO1xuICAgIC8vIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBFdmVudCN0eXBlXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgdGhpcy50eXBlID0gZXYudHlwZTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEV2ZW50I2RlZmF1bHRQcmV2ZW50ZWRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5kZWZhdWx0UHJldmVudGVkID0gZXYuZGVmYXVsdFByZXZlbnRlZDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEV2ZW50I3RpbWVTdGFtcFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMudGltZVN0YW1wID0gZXYudGltZVN0YW1wO1xuXG5cbiAgICAvKipcbiAgICAgKiBVc2VkIGZvciBleHBvc2luZyB0aGUgY3VycmVudCB0YXJnZXQncyB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBuYW1lIEV2ZW50I3ZhbHVlXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgdmFyIHRhcmdldENvbnN0cnVjdG9yID0gZXYudGFyZ2V0LmNvbnN0cnVjdG9yO1xuICAgIC8vIFRPRE8gU3VwcG9ydCBIVE1MS2V5Z2VuRWxlbWVudFxuICAgIGlmIChcbiAgICAgICAgdGFyZ2V0Q29uc3RydWN0b3IgPT09IEhUTUxJbnB1dEVsZW1lbnQgfHxcbiAgICAgICAgdGFyZ2V0Q29uc3RydWN0b3IgPT09IEhUTUxUZXh0QXJlYUVsZW1lbnQgfHxcbiAgICAgICAgdGFyZ2V0Q29uc3RydWN0b3IgPT09IEhUTUxTZWxlY3RFbGVtZW50XG4gICAgKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSBldi50YXJnZXQudmFsdWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbXBvc2l0aW9uRXZlbnQgPSByZXF1aXJlKCcuL0NvbXBvc2l0aW9uRXZlbnQnKTtcbnZhciBFdmVudCA9IHJlcXVpcmUoJy4vRXZlbnQnKTtcbnZhciBGb2N1c0V2ZW50ID0gcmVxdWlyZSgnLi9Gb2N1c0V2ZW50Jyk7XG52YXIgSW5wdXRFdmVudCA9IHJlcXVpcmUoJy4vSW5wdXRFdmVudCcpO1xudmFyIEtleWJvYXJkRXZlbnQgPSByZXF1aXJlKCcuL0tleWJvYXJkRXZlbnQnKTtcbnZhciBNb3VzZUV2ZW50ID0gcmVxdWlyZSgnLi9Nb3VzZUV2ZW50Jyk7XG52YXIgVG91Y2hFdmVudCA9IHJlcXVpcmUoJy4vVG91Y2hFdmVudCcpO1xudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcbnZhciBXaGVlbEV2ZW50ID0gcmVxdWlyZSgnLi9XaGVlbEV2ZW50Jyk7XG5cbi8qKlxuICogQSBtYXBwaW5nIG9mIERPTSBldmVudHMgdG8gdGhlIGNvcnJlc3BvbmRpbmcgaGFuZGxlcnNcbiAqXG4gKiBAbmFtZSBFdmVudE1hcFxuICogQHR5cGUgT2JqZWN0XG4gKi9cbnZhciBFdmVudE1hcCA9IHtcbiAgICBjaGFuZ2UgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRXZlbnQsIHRydWVdLFxuICAgIHN1Ym1pdCAgICAgICAgICAgICAgICAgICAgICAgICA6IFtFdmVudCwgdHJ1ZV0sXG5cbiAgICAvLyBVSSBFdmVudHMgKGh0dHA6Ly93d3cudzMub3JnL1RSL3VpZXZlbnRzLylcbiAgICBhYm9ydCAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRXZlbnQsIGZhbHNlXSxcbiAgICBiZWZvcmVpbnB1dCAgICAgICAgICAgICAgICAgICAgOiBbSW5wdXRFdmVudCwgdHJ1ZV0sXG4gICAgYmx1ciAgICAgICAgICAgICAgICAgICAgICAgICAgIDogW0ZvY3VzRXZlbnQsIGZhbHNlXSxcbiAgICBjbGljayAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgdHJ1ZV0sXG4gICAgY29tcG9zaXRpb25lbmQgICAgICAgICAgICAgICAgIDogW0NvbXBvc2l0aW9uRXZlbnQsIHRydWVdLFxuICAgIGNvbXBvc2l0aW9uc3RhcnQgICAgICAgICAgICAgICA6IFtDb21wb3NpdGlvbkV2ZW50LCB0cnVlXSxcbiAgICBjb21wb3NpdGlvbnVwZGF0ZSAgICAgICAgICAgICAgOiBbQ29tcG9zaXRpb25FdmVudCwgdHJ1ZV0sXG4gICAgZGJsY2xpY2sgICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIHRydWVdLFxuICAgIGZvY3VzICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtGb2N1c0V2ZW50LCBmYWxzZV0sXG4gICAgZm9jdXNpbiAgICAgICAgICAgICAgICAgICAgICAgIDogW0ZvY3VzRXZlbnQsIHRydWVdLFxuICAgIGZvY3Vzb3V0ICAgICAgICAgICAgICAgICAgICAgICA6IFtGb2N1c0V2ZW50LCB0cnVlXSxcbiAgICBpbnB1dCAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbSW5wdXRFdmVudCwgdHJ1ZV0sXG4gICAga2V5ZG93biAgICAgICAgICAgICAgICAgICAgICAgIDogW0tleWJvYXJkRXZlbnQsIHRydWVdLFxuICAgIGtleXVwICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtLZXlib2FyZEV2ZW50LCB0cnVlXSxcbiAgICBsb2FkICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRXZlbnQsIGZhbHNlXSxcbiAgICBtb3VzZWRvd24gICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgdHJ1ZV0sXG4gICAgbW91c2VlbnRlciAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIGZhbHNlXSxcbiAgICBtb3VzZWxlYXZlICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgZmFsc2VdLFxuXG4gICAgLy8gYnViYmxlcywgYnV0IHdpbGwgYmUgdHJpZ2dlcmVkIHZlcnkgZnJlcXVlbnRseVxuICAgIG1vdXNlbW92ZSAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCBmYWxzZV0sXG5cbiAgICBtb3VzZW91dCAgICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgdHJ1ZV0sXG4gICAgbW91c2VvdmVyICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIHRydWVdLFxuICAgIG1vdXNldXAgICAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCB0cnVlXSxcbiAgICByZXNpemUgICAgICAgICAgICAgICAgICAgICAgICAgOiBbVUlFdmVudCwgZmFsc2VdLFxuXG4gICAgLy8gbWlnaHQgYnViYmxlXG4gICAgc2Nyb2xsICAgICAgICAgICAgICAgICAgICAgICAgIDogW1VJRXZlbnQsIGZhbHNlXSxcblxuICAgIHNlbGVjdCAgICAgICAgICAgICAgICAgICAgICAgICA6IFtFdmVudCwgdHJ1ZV0sXG4gICAgdW5sb2FkICAgICAgICAgICAgICAgICAgICAgICAgIDogW0V2ZW50LCBmYWxzZV0sXG4gICAgd2hlZWwgICAgICAgICAgICAgICAgICAgICAgICAgIDogW1doZWVsRXZlbnQsIHRydWVdLFxuXG4gICAgLy8gVG91Y2ggRXZlbnRzIEV4dGVuc2lvbiAoaHR0cDovL3d3dy53My5vcmcvVFIvdG91Y2gtZXZlbnRzLWV4dGVuc2lvbnMvKVxuICAgIHRvdWNoY2FuY2VsICAgICAgICAgICAgICAgICAgICA6IFtUb3VjaEV2ZW50LCB0cnVlXSxcbiAgICB0b3VjaGVuZCAgICAgICAgICAgICAgICAgICAgICAgOiBbVG91Y2hFdmVudCwgdHJ1ZV0sXG4gICAgdG91Y2htb3ZlICAgICAgICAgICAgICAgICAgICAgIDogW1RvdWNoRXZlbnQsIHRydWVdLFxuICAgIHRvdWNoc3RhcnQgICAgICAgICAgICAgICAgICAgICA6IFtUb3VjaEV2ZW50LCB0cnVlXVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudE1hcDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOC8jZXZlbnRzLWZvY3VzZXZlbnQpLlxuICpcbiAqIEBjbGFzcyBGb2N1c0V2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBGb2N1c0V2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlQXJnLCBvcHRpb25hbCBGb2N1c0V2ZW50SW5pdCBmb2N1c0V2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBGb2N1c0V2ZW50IDogVUlFdmVudCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBFdmVudFRhcmdldD8gcmVsYXRlZFRhcmdldDtcbiAgICAvLyB9O1xuXG4gICAgVUlFdmVudC5jYWxsKHRoaXMsIGV2KTtcbn1cblxuRm9jdXNFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcbkZvY3VzRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRm9jdXNFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbkZvY3VzRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnRm9jdXNFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvY3VzRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtJbnB1dCBFdmVudHNdKGh0dHA6Ly93M2MuZ2l0aHViLmlvL2VkaXRpbmctZXhwbGFpbmVyL2lucHV0LWV2ZW50cy5odG1sI2lkbC1kZWYtSW5wdXRFdmVudCkuXG4gKlxuICogQGNsYXNzIElucHV0RXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIElucHV0RXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGVBcmcsIG9wdGlvbmFsIElucHV0RXZlbnRJbml0IGlucHV0RXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIElucHV0RXZlbnQgOiBVSUV2ZW50IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIERPTVN0cmluZyBpbnB1dFR5cGU7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBET01TdHJpbmcgZGF0YTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICBpc0NvbXBvc2luZztcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIFJhbmdlICAgICB0YXJnZXRSYW5nZTtcbiAgICAvLyB9O1xuXG4gICAgVUlFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lICAgIElucHV0RXZlbnQjaW5wdXRUeXBlXG4gICAgICogQHR5cGUgICAgU3RyaW5nXG4gICAgICovXG4gICAgdGhpcy5pbnB1dFR5cGUgPSBldi5pbnB1dFR5cGU7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSAgICBJbnB1dEV2ZW50I2RhdGFcbiAgICAgKiBAdHlwZSAgICBTdHJpbmdcbiAgICAgKi9cbiAgICB0aGlzLmRhdGEgPSBldi5kYXRhO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgICAgSW5wdXRFdmVudCNpc0NvbXBvc2luZ1xuICAgICAqIEB0eXBlICAgIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmlzQ29tcG9zaW5nID0gZXYuaXNDb21wb3Npbmc7XG5cbiAgICAvKipcbiAgICAgKiAqKkxpbWl0ZWQgYnJvd3NlciBzdXBwb3J0KiouXG4gICAgICpcbiAgICAgKiBAbmFtZSAgICBJbnB1dEV2ZW50I3RhcmdldFJhbmdlXG4gICAgICogQHR5cGUgICAgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMudGFyZ2V0UmFuZ2UgPSBldi50YXJnZXRSYW5nZTtcbn1cblxuSW5wdXRFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcbklucHV0RXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSW5wdXRFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbklucHV0RXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnSW5wdXRFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0RXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgvI2V2ZW50cy1rZXlib2FyZGV2ZW50cykuXG4gKlxuICogQGNsYXNzIEtleWJvYXJkRXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIEtleWJvYXJkRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGVBcmcsIG9wdGlvbmFsIEtleWJvYXJkRXZlbnRJbml0IGtleWJvYXJkRXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIEtleWJvYXJkRXZlbnQgOiBVSUV2ZW50IHtcbiAgICAvLyAgICAgLy8gS2V5TG9jYXRpb25Db2RlXG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0tFWV9MT0NBVElPTl9TVEFOREFSRCA9IDB4MDA7XG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0tFWV9MT0NBVElPTl9MRUZUID0gMHgwMTtcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fS0VZX0xPQ0FUSU9OX1JJR0hUID0gMHgwMjtcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fS0VZX0xPQ0FUSU9OX05VTVBBRCA9IDB4MDM7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBET01TdHJpbmcgICAgIGtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIERPTVN0cmluZyAgICAgY29kZTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIHVuc2lnbmVkIGxvbmcgbG9jYXRpb247XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgIGN0cmxLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgIHNoaWZ0S2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICBhbHRLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgIG1ldGFLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgIHJlcGVhdDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgaXNDb21wb3Npbmc7XG4gICAgLy8gICAgIGJvb2xlYW4gZ2V0TW9kaWZpZXJTdGF0ZSAoRE9NU3RyaW5nIGtleUFyZyk7XG4gICAgLy8gfTtcblxuICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I0RPTV9LRVlfTE9DQVRJT05fU1RBTkRBUkRcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9LRVlfTE9DQVRJT05fU1RBTkRBUkQgPSAweDAwO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNET01fS0VZX0xPQ0FUSU9OX0xFRlRcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9LRVlfTE9DQVRJT05fTEVGVCA9IDB4MDE7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I0RPTV9LRVlfTE9DQVRJT05fUklHSFRcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9LRVlfTE9DQVRJT05fUklHSFQgPSAweDAyO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNET01fS0VZX0xPQ0FUSU9OX05VTVBBRFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0tFWV9MT0NBVElPTl9OVU1QQUQgPSAweDAzO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNrZXlcbiAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgKi9cbiAgICB0aGlzLmtleSA9IGV2LmtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjY29kZVxuICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAqL1xuICAgIHRoaXMuY29kZSA9IGV2LmNvZGU7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2xvY2F0aW9uXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5sb2NhdGlvbiA9IGV2LmxvY2F0aW9uO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNjdHJsS2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuY3RybEtleSA9IGV2LmN0cmxLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I3NoaWZ0S2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuc2hpZnRLZXkgPSBldi5zaGlmdEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjYWx0S2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuYWx0S2V5ID0gZXYuYWx0S2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNtZXRhS2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMubWV0YUtleSA9IGV2Lm1ldGFLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I3JlcGVhdFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLnJlcGVhdCA9IGV2LnJlcGVhdDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjaXNDb21wb3NpbmdcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5pc0NvbXBvc2luZyA9IGV2LmlzQ29tcG9zaW5nO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNrZXlDb2RlXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICogQGRlcHJlY2F0ZWRcbiAgICAgKi9cbiAgICB0aGlzLmtleUNvZGUgPSBldi5rZXlDb2RlO1xufVxuXG5LZXlib2FyZEV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuS2V5Ym9hcmRFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBLZXlib2FyZEV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuS2V5Ym9hcmRFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdLZXlib2FyZEV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gS2V5Ym9hcmRFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOC8jZXZlbnRzLW1vdXNlZXZlbnRzKS5cbiAqXG4gKiBAY2xhc3MgS2V5Ym9hcmRFdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gTW91c2VFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZUFyZywgb3B0aW9uYWwgTW91c2VFdmVudEluaXQgbW91c2VFdmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgTW91c2VFdmVudCA6IFVJRXZlbnQge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgbG9uZyAgICAgICAgICAgc2NyZWVuWDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGxvbmcgICAgICAgICAgIHNjcmVlblk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBsb25nICAgICAgICAgICBjbGllbnRYO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgbG9uZyAgICAgICAgICAgY2xpZW50WTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgIGN0cmxLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgICBzaGlmdEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgIGFsdEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgIG1ldGFLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBzaG9ydCAgICAgICAgICBidXR0b247XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBFdmVudFRhcmdldD8gICByZWxhdGVkVGFyZ2V0O1xuICAgIC8vICAgICAvLyBJbnRyb2R1Y2VkIGluIHRoaXMgc3BlY2lmaWNhdGlvblxuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgdW5zaWduZWQgc2hvcnQgYnV0dG9ucztcbiAgICAvLyAgICAgYm9vbGVhbiBnZXRNb2RpZmllclN0YXRlIChET01TdHJpbmcga2V5QXJnKTtcbiAgICAvLyB9O1xuXG4gICAgVUlFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjc2NyZWVuWFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuc2NyZWVuWCA9IGV2LnNjcmVlblg7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I3NjcmVlbllcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnNjcmVlblkgPSBldi5zY3JlZW5ZO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNjbGllbnRYXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5jbGllbnRYID0gZXYuY2xpZW50WDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjY2xpZW50WVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50WSA9IGV2LmNsaWVudFk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I2N0cmxLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5jdHJsS2V5ID0gZXYuY3RybEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjc2hpZnRLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5zaGlmdEtleSA9IGV2LnNoaWZ0S2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNhbHRLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5hbHRLZXkgPSBldi5hbHRLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I21ldGFLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5tZXRhS2V5ID0gZXYubWV0YUtleTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjYnV0dG9uXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5idXR0b24gPSBldi5idXR0b247XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I2J1dHRvbnNcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmJ1dHRvbnMgPSBldi5idXR0b25zO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCNwYWdlWFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMucGFnZVggPSBldi5wYWdlWDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjcGFnZVlcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnBhZ2VZID0gZXYucGFnZVk7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I3hcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnggPSBldi54O1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCN5XG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy55ID0gZXYueTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjb2Zmc2V0WFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMub2Zmc2V0WCA9IGV2Lm9mZnNldFg7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I29mZnNldFlcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLm9mZnNldFkgPSBldi5vZmZzZXRZO1xufVxuXG5Nb3VzZUV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuTW91c2VFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb3VzZUV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuTW91c2VFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdNb3VzZUV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2VFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFVJRXZlbnQgPSByZXF1aXJlKCcuL1VJRXZlbnQnKTtcblxudmFyIEVNUFRZX0FSUkFZID0gW107XG5cbi8qKlxuICogU2VlIFtUb3VjaCBJbnRlcmZhY2VdKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTMvUkVDLXRvdWNoLWV2ZW50cy0yMDEzMTAxMC8jdG91Y2gtaW50ZXJmYWNlKS5cbiAqXG4gKiBAY2xhc3MgVG91Y2hcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtUb3VjaH0gdG91Y2ggVGhlIG5hdGl2ZSBUb3VjaCBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIFRvdWNoKHRvdWNoKSB7XG4gICAgLy8gaW50ZXJmYWNlIFRvdWNoIHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGxvbmcgICAgICAgIGlkZW50aWZpZXI7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBFdmVudFRhcmdldCB0YXJnZXQ7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICBzY3JlZW5YO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgc2NyZWVuWTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgIGNsaWVudFg7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICBjbGllbnRZO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgcGFnZVg7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICBwYWdlWTtcbiAgICAvLyB9O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjaWRlbnRpZmllclxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuaWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNzY3JlZW5YXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5zY3JlZW5YID0gdG91Y2guc2NyZWVuWDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI3NjcmVlbllcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnNjcmVlblkgPSB0b3VjaC5zY3JlZW5ZO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjY2xpZW50WFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50WCA9IHRvdWNoLmNsaWVudFg7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNjbGllbnRZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5jbGllbnRZID0gdG91Y2guY2xpZW50WTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI3BhZ2VYXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5wYWdlWCA9IHRvdWNoLnBhZ2VYO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjcGFnZVlcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnBhZ2VZID0gdG91Y2gucGFnZVk7XG59XG5cblxuLyoqXG4gKiBOb3JtYWxpemVzIHRoZSBicm93c2VyJ3MgbmF0aXZlIFRvdWNoTGlzdCBieSBjb252ZXJ0aW5nIGl0IGludG8gYW4gYXJyYXkgb2ZcbiAqIG5vcm1hbGl6ZWQgVG91Y2ggb2JqZWN0cy5cbiAqXG4gKiBAbWV0aG9kICBjbG9uZVRvdWNoTGlzdFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtUb3VjaExpc3R9IHRvdWNoTGlzdCAgICBUaGUgbmF0aXZlIFRvdWNoTGlzdCBhcnJheS5cbiAqIEByZXR1cm4ge0FycmF5LjxUb3VjaD59ICAgICAgICAgIEFuIGFycmF5IG9mIG5vcm1hbGl6ZWQgVG91Y2ggb2JqZWN0cy5cbiAqL1xuZnVuY3Rpb24gY2xvbmVUb3VjaExpc3QodG91Y2hMaXN0KSB7XG4gICAgaWYgKCF0b3VjaExpc3QpIHJldHVybiBFTVBUWV9BUlJBWTtcbiAgICAvLyBpbnRlcmZhY2UgVG91Y2hMaXN0IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIHVuc2lnbmVkIGxvbmcgbGVuZ3RoO1xuICAgIC8vICAgICBnZXR0ZXIgVG91Y2g/IGl0ZW0gKHVuc2lnbmVkIGxvbmcgaW5kZXgpO1xuICAgIC8vIH07XG5cbiAgICB2YXIgdG91Y2hMaXN0QXJyYXkgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRvdWNoTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3VjaExpc3RBcnJheVtpXSA9IG5ldyBUb3VjaCh0b3VjaExpc3RbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gdG91Y2hMaXN0QXJyYXk7XG59XG5cbi8qKlxuICogU2VlIFtUb3VjaCBFdmVudCBJbnRlcmZhY2VdKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTMvUkVDLXRvdWNoLWV2ZW50cy0yMDEzMTAxMC8jdG91Y2hldmVudC1pbnRlcmZhY2UpLlxuICpcbiAqIEBjbGFzcyBUb3VjaEV2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBUb3VjaEV2ZW50KGV2KSB7XG4gICAgLy8gaW50ZXJmYWNlIFRvdWNoRXZlbnQgOiBVSUV2ZW50IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIFRvdWNoTGlzdCB0b3VjaGVzO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgVG91Y2hMaXN0IHRhcmdldFRvdWNoZXM7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBUb3VjaExpc3QgY2hhbmdlZFRvdWNoZXM7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgYWx0S2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgIG1ldGFLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgY3RybEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICBzaGlmdEtleTtcbiAgICAvLyB9O1xuICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I3RvdWNoZXNcbiAgICAgKiBAdHlwZSBBcnJheS48VG91Y2g+XG4gICAgICovXG4gICAgdGhpcy50b3VjaGVzID0gY2xvbmVUb3VjaExpc3QoZXYudG91Y2hlcyk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I3RhcmdldFRvdWNoZXNcbiAgICAgKiBAdHlwZSBBcnJheS48VG91Y2g+XG4gICAgICovXG4gICAgdGhpcy50YXJnZXRUb3VjaGVzID0gY2xvbmVUb3VjaExpc3QoZXYudGFyZ2V0VG91Y2hlcyk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I2NoYW5nZWRUb3VjaGVzXG4gICAgICogQHR5cGUgVG91Y2hMaXN0XG4gICAgICovXG4gICAgdGhpcy5jaGFuZ2VkVG91Y2hlcyA9IGNsb25lVG91Y2hMaXN0KGV2LmNoYW5nZWRUb3VjaGVzKTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjYWx0S2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuYWx0S2V5ID0gZXYuYWx0S2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCNtZXRhS2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMubWV0YUtleSA9IGV2Lm1ldGFLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I2N0cmxLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5jdHJsS2V5ID0gZXYuY3RybEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjc2hpZnRLZXlcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5zaGlmdEtleSA9IGV2LnNoaWZ0S2V5O1xufVxuXG5Ub3VjaEV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFdmVudC5wcm90b3R5cGUpO1xuVG91Y2hFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUb3VjaEV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuVG91Y2hFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdUb3VjaEV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVG91Y2hFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50ID0gcmVxdWlyZSgnLi9FdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4KS5cbiAqXG4gKiBAY2xhc3MgVUlFdmVudFxuICogQGF1Z21lbnRzIEV2ZW50XG4gKlxuICogQHBhcmFtICB7RXZlbnR9IGV2ICAgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIFVJRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGUsIG9wdGlvbmFsIFVJRXZlbnRJbml0IGV2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBVSUV2ZW50IDogRXZlbnQge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgV2luZG93PyB2aWV3O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgbG9uZyAgICBkZXRhaWw7XG4gICAgLy8gfTtcbiAgICBFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFVJRXZlbnQjZGV0YWlsXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5kZXRhaWwgPSBldi5kZXRhaWw7XG59XG5cblVJRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudC5wcm90b3R5cGUpO1xuVUlFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBVSUV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuVUlFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdVSUV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVUlFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIE1vdXNlRXZlbnQgPSByZXF1aXJlKCcuL01vdXNlRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOC8jZXZlbnRzLXdoZWVsZXZlbnRzKS5cbiAqXG4gKiBAY2xhc3MgV2hlZWxFdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gV2hlZWxFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZUFyZywgb3B0aW9uYWwgV2hlZWxFdmVudEluaXQgd2hlZWxFdmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgV2hlZWxFdmVudCA6IE1vdXNlRXZlbnQge1xuICAgIC8vICAgICAvLyBEZWx0YU1vZGVDb2RlXG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0RFTFRBX1BJWEVMID0gMHgwMDtcbiAgICAvLyAgICAgY29uc3QgdW5zaWduZWQgbG9uZyBET01fREVMVEFfTElORSA9IDB4MDE7XG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0RFTFRBX1BBR0UgPSAweDAyO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgICBkZWx0YVg7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICAgIGRlbHRhWTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgICAgZGVsdGFaO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgdW5zaWduZWQgbG9uZyBkZWx0YU1vZGU7XG4gICAgLy8gfTtcblxuICAgIE1vdXNlRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I0RPTV9ERUxUQV9QSVhFTFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuRE9NX0RFTFRBX1BJWEVMID0gMHgwMDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjRE9NX0RFTFRBX0xJTkVcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9ERUxUQV9MSU5FID0gMHgwMTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjRE9NX0RFTFRBX1BBR0VcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9ERUxUQV9QQUdFID0gMHgwMjtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjZGVsdGFYXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5kZWx0YVggPSBldi5kZWx0YVg7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I2RlbHRhWVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuZGVsdGFZID0gZXYuZGVsdGFZO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNkZWx0YVpcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmRlbHRhWiA9IGV2LmRlbHRhWjtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjZGVsdGFNb2RlXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5kZWx0YU1vZGUgPSBldi5kZWx0YU1vZGU7XG59XG5cbldoZWVsRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNb3VzZUV2ZW50LnByb3RvdHlwZSk7XG5XaGVlbEV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFdoZWVsRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5XaGVlbEV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ1doZWVsRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXaGVlbEV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgdHdvLWRpbWVuc2lvbmFsIHZlY3Rvci5cbiAqXG4gKiBAY2xhc3MgVmVjMlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqL1xudmFyIFZlYzIgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBBcnJheSB8fCB4IGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICAgIHRoaXMueCA9IHhbMF0gfHwgMDtcbiAgICAgICAgdGhpcy55ID0geFsxXSB8fCAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy54ID0geCB8fCAwO1xuICAgICAgICB0aGlzLnkgPSB5IHx8IDA7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggVGhlIHggY29tcG9uZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgVGhlIHkgY29tcG9uZW50LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHgsIHkpIHtcbiAgICBpZiAoeCAhPSBudWxsKSB0aGlzLnggPSB4O1xuICAgIGlmICh5ICE9IG51bGwpIHRoaXMueSA9IHk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgaW5wdXQgdiB0byB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVGhlIFZlYzIgdG8gYWRkLlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHYpIHtcbiAgICB0aGlzLnggKz0gdi54O1xuICAgIHRoaXMueSArPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0IHRoZSBpbnB1dCB2IGZyb20gdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSBWZWMyIHRvIHN1YnRyYWN0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiBzdWJ0cmFjdCh2KSB7XG4gICAgdGhpcy54IC09IHYueDtcbiAgICB0aGlzLnkgLT0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTY2FsZSB0aGUgY3VycmVudCBWZWMyIGJ5IGEgc2NhbGFyIG9yIFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfFZlYzJ9IHMgVGhlIE51bWJlciBvciB2ZWMyIGJ5IHdoaWNoIHRvIHNjYWxlLlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZShzKSB7XG4gICAgaWYgKHMgaW5zdGFuY2VvZiBWZWMyKSB7XG4gICAgICAgIHRoaXMueCAqPSBzLng7XG4gICAgICAgIHRoaXMueSAqPSBzLnk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnggKj0gcztcbiAgICAgICAgdGhpcy55ICo9IHM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIFZlYzIgY291bnRlci1jbG9ja3dpc2UgYnkgdGhldGEgYWJvdXQgdGhlIHotYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy54ID0geCAqIGNvc1RoZXRhIC0geSAqIHNpblRoZXRhO1xuICAgIHRoaXMueSA9IHggKiBzaW5UaGV0YSArIHkgKiBjb3NUaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2Ygb2YgdGhlIGN1cnJlbnQgVmVjMiB3aXRoIHRoZSBpbnB1dCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdiBUaGUgb3RoZXIgVmVjMi5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xufTtcblxuLyoqXG4gKiBUaGUgY3Jvc3MgcHJvZHVjdCBvZiBvZiB0aGUgY3VycmVudCBWZWMyIHdpdGggdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2IFRoZSBvdGhlciBWZWMyLlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueDtcbn07XG5cbi8qKlxuICogUHJlc2VydmUgdGhlIG1hZ25pdHVkZSBidXQgaW52ZXJ0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmludmVydCA9IGZ1bmN0aW9uIGludmVydCgpIHtcbiAgICB0aGlzLnggKj0gLTE7XG4gICAgdGhpcy55ICo9IC0xO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBseSBhIGZ1bmN0aW9uIGNvbXBvbmVudC13aXNlIHRvIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGFwcGx5LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IHRoaXNcbiAqL1xuVmVjMi5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gbWFwKGZuKSB7XG4gICAgdGhpcy54ID0gZm4odGhpcy54KTtcbiAgICB0aGlzLnkgPSBmbih0aGlzLnkpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIG1hZ25pdHVkZSBvZiB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBsZW5ndGggb2YgdGhlIHZlY3RvclxuICovXG5WZWMyLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiBsZW5ndGgoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG5cbiAgICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSBpbnB1dCBvbnRvIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBWZWMyIHRvIGNvcHlcbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5KHYpIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXNldCB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBtYWduaXR1ZGUgb2YgdGhlIGN1cnJlbnQgVmVjMiBpcyBleGFjdGx5IDAuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IHRoZSBsZW5ndGggaXMgMFxuICovXG5WZWMyLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiBpc1plcm8oKSB7XG4gICAgaWYgKHRoaXMueCAhPT0gMCB8fCB0aGlzLnkgIT09IDApIHJldHVybiBmYWxzZTtcbiAgICBlbHNlIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBUaGUgYXJyYXkgZm9ybSBvZiB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gdGhlIFZlYyB0byBhcyBhbiBhcnJheVxuICovXG5WZWMyLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gdG9BcnJheSgpIHtcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55XTtcbn07XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBpbnB1dCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVGhlIHJlZmVyZW5jZSBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSBvdXRwdXQgVmVjMiBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IFRoZSBub3JtYWxpemVkIFZlYzIuXG4gKi9cblZlYzIubm9ybWFsaXplID0gZnVuY3Rpb24gbm9ybWFsaXplKHYsIG91dHB1dCkge1xuICAgIHZhciB4ID0gdi54O1xuICAgIHZhciB5ID0gdi55O1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KSB8fCAxO1xuICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgb3V0cHV0LnggPSB2LnggKiBsZW5ndGg7XG4gICAgb3V0cHV0LnkgPSB2LnkgKiBsZW5ndGg7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBDbG9uZSB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSBWZWMyIHRvIGNsb25lLlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IFRoZSBjbG9uZWQgVmVjMi5cbiAqL1xuVmVjMi5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzIodi54LCB2LnkpO1xufTtcblxuLyoqXG4gKiBBZGQgdGhlIGlucHV0IFZlYzIncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2MSBUaGUgbGVmdCBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSB2MiBUaGUgcmlnaHQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gb3V0cHV0IFZlYzIgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgcmVzdWx0IG9mIHRoZSBhZGRpdGlvbi5cbiAqL1xuVmVjMi5hZGQgPSBmdW5jdGlvbiBhZGQodjEsIHYyLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYxLnggKyB2Mi54O1xuICAgIG91dHB1dC55ID0gdjEueSArIHYyLnk7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgc2Vjb25kIFZlYzIgZnJvbSB0aGUgZmlyc3QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gdjIgVGhlIHJpZ2h0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IG91dHB1dCBWZWMyIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIHJlc3VsdCBvZiB0aGUgc3VidHJhY3Rpb24uXG4gKi9cblZlYzIuc3VidHJhY3QgPSBmdW5jdGlvbiBzdWJ0cmFjdCh2MSwgdjIsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdjEueCAtIHYyLng7XG4gICAgb3V0cHV0LnkgPSB2MS55IC0gdjIueTtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBTY2FsZSB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSByZWZlcmVuY2UgVmVjMi5cbiAqIEBwYXJhbSB7TnVtYmVyfSBzIE51bWJlciB0byBzY2FsZSBieS5cbiAqIEBwYXJhbSB7VmVjMn0gb3V0cHV0IFZlYzIgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgcmVzdWx0IG9mIHRoZSBzY2FsaW5nLlxuICovXG5WZWMyLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUodiwgcywgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2LnggKiBzO1xuICAgIG91dHB1dC55ID0gdi55ICogcztcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIGlucHV0IFZlYzIncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2MSBUaGUgbGVmdCBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSB2MiBUaGUgcmlnaHQgVmVjMi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBkb3QgcHJvZHVjdC5cbiAqL1xuVmVjMi5kb3QgPSBmdW5jdGlvbiBkb3QodjEsIHYyKSB7XG4gICAgcmV0dXJuIHYxLnggKiB2Mi54ICsgdjEueSAqIHYyLnk7XG59O1xuXG4vKipcbiAqIFRoZSBjcm9zcyBwcm9kdWN0IG9mIHRoZSBpbnB1dCBWZWMyJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2MSBUaGUgbGVmdCBWZWMyLlxuICogQHBhcmFtIHtOdW1iZXJ9IHYyIFRoZSByaWdodCBWZWMyLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIHotY29tcG9uZW50IG9mIHRoZSBjcm9zcyBwcm9kdWN0LlxuICovXG5WZWMyLmNyb3NzID0gZnVuY3Rpb24odjEsdjIpIHtcbiAgICByZXR1cm4gdjEueCAqIHYyLnkgLSB2MS55ICogdjIueDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjMjtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIHRocmVlLWRpbWVuc2lvbmFsIHZlY3Rvci5cbiAqXG4gKiBAY2xhc3MgVmVjM1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFRoZSB6IGNvbXBvbmVudC5cbiAqL1xudmFyIFZlYzMgPSBmdW5jdGlvbih4ICx5LCB6KXtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xuICAgIHRoaXMueiA9IHogfHwgMDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFRoZSB6IGNvbXBvbmVudC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh4LCB5LCB6KSB7XG4gICAgaWYgKHggIT0gbnVsbCkgdGhpcy54ID0geDtcbiAgICBpZiAoeSAhPSBudWxsKSB0aGlzLnkgPSB5O1xuICAgIGlmICh6ICE9IG51bGwpIHRoaXMueiA9IHo7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIHRoZSBpbnB1dCB2IHRvIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgVmVjMyB0byBhZGQuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQodikge1xuICAgIHRoaXMueCArPSB2Lng7XG4gICAgdGhpcy55ICs9IHYueTtcbiAgICB0aGlzLnogKz0gdi56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0IHRoZSBpbnB1dCB2IGZyb20gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSBWZWMzIHRvIHN1YnRyYWN0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiBzdWJ0cmFjdCh2KSB7XG4gICAgdGhpcy54IC09IHYueDtcbiAgICB0aGlzLnkgLT0gdi55O1xuICAgIHRoaXMueiAtPSB2Lno7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUm90YXRlIHRoZSBjdXJyZW50IFZlYzMgYnkgdGhldGEgY2xvY2t3aXNlIGFib3V0IHRoZSB4IGF4aXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGV0YSBBbmdsZSBieSB3aGljaCB0byByb3RhdGUuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5yb3RhdGVYID0gZnVuY3Rpb24gcm90YXRlWCh0aGV0YSkge1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHRoaXMueSA9IHkgKiBjb3NUaGV0YSAtIHogKiBzaW5UaGV0YTtcbiAgICB0aGlzLnogPSB5ICogc2luVGhldGEgKyB6ICogY29zVGhldGE7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUm90YXRlIHRoZSBjdXJyZW50IFZlYzMgYnkgdGhldGEgY2xvY2t3aXNlIGFib3V0IHRoZSB5IGF4aXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGV0YSBBbmdsZSBieSB3aGljaCB0byByb3RhdGUuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5yb3RhdGVZID0gZnVuY3Rpb24gcm90YXRlWSh0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHRoaXMueCA9IHogKiBzaW5UaGV0YSArIHggKiBjb3NUaGV0YTtcbiAgICB0aGlzLnogPSB6ICogY29zVGhldGEgLSB4ICogc2luVGhldGE7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUm90YXRlIHRoZSBjdXJyZW50IFZlYzMgYnkgdGhldGEgY2xvY2t3aXNlIGFib3V0IHRoZSB6IGF4aXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGV0YSBBbmdsZSBieSB3aGljaCB0byByb3RhdGUuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5yb3RhdGVaID0gZnVuY3Rpb24gcm90YXRlWih0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHRoaXMueCA9IHggKiBjb3NUaGV0YSAtIHkgKiBzaW5UaGV0YTtcbiAgICB0aGlzLnkgPSB4ICogc2luVGhldGEgKyB5ICogY29zVGhldGE7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSBjdXJyZW50IFZlYzMgd2l0aCBpbnB1dCBWZWMzIHYuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgb3RoZXIgVmVjMy5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uIGRvdCh2KSB7XG4gICAgcmV0dXJuIHRoaXMueCp2LnggKyB0aGlzLnkqdi55ICsgdGhpcy56KnYuejtcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSBjdXJyZW50IFZlYzMgd2l0aCBpbnB1dCBWZWMzIHYuXG4gKiBTdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2QgY3Jvc3NcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIG90aGVyIFZlYzNcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24gY3Jvc3Modikge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIHZ4ID0gdi54O1xuICAgIHZhciB2eSA9IHYueTtcbiAgICB2YXIgdnogPSB2Lno7XG5cbiAgICB0aGlzLnggPSB5ICogdnogLSB6ICogdnk7XG4gICAgdGhpcy55ID0geiAqIHZ4IC0geCAqIHZ6O1xuICAgIHRoaXMueiA9IHggKiB2eSAtIHkgKiB2eDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2NhbGUgdGhlIGN1cnJlbnQgVmVjMyBieSBhIHNjYWxhci5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHMgVGhlIE51bWJlciBieSB3aGljaCB0byBzY2FsZVxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZShzKSB7XG4gICAgdGhpcy54ICo9IHM7XG4gICAgdGhpcy55ICo9IHM7XG4gICAgdGhpcy56ICo9IHM7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUHJlc2VydmUgdGhlIG1hZ25pdHVkZSBidXQgaW52ZXJ0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmludmVydCA9IGZ1bmN0aW9uIGludmVydCgpIHtcbiAgICB0aGlzLnggPSAtdGhpcy54O1xuICAgIHRoaXMueSA9IC10aGlzLnk7XG4gICAgdGhpcy56ID0gLXRoaXMuejtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBseSBhIGZ1bmN0aW9uIGNvbXBvbmVudC13aXNlIHRvIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGFwcGx5LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gbWFwKGZuKSB7XG4gICAgdGhpcy54ID0gZm4odGhpcy54KTtcbiAgICB0aGlzLnkgPSBmbih0aGlzLnkpO1xuICAgIHRoaXMueiA9IGZuKHRoaXMueik7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVGhlIG1hZ25pdHVkZSBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBtYWduaXR1ZGUgb2YgdGhlIFZlYzNcbiAqL1xuVmVjMy5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xufTtcblxuLyoqXG4gKiBUaGUgbWFnbml0dWRlIHNxdWFyZWQgb2YgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBtYWduaXR1ZGUgb2YgdGhlIFZlYzMgc3F1YXJlZFxuICovXG5WZWMzLnByb3RvdHlwZS5sZW5ndGhTcSA9IGZ1bmN0aW9uIGxlbmd0aFNxKCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgcmV0dXJuIHggKiB4ICsgeSAqIHkgKyB6ICogejtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgaW5wdXQgb250byB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVmVjMyB0byBjb3B5XG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSh2KSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICB0aGlzLnogPSB2Lno7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlc2V0IHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB0aGlzLnggPSAwO1xuICAgIHRoaXMueSA9IDA7XG4gICAgdGhpcy56ID0gMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgbWFnbml0dWRlIG9mIHRoZSBjdXJyZW50IFZlYzMgaXMgZXhhY3RseSAwLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCB0aGUgbWFnbml0dWRlIGlzIHplcm9cbiAqL1xuVmVjMy5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gaXNaZXJvKCkge1xuICAgIHJldHVybiB0aGlzLnggPT09IDAgJiYgdGhpcy55ID09PSAwICYmIHRoaXMueiA9PT0gMDtcbn07XG5cbi8qKlxuICogVGhlIGFycmF5IGZvcm0gb2YgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGEgdGhyZWUgZWxlbWVudCBhcnJheSByZXByZXNlbnRpbmcgdGhlIGNvbXBvbmVudHMgb2YgdGhlIFZlYzNcbiAqL1xuVmVjMy5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uIHRvQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLngsIHRoaXMueSwgdGhpcy56XTtcbn07XG5cbi8qKlxuICogUHJlc2VydmUgdGhlIG9yaWVudGF0aW9uIGJ1dCBjaGFuZ2UgdGhlIGxlbmd0aCBvZiB0aGUgY3VycmVudCBWZWMzIHRvIDEuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gbm9ybWFsaXplKCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIGxlbiA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopIHx8IDE7XG4gICAgbGVuID0gMSAvIGxlbjtcblxuICAgIHRoaXMueCAqPSBsZW47XG4gICAgdGhpcy55ICo9IGxlbjtcbiAgICB0aGlzLnogKj0gbGVuO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBseSB0aGUgcm90YXRpb24gY29ycmVzcG9uZGluZyB0byB0aGUgaW5wdXQgKHVuaXQpIFF1YXRlcm5pb25cbiAqIHRvIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcSBVbml0IFF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSByb3RhdGlvbiB0byBhcHBseVxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuYXBwbHlSb3RhdGlvbiA9IGZ1bmN0aW9uIGFwcGx5Um90YXRpb24ocSkge1xuICAgIHZhciBjdyA9IHEudztcbiAgICB2YXIgY3ggPSAtcS54O1xuICAgIHZhciBjeSA9IC1xLnk7XG4gICAgdmFyIGN6ID0gLXEuejtcblxuICAgIHZhciB2eCA9IHRoaXMueDtcbiAgICB2YXIgdnkgPSB0aGlzLnk7XG4gICAgdmFyIHZ6ID0gdGhpcy56O1xuXG4gICAgdmFyIHR3ID0gLWN4ICogdnggLSBjeSAqIHZ5IC0gY3ogKiB2ejtcbiAgICB2YXIgdHggPSB2eCAqIGN3ICsgdnkgKiBjeiAtIGN5ICogdno7XG4gICAgdmFyIHR5ID0gdnkgKiBjdyArIGN4ICogdnogLSB2eCAqIGN6O1xuICAgIHZhciB0eiA9IHZ6ICogY3cgKyB2eCAqIGN5IC0gY3ggKiB2eTtcblxuICAgIHZhciB3ID0gY3c7XG4gICAgdmFyIHggPSAtY3g7XG4gICAgdmFyIHkgPSAtY3k7XG4gICAgdmFyIHogPSAtY3o7XG5cbiAgICB0aGlzLnggPSB0eCAqIHcgKyB4ICogdHcgKyB5ICogdHogLSB0eSAqIHo7XG4gICAgdGhpcy55ID0gdHkgKiB3ICsgeSAqIHR3ICsgdHggKiB6IC0geCAqIHR6O1xuICAgIHRoaXMueiA9IHR6ICogdyArIHogKiB0dyArIHggKiB0eSAtIHR4ICogeTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQXBwbHkgdGhlIGlucHV0IE1hdDMzIHRoZSB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge01hdDMzfSBtYXRyaXggTWF0MzMgdG8gYXBwbHlcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmFwcGx5TWF0cml4ID0gZnVuY3Rpb24gYXBwbHlNYXRyaXgobWF0cml4KSB7XG4gICAgdmFyIE0gPSBtYXRyaXguZ2V0KCk7XG5cbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHRoaXMueCA9IE1bMF0qeCArIE1bMV0qeSArIE1bMl0qejtcbiAgICB0aGlzLnkgPSBNWzNdKnggKyBNWzRdKnkgKyBNWzVdKno7XG4gICAgdGhpcy56ID0gTVs2XSp4ICsgTVs3XSp5ICsgTVs4XSp6O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGlucHV0IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgcmVmZXJlbmNlIFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIG5vcm1hbGl6ZSBWZWMzLlxuICovXG5WZWMzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZSh2LCBvdXRwdXQpIHtcbiAgICB2YXIgeCA9IHYueDtcbiAgICB2YXIgeSA9IHYueTtcbiAgICB2YXIgeiA9IHYuejtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KSB8fCAxO1xuICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG5cbiAgICBvdXRwdXQueCA9IHggKiBsZW5ndGg7XG4gICAgb3V0cHV0LnkgPSB5ICogbGVuZ3RoO1xuICAgIG91dHB1dC56ID0geiAqIGxlbmd0aDtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBBcHBseSBhIHJvdGF0aW9uIHRvIHRoZSBpbnB1dCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIHJlZmVyZW5jZSBWZWMzLlxuICogQHBhcmFtIHtRdWF0ZXJuaW9ufSBxIFVuaXQgUXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIHRvIGFwcGx5LlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSByb3RhdGVkIHZlcnNpb24gb2YgdGhlIGlucHV0IFZlYzMuXG4gKi9cblZlYzMuYXBwbHlSb3RhdGlvbiA9IGZ1bmN0aW9uIGFwcGx5Um90YXRpb24odiwgcSwgb3V0cHV0KSB7XG4gICAgdmFyIGN3ID0gcS53O1xuICAgIHZhciBjeCA9IC1xLng7XG4gICAgdmFyIGN5ID0gLXEueTtcbiAgICB2YXIgY3ogPSAtcS56O1xuXG4gICAgdmFyIHZ4ID0gdi54O1xuICAgIHZhciB2eSA9IHYueTtcbiAgICB2YXIgdnogPSB2Lno7XG5cbiAgICB2YXIgdHcgPSAtY3ggKiB2eCAtIGN5ICogdnkgLSBjeiAqIHZ6O1xuICAgIHZhciB0eCA9IHZ4ICogY3cgKyB2eSAqIGN6IC0gY3kgKiB2ejtcbiAgICB2YXIgdHkgPSB2eSAqIGN3ICsgY3ggKiB2eiAtIHZ4ICogY3o7XG4gICAgdmFyIHR6ID0gdnogKiBjdyArIHZ4ICogY3kgLSBjeCAqIHZ5O1xuXG4gICAgdmFyIHcgPSBjdztcbiAgICB2YXIgeCA9IC1jeDtcbiAgICB2YXIgeSA9IC1jeTtcbiAgICB2YXIgeiA9IC1jejtcblxuICAgIG91dHB1dC54ID0gdHggKiB3ICsgeCAqIHR3ICsgeSAqIHR6IC0gdHkgKiB6O1xuICAgIG91dHB1dC55ID0gdHkgKiB3ICsgeSAqIHR3ICsgdHggKiB6IC0geCAqIHR6O1xuICAgIG91dHB1dC56ID0gdHogKiB3ICsgeiAqIHR3ICsgeCAqIHR5IC0gdHggKiB5O1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIENsb25lIHRoZSBpbnB1dCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIFZlYzMgdG8gY2xvbmUuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIGNsb25lZCBWZWMzLlxuICovXG5WZWMzLmNsb25lID0gZnVuY3Rpb24gY2xvbmUodikge1xuICAgIHJldHVybiBuZXcgVmVjMyh2LngsIHYueSwgdi56KTtcbn07XG5cbi8qKlxuICogQWRkIHRoZSBpbnB1dCBWZWMzJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdjEgVGhlIGxlZnQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gdjIgVGhlIHJpZ2h0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJlc3VsdCBvZiB0aGUgYWRkaXRpb24uXG4gKi9cblZlYzMuYWRkID0gZnVuY3Rpb24gYWRkKHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2MS54ICsgdjIueDtcbiAgICBvdXRwdXQueSA9IHYxLnkgKyB2Mi55O1xuICAgIG91dHB1dC56ID0gdjEueiArIHYyLno7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgdGhlIHNlY29uZCBWZWMzIGZyb20gdGhlIGZpcnN0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSByZXN1bHQgb2YgdGhlIHN1YnRyYWN0aW9uLlxuICovXG5WZWMzLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3QodjEsIHYyLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYxLnggLSB2Mi54O1xuICAgIG91dHB1dC55ID0gdjEueSAtIHYyLnk7XG4gICAgb3V0cHV0LnogPSB2MS56IC0gdjIuejtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBTY2FsZSB0aGUgaW5wdXQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSByZWZlcmVuY2UgVmVjMy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBzIE51bWJlciB0byBzY2FsZSBieS5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgcmVzdWx0IG9mIHRoZSBzY2FsaW5nLlxuICovXG5WZWMzLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUodiwgcywgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2LnggKiBzO1xuICAgIG91dHB1dC55ID0gdi55ICogcztcbiAgICBvdXRwdXQueiA9IHYueiAqIHM7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSBpbnB1dCBWZWMzJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdjEgVGhlIGxlZnQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gdjIgVGhlIHJpZ2h0IFZlYzMuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgZG90IHByb2R1Y3QuXG4gKi9cblZlYzMuZG90ID0gZnVuY3Rpb24gZG90KHYxLCB2Mikge1xuICAgIHJldHVybiB2MS54ICogdjIueCArIHYxLnkgKiB2Mi55ICsgdjEueiAqIHYyLno7XG59O1xuXG4vKipcbiAqIFRoZSAocmlnaHQtaGFuZGVkKSBjcm9zcyBwcm9kdWN0IG9mIHRoZSBpbnB1dCBWZWMzJ3MuXG4gKiB2MSB4IHYyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIG9iamVjdCB0aGUgcmVzdWx0IG9mIHRoZSBjcm9zcyBwcm9kdWN0IHdhcyBwbGFjZWQgaW50b1xuICovXG5WZWMzLmNyb3NzID0gZnVuY3Rpb24gY3Jvc3ModjEsIHYyLCBvdXRwdXQpIHtcbiAgICB2YXIgeDEgPSB2MS54O1xuICAgIHZhciB5MSA9IHYxLnk7XG4gICAgdmFyIHoxID0gdjEuejtcbiAgICB2YXIgeDIgPSB2Mi54O1xuICAgIHZhciB5MiA9IHYyLnk7XG4gICAgdmFyIHoyID0gdjIuejtcblxuICAgIG91dHB1dC54ID0geTEgKiB6MiAtIHoxICogeTI7XG4gICAgb3V0cHV0LnkgPSB6MSAqIHgyIC0geDEgKiB6MjtcbiAgICBvdXRwdXQueiA9IHgxICogeTIgLSB5MSAqIHgyO1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFRoZSBwcm9qZWN0aW9uIG9mIHYxIG9udG8gdjIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdjEgVGhlIGxlZnQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gdjIgVGhlIHJpZ2h0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSB0aGUgb2JqZWN0IHRoZSByZXN1bHQgb2YgdGhlIGNyb3NzIHByb2R1Y3Qgd2FzIHBsYWNlZCBpbnRvIFxuICovXG5WZWMzLnByb2plY3QgPSBmdW5jdGlvbiBwcm9qZWN0KHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgdmFyIHgxID0gdjEueDtcbiAgICB2YXIgeTEgPSB2MS55O1xuICAgIHZhciB6MSA9IHYxLno7XG4gICAgdmFyIHgyID0gdjIueDtcbiAgICB2YXIgeTIgPSB2Mi55O1xuICAgIHZhciB6MiA9IHYyLno7XG5cbiAgICB2YXIgc2NhbGUgPSB4MSAqIHgyICsgeTEgKiB5MiArIHoxICogejI7XG4gICAgc2NhbGUgLz0geDIgKiB4MiArIHkyICogeTIgKyB6MiAqIHoyO1xuXG4gICAgb3V0cHV0LnggPSB4MiAqIHNjYWxlO1xuICAgIG91dHB1dC55ID0geTIgKiBzY2FsZTtcbiAgICBvdXRwdXQueiA9IHoyICogc2NhbGU7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWMzO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBub29wXG5cbmZ1bmN0aW9uIG5vb3AoKSB7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdZb3Ugc2hvdWxkIGJ1bmRsZSB5b3VyIGNvZGUgJyArXG4gICAgICAndXNpbmcgYGdsc2xpZnlgIGFzIGEgdHJhbnNmb3JtLidcbiAgKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ncmFtaWZ5XG5cbmZ1bmN0aW9uIHByb2dyYW1pZnkodmVydGV4LCBmcmFnbWVudCwgdW5pZm9ybXMsIGF0dHJpYnV0ZXMpIHtcbiAgcmV0dXJuIHtcbiAgICB2ZXJ0ZXg6IHZlcnRleCwgXG4gICAgZnJhZ21lbnQ6IGZyYWdtZW50LFxuICAgIHVuaWZvcm1zOiB1bmlmb3JtcywgXG4gICAgYXR0cmlidXRlczogYXR0cmlidXRlc1xuICB9O1xufVxuIiwiLy8gaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cbi8vIGh0dHA6Ly9teS5vcGVyYS5jb20vZW1vbGxlci9ibG9nLzIwMTEvMTIvMjAvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1lci1hbmltYXRpbmdcbi8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSBwb2x5ZmlsbCBieSBFcmlrIE3DtmxsZXIuIGZpeGVzIGZyb20gUGF1bCBJcmlzaCBhbmQgVGlubyBaaWpkZWxcbi8vIE1JVCBsaWNlbnNlXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGxhc3RUaW1lID0gMDtcbnZhciB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcblxudmFyIHJBRiwgY0FGO1xuXG5pZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHtcbiAgICByQUYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgIGNBRiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuY2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgIGZvciAodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXJBRjsgKyt4KSB7XG4gICAgICAgIHJBRiA9IHdpbmRvd1t2ZW5kb3JzW3hdICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgICBjQUYgPSB3aW5kb3dbdmVuZG9yc1t4XSArICdDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSB8fFxuICAgICAgICAgICAgICB3aW5kb3dbdmVuZG9yc1t4XSArICdDYW5jZWxBbmltYXRpb25GcmFtZSddO1xuICAgIH1cblxuICAgIGlmIChyQUYgJiYgIWNBRikge1xuICAgICAgICAvLyBjQUYgbm90IHN1cHBvcnRlZC5cbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIHNldEludGVydmFsIGZvciBub3cgKHZlcnkgcmFyZSkuXG4gICAgICAgIHJBRiA9IG51bGw7XG4gICAgfVxufVxuXG5pZiAoIXJBRikge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdyA/IERhdGUubm93IDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgfTtcblxuICAgIHJBRiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjdXJyVGltZSA9IG5vdygpO1xuICAgICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcbiAgICAgICAgdmFyIGlkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpO1xuICAgICAgICB9LCB0aW1lVG9DYWxsKTtcbiAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9O1xuXG4gICAgY0FGID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcbn1cblxudmFyIGFuaW1hdGlvbkZyYW1lID0ge1xuICAgIC8qKlxuICAgICAqIENyb3NzIGJyb3dzZXIgdmVyc2lvbiBvZiBbcmVxdWVzdEFuaW1hdGlvbkZyYW1lXXtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93L3JlcXVlc3RBbmltYXRpb25GcmFtZX0uXG4gICAgICpcbiAgICAgKiBVc2VkIGJ5IEVuZ2luZSBpbiBvcmRlciB0byBlc3RhYmxpc2ggYSByZW5kZXIgbG9vcC5cbiAgICAgKlxuICAgICAqIElmIG5vICh2ZW5kb3IgcHJlZml4ZWQgdmVyc2lvbiBvZikgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgaXMgYXZhaWxhYmxlLFxuICAgICAqIGBzZXRUaW1lb3V0YCB3aWxsIGJlIHVzZWQgaW4gb3JkZXIgdG8gZW11bGF0ZSBhIHJlbmRlciBsb29wIHJ1bm5pbmcgYXRcbiAgICAgKiBhcHByb3hpbWF0ZWx5IDYwIGZyYW1lcyBwZXIgc2Vjb25kLlxuICAgICAqXG4gICAgICogQG1ldGhvZCAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0gICB7RnVuY3Rpb259ICBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBpbnZva2VkIG9uIHRoZSBuZXh0IGZyYW1lLlxuICAgICAqIEByZXR1cm4gIHtOdW1iZXJ9ICAgIHJlcXVlc3RJZCB0byBiZSB1c2VkIHRvIGNhbmNlbCB0aGUgcmVxdWVzdCB1c2luZ1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgIEBsaW5re2NhbmNlbEFuaW1hdGlvbkZyYW1lfS5cbiAgICAgKi9cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWU6IHJBRixcblxuICAgIC8qKlxuICAgICAqIENyb3NzIGJyb3dzZXIgdmVyc2lvbiBvZiBbY2FuY2VsQW5pbWF0aW9uRnJhbWVde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cvY2FuY2VsQW5pbWF0aW9uRnJhbWV9LlxuICAgICAqXG4gICAgICogQ2FuY2VscyBhIHByZXZpb3VzbHkgdXNpbmcgW3JlcXVlc3RBbmltYXRpb25GcmFtZV17QGxpbmsgYW5pbWF0aW9uRnJhbWUjcmVxdWVzdEFuaW1hdGlvbkZyYW1lfVxuICAgICAqIHNjaGVkdWxlZCByZXF1ZXN0LlxuICAgICAqXG4gICAgICogVXNlZCBmb3IgaW1tZWRpYXRlbHkgc3RvcHBpbmcgdGhlIHJlbmRlciBsb29wIHdpdGhpbiB0aGUgRW5naW5lLlxuICAgICAqXG4gICAgICogQG1ldGhvZCAgY2FuY2VsQW5pbWF0aW9uRnJhbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAgIHtOdW1iZXJ9ICAgIHJlcXVlc3RJZCBvZiB0aGUgc2NoZWR1bGVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgcmV0dXJuZWQgYnkgW3JlcXVlc3RBbmltYXRpb25GcmFtZV17QGxpbmsgYW5pbWF0aW9uRnJhbWUjcmVxdWVzdEFuaW1hdGlvbkZyYW1lfS5cbiAgICAgKi9cbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZTogY0FGXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFuaW1hdGlvbkZyYW1lO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lOiByZXF1aXJlKCcuL2FuaW1hdGlvbkZyYW1lJykucmVxdWVzdEFuaW1hdGlvbkZyYW1lLFxuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lOiByZXF1aXJlKCcuL2FuaW1hdGlvbkZyYW1lJykuY2FuY2VsQW5pbWF0aW9uRnJhbWVcbn07XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcG9seWZpbGxzID0gcmVxdWlyZSgnLi4vcG9seWZpbGxzJyk7XG52YXIgckFGID0gcG9seWZpbGxzLnJlcXVlc3RBbmltYXRpb25GcmFtZTtcbnZhciBjQUYgPSBwb2x5ZmlsbHMuY2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cbi8qKlxuICogQm9vbGVhbiBjb25zdGFudCBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AgaGFzIGFjY2VzcyB0byB0aGUgZG9jdW1lbnQuXG4gKiBUaGUgZG9jdW1lbnQgaXMgYmVpbmcgdXNlZCBpbiBvcmRlciB0byBzdWJzY3JpYmUgZm9yIHZpc2liaWxpdHljaGFuZ2UgZXZlbnRzXG4gKiB1c2VkIGZvciBub3JtYWxpemluZyB0aGUgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCB0aW1lIHdoZW4gZS5nLiB3aGVuIHN3aXRjaGluZyB0YWJzLlxuICogXG4gKiBAY29uc3RhbnRcbiAqIEB0eXBlIHtCb29sZWFufVxuICovIFxudmFyIERPQ1VNRU5UX0FDQ0VTUyA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCc7XG5cbmlmIChET0NVTUVOVF9BQ0NFU1MpIHtcbiAgICB2YXIgVkVORE9SX0hJRERFTiwgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFO1xuXG4gICAgLy8gT3BlcmEgMTIuMTAgYW5kIEZpcmVmb3ggMTggYW5kIGxhdGVyIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50LmhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgVkVORE9SX0hJRERFTiA9ICdoaWRkZW4nO1xuICAgICAgICBWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UgPSAndmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5tb3pIaWRkZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFZFTkRPUl9ISURERU4gPSAnbW96SGlkZGVuJztcbiAgICAgICAgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFID0gJ21venZpc2liaWxpdHljaGFuZ2UnO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQubXNIaWRkZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFZFTkRPUl9ISURERU4gPSAnbXNIaWRkZW4nO1xuICAgICAgICBWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UgPSAnbXN2aXNpYmlsaXR5Y2hhbmdlJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LndlYmtpdEhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgVkVORE9SX0hJRERFTiA9ICd3ZWJraXRIaWRkZW4nO1xuICAgICAgICBWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UgPSAnd2Via2l0dmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AgY2xhc3MgdXNlZCBmb3IgdXBkYXRpbmcgb2JqZWN0cyBvbiBhIGZyYW1lLWJ5LWZyYW1lLiBTeW5jaHJvbml6ZXMgdGhlXG4gKiBgdXBkYXRlYCBtZXRob2QgaW52b2NhdGlvbnMgdG8gdGhlIHJlZnJlc2ggcmF0ZSBvZiB0aGUgc2NyZWVuLiBNYW5hZ2VzXG4gKiB0aGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAtbG9vcCBieSBub3JtYWxpemluZyB0aGUgcGFzc2VkIGluIHRpbWVzdGFtcFxuICogd2hlbiBzd2l0Y2hpbmcgdGFicy5cbiAqIFxuICogQGNsYXNzIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3BcbiAqL1xuZnVuY3Rpb24gUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIFxuICAgIC8vIFJlZmVyZW5jZXMgdG8gb2JqZWN0cyB0byBiZSB1cGRhdGVkIG9uIG5leHQgZnJhbWUuXG4gICAgdGhpcy5fdXBkYXRlcyA9IFtdO1xuICAgIFxuICAgIHRoaXMuX2xvb3BlciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgX3RoaXMubG9vcCh0aW1lKTtcbiAgICB9O1xuICAgIHRoaXMuX3RpbWUgPSAwO1xuICAgIHRoaXMuX3N0b3BwZWRBdCA9IDA7XG4gICAgdGhpcy5fc2xlZXAgPSAwO1xuICAgIFxuICAgIC8vIEluZGljYXRlcyB3aGV0aGVyIHRoZSBlbmdpbmUgc2hvdWxkIGJlIHJlc3RhcnRlZCB3aGVuIHRoZSB0YWIvIHdpbmRvdyBpc1xuICAgIC8vIGJlaW5nIGZvY3VzZWQgYWdhaW4gKHZpc2liaWxpdHkgY2hhbmdlKS5cbiAgICB0aGlzLl9zdGFydE9uVmlzaWJpbGl0eUNoYW5nZSA9IHRydWU7XG4gICAgXG4gICAgLy8gcmVxdWVzdElkIGFzIHJldHVybmVkIGJ5IHJlcXVlc3RBbmltYXRpb25GcmFtZSBmdW5jdGlvbjtcbiAgICB0aGlzLl9yQUYgPSBudWxsO1xuICAgIFxuICAgIHRoaXMuX3NsZWVwRGlmZiA9IHRydWU7XG4gICAgXG4gICAgLy8gVGhlIGVuZ2luZSBpcyBiZWluZyBzdGFydGVkIG9uIGluc3RhbnRpYXRpb24uXG4gICAgLy8gVE9ETyhhbGV4YW5kZXJHdWdlbClcbiAgICB0aGlzLnN0YXJ0KCk7XG5cbiAgICAvLyBUaGUgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCBzdXBwb3J0cyBydW5uaW5nIGluIGEgbm9uLWJyb3dzZXIgZW52aXJvbm1lbnQgKGUuZy4gV29ya2VyKS5cbiAgICBpZiAoRE9DVU1FTlRfQUNDRVNTKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLl9vblZpc2liaWxpdHlDaGFuZ2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEhhbmRsZSB0aGUgc3dpdGNoaW5nIG9mIHRhYnMuXG4gKlxuICogQG1ldGhvZFxuICogX3ByaXZhdGVcbiAqIFxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuX29uVmlzaWJpbGl0eUNoYW5nZSA9IGZ1bmN0aW9uIF9vblZpc2liaWxpdHlDaGFuZ2UoKSB7XG4gICAgaWYgKGRvY3VtZW50W1ZFTkRPUl9ISURERU5dKSB7XG4gICAgICAgIHRoaXMuX29uVW5mb2N1cygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5fb25Gb2N1cygpO1xuICAgIH1cbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYXMgc29vbiBhcyB0aGUgd2luZG93LyB0YWIgaXMgYmVpbmdcbiAqIGZvY3VzZWQgYWZ0ZXIgYSB2aXNpYmlsdGl5IGNoYW5nZS5cbiAqIFxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovIFxuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuX29uRm9jdXMgPSBmdW5jdGlvbiBfb25Gb2N1cygpIHtcbiAgICBpZiAodGhpcy5fc3RhcnRPblZpc2liaWxpdHlDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fc3RhcnQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFzIHNvb24gYXMgdGhlIHdpbmRvdy8gdGFiIGlzIGJlaW5nXG4gKiB1bmZvY3VzZWQgKGhpZGRlbikgYWZ0ZXIgYSB2aXNpYmlsdGl5IGNoYW5nZS5cbiAqIFxuICogQG1ldGhvZCAgX29uRm9jdXNcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqLyBcblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9vblVuZm9jdXMgPSBmdW5jdGlvbiBfb25VbmZvY3VzKCkge1xuICAgIHRoaXMuX3N0b3AoKTtcbn07XG5cbi8qKlxuICogU3RhcnRzIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLiBXaGVuIHN3aXRjaGluZyB0byBhIGRpZmZlcm50IHRhYi8gd2luZG93IChjaGFuZ2luZyB0aGVcbiAqIHZpc2liaWx0aXkpLCB0aGUgZW5naW5lIHdpbGwgYmUgcmV0YXJ0ZWQgd2hlbiBzd2l0Y2hpbmcgYmFjayB0byBhIHZpc2libGVcbiAqIHN0YXRlLlxuICpcbiAqIEBtZXRob2RcbiAqIFxuICogQHJldHVybiB7UmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcH0gdGhpc1xuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgIGlmICghdGhpcy5fcnVubmluZykge1xuICAgICAgICB0aGlzLl9zdGFydE9uVmlzaWJpbGl0eUNoYW5nZSA9IHRydWU7XG4gICAgICAgIHRoaXMuX3N0YXJ0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbnRlcm5hbCB2ZXJzaW9uIG9mIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AncyBzdGFydCBmdW5jdGlvbiwgbm90IGFmZmVjdGluZyBiZWhhdmlvciBvbiB2aXNpYmlsdHlcbiAqIGNoYW5nZS5cbiAqIFxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbipcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi8gXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiBfc3RhcnQoKSB7XG4gICAgdGhpcy5fcnVubmluZyA9IHRydWU7XG4gICAgdGhpcy5fc2xlZXBEaWZmID0gdHJ1ZTtcbiAgICB0aGlzLl9yQUYgPSByQUYodGhpcy5fbG9vcGVyKTtcbn07XG5cbi8qKlxuICogU3RvcHMgdGhlIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AuXG4gKlxuICogQG1ldGhvZFxuICogXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wKCkge1xuICAgIGlmICh0aGlzLl9ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0T25WaXNpYmlsaXR5Q2hhbmdlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3N0b3AoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEludGVybmFsIHZlcnNpb24gb2YgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCdzIHN0b3AgZnVuY3Rpb24sIG5vdCBhZmZlY3RpbmcgYmVoYXZpb3Igb24gdmlzaWJpbHR5XG4gKiBjaGFuZ2UuXG4gKiBcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqLyBcblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gX3N0b3AoKSB7XG4gICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3N0b3BwZWRBdCA9IHRoaXMuX3RpbWU7XG5cbiAgICAvLyBCdWcgaW4gb2xkIHZlcnNpb25zIG9mIEZ4LiBFeHBsaWNpdGx5IGNhbmNlbC5cbiAgICBjQUYodGhpcy5fckFGKTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGlzIGN1cnJlbnRseSBydW5uaW5nIG9yIG5vdC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGJvb2xlYW4gdmFsdWUgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGlzIGN1cnJlbnRseSBydW5uaW5nIG9yIG5vdFxuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5pc1J1bm5pbmcgPSBmdW5jdGlvbiBpc1J1bm5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3J1bm5pbmc7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgYWxsIHJlZ2lzdGVyZWQgb2JqZWN0cy5cbiAqXG4gKiBAbWV0aG9kXG4gKiBcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1zdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGUgYHVwZGF0ZWAgbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiBzdGVwICh0aW1lKSB7XG4gICAgdGhpcy5fdGltZSA9IHRpbWU7XG4gICAgaWYgKHRoaXMuX3NsZWVwRGlmZikge1xuICAgICAgICB0aGlzLl9zbGVlcCArPSB0aW1lIC0gdGhpcy5fc3RvcHBlZEF0O1xuICAgICAgICB0aGlzLl9zbGVlcERpZmYgPSBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgLy8gVGhlIHNhbWUgdGltZXRhbXAgd2lsbCBiZSBlbWl0dGVkIGltbWVkaWF0ZWx5IGJlZm9yZSBhbmQgYWZ0ZXIgdmlzaWJpbGl0eVxuICAgIC8vIGNoYW5nZS5cbiAgICB2YXIgbm9ybWFsaXplZFRpbWUgPSB0aW1lIC0gdGhpcy5fc2xlZXA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3VwZGF0ZXMubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICB0aGlzLl91cGRhdGVzW2ldLnVwZGF0ZShub3JtYWxpemVkVGltZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNZXRob2QgYmVpbmcgY2FsbGVkIGJ5IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIG9uIGV2ZXJ5IHBhaW50LiBJbmRpcmVjdGx5XG4gKiByZWN1cnNpdmUgYnkgc2NoZWR1bGluZyBhIGZ1dHVyZSBpbnZvY2F0aW9uIG9mIGl0c2VsZiBvbiB0aGUgbmV4dCBwYWludC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1zdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGUgYHVwZGF0ZWAgbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqIEByZXR1cm4ge1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3B9IHRoaXNcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUubG9vcCA9IGZ1bmN0aW9uIGxvb3AodGltZSkge1xuICAgIHRoaXMuc3RlcCh0aW1lKTtcbiAgICB0aGlzLl9yQUYgPSByQUYodGhpcy5fbG9vcGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJlcyBhbiB1cGRhdGVhYmxlIG9iamVjdCB3aGljaCBgdXBkYXRlYCBtZXRob2Qgc2hvdWxkIGJlIGludm9rZWQgb25cbiAqIGV2ZXJ5IHBhaW50LCBzdGFydGluZyBvbiB0aGUgbmV4dCBwYWludCAoYXNzdW1pbmcgdGhlIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AgaXMgcnVubmluZykuXG4gKlxuICogQG1ldGhvZFxuICogXG4gKiBAcGFyYW0ge09iamVjdH0gdXBkYXRlYWJsZSBvYmplY3QgdG8gYmUgdXBkYXRlZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gdXBkYXRlYWJsZS51cGRhdGUgdXBkYXRlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiB0aGUgcmVnaXN0ZXJlZCBvYmplY3RcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSh1cGRhdGVhYmxlKSB7XG4gICAgaWYgKHRoaXMuX3VwZGF0ZXMuaW5kZXhPZih1cGRhdGVhYmxlKSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlcy5wdXNoKHVwZGF0ZWFibGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGVyZWdpc3RlcnMgYW4gdXBkYXRlYWJsZSBvYmplY3QgcHJldmlvdXNseSByZWdpc3RlcmVkIHVzaW5nIGB1cGRhdGVgIHRvIGJlXG4gKiBubyBsb25nZXIgdXBkYXRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBcbiAqIEBwYXJhbSB7T2JqZWN0fSB1cGRhdGVhYmxlIHVwZGF0ZWFibGUgb2JqZWN0IHByZXZpb3VzbHkgcmVnaXN0ZXJlZCB1c2luZyBgdXBkYXRlYFxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3B9IHRoaXNcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUubm9Mb25nZXJVcGRhdGUgPSBmdW5jdGlvbiBub0xvbmdlclVwZGF0ZSh1cGRhdGVhYmxlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fdXBkYXRlcy5pbmRleE9mKHVwZGF0ZWFibGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3A7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi9Db250ZXh0Jyk7XG52YXIgaW5qZWN0Q1NTID0gcmVxdWlyZSgnLi9pbmplY3QtY3NzJyk7XG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGEgbmV3IENvbXBvc2l0b3IuXG4gKiBUaGUgQ29tcG9zaXRvciByZWNlaXZlcyBkcmF3IGNvbW1hbmRzIGZybSB0aGUgVUlNYW5hZ2VyIGFuZCByb3V0ZXMgdGhlIHRvIHRoZVxuICogcmVzcGVjdGl2ZSBjb250ZXh0IG9iamVjdHMuXG4gKlxuICogVXBvbiBjcmVhdGlvbiwgaXQgaW5qZWN0cyBhIHN0eWxlc2hlZXQgdXNlZCBmb3Igc3R5bGluZyB0aGUgaW5kaXZpZHVhbFxuICogcmVuZGVyZXJzIHVzZWQgaW4gdGhlIGNvbnRleHQgb2JqZWN0cy5cbiAqXG4gKiBAY2xhc3MgQ29tcG9zaXRvclxuICogQGNvbnN0cnVjdG9yXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBDb21wb3NpdG9yKCkge1xuICAgIGluamVjdENTUygpO1xuXG4gICAgdGhpcy5fY29udGV4dHMgPSB7fTtcbiAgICB0aGlzLl9vdXRDb21tYW5kcyA9IFtdO1xuICAgIHRoaXMuX2luQ29tbWFuZHMgPSBbXTtcbiAgICB0aGlzLl90aW1lID0gbnVsbDtcblxuICAgIHRoaXMuX3Jlc2l6ZWQgPSBmYWxzZTtcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5fcmVzaXplZCA9IHRydWU7XG4gICAgfSk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSB0aW1lIGJlaW5nIHVzZWQgYnkgdGhlIGludGVybmFsIGNsb2NrIG1hbmFnZWQgYnlcbiAqIGBGYW1vdXNFbmdpbmVgLlxuICpcbiAqIFRoZSB0aW1lIGlzIGJlaW5nIHBhc3NlZCBpbnRvIGNvcmUgYnkgdGhlIEVuZ2luZSB0aHJvdWdoIHRoZSBVSU1hbmFnZXIuXG4gKiBTaW5jZSBjb3JlIGhhcyB0aGUgYWJpbGl0eSB0byBzY2FsZSB0aGUgdGltZSwgdGhlIHRpbWUgbmVlZHMgdG8gYmUgcGFzc2VkXG4gKiBiYWNrIHRvIHRoZSByZW5kZXJpbmcgc3lzdGVtLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRpbWUgVGhlIGNsb2NrIHRpbWUgdXNlZCBpbiBjb3JlLlxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24gZ2V0VGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGltZTtcbn07XG5cbi8qKlxuICogU2NoZWR1bGVzIGFuIGV2ZW50IHRvIGJlIHNlbnQgdGhlIG5leHQgdGltZSB0aGUgb3V0IGNvbW1hbmQgcXVldWUgaXMgYmVpbmdcbiAqIGZsdXNoZWQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHBhdGggUmVuZGVyIHBhdGggdG8gdGhlIG5vZGUgdGhlIGV2ZW50IHNob3VsZCBiZSB0cmlnZ2VyZWRcbiAqIG9uICgqdGFyZ2V0ZWQgZXZlbnQqKVxuICogQHBhcmFtICB7U3RyaW5nfSBldiBFdmVudCB0eXBlXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBheWxvYWQgRXZlbnQgb2JqZWN0IChzZXJpYWxpemFibGUgdXNpbmcgc3RydWN0dXJlZCBjbG9uaW5nXG4gKiBhbGdvcml0aG0pXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuc2VuZEV2ZW50ID0gZnVuY3Rpb24gc2VuZEV2ZW50KHBhdGgsIGV2LCBwYXlsb2FkKSB7XG4gICAgdGhpcy5fb3V0Q29tbWFuZHMucHVzaCgnV0lUSCcsIHBhdGgsICdUUklHR0VSJywgZXYsIHBheWxvYWQpO1xufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgbWV0aG9kIHVzZWQgZm9yIG5vdGlmeWluZyBleHRlcm5hbGx5XG4gKiByZXNpemVkIGNvbnRleHRzIChlLmcuIGJ5IHJlc2l6aW5nIHRoZSBicm93c2VyIHdpbmRvdykuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIHJlbmRlciBwYXRoIHRvIHRoZSBub2RlIChjb250ZXh0KSB0aGF0IHNob3VsZCBiZVxuICogcmVzaXplZFxuICogQHBhcmFtICB7QXJyYXl9IHNpemUgbmV3IGNvbnRleHQgc2l6ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLnNlbmRSZXNpemUgPSBmdW5jdGlvbiBzZW5kUmVzaXplIChzZWxlY3Rvciwgc2l6ZSkge1xuICAgIHRoaXMuc2VuZEV2ZW50KHNlbGVjdG9yLCAnQ09OVEVYVF9SRVNJWkUnLCBzaXplKTtcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCB1c2VkIGJ5IGBkcmF3Q29tbWFuZHNgLlxuICogU3Vic2VxdWVudCBjb21tYW5kcyBhcmUgYmVpbmcgYXNzb2NpYXRlZCB3aXRoIHRoZSBub2RlIGRlZmluZWQgdGhlIHRoZSBwYXRoXG4gKiBmb2xsb3dpbmcgdGhlIGBXSVRIYCBjb21tYW5kLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBpdGVyYXRvciBwb3NpdGlvbiBpbmRleCB3aXRoaW4gdGhlIGNvbW1hbmRzIHF1ZXVlXG4gKiBAcGFyYW0gIHtBcnJheX0gY29tbWFuZHMgcmVtYWluaW5nIG1lc3NhZ2UgcXVldWUgcmVjZWl2ZWQsIHVzZWQgdG9cbiAqIHNoaWZ0IHNpbmdsZSBtZXNzYWdlcyBmcm9tXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuaGFuZGxlV2l0aCA9IGZ1bmN0aW9uIGhhbmRsZVdpdGggKGl0ZXJhdG9yLCBjb21tYW5kcykge1xuICAgIHZhciBwYXRoID0gY29tbWFuZHNbaXRlcmF0b3JdO1xuICAgIHZhciBwYXRoQXJyID0gcGF0aC5zcGxpdCgnLycpO1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5nZXRPclNldENvbnRleHQocGF0aEFyci5zaGlmdCgpKTtcbiAgICByZXR1cm4gY29udGV4dC5yZWNlaXZlKHBhdGgsIGNvbW1hbmRzLCBpdGVyYXRvcik7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgdG9wLWxldmVsIENvbnRleHQgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQgaW4gZG9jdW1lbnRcbiAqIHF1ZXJ5IHNlbGVjdG9yLiBJZiBubyBzdWNoIENvbnRleHQgZXhpc3RzLCBhIG5ldyBvbmUgd2lsbCBiZSBpbnN0YW50aWF0ZWQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIGRvY3VtZW50IHF1ZXJ5IHNlbGVjdG9yIHVzZWQgZm9yIHJldHJpZXZpbmcgdGhlXG4gKiBET00gbm9kZSB0aGUgVmlydHVhbEVsZW1lbnQgc2hvdWxkIGJlIGF0dGFjaGVkIHRvXG4gKlxuICogQHJldHVybiB7Q29udGV4dH0gY29udGV4dFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5nZXRPclNldENvbnRleHQgPSBmdW5jdGlvbiBnZXRPclNldENvbnRleHQoc2VsZWN0b3IpIHtcbiAgICBpZiAodGhpcy5fY29udGV4dHNbc2VsZWN0b3JdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0c1tzZWxlY3Rvcl07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHNlbGVjdG9yLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udGV4dHNbc2VsZWN0b3JdID0gY29udGV4dDtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgbWV0aG9kIHVzZWQgYnkgYGRyYXdDb21tYW5kc2AuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGl0ZXJhdG9yIHBvc2l0aW9uIGluZGV4IHdpdGhpbiB0aGUgY29tbWFuZCBxdWV1ZVxuICogQHBhcmFtICB7QXJyYXl9IGNvbW1hbmRzIHJlbWFpbmluZyBtZXNzYWdlIHF1ZXVlIHJlY2VpdmVkLCB1c2VkIHRvXG4gKiBzaGlmdCBzaW5nbGUgbWVzc2FnZXNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5naXZlU2l6ZUZvciA9IGZ1bmN0aW9uIGdpdmVTaXplRm9yKGl0ZXJhdG9yLCBjb21tYW5kcykge1xuICAgIHZhciBzZWxlY3RvciA9IGNvbW1hbmRzW2l0ZXJhdG9yXTtcbiAgICB2YXIgc2l6ZSA9IHRoaXMuZ2V0T3JTZXRDb250ZXh0KHNlbGVjdG9yKS5nZXRSb290U2l6ZSgpO1xuICAgIHRoaXMuc2VuZFJlc2l6ZShzZWxlY3Rvciwgc2l6ZSk7XG59O1xuXG4vKipcbiAqIFByb2Nlc3NlcyB0aGUgcHJldmlvdXNseSB2aWEgYHJlY2VpdmVDb21tYW5kc2AgdXBkYXRlZCBpbmNvbWluZyBcImluXCJcbiAqIGNvbW1hbmQgcXVldWUuXG4gKiBDYWxsZWQgYnkgVUlNYW5hZ2VyIG9uIGEgZnJhbWUgYnkgZnJhbWUgYmFzaXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBvdXRDb21tYW5kcyBzZXQgb2YgY29tbWFuZHMgdG8gYmUgc2VudCBiYWNrXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLmRyYXdDb21tYW5kcyA9IGZ1bmN0aW9uIGRyYXdDb21tYW5kcygpIHtcbiAgICB2YXIgY29tbWFuZHMgPSB0aGlzLl9pbkNvbW1hbmRzO1xuICAgIHZhciBsb2NhbEl0ZXJhdG9yID0gMDtcbiAgICB2YXIgY29tbWFuZCA9IGNvbW1hbmRzW2xvY2FsSXRlcmF0b3JdO1xuICAgIHdoaWxlIChjb21tYW5kKSB7XG4gICAgICAgIHN3aXRjaCAoY29tbWFuZCkge1xuICAgICAgICAgICAgY2FzZSAnVElNRSc6XG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdXSVRIJzpcbiAgICAgICAgICAgICAgICBsb2NhbEl0ZXJhdG9yID0gdGhpcy5oYW5kbGVXaXRoKCsrbG9jYWxJdGVyYXRvciwgY29tbWFuZHMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTkVFRF9TSVpFX0ZPUic6XG4gICAgICAgICAgICAgICAgdGhpcy5naXZlU2l6ZUZvcigrK2xvY2FsSXRlcmF0b3IsIGNvbW1hbmRzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb21tYW5kID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBTd2l0Y2ggdG8gYXNzb2NpYXRpdmUgYXJyYXlzIGhlcmUuLi5cblxuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9jb250ZXh0cykge1xuICAgICAgICB0aGlzLl9jb250ZXh0c1trZXldLmRyYXcoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcmVzaXplZCkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNpemUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fb3V0Q29tbWFuZHM7XG59O1xuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc2l6ZSBvZiBhbGwgcHJldmlvdXNseSByZWdpc3RlcmVkIGNvbnRleHQgb2JqZWN0cy5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIENPTlRFWFRfUkVTSVpFIGV2ZW50cyBiZWluZyBzZW50IGFuZCB0aGUgcm9vdCBlbGVtZW50c1xuICogdXNlZCBieSB0aGUgaW5kaXZpZHVhbCByZW5kZXJlcnMgYmVpbmcgcmVzaXplZCB0byB0aGUgdGhlIERPTVJlbmRlcmVyJ3Mgcm9vdFxuICogc2l6ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uIHVwZGF0ZVNpemUoKSB7XG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gdGhpcy5fY29udGV4dHMpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dHNbc2VsZWN0b3JdLnVwZGF0ZVNpemUoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFVzZWQgYnkgVGhyZWFkTWFuYWdlciB0byB1cGRhdGUgdGhlIGludGVybmFsIHF1ZXVlIG9mIGluY29taW5nIGNvbW1hbmRzLlxuICogUmVjZWl2aW5nIGNvbW1hbmRzIGRvZXMgbm90IGltbWVkaWF0ZWx5IHN0YXJ0IHRoZSByZW5kZXJpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtICB7QXJyYXl9IGNvbW1hbmRzIGNvbW1hbmQgcXVldWUgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBjb21wb3NpdG9yJ3NcbiAqIGBkcmF3Q29tbWFuZHNgIG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLnJlY2VpdmVDb21tYW5kcyA9IGZ1bmN0aW9uIHJlY2VpdmVDb21tYW5kcyhjb21tYW5kcykge1xuICAgIHZhciBsZW4gPSBjb21tYW5kcy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB0aGlzLl9pbkNvbW1hbmRzLnB1c2goY29tbWFuZHNbaV0pO1xuICAgIH1cbn07XG5cbi8qKlxuICogRmx1c2hlcyB0aGUgcXVldWUgb2Ygb3V0Z29pbmcgXCJvdXRcIiBjb21tYW5kcy5cbiAqIENhbGxlZCBieSBUaHJlYWRNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5jbGVhckNvbW1hbmRzID0gZnVuY3Rpb24gY2xlYXJDb21tYW5kcygpIHtcbiAgICB0aGlzLl9pbkNvbW1hbmRzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fb3V0Q29tbWFuZHMubGVuZ3RoID0gMDtcbiAgICB0aGlzLl9yZXNpemVkID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvc2l0b3I7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBXZWJHTFJlbmRlcmVyID0gcmVxdWlyZSgnLi4vd2ViZ2wtcmVuZGVyZXJzL1dlYkdMUmVuZGVyZXInKTtcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0NhbWVyYScpO1xudmFyIERPTVJlbmRlcmVyID0gcmVxdWlyZSgnLi4vZG9tLXJlbmRlcmVycy9ET01SZW5kZXJlcicpO1xuXG4vKipcbiAqIENvbnRleHQgaXMgYSByZW5kZXIgbGF5ZXIgd2l0aCBpdHMgb3duIFdlYkdMUmVuZGVyZXIgYW5kIERPTVJlbmRlcmVyLlxuICogSXQgaXMgdGhlIGludGVyZmFjZSBiZXR3ZWVuIHRoZSBDb21wb3NpdG9yIHdoaWNoIHJlY2VpdmVzIGNvbW1hbmRzXG4gKiBhbmQgdGhlIHJlbmRlcmVycyB0aGF0IGludGVycHJldCB0aGVtLiBJdCBhbHNvIHJlbGF5cyBpbmZvcm1hdGlvbiB0b1xuICogdGhlIHJlbmRlcmVycyBhYm91dCByZXNpemluZy5cbiAqXG4gKiBUaGUgRE9NRWxlbWVudCBhdCB0aGUgZ2l2ZW4gcXVlcnkgc2VsZWN0b3IgaXMgdXNlZCBhcyB0aGUgcm9vdC4gQVxuICogbmV3IERPTUVsZW1lbnQgaXMgYXBwZW5kZWQgdG8gdGhpcyByb290IGVsZW1lbnQsIGFuZCB1c2VkIGFzIHRoZVxuICogcGFyZW50IGVsZW1lbnQgZm9yIGFsbCBGYW1vdXMgRE9NIHJlbmRlcmluZyBhdCB0aGlzIGNvbnRleHQuIEFcbiAqIGNhbnZhcyBpcyBhZGRlZCBhbmQgdXNlZCBmb3IgYWxsIFdlYkdMIHJlbmRlcmluZyBhdCB0aGlzIGNvbnRleHQuXG4gKlxuICogQGNsYXNzIENvbnRleHRcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBRdWVyeSBzZWxlY3RvciB1c2VkIHRvIGxvY2F0ZSByb290IGVsZW1lbnQgb2ZcbiAqIGNvbnRleHQgbGF5ZXIuXG4gKiBAcGFyYW0ge0NvbXBvc2l0b3J9IGNvbXBvc2l0b3IgQ29tcG9zaXRvciByZWZlcmVuY2UgdG8gcGFzcyBkb3duIHRvXG4gKiBXZWJHTFJlbmRlcmVyLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIENvbnRleHQoc2VsZWN0b3IsIGNvbXBvc2l0b3IpIHtcbiAgICB0aGlzLl9jb21wb3NpdG9yID0gY29tcG9zaXRvcjtcbiAgICB0aGlzLl9yb290RWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XG5cbiAgICAvLyBDcmVhdGUgRE9NIGVsZW1lbnQgdG8gYmUgdXNlZCBhcyByb290IGZvciBhbGwgZmFtb3VzIERPTVxuICAgIC8vIHJlbmRlcmluZyBhbmQgYXBwZW5kIGVsZW1lbnQgdG8gdGhlIHJvb3QgZWxlbWVudC5cblxuICAgIHZhciBET01MYXllckVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fcm9vdEVsLmFwcGVuZENoaWxkKERPTUxheWVyRWwpO1xuXG4gICAgLy8gSW5zdGFudGlhdGUgcmVuZGVyZXJzXG5cbiAgICB0aGlzLkRPTVJlbmRlcmVyID0gbmV3IERPTVJlbmRlcmVyKERPTUxheWVyRWwsIHNlbGVjdG9yLCBjb21wb3NpdG9yKTtcbiAgICB0aGlzLldlYkdMUmVuZGVyZXIgPSBudWxsO1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIC8vIFN0YXRlIGhvbGRlcnNcblxuICAgIHRoaXMuX3JlbmRlclN0YXRlID0ge1xuICAgICAgICBwcm9qZWN0aW9uVHlwZTogQ2FtZXJhLk9SVEhPR1JBUEhJQ19QUk9KRUNUSU9OLFxuICAgICAgICBwZXJzcGVjdGl2ZVRyYW5zZm9ybTogbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgICAgICB2aWV3VHJhbnNmb3JtOiBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSksXG4gICAgICAgIHZpZXdEaXJ0eTogZmFsc2UsXG4gICAgICAgIHBlcnNwZWN0aXZlRGlydHk6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMuX3NpemUgPSBbXTtcbiAgICB0aGlzLl9jaGlsZHJlbiA9IHt9O1xuICAgIHRoaXMuX2VsZW1lbnRIYXNoID0ge307XG5cbiAgICB0aGlzLl9tZXNoVHJhbnNmb3JtID0gW107XG4gICAgdGhpcy5fbWVzaFNpemUgPSBbMCwgMCwgMF07XG59XG5cbi8qKlxuICogUXVlcmllcyBET01SZW5kZXJlciBzaXplIGFuZCB1cGRhdGVzIGNhbnZhcyBzaXplLiBSZWxheXMgc2l6ZSBpbmZvcm1hdGlvbiB0b1xuICogV2ViR0xSZW5kZXJlci5cbiAqXG4gKiBAcmV0dXJuIHtDb250ZXh0fSB0aGlzXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLnVwZGF0ZVNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5ld1NpemUgPSB0aGlzLkRPTVJlbmRlcmVyLmdldFNpemUoKTtcbiAgICB0aGlzLl9jb21wb3NpdG9yLnNlbmRSZXNpemUodGhpcy5fc2VsZWN0b3IsIG5ld1NpemUpO1xuXG4gICAgdmFyIHdpZHRoID0gbmV3U2l6ZVswXTtcbiAgICB2YXIgaGVpZ2h0ID0gbmV3U2l6ZVsxXTtcblxuICAgIHRoaXMuX3NpemVbMF0gPSB3aWR0aDtcbiAgICB0aGlzLl9zaXplWzFdID0gaGVpZ2h0O1xuICAgIHRoaXMuX3NpemVbMl0gPSAod2lkdGggPiBoZWlnaHQpID8gd2lkdGggOiBoZWlnaHQ7XG5cbiAgICBpZiAodGhpcy5jYW52YXMpIHtcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggID0gd2lkdGg7XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIudXBkYXRlU2l6ZSh0aGlzLl9zaXplKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBEcmF3IGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBhbGwgY29tbWFuZHMgaGF2ZSBiZWVuIGhhbmRsZWQgZm9yIGN1cnJlbnQgZnJhbWUuXG4gKiBJc3N1ZXMgZHJhdyBjb21tYW5kcyB0byBhbGwgcmVuZGVyZXJzIHdpdGggY3VycmVudCByZW5kZXJTdGF0ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIGRyYXcoKSB7XG4gICAgdGhpcy5ET01SZW5kZXJlci5kcmF3KHRoaXMuX3JlbmRlclN0YXRlKTtcbiAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZHJhdyh0aGlzLl9yZW5kZXJTdGF0ZSk7XG5cbiAgICBpZiAodGhpcy5fcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVEaXJ0eSkgdGhpcy5fcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVEaXJ0eSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLl9yZW5kZXJTdGF0ZS52aWV3RGlydHkpIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdEaXJ0eSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBzaXplIG9mIHRoZSBwYXJlbnQgZWxlbWVudCBvZiB0aGUgRE9NUmVuZGVyZXIgZm9yIHRoaXMgY29udGV4dC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUuZ2V0Um9vdFNpemUgPSBmdW5jdGlvbiBnZXRSb290U2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5ET01SZW5kZXJlci5nZXRTaXplKCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZXMgaW5pdGlhbGl6YXRpb24gb2YgV2ViR0xSZW5kZXJlciB3aGVuIG5lY2Vzc2FyeSwgaW5jbHVkaW5nIGNyZWF0aW9uXG4gKiBvZiB0aGUgY2FudmFzIGVsZW1lbnQgYW5kIGluc3RhbnRpYXRpb24gb2YgdGhlIHJlbmRlcmVyLiBBbHNvIHVwZGF0ZXMgc2l6ZVxuICogdG8gcGFzcyBzaXplIGluZm9ybWF0aW9uIHRvIHRoZSByZW5kZXJlci5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29udGV4dC5wcm90b3R5cGUuaW5pdFdlYkdMID0gZnVuY3Rpb24gaW5pdFdlYkdMKCkge1xuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5fcm9vdEVsLmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcbiAgICB0aGlzLldlYkdMUmVuZGVyZXIgPSBuZXcgV2ViR0xSZW5kZXJlcih0aGlzLmNhbnZhcywgdGhpcy5fY29tcG9zaXRvcik7XG4gICAgdGhpcy51cGRhdGVTaXplKCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZXMgZGVsZWdhdGlvbiBvZiBjb21tYW5kcyB0byByZW5kZXJlcnMgb2YgdGhpcyBjb250ZXh0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBTdHJpbmcgdXNlZCBhcyBpZGVudGlmaWVyIG9mIGEgZ2l2ZW4gbm9kZSBpbiB0aGVcbiAqIHNjZW5lIGdyYXBoLlxuICogQHBhcmFtIHtBcnJheX0gY29tbWFuZHMgTGlzdCBvZiBhbGwgY29tbWFuZHMgZnJvbSB0aGlzIGZyYW1lLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZXJhdG9yIE51bWJlciBpbmRpY2F0aW5nIHByb2dyZXNzIHRocm91Z2ggdGhlIGNvbW1hbmRcbiAqIHF1ZXVlLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gaXRlcmF0b3IgaW5kaWNhdGluZyBwcm9ncmVzcyB0aHJvdWdoIHRoZSBjb21tYW5kIHF1ZXVlLlxuICovXG5Db250ZXh0LnByb3RvdHlwZS5yZWNlaXZlID0gZnVuY3Rpb24gcmVjZWl2ZShwYXRoLCBjb21tYW5kcywgaXRlcmF0b3IpIHtcbiAgICB2YXIgbG9jYWxJdGVyYXRvciA9IGl0ZXJhdG9yO1xuXG4gICAgdmFyIGNvbW1hbmQgPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgIHRoaXMuRE9NUmVuZGVyZXIubG9hZFBhdGgocGF0aCk7XG4gICAgdGhpcy5ET01SZW5kZXJlci5maW5kVGFyZ2V0KCk7XG4gICAgd2hpbGUgKGNvbW1hbmQpIHtcblxuICAgICAgICBzd2l0Y2ggKGNvbW1hbmQpIHtcbiAgICAgICAgICAgIGNhc2UgJ0lOSVRfRE9NJzpcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLmluc2VydEVsKGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdET01fUkVOREVSX1NJWkUnOlxuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuZ2V0U2l6ZU9mKGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDSEFOR0VfVFJBTlNGT1JNJzpcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCA7IGkgPCAxNiA7IGkrKykgdGhpcy5fbWVzaFRyYW5zZm9ybVtpXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnNldE1hdHJpeCh0aGlzLl9tZXNoVHJhbnNmb3JtKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRDdXRvdXRVbmlmb3JtKHBhdGgsICd1X3RyYW5zZm9ybScsIHRoaXMuX21lc2hUcmFuc2Zvcm0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0NIQU5HRV9TSVpFJzpcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzaFNpemVbMF0gPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzaFNpemVbMV0gPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRDdXRvdXRVbmlmb3JtKHBhdGgsICd1X3NpemUnLCB0aGlzLl9tZXNoU2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDSEFOR0VfUFJPUEVSVFknOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5nZXRPclNldEN1dG91dChwYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnNldFByb3BlcnR5KGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDSEFOR0VfQ09OVEVOVCc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuc2V0Q29udGVudChjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQ0hBTkdFX0FUVFJJQlVURSc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmdldE9yU2V0Q3V0b3V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuc2V0QXR0cmlidXRlKGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdBRERfQ0xBU1MnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5nZXRPclNldEN1dG91dChwYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLmFkZENsYXNzKGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdSRU1PVkVfQ0xBU1MnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5nZXRPclNldEN1dG91dChwYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnJlbW92ZUNsYXNzKGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdTVUJTQ1JJQkUnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5nZXRPclNldEN1dG91dChwYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnN1YnNjcmliZShjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLCBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfU0VUX0RSQVdfT1BUSU9OUyc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldE1lc2hPcHRpb25zKHBhdGgsIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9BTUJJRU5UX0xJR0hUJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0QW1iaWVudExpZ2h0Q29sb3IoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9MSUdIVF9QT1NJVElPTic6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldExpZ2h0UG9zaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9MSUdIVF9DT0xPUic6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldExpZ2h0Q29sb3IoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdNQVRFUklBTF9JTlBVVCc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLmhhbmRsZU1hdGVyaWFsSW5wdXQoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9TRVRfR0VPTUVUUlknOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRHZW9tZXRyeShcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX1VOSUZPUk1TJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0TWVzaFVuaWZvcm0oXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9CVUZGRVJfREFUQSc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLmJ1ZmZlckRhdGEoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9DVVRPVVRfU1RBVEUnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRDdXRvdXRTdGF0ZShwYXRoLCBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfTUVTSF9WSVNJQklMSVRZJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0TWVzaFZpc2liaWxpdHkocGF0aCwgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX1JFTU9WRV9NRVNIJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIucmVtb3ZlTWVzaChwYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnUElOSE9MRV9QUk9KRUNUSU9OJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS5wcm9qZWN0aW9uVHlwZSA9IENhbWVyYS5QSU5IT0xFX1BST0pFQ1RJT047XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdID0gLTEgLyBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ09SVEhPR1JBUEhJQ19QUk9KRUNUSU9OJzpcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS5wcm9qZWN0aW9uVHlwZSA9IENhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTjtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMV0gPSAwO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0NIQU5HRV9WSUVXX1RSQU5TRk9STSc6XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVswXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsyXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVszXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzRdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzVdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzZdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzddID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bOF0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bOV0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMTBdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzExXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzEyXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxM10gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMTRdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzE1XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3RGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdXSVRIJzogcmV0dXJuIGxvY2FsSXRlcmF0b3IgLSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgY29tbWFuZCA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsSXRlcmF0b3I7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVGhlIFVJTWFuYWdlciBpcyBiZWluZyB1cGRhdGVkIGJ5IGFuIEVuZ2luZSBieSBjb25zZWN1dGl2ZWx5IGNhbGxpbmcgaXRzXG4gKiBgdXBkYXRlYCBtZXRob2QuIEl0IGNhbiBlaXRoZXIgbWFuYWdlIGEgcmVhbCBXZWItV29ya2VyIG9yIHRoZSBnbG9iYWxcbiAqIEZhbW91c0VuZ2luZSBjb3JlIHNpbmdsZXRvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGNvbXBvc2l0b3IgPSBuZXcgQ29tcG9zaXRvcigpO1xuICogdmFyIGVuZ2luZSA9IG5ldyBFbmdpbmUoKTtcbiAqXG4gKiAvLyBVc2luZyBhIFdlYiBXb3JrZXJcbiAqIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKCd3b3JrZXIuYnVuZGxlLmpzJyk7XG4gKiB2YXIgdGhyZWFkbWFuZ2VyID0gbmV3IFVJTWFuYWdlcih3b3JrZXIsIGNvbXBvc2l0b3IsIGVuZ2luZSk7XG4gKlxuICogLy8gV2l0aG91dCB1c2luZyBhIFdlYiBXb3JrZXJcbiAqIHZhciB0aHJlYWRtYW5nZXIgPSBuZXcgVUlNYW5hZ2VyKEZhbW91cywgY29tcG9zaXRvciwgZW5naW5lKTtcbiAqXG4gKiBAY2xhc3MgIFVJTWFuYWdlclxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtGYW1vdXN8V29ya2VyfSB0aHJlYWQgVGhlIHRocmVhZCBiZWluZyB1c2VkIHRvIHJlY2VpdmUgbWVzc2FnZXNcbiAqIGZyb20gYW5kIHBvc3QgbWVzc2FnZXMgdG8uIEV4cGVjdGVkIHRvIGV4cG9zZSBhIFdlYldvcmtlci1saWtlIEFQSSwgd2hpY2hcbiAqIG1lYW5zIHByb3ZpZGluZyBhIHdheSB0byBsaXN0ZW4gZm9yIHVwZGF0ZXMgYnkgc2V0dGluZyBpdHMgYG9ubWVzc2FnZWBcbiAqIHByb3BlcnR5IGFuZCBzZW5kaW5nIHVwZGF0ZXMgdXNpbmcgYHBvc3RNZXNzYWdlYC5cbiAqIEBwYXJhbSB7Q29tcG9zaXRvcn0gY29tcG9zaXRvciBhbiBpbnN0YW5jZSBvZiBDb21wb3NpdG9yIHVzZWQgdG8gZXh0cmFjdFxuICogZW5xdWV1ZWQgZHJhdyBjb21tYW5kcyBmcm9tIHRvIGJlIHNlbnQgdG8gdGhlIHRocmVhZC5cbiAqIEBwYXJhbSB7UmVuZGVyTG9vcH0gcmVuZGVyTG9vcCBhbiBpbnN0YW5jZSBvZiBFbmdpbmUgdXNlZCBmb3IgZXhlY3V0aW5nXG4gKiB0aGUgYEVOR0lORWAgY29tbWFuZHMgb24uXG4gKi9cbmZ1bmN0aW9uIFVJTWFuYWdlciAodGhyZWFkLCBjb21wb3NpdG9yLCByZW5kZXJMb29wKSB7XG4gICAgdGhpcy5fdGhyZWFkID0gdGhyZWFkO1xuICAgIHRoaXMuX2NvbXBvc2l0b3IgPSBjb21wb3NpdG9yO1xuICAgIHRoaXMuX3JlbmRlckxvb3AgPSByZW5kZXJMb29wO1xuXG4gICAgdGhpcy5fcmVuZGVyTG9vcC51cGRhdGUodGhpcyk7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuX3RocmVhZC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBldi5kYXRhID8gZXYuZGF0YSA6IGV2O1xuICAgICAgICBpZiAobWVzc2FnZVswXSA9PT0gJ0VOR0lORScpIHtcbiAgICAgICAgICAgIHN3aXRjaCAobWVzc2FnZVsxXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ1NUQVJUJzpcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3JlbmRlckxvb3Auc3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnU1RPUCc6XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9yZW5kZXJMb29wLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdVbmtub3duIEVOR0lORSBjb21tYW5kIFwiJyArIG1lc3NhZ2VbMV0gKyAnXCInXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgX3RoaXMuX2NvbXBvc2l0b3IucmVjZWl2ZUNvbW1hbmRzKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLl90aHJlYWQub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHRocmVhZCBiZWluZyB1c2VkIGJ5IHRoZSBVSU1hbmFnZXIuXG4gKiBUaGlzIGNvdWxkIGVpdGhlciBiZSBhbiBhbiBhY3R1YWwgd2ViIHdvcmtlciBvciBhIGBGYW1vdXNFbmdpbmVgIHNpbmdsZXRvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7V29ya2VyfEZhbW91c0VuZ2luZX0gRWl0aGVyIGEgd2ViIHdvcmtlciBvciBhIGBGYW1vdXNFbmdpbmVgIHNpbmdsZXRvbi5cbiAqL1xuVUlNYW5hZ2VyLnByb3RvdHlwZS5nZXRUaHJlYWQgPSBmdW5jdGlvbiBnZXRUaHJlYWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RocmVhZDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29tcG9zaXRvciBiZWluZyB1c2VkIGJ5IHRoaXMgVUlNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtDb21wb3NpdG9yfSBUaGUgY29tcG9zaXRvciB1c2VkIGJ5IHRoZSBVSU1hbmFnZXIuXG4gKi9cblVJTWFuYWdlci5wcm90b3R5cGUuZ2V0Q29tcG9zaXRvciA9IGZ1bmN0aW9uIGdldENvbXBvc2l0b3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvc2l0b3I7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGVuZ2luZSBiZWluZyB1c2VkIGJ5IHRoaXMgVUlNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtFbmdpbmV9IFRoZSBlbmdpbmUgdXNlZCBieSB0aGUgVUlNYW5hZ2VyLlxuICovXG5VSU1hbmFnZXIucHJvdG90eXBlLmdldEVuZ2luZSA9IGZ1bmN0aW9uIGdldEVuZ2luZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyTG9vcDtcbn07XG5cbi8qKlxuICogVXBkYXRlIG1ldGhvZCBiZWluZyBpbnZva2VkIGJ5IHRoZSBFbmdpbmUgb24gZXZlcnkgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gKiBVc2VkIGZvciB1cGRhdGluZyB0aGUgbm90aW9uIG9mIHRpbWUgd2l0aGluIHRoZSBtYW5hZ2VkIHRocmVhZCBieSBzZW5kaW5nXG4gKiBhIEZSQU1FIGNvbW1hbmQgYW5kIHNlbmRpbmcgbWVzc2FnZXMgdG9cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSB0aW1lIHVuaXggdGltZXN0YW1wIHRvIGJlIHBhc3NlZCBkb3duIHRvIHRoZSB3b3JrZXIgYXMgYVxuICogRlJBTUUgY29tbWFuZFxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuVUlNYW5hZ2VyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUgKHRpbWUpIHtcbiAgICB0aGlzLl90aHJlYWQucG9zdE1lc3NhZ2UoWydGUkFNRScsIHRpbWVdKTtcbiAgICB2YXIgdGhyZWFkTWVzc2FnZXMgPSB0aGlzLl9jb21wb3NpdG9yLmRyYXdDb21tYW5kcygpO1xuICAgIHRoaXMuX3RocmVhZC5wb3N0TWVzc2FnZSh0aHJlYWRNZXNzYWdlcyk7XG4gICAgdGhpcy5fY29tcG9zaXRvci5jbGVhckNvbW1hbmRzKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVJTWFuYWdlcjtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNzcyA9ICcuZmFtb3VzLWRvbS1yZW5kZXJlciB7JyArXG4gICAgJ3dpZHRoOjEwMCU7JyArXG4gICAgJ2hlaWdodDoxMDAlOycgK1xuICAgICd0cmFuc2Zvcm0tc3R5bGU6cHJlc2VydmUtM2Q7JyArXG4gICAgJy13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOnByZXNlcnZlLTNkOycgK1xuJ30nICtcblxuJy5mYW1vdXMtZG9tLWVsZW1lbnQgeycgK1xuICAgICctd2Via2l0LXRyYW5zZm9ybS1vcmlnaW46MCUgMCU7JyArXG4gICAgJ3RyYW5zZm9ybS1vcmlnaW46MCUgMCU7JyArXG4gICAgJy13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTp2aXNpYmxlOycgK1xuICAgICdiYWNrZmFjZS12aXNpYmlsaXR5OnZpc2libGU7JyArXG4gICAgJy13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOnByZXNlcnZlLTNkOycgK1xuICAgICd0cmFuc2Zvcm0tc3R5bGU6cHJlc2VydmUtM2Q7JyArXG4gICAgJy13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjp0cmFuc3BhcmVudDsnICtcbiAgICAncG9pbnRlci1ldmVudHM6YXV0bzsnICtcbiAgICAnei1pbmRleDoxOycgK1xuJ30nICtcblxuJy5mYW1vdXMtZG9tLWVsZW1lbnQtY29udGVudCwnICtcbicuZmFtb3VzLWRvbS1lbGVtZW50IHsnICtcbiAgICAncG9zaXRpb246YWJzb2x1dGU7JyArXG4gICAgJ2JveC1zaXppbmc6Ym9yZGVyLWJveDsnICtcbiAgICAnLW1vei1ib3gtc2l6aW5nOmJvcmRlci1ib3g7JyArXG4gICAgJy13ZWJraXQtYm94LXNpemluZzpib3JkZXItYm94OycgK1xuJ30nICtcblxuJy5mYW1vdXMtd2ViZ2wtcmVuZGVyZXIgeycgK1xuICAgICctd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWigxMDAwMDAwcHgpOycgKyAgLyogVE9ETzogRml4IHdoZW4gU2FmYXJpIEZpeGVzKi9cbiAgICAndHJhbnNmb3JtOiB0cmFuc2xhdGVaKDEwMDAwMDBweCknICtcbiAgICAncG9pbnRlci1ldmVudHM6bm9uZTsnICtcbiAgICAncG9zaXRpb246YWJzb2x1dGU7JyArXG4gICAgJ3otaW5kZXg6MTsnICtcbiAgICAndG9wOjA7JyArXG4gICAgJ2xlZnQ6MDsnICtcbid9JztcblxudmFyIElOSkVDVEVEID0gdHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJztcblxuZnVuY3Rpb24gaW5qZWN0Q1NTKCkge1xuICAgIGlmIChJTkpFQ1RFRCkgcmV0dXJuO1xuICAgIElOSkVDVEVEID0gdHJ1ZTtcbiAgICBpZiAoZG9jdW1lbnQuY3JlYXRlU3R5bGVTaGVldCkge1xuICAgICAgICB2YXIgc2hlZXQgPSBkb2N1bWVudC5jcmVhdGVTdHlsZVNoZWV0KCk7XG4gICAgICAgIHNoZWV0LmNzc1RleHQgPSBjc3M7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgKGhlYWQgPyBoZWFkIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluamVjdENTUztcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIGxpZ2h0d2VpZ2h0LCBmZWF0dXJlbGVzcyBFdmVudEVtaXR0ZXIuXG4gKlxuICogQGNsYXNzIENhbGxiYWNrU3RvcmVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDYWxsYmFja1N0b3JlICgpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgKD0ga2V5KS5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIGtleSAgICAgICBUaGUgZXZlbnQgdHlwZSAoZS5nLiBgY2xpY2tgKS5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayAgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHdoZW5ldmVyIGBrZXlgXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50IGlzIGJlaW5nIHRyaWdnZXJlZC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBkZXN0cm95ICAgQSBmdW5jdGlvbiB0byBjYWxsIGlmIHlvdSB3YW50IHRvIHJlbW92ZSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suXG4gKi9cbkNhbGxiYWNrU3RvcmUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24gKGtleSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1trZXldKSB0aGlzLl9ldmVudHNba2V5XSA9IFtdO1xuICAgIHZhciBjYWxsYmFja0xpc3QgPSB0aGlzLl9ldmVudHNba2V5XTtcbiAgICBjYWxsYmFja0xpc3QucHVzaChjYWxsYmFjayk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2tMaXN0LnNwbGljZShjYWxsYmFja0xpc3QuaW5kZXhPZihjYWxsYmFjayksIDEpO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYSBwcmV2aW91c2x5IGFkZGVkIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBtZXRob2Qgb2ZmXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBrZXkgICAgICAgICBUaGUgZXZlbnQgdHlwZSBmcm9tIHdoaWNoIHRoZSBjYWxsYmFjayBmdW5jdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG91bGQgYmUgcmVtb3ZlZC5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayAgVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzIGZvciBrZXkuXG4gKiBAcmV0dXJuIHtDYWxsYmFja1N0b3JlfSB0aGlzXG4gKi9cbkNhbGxiYWNrU3RvcmUucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIG9mZiAoa2V5LCBjYWxsYmFjaykge1xuICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNba2V5XTtcbiAgICBpZiAoZXZlbnRzKSBldmVudHMuc3BsaWNlKGV2ZW50cy5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYWxsIHRoZSBwcmV2aW91c2x5IGZvciB0aGlzIGtleSByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAbWV0aG9kIHRyaWdnZXJcbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgICBrZXkgICAgICBUaGUgZXZlbnQgdHlwZS5cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgIHBheWxvYWQgIFRoZSBldmVudCBwYXlsb2FkIChldmVudCBvYmplY3QpLlxuICogQHJldHVybiB7Q2FsbGJhY2tTdG9yZX0gdGhpc1xuICovXG5DYWxsYmFja1N0b3JlLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gdHJpZ2dlciAoa2V5LCBwYXlsb2FkKSB7XG4gICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1trZXldO1xuICAgIGlmIChldmVudHMpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGVuID0gZXZlbnRzLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIGV2ZW50c1tpXShwYXlsb2FkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbGxiYWNrU3RvcmU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRGVlcCBjbG9uZSBhbiBvYmplY3QuXG4gKlxuICogQG1ldGhvZCAgY2xvbmVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYiAgICAgICBPYmplY3QgdG8gYmUgY2xvbmVkLlxuICogQHJldHVybiB7T2JqZWN0fSBhICAgICAgQ2xvbmVkIG9iamVjdCAoZGVlcCBlcXVhbGl0eSkuXG4gKi9cbnZhciBjbG9uZSA9IGZ1bmN0aW9uIGNsb25lKGIpIHtcbiAgICB2YXIgYTtcbiAgICBpZiAodHlwZW9mIGIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGEgPSAoYiBpbnN0YW5jZW9mIEFycmF5KSA/IFtdIDoge307XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBiKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJba2V5XSA9PT0gJ29iamVjdCcgJiYgYltrZXldICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGJba2V5XSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGFba2V5XSA9IG5ldyBBcnJheShiW2tleV0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFba2V5XVtpXSA9IGNsb25lKGJba2V5XVtpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICBhW2tleV0gPSBjbG9uZShiW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYSA9IGI7XG4gICAgfVxuICAgIHJldHVybiBhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBUYWtlcyBhbiBvYmplY3QgY29udGFpbmluZyBrZXlzIGFuZCB2YWx1ZXMgYW5kIHJldHVybnMgYW4gb2JqZWN0XG4gKiBjb21wcmlzaW5nIHR3byBcImFzc29jaWF0ZVwiIGFycmF5cywgb25lIHdpdGggdGhlIGtleXMgYW5kIHRoZSBvdGhlclxuICogd2l0aCB0aGUgdmFsdWVzLlxuICpcbiAqIEBtZXRob2Qga2V5VmFsdWVzVG9BcnJheXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqICAgICAgICAgICAgICAgICAgICAgIE9iamVjdHMgd2hlcmUgdG8gZXh0cmFjdCBrZXlzIGFuZCB2YWx1ZXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbS5cbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICByZXN1bHRcbiAqICAgICAgICAge0FycmF5LjxTdHJpbmc+fSByZXN1bHQua2V5cyAgICAgS2V5cyBvZiBgcmVzdWx0YCwgYXMgcmV0dXJuZWQgYnlcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYE9iamVjdC5rZXlzKClgXG4gKiAgICAgICAgIHtBcnJheX0gICAgICAgICAgcmVzdWx0LnZhbHVlcyAgIFZhbHVlcyBvZiBwYXNzZWQgaW4gb2JqZWN0LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleVZhbHVlc1RvQXJyYXlzKG9iaikge1xuICAgIHZhciBrZXlzQXJyYXkgPSBbXSwgdmFsdWVzQXJyYXkgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAga2V5c0FycmF5W2ldID0ga2V5O1xuICAgICAgICAgICAgdmFsdWVzQXJyYXlbaV0gPSBvYmpba2V5XTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBrZXlzOiBrZXlzQXJyYXksXG4gICAgICAgIHZhbHVlczogdmFsdWVzQXJyYXlcbiAgICB9O1xufTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFBSRUZJWEVTID0gWycnLCAnLW1zLScsICctd2Via2l0LScsICctbW96LScsICctby0nXTtcblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgdmVuZG9yIHByZWZpeGVkIHZlcnNpb24gb2YgdGhlXG4gKiBwYXNzZWQgaW4gQ1NTIHByb3BlcnR5LlxuICpcbiAqIFZlbmRvciBjaGVja3MgYXJlIGJlaW5nIGNvbmR1Y3RlZCBpbiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuICpcbiAqIDEuIChubyBwcmVmaXgpXG4gKiAyLiBgLW16LWBcbiAqIDMuIGAtd2Via2l0LWBcbiAqIDQuIGAtbW96LWBcbiAqIDUuIGAtby1gXG4gKlxuICogQG1ldGhvZCB2ZW5kb3JQcmVmaXhcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHkgICAgIENTUyBwcm9wZXJ0eSAobm8gY2FtZWxDYXNlKSwgZS5nLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYm9yZGVyLXJhZGl1c2AuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHByZWZpeGVkICAgIFZlbmRvciBwcmVmaXhlZCB2ZXJzaW9uIG9mIHBhc3NlZCBpbiBDU1NcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgKGUuZy4gYC13ZWJraXQtYm9yZGVyLXJhZGl1c2ApLlxuICovXG5mdW5jdGlvbiB2ZW5kb3JQcmVmaXgocHJvcGVydHkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IFBSRUZJWEVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwcmVmaXhlZCA9IFBSRUZJWEVTW2ldICsgcHJvcGVydHk7XG4gICAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGVbcHJlZml4ZWRdID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHByZWZpeGVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm9wZXJ0eTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2ZW5kb3JQcmVmaXg7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBHZW9tZXRyeUlkcyA9IDA7XG5cbi8qKlxuICogR2VvbWV0cnkgaXMgYSBjb21wb25lbnQgdGhhdCBkZWZpbmVzIGFuZCBtYW5hZ2VzIGRhdGFcbiAqICh2ZXJ0ZXggZGF0YSBhbmQgYXR0cmlidXRlcykgdGhhdCBpcyB1c2VkIHRvIGRyYXcgdG8gV2ViR0wuXG4gKlxuICogQGNsYXNzIEdlb21ldHJ5XG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBpbnN0YW50aWF0aW9uIG9wdGlvbnNcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIEdlb21ldHJ5KG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuREVGQVVMVF9CVUZGRVJfU0laRSA9IDM7XG5cbiAgICB0aGlzLnNwZWMgPSB7XG4gICAgICAgIGlkOiBHZW9tZXRyeUlkcysrLFxuICAgICAgICBkeW5hbWljOiBmYWxzZSxcbiAgICAgICAgdHlwZTogdGhpcy5vcHRpb25zLnR5cGUgfHwgJ1RSSUFOR0xFUycsXG4gICAgICAgIGJ1ZmZlck5hbWVzOiBbXSxcbiAgICAgICAgYnVmZmVyVmFsdWVzOiBbXSxcbiAgICAgICAgYnVmZmVyU3BhY2luZ3M6IFtdLFxuICAgICAgICBpbnZhbGlkYXRpb25zOiBbXVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmJ1ZmZlcnMpIHtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMub3B0aW9ucy5idWZmZXJzLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47KSB7XG4gICAgICAgICAgICB0aGlzLnNwZWMuYnVmZmVyTmFtZXMucHVzaCh0aGlzLm9wdGlvbnMuYnVmZmVyc1tpXS5uYW1lKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5idWZmZXJWYWx1ZXMucHVzaCh0aGlzLm9wdGlvbnMuYnVmZmVyc1tpXS5kYXRhKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5idWZmZXJTcGFjaW5ncy5wdXNoKHRoaXMub3B0aW9ucy5idWZmZXJzW2ldLnNpemUgfHwgdGhpcy5ERUZBVUxUX0JVRkZFUl9TSVpFKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5pbnZhbGlkYXRpb25zLnB1c2goaSsrKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHZW9tZXRyeTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFZlYzMgPSByZXF1aXJlKCcuLi9tYXRoL1ZlYzMnKTtcbnZhciBWZWMyID0gcmVxdWlyZSgnLi4vbWF0aC9WZWMyJyk7XG5cbnZhciBvdXRwdXRzID0gW1xuICAgIG5ldyBWZWMzKCksXG4gICAgbmV3IFZlYzMoKSxcbiAgICBuZXcgVmVjMygpLFxuICAgIG5ldyBWZWMyKCksXG4gICAgbmV3IFZlYzIoKVxuXTtcblxuLyoqXG4gKiBBIGhlbHBlciBvYmplY3QgdXNlZCB0byBjYWxjdWxhdGUgYnVmZmVycyBmb3IgY29tcGxpY2F0ZWQgZ2VvbWV0cmllcy5cbiAqIFRhaWxvcmVkIGZvciB0aGUgV2ViR0xSZW5kZXJlciwgdXNlZCBieSBtb3N0IHByaW1pdGl2ZXMuXG4gKlxuICogQHN0YXRpY1xuICogQGNsYXNzIEdlb21ldHJ5SGVscGVyXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG52YXIgR2VvbWV0cnlIZWxwZXIgPSB7fTtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgaXRlcmF0ZXMgdGhyb3VnaCB2ZXJ0aWNhbCBhbmQgaG9yaXpvbnRhbCBzbGljZXNcbiAqIGJhc2VkIG9uIGlucHV0IGRldGFpbCwgYW5kIGdlbmVyYXRlcyB2ZXJ0aWNlcyBhbmQgaW5kaWNlcyBmb3IgZWFjaFxuICogc3ViZGl2aXNpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gZGV0YWlsWCBBbW91bnQgb2Ygc2xpY2VzIHRvIGl0ZXJhdGUgdGhyb3VnaC5cbiAqIEBwYXJhbSAge051bWJlcn0gZGV0YWlsWSBBbW91bnQgb2Ygc3RhY2tzIHRvIGl0ZXJhdGUgdGhyb3VnaC5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmdW5jIEZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgdmVydGV4IHBvc2l0aW9ucyBhdCBlYWNoIHBvaW50LlxuICogQHBhcmFtICB7Qm9vbGVhbn0gd3JhcCBPcHRpb25hbCBwYXJhbWV0ZXIgKGRlZmF1bHQ6IFBpKSBmb3Igc2V0dGluZyBhIGN1c3RvbSB3cmFwIHJhbmdlXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBPYmplY3QgY29udGFpbmluZyBnZW5lcmF0ZWQgdmVydGljZXMgYW5kIGluZGljZXMuXG4gKi9cbkdlb21ldHJ5SGVscGVyLmdlbmVyYXRlUGFyYW1ldHJpYyA9IGZ1bmN0aW9uIGdlbmVyYXRlUGFyYW1ldHJpYyhkZXRhaWxYLCBkZXRhaWxZLCBmdW5jLCB3cmFwKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG4gICAgdmFyIGk7XG4gICAgdmFyIHRoZXRhO1xuICAgIHZhciBwaGk7XG4gICAgdmFyIGo7XG5cbiAgICAvLyBXZSBjYW4gd3JhcCBhcm91bmQgc2xpZ2h0bHkgbW9yZSB0aGFuIG9uY2UgZm9yIHV2IGNvb3JkaW5hdGVzIHRvIGxvb2sgY29ycmVjdC5cblxuICAgIHZhciBYcmFuZ2UgPSB3cmFwID8gTWF0aC5QSSArIChNYXRoLlBJIC8gKGRldGFpbFggLSAxKSkgOiBNYXRoLlBJO1xuICAgIHZhciBvdXQgPSBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBkZXRhaWxYICsgMTsgaSsrKSB7XG4gICAgICAgIHRoZXRhID0gaSAqIFhyYW5nZSAvIGRldGFpbFg7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBkZXRhaWxZOyBqKyspIHtcbiAgICAgICAgICAgIHBoaSA9IGogKiAyLjAgKiBYcmFuZ2UgLyBkZXRhaWxZO1xuICAgICAgICAgICAgZnVuYyh0aGV0YSwgcGhpLCBvdXQpO1xuICAgICAgICAgICAgdmVydGljZXMucHVzaChvdXRbMF0sIG91dFsxXSwgb3V0WzJdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBpbmRpY2VzID0gW10sXG4gICAgICAgIHYgPSAwLFxuICAgICAgICBuZXh0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBkZXRhaWxYOyBpKyspIHtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGRldGFpbFk7IGorKykge1xuICAgICAgICAgICAgbmV4dCA9IChqICsgMSkgJSBkZXRhaWxZO1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKHYgKyBqLCB2ICsgaiArIGRldGFpbFksIHYgKyBuZXh0KTtcbiAgICAgICAgICAgIGluZGljZXMucHVzaCh2ICsgbmV4dCwgdiArIGogKyBkZXRhaWxZLCB2ICsgbmV4dCArIGRldGFpbFkpO1xuICAgICAgICB9XG4gICAgICAgIHYgKz0gZGV0YWlsWTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJ0aWNlczogdmVydGljZXMsXG4gICAgICAgIGluZGljZXM6IGluZGljZXNcbiAgICB9O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIG5vcm1hbHMgYmVsb25naW5nIHRvIGVhY2ggZmFjZSBvZiBhIGdlb21ldHJ5LlxuICogQXNzdW1lcyBjbG9ja3dpc2UgZGVjbGFyYXRpb24gb2YgdmVydGljZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIGRlY2xhcmluZyBmYWNlcyBvZiBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBBcnJheSB0byBiZSBmaWxsZWQgYW5kIHJldHVybmVkLlxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBDYWxjdWxhdGVkIGZhY2Ugbm9ybWFscy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuY29tcHV0ZU5vcm1hbHMgPSBmdW5jdGlvbiBjb21wdXRlTm9ybWFscyh2ZXJ0aWNlcywgaW5kaWNlcywgb3V0KSB7XG4gICAgdmFyIG5vcm1hbHMgPSBvdXQgfHwgW107XG4gICAgdmFyIGluZGV4T25lO1xuICAgIHZhciBpbmRleFR3bztcbiAgICB2YXIgaW5kZXhUaHJlZTtcbiAgICB2YXIgbm9ybWFsO1xuICAgIHZhciBqO1xuICAgIHZhciBsZW4gPSBpbmRpY2VzLmxlbmd0aCAvIDM7XG4gICAgdmFyIGk7XG4gICAgdmFyIHg7XG4gICAgdmFyIHk7XG4gICAgdmFyIHo7XG4gICAgdmFyIGxlbmd0aDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpbmRleFR3byA9IGluZGljZXNbaSozICsgMF0gKiAzO1xuICAgICAgICBpbmRleE9uZSA9IGluZGljZXNbaSozICsgMV0gKiAzO1xuICAgICAgICBpbmRleFRocmVlID0gaW5kaWNlc1tpKjMgKyAyXSAqIDM7XG5cbiAgICAgICAgb3V0cHV0c1swXS5zZXQodmVydGljZXNbaW5kZXhPbmVdLCB2ZXJ0aWNlc1tpbmRleE9uZSArIDFdLCB2ZXJ0aWNlc1tpbmRleE9uZSArIDJdKTtcbiAgICAgICAgb3V0cHV0c1sxXS5zZXQodmVydGljZXNbaW5kZXhUd29dLCB2ZXJ0aWNlc1tpbmRleFR3byArIDFdLCB2ZXJ0aWNlc1tpbmRleFR3byArIDJdKTtcbiAgICAgICAgb3V0cHV0c1syXS5zZXQodmVydGljZXNbaW5kZXhUaHJlZV0sIHZlcnRpY2VzW2luZGV4VGhyZWUgKyAxXSwgdmVydGljZXNbaW5kZXhUaHJlZSArIDJdKTtcblxuICAgICAgICBub3JtYWwgPSBvdXRwdXRzWzJdLnN1YnRyYWN0KG91dHB1dHNbMF0pLmNyb3NzKG91dHB1dHNbMV0uc3VidHJhY3Qob3V0cHV0c1swXSkpLm5vcm1hbGl6ZSgpO1xuXG4gICAgICAgIG5vcm1hbHNbaW5kZXhPbmUgKyAwXSA9IChub3JtYWxzW2luZGV4T25lICsgMF0gfHwgMCkgKyBub3JtYWwueDtcbiAgICAgICAgbm9ybWFsc1tpbmRleE9uZSArIDFdID0gKG5vcm1hbHNbaW5kZXhPbmUgKyAxXSB8fCAwKSArIG5vcm1hbC55O1xuICAgICAgICBub3JtYWxzW2luZGV4T25lICsgMl0gPSAobm9ybWFsc1tpbmRleE9uZSArIDJdIHx8IDApICsgbm9ybWFsLno7XG5cbiAgICAgICAgbm9ybWFsc1tpbmRleFR3byArIDBdID0gKG5vcm1hbHNbaW5kZXhUd28gKyAwXSB8fCAwKSArIG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW2luZGV4VHdvICsgMV0gPSAobm9ybWFsc1tpbmRleFR3byArIDFdIHx8IDApICsgbm9ybWFsLnk7XG4gICAgICAgIG5vcm1hbHNbaW5kZXhUd28gKyAyXSA9IChub3JtYWxzW2luZGV4VHdvICsgMl0gfHwgMCkgKyBub3JtYWwuejtcblxuICAgICAgICBub3JtYWxzW2luZGV4VGhyZWUgKyAwXSA9IChub3JtYWxzW2luZGV4VGhyZWUgKyAwXSB8fCAwKSArIG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW2luZGV4VGhyZWUgKyAxXSA9IChub3JtYWxzW2luZGV4VGhyZWUgKyAxXSB8fCAwKSArIG5vcm1hbC55O1xuICAgICAgICBub3JtYWxzW2luZGV4VGhyZWUgKyAyXSA9IChub3JtYWxzW2luZGV4VGhyZWUgKyAyXSB8fCAwKSArIG5vcm1hbC56O1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBub3JtYWxzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIHggPSBub3JtYWxzW2ldO1xuICAgICAgICB5ID0gbm9ybWFsc1tpKzFdO1xuICAgICAgICB6ID0gbm9ybWFsc1tpKzJdO1xuICAgICAgICBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICAgICAgZm9yKGogPSAwOyBqPCAzOyBqKyspIHtcbiAgICAgICAgICAgIG5vcm1hbHNbaStqXSAvPSBsZW5ndGg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFscztcbn07XG5cbi8qKlxuICogRGl2aWRlcyBhbGwgaW5zZXJ0ZWQgdHJpYW5nbGVzIGludG8gZm91ciBzdWItdHJpYW5nbGVzLiBBbHRlcnMgdGhlXG4gKiBwYXNzZWQgaW4gYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgZGVjbGFyaW5nIGZhY2VzIG9mIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gdGV4dHVyZUNvb3JkcyBUZXh0dXJlIGNvb3JkaW5hdGVzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5HZW9tZXRyeUhlbHBlci5zdWJkaXZpZGUgPSBmdW5jdGlvbiBzdWJkaXZpZGUoaW5kaWNlcywgdmVydGljZXMsIHRleHR1cmVDb29yZHMpIHtcbiAgICB2YXIgdHJpYW5nbGVJbmRleCA9IGluZGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgZmFjZTtcbiAgICB2YXIgaTtcbiAgICB2YXIgajtcbiAgICB2YXIgaztcbiAgICB2YXIgcG9zO1xuICAgIHZhciB0ZXg7XG5cbiAgICB3aGlsZSAodHJpYW5nbGVJbmRleC0tKSB7XG4gICAgICAgIGZhY2UgPSBpbmRpY2VzLnNsaWNlKHRyaWFuZ2xlSW5kZXggKiAzLCB0cmlhbmdsZUluZGV4ICogMyArIDMpO1xuXG4gICAgICAgIHBvcyA9IGZhY2UubWFwKGZ1bmN0aW9uKHZlcnRJbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBWZWMzKHZlcnRpY2VzW3ZlcnRJbmRleCAqIDNdLCB2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzICsgMV0sIHZlcnRpY2VzW3ZlcnRJbmRleCAqIDMgKyAyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLnNjYWxlKFZlYzMuYWRkKHBvc1swXSwgcG9zWzFdLCBvdXRwdXRzWzBdKSwgMC41LCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLnNjYWxlKFZlYzMuYWRkKHBvc1sxXSwgcG9zWzJdLCBvdXRwdXRzWzBdKSwgMC41LCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLnNjYWxlKFZlYzMuYWRkKHBvc1swXSwgcG9zWzJdLCBvdXRwdXRzWzBdKSwgMC41LCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuXG4gICAgICAgIGlmICh0ZXh0dXJlQ29vcmRzKSB7XG4gICAgICAgICAgICB0ZXggPSBmYWNlLm1hcChmdW5jdGlvbih2ZXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFZlYzIodGV4dHVyZUNvb3Jkc1t2ZXJ0SW5kZXggKiAyXSwgdGV4dHVyZUNvb3Jkc1t2ZXJ0SW5kZXggKiAyICsgMV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0ZXh0dXJlQ29vcmRzLnB1c2guYXBwbHkodGV4dHVyZUNvb3JkcywgVmVjMi5zY2FsZShWZWMyLmFkZCh0ZXhbMF0sIHRleFsxXSwgb3V0cHV0c1szXSksIDAuNSwgb3V0cHV0c1s0XSkudG9BcnJheSgpKTtcbiAgICAgICAgICAgIHRleHR1cmVDb29yZHMucHVzaC5hcHBseSh0ZXh0dXJlQ29vcmRzLCBWZWMyLnNjYWxlKFZlYzIuYWRkKHRleFsxXSwgdGV4WzJdLCBvdXRwdXRzWzNdKSwgMC41LCBvdXRwdXRzWzRdKS50b0FycmF5KCkpO1xuICAgICAgICAgICAgdGV4dHVyZUNvb3Jkcy5wdXNoLmFwcGx5KHRleHR1cmVDb29yZHMsIFZlYzIuc2NhbGUoVmVjMi5hZGQodGV4WzBdLCB0ZXhbMl0sIG91dHB1dHNbM10pLCAwLjUsIG91dHB1dHNbNF0pLnRvQXJyYXkoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpID0gdmVydGljZXMubGVuZ3RoIC0gMztcbiAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICBrID0gaSArIDI7XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGksIGosIGspO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZVswXSwgaSwgayk7XG4gICAgICAgIGluZGljZXMucHVzaChpLCBmYWNlWzFdLCBqKTtcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4XSA9IGs7XG4gICAgICAgIGluZGljZXNbdHJpYW5nbGVJbmRleCArIDFdID0gajtcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4ICsgMl0gPSBmYWNlWzJdO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBkdXBsaWNhdGUgb2YgdmVydGljZXMgdGhhdCBhcmUgc2hhcmVkIGJldHdlZW4gZmFjZXMuXG4gKiBBbHRlcnMgdGhlIGlucHV0IHZlcnRleCBhbmQgaW5kZXggYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIGRlY2xhcmluZyBmYWNlcyBvZiBnZW9tZXRyeVxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0VW5pcXVlRmFjZXMgPSBmdW5jdGlvbiBnZXRVbmlxdWVGYWNlcyh2ZXJ0aWNlcywgaW5kaWNlcykge1xuICAgIHZhciB0cmlhbmdsZUluZGV4ID0gaW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICByZWdpc3RlcmVkID0gW10sXG4gICAgICAgIGluZGV4O1xuXG4gICAgd2hpbGUgKHRyaWFuZ2xlSW5kZXgtLSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuXG4gICAgICAgICAgICBpbmRleCA9IGluZGljZXNbdHJpYW5nbGVJbmRleCAqIDMgKyBpXTtcblxuICAgICAgICAgICAgaWYgKHJlZ2lzdGVyZWRbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCh2ZXJ0aWNlc1tpbmRleCAqIDNdLCB2ZXJ0aWNlc1tpbmRleCAqIDMgKyAxXSwgdmVydGljZXNbaW5kZXggKiAzICsgMl0pO1xuICAgICAgICAgICAgICAgIGluZGljZXNbdHJpYW5nbGVJbmRleCAqIDMgKyBpXSA9IHZlcnRpY2VzLmxlbmd0aCAvIDMgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJlZFtpbmRleF0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBEaXZpZGVzIGFsbCBpbnNlcnRlZCB0cmlhbmdsZXMgaW50byBmb3VyIHN1Yi10cmlhbmdsZXMgd2hpbGUgbWFpbnRhaW5pbmdcbiAqIGEgcmFkaXVzIG9mIG9uZS4gQWx0ZXJzIHRoZSBwYXNzZWQgaW4gYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIGRlY2xhcmluZyBmYWNlcyBvZiBnZW9tZXRyeVxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuR2VvbWV0cnlIZWxwZXIuc3ViZGl2aWRlU3BoZXJvaWQgPSBmdW5jdGlvbiBzdWJkaXZpZGVTcGhlcm9pZCh2ZXJ0aWNlcywgaW5kaWNlcykge1xuICAgIHZhciB0cmlhbmdsZUluZGV4ID0gaW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICBhYmMsXG4gICAgICAgIGZhY2UsXG4gICAgICAgIGksIGosIGs7XG5cbiAgICB3aGlsZSAodHJpYW5nbGVJbmRleC0tKSB7XG4gICAgICAgIGZhY2UgPSBpbmRpY2VzLnNsaWNlKHRyaWFuZ2xlSW5kZXggKiAzLCB0cmlhbmdsZUluZGV4ICogMyArIDMpO1xuICAgICAgICBhYmMgPSBmYWNlLm1hcChmdW5jdGlvbih2ZXJ0SW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMyh2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzXSwgdmVydGljZXNbdmVydEluZGV4ICogMyArIDFdLCB2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzICsgMl0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLm5vcm1hbGl6ZShWZWMzLmFkZChhYmNbMF0sIGFiY1sxXSwgb3V0cHV0c1swXSksIG91dHB1dHNbMV0pLnRvQXJyYXkoKSk7XG4gICAgICAgIHZlcnRpY2VzLnB1c2guYXBwbHkodmVydGljZXMsIFZlYzMubm9ybWFsaXplKFZlYzMuYWRkKGFiY1sxXSwgYWJjWzJdLCBvdXRwdXRzWzBdKSwgb3V0cHV0c1sxXSkudG9BcnJheSgpKTtcbiAgICAgICAgdmVydGljZXMucHVzaC5hcHBseSh2ZXJ0aWNlcywgVmVjMy5ub3JtYWxpemUoVmVjMy5hZGQoYWJjWzBdLCBhYmNbMl0sIG91dHB1dHNbMF0pLCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuXG4gICAgICAgIGkgPSB2ZXJ0aWNlcy5sZW5ndGggLyAzIC0gMztcbiAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICBrID0gaSArIDI7XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGksIGosIGspO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZVswXSwgaSwgayk7XG4gICAgICAgIGluZGljZXMucHVzaChpLCBmYWNlWzFdLCBqKTtcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4ICogM10gPSBrO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXggKiAzICsgMV0gPSBqO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXggKiAzICsgMl0gPSBmYWNlWzJdO1xuICAgIH1cbn07XG5cbi8qKlxuICogRGl2aWRlcyBhbGwgaW5zZXJ0ZWQgdHJpYW5nbGVzIGludG8gZm91ciBzdWItdHJpYW5nbGVzIHdoaWxlIG1haW50YWluaW5nXG4gKiBhIHJhZGl1cyBvZiBvbmUuIEFsdGVycyB0aGUgcGFzc2VkIGluIGFycmF5cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgVmVydGljZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBPcHRpb25hbCBhcnJheSB0byBiZSBmaWxsZWQgd2l0aCByZXN1bHRpbmcgbm9ybWFscy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2YgY2FsY3VsYXRlZCBub3JtYWxzLlxuICovXG5HZW9tZXRyeUhlbHBlci5nZXRTcGhlcm9pZE5vcm1hbHMgPSBmdW5jdGlvbiBnZXRTcGhlcm9pZE5vcm1hbHModmVydGljZXMsIG91dCkge1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgbGVuZ3RoID0gdmVydGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgbm9ybWFsaXplZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbm9ybWFsaXplZCA9IG5ldyBWZWMzKFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAwXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMV0sXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogMyArIDJdXG4gICAgICAgICkubm9ybWFsaXplKCkudG9BcnJheSgpO1xuXG4gICAgICAgIG91dFtpICogMyArIDBdID0gbm9ybWFsaXplZFswXTtcbiAgICAgICAgb3V0W2kgKiAzICsgMV0gPSBub3JtYWxpemVkWzFdO1xuICAgICAgICBvdXRbaSAqIDMgKyAyXSA9IG5vcm1hbGl6ZWRbMl07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0ZXh0dXJlIGNvb3JkaW5hdGVzIGZvciBzcGhlcm9pZCBwcmltaXRpdmVzIGJhc2VkIG9uXG4gKiBpbnB1dCB2ZXJ0aWNlcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgVmVydGljZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBPcHRpb25hbCBhcnJheSB0byBiZSBmaWxsZWQgd2l0aCByZXN1bHRpbmcgdGV4dHVyZSBjb29yZGluYXRlcy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2YgY2FsY3VsYXRlZCB0ZXh0dXJlIGNvb3JkaW5hdGVzXG4gKi9cbkdlb21ldHJ5SGVscGVyLmdldFNwaGVyb2lkVVYgPSBmdW5jdGlvbiBnZXRTcGhlcm9pZFVWKHZlcnRpY2VzLCBvdXQpIHtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIGxlbmd0aCA9IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG4gICAgdmFyIHZlcnRleDtcblxuICAgIHZhciB1diA9IFtdO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZlcnRleCA9IG91dHB1dHNbMF0uc2V0KFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDNdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMl1cbiAgICAgICAgKVxuICAgICAgICAubm9ybWFsaXplKClcbiAgICAgICAgLnRvQXJyYXkoKTtcblxuICAgICAgICB1dlswXSA9IHRoaXMuZ2V0QXppbXV0aCh2ZXJ0ZXgpICogMC41IC8gTWF0aC5QSSArIDAuNTtcbiAgICAgICAgdXZbMV0gPSB0aGlzLmdldEFsdGl0dWRlKHZlcnRleCkgLyBNYXRoLlBJICsgMC41O1xuXG4gICAgICAgIG91dC5wdXNoLmFwcGx5KG91dCwgdXYpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggYW5kIG5vcm1hbGl6ZXMgYSBsaXN0IG9mIHZlcnRpY2VzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gb3V0IE9wdGlvbmFsIGFycmF5IHRvIGJlIGZpbGxlZCB3aXRoIHJlc3VsdGluZyBub3JtYWxpemVkIHZlY3RvcnMuXG4gKlxuICogQHJldHVybiB7QXJyYXl9IE5ldyBsaXN0IG9mIG5vcm1hbGl6ZWQgdmVydGljZXNcbiAqL1xuR2VvbWV0cnlIZWxwZXIubm9ybWFsaXplQWxsID0gZnVuY3Rpb24gbm9ybWFsaXplQWxsKHZlcnRpY2VzLCBvdXQpIHtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIGxlbiA9IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KG91dCwgbmV3IFZlYzModmVydGljZXNbaSAqIDNdLCB2ZXJ0aWNlc1tpICogMyArIDFdLCB2ZXJ0aWNlc1tpICogMyArIDJdKS5ub3JtYWxpemUoKS50b0FycmF5KCkpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYSBzZXQgb2YgdmVydGljZXMgdG8gbW9kZWwgc3BhY2UuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSBvdXQgT3B0aW9uYWwgYXJyYXkgdG8gYmUgZmlsbGVkIHdpdGggbW9kZWwgc3BhY2UgcG9zaXRpb24gdmVjdG9ycy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gT3V0cHV0IHZlcnRpY2VzLlxuICovXG5HZW9tZXRyeUhlbHBlci5ub3JtYWxpemVWZXJ0aWNlcyA9IGZ1bmN0aW9uIG5vcm1hbGl6ZVZlcnRpY2VzKHZlcnRpY2VzLCBvdXQpIHtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIGxlbiA9IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG4gICAgdmFyIHZlY3RvcnMgPSBbXTtcbiAgICB2YXIgbWluWDtcbiAgICB2YXIgbWF4WDtcbiAgICB2YXIgbWluWTtcbiAgICB2YXIgbWF4WTtcbiAgICB2YXIgbWluWjtcbiAgICB2YXIgbWF4WjtcbiAgICB2YXIgdjtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2ID0gdmVjdG9yc1tpXSA9IG5ldyBWZWMzKFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDNdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMl1cbiAgICAgICAgKTtcblxuICAgICAgICBpZiAobWluWCA9PSBudWxsIHx8IHYueCA8IG1pblgpIG1pblggPSB2Lng7XG4gICAgICAgIGlmIChtYXhYID09IG51bGwgfHwgdi54ID4gbWF4WCkgbWF4WCA9IHYueDtcblxuICAgICAgICBpZiAobWluWSA9PSBudWxsIHx8IHYueSA8IG1pblkpIG1pblkgPSB2Lnk7XG4gICAgICAgIGlmIChtYXhZID09IG51bGwgfHwgdi55ID4gbWF4WSkgbWF4WSA9IHYueTtcblxuICAgICAgICBpZiAobWluWiA9PSBudWxsIHx8IHYueiA8IG1pblopIG1pblogPSB2Lno7XG4gICAgICAgIGlmIChtYXhaID09IG51bGwgfHwgdi56ID4gbWF4WikgbWF4WiA9IHYuejtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNsYXRpb24gPSBuZXcgVmVjMyhcbiAgICAgICAgZ2V0VHJhbnNsYXRpb25GYWN0b3IobWF4WCwgbWluWCksXG4gICAgICAgIGdldFRyYW5zbGF0aW9uRmFjdG9yKG1heFksIG1pblkpLFxuICAgICAgICBnZXRUcmFuc2xhdGlvbkZhY3RvcihtYXhaLCBtaW5aKVxuICAgICk7XG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbihcbiAgICAgICAgZ2V0U2NhbGVGYWN0b3IobWF4WCArIHRyYW5zbGF0aW9uLngsIG1pblggKyB0cmFuc2xhdGlvbi54KSxcbiAgICAgICAgZ2V0U2NhbGVGYWN0b3IobWF4WSArIHRyYW5zbGF0aW9uLnksIG1pblkgKyB0cmFuc2xhdGlvbi55KSxcbiAgICAgICAgZ2V0U2NhbGVGYWN0b3IobWF4WiArIHRyYW5zbGF0aW9uLnosIG1pblogKyB0cmFuc2xhdGlvbi56KVxuICAgICk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdmVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvdXQucHVzaC5hcHBseShvdXQsIHZlY3RvcnNbaV0uYWRkKHRyYW5zbGF0aW9uKS5zY2FsZShzY2FsZSkudG9BcnJheSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRyYW5zbGF0aW9uIGFtb3VudCBmb3IgYSBnaXZlbiBheGlzIHRvIG5vcm1hbGl6ZSBtb2RlbCBjb29yZGluYXRlcy5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggTWF4aW11bSBwb3NpdGlvbiB2YWx1ZSBvZiBnaXZlbiBheGlzIG9uIHRoZSBtb2RlbC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtaW4gTWluaW11bSBwb3NpdGlvbiB2YWx1ZSBvZiBnaXZlbiBheGlzIG9uIHRoZSBtb2RlbC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IE51bWJlciBieSB3aGljaCB0aGUgZ2l2ZW4gYXhpcyBzaG91bGQgYmUgdHJhbnNsYXRlZCBmb3IgYWxsIHZlcnRpY2VzLlxuICovXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkZhY3RvcihtYXgsIG1pbikge1xuICAgIHJldHVybiAtKG1pbiArIChtYXggLSBtaW4pIC8gMik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBzY2FsZSBhbW91bnQgZm9yIGEgZ2l2ZW4gYXhpcyB0byBub3JtYWxpemUgbW9kZWwgY29vcmRpbmF0ZXMuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbWF4IE1heGltdW0gc2NhbGUgdmFsdWUgb2YgZ2l2ZW4gYXhpcyBvbiB0aGUgbW9kZWwuXG4gKiBAcGFyYW0ge051bWJlcn0gbWluIE1pbmltdW0gc2NhbGUgdmFsdWUgb2YgZ2l2ZW4gYXhpcyBvbiB0aGUgbW9kZWwuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBOdW1iZXIgYnkgd2hpY2ggdGhlIGdpdmVuIGF4aXMgc2hvdWxkIGJlIHNjYWxlZCBmb3IgYWxsIHZlcnRpY2VzLlxuICovXG5mdW5jdGlvbiBnZXRTY2FsZUZhY3RvcihtYXgsIG1pbikge1xuICAgIHJldHVybiAxIC8gKChtYXggLSBtaW4pIC8gMik7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGF6aW11dGgsIG9yIGFuZ2xlIGFib3ZlIHRoZSBYWSBwbGFuZSwgb2YgYSBnaXZlbiB2ZWN0b3IuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHYgVmVydGV4IHRvIHJldHJlaXZlIGF6aW11dGggZnJvbS5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEF6aW11dGggdmFsdWUgaW4gcmFkaWFucy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0QXppbXV0aCA9IGZ1bmN0aW9uIGF6aW11dGgodikge1xuICAgIHJldHVybiBNYXRoLmF0YW4yKHZbMl0sIC12WzBdKTtcbn07XG5cbi8qKlxuICogRmluZHMgdGhlIGFsdGl0dWRlLCBvciBhbmdsZSBhYm92ZSB0aGUgWFogcGxhbmUsIG9mIGEgZ2l2ZW4gdmVjdG9yLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2IFZlcnRleCB0byByZXRyZWl2ZSBhbHRpdHVkZSBmcm9tLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gQWx0aXR1ZGUgdmFsdWUgaW4gcmFkaWFucy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0QWx0aXR1ZGUgPSBmdW5jdGlvbiBhbHRpdHVkZSh2KSB7XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoLXZbMV0sIE1hdGguc3FydCgodlswXSAqIHZbMF0pICsgKHZbMl0gKiB2WzJdKSkpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIGxpc3Qgb2YgaW5kaWNlcyBmcm9tICd0cmlhbmdsZScgdG8gJ2xpbmUnIGZvcm1hdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIG9mIGFsbCBmYWNlcyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBJbmRpY2VzIG9mIGFsbCBmYWNlcyBvbiB0aGUgZ2VvbWV0cnlcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2YgbGluZS1mb3JtYXR0ZWQgaW5kaWNlc1xuICovXG5HZW9tZXRyeUhlbHBlci50cmlhbmdsZXNUb0xpbmVzID0gZnVuY3Rpb24gdHJpYW5nbGVUb0xpbmVzKGluZGljZXMsIG91dCkge1xuICAgIHZhciBudW1WZWN0b3JzID0gaW5kaWNlcy5sZW5ndGggLyAzO1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBudW1WZWN0b3JzOyBpKyspIHtcbiAgICAgICAgb3V0LnB1c2goaW5kaWNlc1tpICogMyArIDBdLCBpbmRpY2VzW2kgKiAzICsgMV0pO1xuICAgICAgICBvdXQucHVzaChpbmRpY2VzW2kgKiAzICsgMV0sIGluZGljZXNbaSAqIDMgKyAyXSk7XG4gICAgICAgIG91dC5wdXNoKGluZGljZXNbaSAqIDMgKyAyXSwgaW5kaWNlc1tpICogMyArIDBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIGEgcmV2ZXJzZSBvcmRlciB0cmlhbmdsZSBmb3IgZXZlcnkgdHJpYW5nbGUgaW4gdGhlIG1lc2guIEFkZHMgZXh0cmEgdmVydGljZXNcbiAqIGFuZCBpbmRpY2VzIHRvIGlucHV0IGFycmF5cy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgWCwgWSwgWiBwb3NpdGlvbnMgb2YgYWxsIHZlcnRpY2VzIGluIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gaW5kaWNlcyBJbmRpY2VzIG9mIGFsbCBmYWNlcyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkdlb21ldHJ5SGVscGVyLmFkZEJhY2tmYWNlVHJpYW5nbGVzID0gZnVuY3Rpb24gYWRkQmFja2ZhY2VUcmlhbmdsZXModmVydGljZXMsIGluZGljZXMpIHtcbiAgICB2YXIgbkZhY2VzID0gaW5kaWNlcy5sZW5ndGggLyAzO1xuXG4gICAgdmFyIG1heEluZGV4ID0gMDtcbiAgICB2YXIgaSA9IGluZGljZXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIGlmIChpbmRpY2VzW2ldID4gbWF4SW5kZXgpIG1heEluZGV4ID0gaW5kaWNlc1tpXTtcblxuICAgIG1heEluZGV4Kys7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbkZhY2VzOyBpKyspIHtcbiAgICAgICAgdmFyIGluZGV4T25lID0gaW5kaWNlc1tpICogM10sXG4gICAgICAgICAgICBpbmRleFR3byA9IGluZGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIGluZGV4VGhyZWUgPSBpbmRpY2VzW2kgKiAzICsgMl07XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGluZGV4T25lICsgbWF4SW5kZXgsIGluZGV4VGhyZWUgKyBtYXhJbmRleCwgaW5kZXhUd28gKyBtYXhJbmRleCk7XG4gICAgfVxuXG4gICAgLy8gSXRlcmF0aW5nIGluc3RlYWQgb2YgLnNsaWNlKCkgaGVyZSB0byBhdm9pZCBtYXggY2FsbCBzdGFjayBpc3N1ZS5cblxuICAgIHZhciBuVmVydHMgPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IG5WZXJ0czsgaSsrKSB7XG4gICAgICAgIHZlcnRpY2VzLnB1c2godmVydGljZXNbaV0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2VvbWV0cnlIZWxwZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL0dlb21ldHJ5Jyk7XG52YXIgR2VvbWV0cnlIZWxwZXIgPSByZXF1aXJlKCcuLi9HZW9tZXRyeUhlbHBlcicpO1xuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIG5ldyBzdGF0aWMgZ2VvbWV0cnksIHdoaWNoIGlzIHBhc3NlZFxuICogY3VzdG9tIGJ1ZmZlciBkYXRhLlxuICpcbiAqIEBjbGFzcyBQbGFuZVxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgUGFyYW1ldGVycyB0aGF0IGFsdGVyIHRoZVxuICogdmVydGV4IGJ1ZmZlcnMgb2YgdGhlIGdlbmVyYXRlZCBnZW9tZXRyeS5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGNvbnN0cnVjdGVkIGdlb21ldHJ5XG4gKi9cbmZ1bmN0aW9uIFBsYW5lKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgZGV0YWlsWCA9IG9wdGlvbnMuZGV0YWlsWCB8fCBvcHRpb25zLmRldGFpbCB8fCAxO1xuICAgIHZhciBkZXRhaWxZID0gb3B0aW9ucy5kZXRhaWxZIHx8IG9wdGlvbnMuZGV0YWlsIHx8IDE7XG5cbiAgICB2YXIgdmVydGljZXMgICAgICA9IFtdO1xuICAgIHZhciB0ZXh0dXJlQ29vcmRzID0gW107XG4gICAgdmFyIG5vcm1hbHMgICAgICAgPSBbXTtcbiAgICB2YXIgaW5kaWNlcyAgICAgICA9IFtdO1xuXG4gICAgdmFyIGk7XG5cbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8PSBkZXRhaWxZOyB5KyspIHtcbiAgICAgICAgdmFyIHQgPSB5IC8gZGV0YWlsWTtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gZGV0YWlsWDsgeCsrKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHggLyBkZXRhaWxYO1xuICAgICAgICAgICAgdmVydGljZXMucHVzaCgyLiAqIChzIC0gLjUpLCAyICogKHQgLSAuNSksIDApO1xuICAgICAgICAgICAgdGV4dHVyZUNvb3Jkcy5wdXNoKHMsIDEgLSB0KTtcbiAgICAgICAgICAgIGlmICh4IDwgZGV0YWlsWCAmJiB5IDwgZGV0YWlsWSkge1xuICAgICAgICAgICAgICAgIGkgPSB4ICsgeSAqIChkZXRhaWxYICsgMSk7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGksIGkgKyAxLCBpICsgZGV0YWlsWCArIDEpO1xuICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChpICsgZGV0YWlsWCArIDEsIGkgKyAxLCBpICsgZGV0YWlsWCArIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuYmFja2ZhY2UgIT09IGZhbHNlKSB7XG4gICAgICAgIEdlb21ldHJ5SGVscGVyLmFkZEJhY2tmYWNlVHJpYW5nbGVzKHZlcnRpY2VzLCBpbmRpY2VzKTtcblxuICAgICAgICAvLyBkdXBsaWNhdGUgdGV4dHVyZSBjb29yZGluYXRlcyBhcyB3ZWxsXG5cbiAgICAgICAgdmFyIGxlbiA9IHRleHR1cmVDb29yZHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHRleHR1cmVDb29yZHMucHVzaCh0ZXh0dXJlQ29vcmRzW2ldKTtcbiAgICB9XG5cbiAgICBub3JtYWxzID0gR2VvbWV0cnlIZWxwZXIuY29tcHV0ZU5vcm1hbHModmVydGljZXMsIGluZGljZXMpO1xuXG4gICAgcmV0dXJuIG5ldyBHZW9tZXRyeSh7XG4gICAgICAgIGJ1ZmZlcnM6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2FfcG9zJywgZGF0YTogdmVydGljZXMgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2FfdGV4Q29vcmQnLCBkYXRhOiB0ZXh0dXJlQ29vcmRzLCBzaXplOiAyIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdhX25vcm1hbHMnLCBkYXRhOiBub3JtYWxzIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdpbmRpY2VzJywgZGF0YTogaW5kaWNlcywgc2l6ZTogMSB9XG4gICAgICAgIF1cbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQbGFuZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBCdWZmZXIgaXMgYSBwcml2YXRlIGNsYXNzIHRoYXQgd3JhcHMgdGhlIHZlcnRleCBkYXRhIHRoYXQgZGVmaW5lc1xuICogdGhlIHRoZSBwb2ludHMgb2YgdGhlIHRyaWFuZ2xlcyB0aGF0IHdlYmdsIGRyYXdzLiBFYWNoIGJ1ZmZlclxuICogbWFwcyB0byBvbmUgYXR0cmlidXRlIG9mIGEgbWVzaC5cbiAqXG4gKiBAY2xhc3MgQnVmZmVyXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGFyZ2V0IFRoZSBiaW5kIHRhcmdldCBvZiB0aGUgYnVmZmVyIHRvIHVwZGF0ZTogQVJSQVlfQlVGRkVSIG9yIEVMRU1FTlRfQVJSQVlfQlVGRkVSXG4gKiBAcGFyYW0ge09iamVjdH0gdHlwZSBBcnJheSB0eXBlIHRvIGJlIHVzZWQgaW4gY2FsbHMgdG8gZ2wuYnVmZmVyRGF0YS5cbiAqIEBwYXJhbSB7V2ViR0xDb250ZXh0fSBnbCBUaGUgV2ViR0wgY29udGV4dCB0aGF0IHRoZSBidWZmZXIgaXMgaG9zdGVkIGJ5LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlcih0YXJnZXQsIHR5cGUsIGdsKSB7XG4gICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5kYXRhID0gW107XG4gICAgdGhpcy5nbCA9IGdsO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBXZWJHTCBidWZmZXIgaWYgb25lIGRvZXMgbm90IHlldCBleGlzdCBhbmQgYmluZHMgdGhlIGJ1ZmZlciB0b1xuICogdG8gdGhlIGNvbnRleHQuIFJ1bnMgYnVmZmVyRGF0YSB3aXRoIGFwcHJvcHJpYXRlIGRhdGEuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUuc3ViRGF0YSA9IGZ1bmN0aW9uIHN1YkRhdGEoKSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICB2YXIgZGF0YSA9IFtdO1xuXG4gICAgLy8gdG8gcHJldmVudCBhZ2FpbnN0IG1heGltdW0gY2FsbC1zdGFjayBpc3N1ZS5cbiAgICBmb3IgKHZhciBpID0gMCwgY2h1bmsgPSAxMDAwMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkgKz0gY2h1bmspXG4gICAgICAgIGRhdGEgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KGRhdGEsIHRoaXMuZGF0YS5zbGljZShpLCBpICsgY2h1bmspKTtcblxuICAgIHRoaXMuYnVmZmVyID0gdGhpcy5idWZmZXIgfHwgZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLnRhcmdldCwgdGhpcy5idWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEodGhpcy50YXJnZXQsIG5ldyB0aGlzLnR5cGUoZGF0YSksIGdsLlNUQVRJQ19EUkFXKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgSU5ESUNFUyA9ICdpbmRpY2VzJztcblxudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJy4vQnVmZmVyJyk7XG5cbi8qKlxuICogQnVmZmVyUmVnaXN0cnkgaXMgYSBjbGFzcyB0aGF0IG1hbmFnZXMgYWxsb2NhdGlvbiBvZiBidWZmZXJzIHRvXG4gKiBpbnB1dCBnZW9tZXRyaWVzLlxuICpcbiAqIEBjbGFzcyBCdWZmZXJSZWdpc3RyeVxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtXZWJHTENvbnRleHR9IGNvbnRleHQgV2ViR0wgZHJhd2luZyBjb250ZXh0IHRvIGJlIHBhc3NlZCB0byBidWZmZXJzLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlclJlZ2lzdHJ5KGNvbnRleHQpIHtcbiAgICB0aGlzLmdsID0gY29udGV4dDtcblxuICAgIHRoaXMucmVnaXN0cnkgPSB7fTtcbiAgICB0aGlzLl9keW5hbWljQnVmZmVycyA9IFtdO1xuICAgIHRoaXMuX3N0YXRpY0J1ZmZlcnMgPSBbXTtcblxuICAgIHRoaXMuX2FycmF5QnVmZmVyTWF4ID0gMzAwMDA7XG4gICAgdGhpcy5fZWxlbWVudEJ1ZmZlck1heCA9IDMwMDAwO1xufVxuXG4vKipcbiAqIEJpbmRzIGFuZCBmaWxscyBhbGwgdGhlIHZlcnRleCBkYXRhIGludG8gd2ViZ2wgYnVmZmVycy4gIFdpbGwgcmV1c2UgYnVmZmVycyBpZlxuICogcG9zc2libGUuICBQb3B1bGF0ZXMgcmVnaXN0cnkgd2l0aCB0aGUgbmFtZSBvZiB0aGUgYnVmZmVyLCB0aGUgV2ViR0wgYnVmZmVyXG4gKiBvYmplY3QsIHNwYWNpbmcgb2YgdGhlIGF0dHJpYnV0ZSwgdGhlIGF0dHJpYnV0ZSdzIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlcixcbiAqIGFuZCBmaW5hbGx5IHRoZSBsZW5ndGggb2YgdGhlIGJ1ZmZlci4gIFRoaXMgaW5mb3JtYXRpb24gaXMgbGF0ZXIgYWNjZXNzZWQgYnlcbiAqIHRoZSByb290IHRvIGRyYXcgdGhlIGJ1ZmZlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBnZW9tZXRyeUlkIElkIG9mIHRoZSBnZW9tZXRyeSBpbnN0YW5jZSB0aGF0IGhvbGRzIHRoZSBidWZmZXJzLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgS2V5IG9mIHRoZSBpbnB1dCBidWZmZXIgaW4gdGhlIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWUgRmxhdCBhcnJheSBjb250YWluaW5nIGlucHV0IGRhdGEgZm9yIGJ1ZmZlci5cbiAqIEBwYXJhbSB7TnVtYmVyfSBzcGFjaW5nIFRoZSBzcGFjaW5nLCBvciBpdGVtU2l6ZSwgb2YgdGhlIGlucHV0IGJ1ZmZlci5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZHluYW1pYyBCb29sZWFuIGRlbm90aW5nIHdoZXRoZXIgYSBnZW9tZXRyeSBpcyBkeW5hbWljIG9yIHN0YXRpYy5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5CdWZmZXJSZWdpc3RyeS5wcm90b3R5cGUuYWxsb2NhdGUgPSBmdW5jdGlvbiBhbGxvY2F0ZShnZW9tZXRyeUlkLCBuYW1lLCB2YWx1ZSwgc3BhY2luZywgZHluYW1pYykge1xuICAgIHZhciB2ZXJ0ZXhCdWZmZXJzID0gdGhpcy5yZWdpc3RyeVtnZW9tZXRyeUlkXSB8fCAodGhpcy5yZWdpc3RyeVtnZW9tZXRyeUlkXSA9IHsga2V5czogW10sIHZhbHVlczogW10sIHNwYWNpbmc6IFtdLCBvZmZzZXQ6IFtdLCBsZW5ndGg6IFtdIH0pO1xuXG4gICAgdmFyIGogPSB2ZXJ0ZXhCdWZmZXJzLmtleXMuaW5kZXhPZihuYW1lKTtcbiAgICB2YXIgaXNJbmRleCA9IG5hbWUgPT09IElORElDRVM7XG4gICAgdmFyIGJ1ZmZlckZvdW5kID0gZmFsc2U7XG4gICAgdmFyIG5ld09mZnNldDtcbiAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICB2YXIgbGVuZ3RoO1xuICAgIHZhciBidWZmZXI7XG4gICAgdmFyIGs7XG5cbiAgICBpZiAoaiA9PT0gLTEpIHtcbiAgICAgICAgaiA9IHZlcnRleEJ1ZmZlcnMua2V5cy5sZW5ndGg7XG4gICAgICAgIGxlbmd0aCA9IGlzSW5kZXggPyB2YWx1ZS5sZW5ndGggOiBNYXRoLmZsb29yKHZhbHVlLmxlbmd0aCAvIHNwYWNpbmcpO1xuXG4gICAgICAgIGlmICghZHluYW1pYykge1xuXG4gICAgICAgICAgICAvLyBVc2UgYSBwcmV2aW91c2x5IGNyZWF0ZWQgYnVmZmVyIGlmIGF2YWlsYWJsZS5cblxuICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IHRoaXMuX3N0YXRpY0J1ZmZlcnMubGVuZ3RoOyBrKyspIHtcblxuICAgICAgICAgICAgICAgIGlmIChpc0luZGV4ID09PSB0aGlzLl9zdGF0aWNCdWZmZXJzW2tdLmlzSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3T2Zmc2V0ID0gdGhpcy5fc3RhdGljQnVmZmVyc1trXS5vZmZzZXQgKyB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoIWlzSW5kZXggJiYgbmV3T2Zmc2V0IDwgdGhpcy5fYXJyYXlCdWZmZXJNYXgpIHx8IChpc0luZGV4ICYmIG5ld09mZnNldCA8IHRoaXMuX2VsZW1lbnRCdWZmZXJNYXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSB0aGlzLl9zdGF0aWNCdWZmZXJzW2tdLmJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMuX3N0YXRpY0J1ZmZlcnNba10ub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdGljQnVmZmVyc1trXS5vZmZzZXQgKz0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBzdGF0aWMgYnVmZmVyIGluIG5vbmUgd2VyZSBmb3VuZC5cblxuICAgICAgICAgICAgaWYgKCFidWZmZXJGb3VuZCkge1xuICAgICAgICAgICAgICAgIGJ1ZmZlciA9IG5ldyBCdWZmZXIoXG4gICAgICAgICAgICAgICAgICAgIGlzSW5kZXggPyB0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSIDogdGhpcy5nbC5BUlJBWV9CVUZGRVIsXG4gICAgICAgICAgICAgICAgICAgIGlzSW5kZXggPyBVaW50MTZBcnJheSA6IEZsb2F0MzJBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbFxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0aWNCdWZmZXJzLnB1c2goeyBidWZmZXI6IGJ1ZmZlciwgb2Zmc2V0OiB2YWx1ZS5sZW5ndGgsIGlzSW5kZXg6IGlzSW5kZXggfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIEZvciBkeW5hbWljIGdlb21ldHJpZXMsIGFsd2F5cyBjcmVhdGUgbmV3IGJ1ZmZlci5cblxuICAgICAgICAgICAgYnVmZmVyID0gbmV3IEJ1ZmZlcihcbiAgICAgICAgICAgICAgICBpc0luZGV4ID8gdGhpcy5nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiA6IHRoaXMuZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgICAgICAgICAgIGlzSW5kZXggPyBVaW50MTZBcnJheSA6IEZsb2F0MzJBcnJheSxcbiAgICAgICAgICAgICAgICB0aGlzLmdsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB0aGlzLl9keW5hbWljQnVmZmVycy5wdXNoKHsgYnVmZmVyOiBidWZmZXIsIG9mZnNldDogdmFsdWUubGVuZ3RoLCBpc0luZGV4OiBpc0luZGV4IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSByZWdpc3RyeSBmb3IgdGhlIHNwZWMgd2l0aCBidWZmZXIgaW5mb3JtYXRpb24uXG5cbiAgICAgICAgdmVydGV4QnVmZmVycy5rZXlzLnB1c2gobmFtZSk7XG4gICAgICAgIHZlcnRleEJ1ZmZlcnMudmFsdWVzLnB1c2goYnVmZmVyKTtcbiAgICAgICAgdmVydGV4QnVmZmVycy5zcGFjaW5nLnB1c2goc3BhY2luZyk7XG4gICAgICAgIHZlcnRleEJ1ZmZlcnMub2Zmc2V0LnB1c2gob2Zmc2V0KTtcbiAgICAgICAgdmVydGV4QnVmZmVycy5sZW5ndGgucHVzaChsZW5ndGgpO1xuICAgIH1cblxuICAgIHZhciBsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgZm9yIChrID0gMDsgayA8IGxlbjsgaysrKSB7XG4gICAgICAgIHZlcnRleEJ1ZmZlcnMudmFsdWVzW2pdLmRhdGFbb2Zmc2V0ICsga10gPSB2YWx1ZVtrXTtcbiAgICB9XG4gICAgdmVydGV4QnVmZmVycy52YWx1ZXNbal0uc3ViRGF0YSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJSZWdpc3RyeTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBUYWtlcyB0aGUgb3JpZ2luYWwgcmVuZGVyaW5nIGNvbnRleHRzJyBjb21waWxlciBmdW5jdGlvblxuICogYW5kIGF1Z21lbnRzIGl0IHdpdGggYWRkZWQgZnVuY3Rpb25hbGl0eSBmb3IgcGFyc2luZyBhbmRcbiAqIGRpc3BsYXlpbmcgZXJyb3JzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEF1Z21lbnRlZCBmdW5jdGlvblxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIERlYnVnKCkge1xuICAgIHJldHVybiBfYXVnbWVudEZ1bmN0aW9uKFxuICAgICAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIsXG4gICAgICAgIGZ1bmN0aW9uKHNoYWRlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIHRoaXMuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IHRoaXMuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLmdldFNoYWRlclNvdXJjZShzaGFkZXIpO1xuICAgICAgICAgICAgICAgIF9wcm9jZXNzRXJyb3JzKGVycm9ycywgc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59O1xuXG4vLyBUYWtlcyBhIGZ1bmN0aW9uLCBrZWVwcyB0aGUgcmVmZXJlbmNlIGFuZCByZXBsYWNlcyBpdCBieSBhIGNsb3N1cmUgdGhhdFxuLy8gZXhlY3V0ZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgcHJvdmlkZWQgY2FsbGJhY2suXG5mdW5jdGlvbiBfYXVnbWVudEZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVzID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG59XG5cbi8vIFBhcnNlcyBlcnJvcnMgYW5kIGZhaWxlZCBzb3VyY2UgY29kZSBmcm9tIHNoYWRlcnMgaW4gb3JkZXJcbi8vIHRvIGJ1aWxkIGRpc3BsYXlhYmxlIGVycm9yIGJsb2Nrcy5cbi8vIEluc3BpcmVkIGJ5IEphdW1lIFNhbmNoZXogRWxpYXMuXG5mdW5jdGlvbiBfcHJvY2Vzc0Vycm9ycyhlcnJvcnMsIHNvdXJjZSkge1xuXG4gICAgdmFyIGNzcyA9ICdib2R5LGh0bWx7YmFja2dyb3VuZDojZTNlM2UzO2ZvbnQtZmFtaWx5Om1vbmFjbyxtb25vc3BhY2U7Zm9udC1zaXplOjE0cHg7bGluZS1oZWlnaHQ6MS43ZW19JyArXG4gICAgICAgICAgICAgICcjc2hhZGVyUmVwb3J0e2xlZnQ6MDt0b3A6MDtyaWdodDowO2JveC1zaXppbmc6Ym9yZGVyLWJveDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwMDA7Y29sb3I6JyArXG4gICAgICAgICAgICAgICcjMjIyO3BhZGRpbmc6MTVweDt3aGl0ZS1zcGFjZTpub3JtYWw7bGlzdC1zdHlsZS10eXBlOm5vbmU7bWFyZ2luOjUwcHggYXV0bzttYXgtd2lkdGg6MTIwMHB4fScgK1xuICAgICAgICAgICAgICAnI3NoYWRlclJlcG9ydCBsaXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7bWFyZ2luOjEzcHggMDtib3gtc2hhZG93OjAgMXB4IDJweCByZ2JhKDAsMCwwLC4xNSk7JyArXG4gICAgICAgICAgICAgICdwYWRkaW5nOjIwcHggMzBweDtib3JkZXItcmFkaXVzOjJweDtib3JkZXItbGVmdDoyMHB4IHNvbGlkICNlMDExMTF9c3Bhbntjb2xvcjojZTAxMTExOycgK1xuICAgICAgICAgICAgICAndGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtmb250LXdlaWdodDo3MDB9I3NoYWRlclJlcG9ydCBsaSBwe3BhZGRpbmc6MDttYXJnaW46MH0nICtcbiAgICAgICAgICAgICAgJyNzaGFkZXJSZXBvcnQgbGk6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2Y0ZjRmNH0nICtcbiAgICAgICAgICAgICAgJyNzaGFkZXJSZXBvcnQgbGkgcDpmaXJzdC1jaGlsZHttYXJnaW4tYm90dG9tOjEwcHg7Y29sb3I6IzY2Nn0nO1xuXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGVsKTtcbiAgICBlbC50ZXh0Q29udGVudCA9IGNzcztcblxuICAgIHZhciByZXBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIHJlcG9ydC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ3NoYWRlclJlcG9ydCcpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVwb3J0KTtcblxuICAgIHZhciByZSA9IC9FUlJPUjogW1xcZF0rOihbXFxkXSspOiAoLispL2dtaTtcbiAgICB2YXIgbGluZXMgPSBzb3VyY2Uuc3BsaXQoJ1xcbicpO1xuXG4gICAgdmFyIG07XG4gICAgd2hpbGUgKChtID0gcmUuZXhlYyhlcnJvcnMpKSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChtLmluZGV4ID09PSByZS5sYXN0SW5kZXgpIHJlLmxhc3RJbmRleCsrO1xuICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB2YXIgY29kZSA9ICc8cD48c3Bhbj5FUlJPUjwvc3Bhbj4gXCInICsgbVsyXSArICdcIiBpbiBsaW5lICcgKyBtWzFdICsgJzwvcD4nO1xuICAgICAgICBjb2RlICs9ICc8cD48Yj4nICsgbGluZXNbbVsxXSAtIDFdLnJlcGxhY2UoL15bIFxcdF0rL2csICcnKSArICc8L2I+PC9wPic7XG4gICAgICAgIGxpLmlubmVySFRNTCA9IGNvZGU7XG4gICAgICAgIHJlcG9ydC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xvbmUgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMvY2xvbmUnKTtcbnZhciBrZXlWYWx1ZVRvQXJyYXlzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2tleVZhbHVlVG9BcnJheXMnKTtcblxudmFyIHZlcnRleFdyYXBwZXIgPSByZXF1aXJlKCcuLi93ZWJnbC1zaGFkZXJzJykudmVydGV4O1xudmFyIGZyYWdtZW50V3JhcHBlciA9IHJlcXVpcmUoJy4uL3dlYmdsLXNoYWRlcnMnKS5mcmFnbWVudDtcbnZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4vRGVidWcnKTtcblxudmFyIFZFUlRFWF9TSEFERVIgPSAzNTYzMztcbnZhciBGUkFHTUVOVF9TSEFERVIgPSAzNTYzMjtcbnZhciBpZGVudGl0eU1hdHJpeCA9IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXTtcblxudmFyIGhlYWRlciA9ICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcXG4nO1xuXG52YXIgVFlQRVMgPSB7XG4gICAgdW5kZWZpbmVkOiAnZmxvYXQgJyxcbiAgICAxOiAnZmxvYXQgJyxcbiAgICAyOiAndmVjMiAnLFxuICAgIDM6ICd2ZWMzICcsXG4gICAgNDogJ3ZlYzQgJyxcbiAgICAxNjogJ21hdDQgJ1xufTtcblxudmFyIGlucHV0VHlwZXMgPSB7XG4gICAgdV9iYXNlQ29sb3I6ICd2ZWM0JyxcbiAgICB1X25vcm1hbHM6ICd2ZXJ0JyxcbiAgICB1X2dsb3NzaW5lc3M6ICd2ZWM0JyxcbiAgICB1X3Bvc2l0aW9uT2Zmc2V0OiAndmVydCdcbn07XG5cbnZhciBtYXNrcyA9ICB7XG4gICAgdmVydDogMSxcbiAgICB2ZWMzOiAyLFxuICAgIHZlYzQ6IDQsXG4gICAgZmxvYXQ6IDhcbn07XG5cbi8qKlxuICogVW5pZm9ybSBrZXlzIGFuZCB2YWx1ZXNcbiAqL1xudmFyIHVuaWZvcm1zID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgdV9wZXJzcGVjdGl2ZTogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV92aWV3OiBpZGVudGl0eU1hdHJpeCxcbiAgICB1X3Jlc29sdXRpb246IFswLCAwLCAwXSxcbiAgICB1X3RyYW5zZm9ybTogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV9zaXplOiBbMSwgMSwgMV0sXG4gICAgdV90aW1lOiAwLFxuICAgIHVfb3BhY2l0eTogMSxcbiAgICB1X21ldGFsbmVzczogMCxcbiAgICB1X2dsb3NzaW5lc3M6IFswLCAwLCAwLCAwXSxcbiAgICB1X2Jhc2VDb2xvcjogWzEsIDEsIDEsIDFdLFxuICAgIHVfbm9ybWFsczogWzEsIDEsIDFdLFxuICAgIHVfcG9zaXRpb25PZmZzZXQ6IFswLCAwLCAwXSxcbiAgICB1X2xpZ2h0UG9zaXRpb246IGlkZW50aXR5TWF0cml4LFxuICAgIHVfbGlnaHRDb2xvcjogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV9hbWJpZW50TGlnaHQ6IFswLCAwLCAwXSxcbiAgICB1X2ZsYXRTaGFkaW5nOiAwLFxuICAgIHVfbnVtTGlnaHRzOiAwXG59KTtcblxuLyoqXG4gKiBBdHRyaWJ1dGVzIGtleXMgYW5kIHZhbHVlc1xuICovXG52YXIgYXR0cmlidXRlcyA9IGtleVZhbHVlVG9BcnJheXMoe1xuICAgIGFfcG9zOiBbMCwgMCwgMF0sXG4gICAgYV90ZXhDb29yZDogWzAsIDBdLFxuICAgIGFfbm9ybWFsczogWzAsIDAsIDBdXG59KTtcblxuLyoqXG4gKiBWYXJ5aW5ncyBrZXlzIGFuZCB2YWx1ZXNcbiAqL1xudmFyIHZhcnlpbmdzID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgdl90ZXh0dXJlQ29vcmRpbmF0ZTogWzAsIDBdLFxuICAgIHZfbm9ybWFsOiBbMCwgMCwgMF0sXG4gICAgdl9wb3NpdGlvbjogWzAsIDAsIDBdLFxuICAgIHZfZXllVmVjdG9yOiBbMCwgMCwgMF1cbn0pO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCBoYW5kbGVzIGludGVyYWN0aW9ucyB3aXRoIHRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICogdXNlZCBieSBhIHNwZWNpZmljIGNvbnRleHQuICBJdCBtYW5hZ2VzIGNyZWF0aW9uIG9mIHRoZSBzaGFkZXIgcHJvZ3JhbVxuICogYW5kIHRoZSBhdHRhY2hlZCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnMuICBJdCBpcyBhbHNvIGluIGNoYXJnZSBvZlxuICogcGFzc2luZyBhbGwgdW5pZm9ybXMgdG8gdGhlIFdlYkdMQ29udGV4dC5cbiAqXG4gKiBAY2xhc3MgUHJvZ3JhbVxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtXZWJHTF9Db250ZXh0fSBnbCBDb250ZXh0IHRvIGJlIHVzZWQgdG8gY3JlYXRlIHRoZSBzaGFkZXIgcHJvZ3JhbVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgUHJvZ3JhbSBvcHRpb25zXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gUHJvZ3JhbShnbCwgb3B0aW9ucykge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnRleHR1cmVTbG90cyA9IDE7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHRoaXMucmVnaXN0ZXJlZE1hdGVyaWFscyA9IHt9O1xuICAgIHRoaXMuZmxhZ2dlZFVuaWZvcm1zID0gW107XG4gICAgdGhpcy5jYWNoZWRVbmlmb3JtcyAgPSB7fTtcbiAgICB0aGlzLnVuaWZvcm1UeXBlcyA9IFtdO1xuXG4gICAgdGhpcy5kZWZpbml0aW9uVmVjNCA9IFtdO1xuICAgIHRoaXMuZGVmaW5pdGlvblZlYzMgPSBbXTtcbiAgICB0aGlzLmRlZmluaXRpb25GbG9hdCA9IFtdO1xuICAgIHRoaXMuYXBwbGljYXRpb25WZWMzID0gW107XG4gICAgdGhpcy5hcHBsaWNhdGlvblZlYzQgPSBbXTtcbiAgICB0aGlzLmFwcGxpY2F0aW9uRmxvYXQgPSBbXTtcbiAgICB0aGlzLmFwcGxpY2F0aW9uVmVydCA9IFtdO1xuICAgIHRoaXMuZGVmaW5pdGlvblZlcnQgPSBbXTtcblxuICAgIHRoaXMucmVzZXRQcm9ncmFtKCk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbWF0ZXJpYWwgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkIHRvXG4gKiB0aGUgc2hhZGVyIHByb2dyYW0uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGFyZ2V0IGlucHV0IG9mIG1hdGVyaWFsLlxuICogQHBhcmFtIHtPYmplY3R9IG1hdGVyaWFsIENvbXBpbGVkIG1hdGVyaWFsIG9iamVjdCBiZWluZyB2ZXJpZmllZC5cbiAqXG4gKiBAcmV0dXJuIHtQcm9ncmFtfSB0aGlzIEN1cnJlbnQgcHJvZ3JhbS5cbiAqL1xuUHJvZ3JhbS5wcm90b3R5cGUucmVnaXN0ZXJNYXRlcmlhbCA9IGZ1bmN0aW9uIHJlZ2lzdGVyTWF0ZXJpYWwobmFtZSwgbWF0ZXJpYWwpIHtcbiAgICB2YXIgY29tcGlsZWQgPSBtYXRlcmlhbDtcbiAgICB2YXIgdHlwZSA9IGlucHV0VHlwZXNbbmFtZV07XG4gICAgdmFyIG1hc2sgPSBtYXNrc1t0eXBlXTtcblxuICAgIGlmICgodGhpcy5yZWdpc3RlcmVkTWF0ZXJpYWxzW21hdGVyaWFsLl9pZF0gJiBtYXNrKSA9PT0gbWFzaykgcmV0dXJuIHRoaXM7XG5cbiAgICB2YXIgaztcblxuICAgIGZvciAoayBpbiBjb21waWxlZC51bmlmb3Jtcykge1xuICAgICAgICBpZiAodW5pZm9ybXMua2V5cy5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgdW5pZm9ybXMua2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgdW5pZm9ybXMudmFsdWVzLnB1c2goY29tcGlsZWQudW5pZm9ybXNba10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChrIGluIGNvbXBpbGVkLnZhcnlpbmdzKSB7XG4gICAgICAgIGlmICh2YXJ5aW5ncy5rZXlzLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICB2YXJ5aW5ncy5rZXlzLnB1c2goayk7XG4gICAgICAgICAgICB2YXJ5aW5ncy52YWx1ZXMucHVzaChjb21waWxlZC52YXJ5aW5nc1trXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGsgaW4gY29tcGlsZWQuYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5rZXlzLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmtleXMucHVzaChrKTtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMudmFsdWVzLnB1c2goY29tcGlsZWQuYXR0cmlidXRlc1trXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyZWRNYXRlcmlhbHNbbWF0ZXJpYWwuX2lkXSB8PSBtYXNrO1xuXG4gICAgaWYgKHR5cGUgPT09ICdmbG9hdCcpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uRmxvYXQucHVzaChtYXRlcmlhbC5kZWZpbmVzKTtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uRmxvYXQucHVzaCgnZmxvYXQgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uRmxvYXQucHVzaCgnaWYgKGludChhYnMoSUQpKSA9PSAnICsgbWF0ZXJpYWwuX2lkICsgJykgcmV0dXJuIGZhXycgKyBtYXRlcmlhbC5faWQgICsgJygpOycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAndmVjMycpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uVmVjMy5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZWMzLnB1c2goJ3ZlYzMgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uVmVjMy5wdXNoKCdpZiAoaW50KGFicyhJRC54KSkgPT0gJyArIG1hdGVyaWFsLl9pZCArICcpIHJldHVybiBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpOycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAndmVjNCcpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uVmVjNC5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZWM0LnB1c2goJ3ZlYzQgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uVmVjNC5wdXNoKCdpZiAoaW50KGFicyhJRC54KSkgPT0gJyArIG1hdGVyaWFsLl9pZCArICcpIHJldHVybiBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpOycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSAndmVydCcpIHtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uVmVydC5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZXJ0LnB1c2goJ3ZlYzMgZmFfJyArIG1hdGVyaWFsLl9pZCArICcoKSB7XFxuICcgICsgY29tcGlsZWQuZ2xzbCArICcgXFxufScpO1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uVmVydC5wdXNoKCdpZiAoaW50KGFicyhJRC54KSkgPT0gJyArIG1hdGVyaWFsLl9pZCArICcpIHJldHVybiBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpOycpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlc2V0UHJvZ3JhbSgpO1xufTtcblxuLyoqXG4gKiBDbGVhcnMgYWxsIGNhY2hlZCB1bmlmb3JtcyBhbmQgYXR0cmlidXRlIGxvY2F0aW9ucy4gIEFzc2VtYmxlc1xuICogbmV3IGZyYWdtZW50IGFuZCB2ZXJ0ZXggc2hhZGVycyBhbmQgYmFzZWQgb24gbWF0ZXJpYWwgZnJvbVxuICogY3VycmVudGx5IHJlZ2lzdGVyZWQgbWF0ZXJpYWxzLiAgQXR0YWNoZXMgc2FpZCBzaGFkZXJzIHRvIG5ld1xuICogc2hhZGVyIHByb2dyYW0gYW5kIHVwb24gc3VjY2VzcyBsaW5rcyBwcm9ncmFtIHRvIHRoZSBXZWJHTFxuICogY29udGV4dC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7UHJvZ3JhbX0gQ3VycmVudCBwcm9ncmFtLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS5yZXNldFByb2dyYW0gPSBmdW5jdGlvbiByZXNldFByb2dyYW0oKSB7XG4gICAgdmFyIHZlcnRleEhlYWRlciA9IFtoZWFkZXJdO1xuICAgIHZhciBmcmFnbWVudEhlYWRlciA9IFtoZWFkZXJdO1xuXG4gICAgdmFyIGZyYWdtZW50U291cmNlO1xuICAgIHZhciB2ZXJ0ZXhTb3VyY2U7XG4gICAgdmFyIHByb2dyYW07XG4gICAgdmFyIG5hbWU7XG4gICAgdmFyIHZhbHVlO1xuICAgIHZhciBpO1xuXG4gICAgdGhpcy51bmlmb3JtTG9jYXRpb25zICAgPSBbXTtcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuXG4gICAgdGhpcy51bmlmb3JtVHlwZXMgPSB7fTtcblxuICAgIHRoaXMuYXR0cmlidXRlTmFtZXMgPSBjbG9uZShhdHRyaWJ1dGVzLmtleXMpO1xuICAgIHRoaXMuYXR0cmlidXRlVmFsdWVzID0gY2xvbmUoYXR0cmlidXRlcy52YWx1ZXMpO1xuXG4gICAgdGhpcy52YXJ5aW5nTmFtZXMgPSBjbG9uZSh2YXJ5aW5ncy5rZXlzKTtcbiAgICB0aGlzLnZhcnlpbmdWYWx1ZXMgPSBjbG9uZSh2YXJ5aW5ncy52YWx1ZXMpO1xuXG4gICAgdGhpcy51bmlmb3JtTmFtZXMgPSBjbG9uZSh1bmlmb3Jtcy5rZXlzKTtcbiAgICB0aGlzLnVuaWZvcm1WYWx1ZXMgPSBjbG9uZSh1bmlmb3Jtcy52YWx1ZXMpO1xuXG4gICAgdGhpcy5mbGFnZ2VkVW5pZm9ybXMgPSBbXTtcbiAgICB0aGlzLmNhY2hlZFVuaWZvcm1zID0ge307XG5cbiAgICBmcmFnbWVudEhlYWRlci5wdXNoKCd1bmlmb3JtIHNhbXBsZXIyRCB1X3RleHR1cmVzWzddO1xcbicpO1xuXG4gICAgaWYgKHRoaXMuYXBwbGljYXRpb25WZXJ0Lmxlbmd0aCkge1xuICAgICAgICB2ZXJ0ZXhIZWFkZXIucHVzaCgndW5pZm9ybSBzYW1wbGVyMkQgdV90ZXh0dXJlc1s3XTtcXG4nKTtcbiAgICB9XG5cbiAgICBmb3IoaSA9IDA7IGkgPCB0aGlzLnVuaWZvcm1OYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuYW1lID0gdGhpcy51bmlmb3JtTmFtZXNbaV07XG4gICAgICAgIHZhbHVlID0gdGhpcy51bmlmb3JtVmFsdWVzW2ldO1xuICAgICAgICB2ZXJ0ZXhIZWFkZXIucHVzaCgndW5pZm9ybSAnICsgVFlQRVNbdmFsdWUubGVuZ3RoXSArIG5hbWUgKyAnO1xcbicpO1xuICAgICAgICBmcmFnbWVudEhlYWRlci5wdXNoKCd1bmlmb3JtICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICsgbmFtZSArICc7XFxuJyk7XG4gICAgfVxuXG4gICAgZm9yKGkgPSAwOyBpIDwgdGhpcy5hdHRyaWJ1dGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBuYW1lID0gdGhpcy5hdHRyaWJ1dGVOYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB0aGlzLmF0dHJpYnV0ZVZhbHVlc1tpXTtcbiAgICAgICAgdmVydGV4SGVhZGVyLnB1c2goJ2F0dHJpYnV0ZSAnICsgVFlQRVNbdmFsdWUubGVuZ3RoXSArIG5hbWUgKyAnO1xcbicpO1xuICAgIH1cblxuICAgIGZvcihpID0gMDsgaSA8IHRoaXMudmFyeWluZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSB0aGlzLnZhcnlpbmdOYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB0aGlzLnZhcnlpbmdWYWx1ZXNbaV07XG4gICAgICAgIHZlcnRleEhlYWRlci5wdXNoKCd2YXJ5aW5nICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICArIG5hbWUgKyAnO1xcbicpO1xuICAgICAgICBmcmFnbWVudEhlYWRlci5wdXNoKCd2YXJ5aW5nICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICsgbmFtZSArICc7XFxuJyk7XG4gICAgfVxuXG4gICAgdmVydGV4U291cmNlID0gdmVydGV4SGVhZGVyLmpvaW4oJycpICsgdmVydGV4V3JhcHBlclxuICAgICAgICAucmVwbGFjZSgnI3ZlcnRfZGVmaW5pdGlvbnMnLCB0aGlzLmRlZmluaXRpb25WZXJ0LmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI3ZlcnRfYXBwbGljYXRpb25zJywgdGhpcy5hcHBsaWNhdGlvblZlcnQuam9pbignXFxuJykpO1xuXG4gICAgZnJhZ21lbnRTb3VyY2UgPSBmcmFnbWVudEhlYWRlci5qb2luKCcnKSArIGZyYWdtZW50V3JhcHBlclxuICAgICAgICAucmVwbGFjZSgnI3ZlYzNfZGVmaW5pdGlvbnMnLCB0aGlzLmRlZmluaXRpb25WZWMzLmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI3ZlYzNfYXBwbGljYXRpb25zJywgdGhpcy5hcHBsaWNhdGlvblZlYzMuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjdmVjNF9kZWZpbml0aW9ucycsIHRoaXMuZGVmaW5pdGlvblZlYzQuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjdmVjNF9hcHBsaWNhdGlvbnMnLCB0aGlzLmFwcGxpY2F0aW9uVmVjNC5qb2luKCdcXG4nKSlcbiAgICAgICAgLnJlcGxhY2UoJyNmbG9hdF9kZWZpbml0aW9ucycsIHRoaXMuZGVmaW5pdGlvbkZsb2F0LmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI2Zsb2F0X2FwcGxpY2F0aW9ucycsIHRoaXMuYXBwbGljYXRpb25GbG9hdC5qb2luKCdcXG4nKSk7XG5cbiAgICBwcm9ncmFtID0gdGhpcy5nbC5jcmVhdGVQcm9ncmFtKCk7XG5cbiAgICB0aGlzLmdsLmF0dGFjaFNoYWRlcihcbiAgICAgICAgcHJvZ3JhbSxcbiAgICAgICAgdGhpcy5jb21waWxlU2hhZGVyKHRoaXMuZ2wuY3JlYXRlU2hhZGVyKFZFUlRFWF9TSEFERVIpLCB2ZXJ0ZXhTb3VyY2UpXG4gICAgKTtcblxuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKFxuICAgICAgICBwcm9ncmFtLFxuICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5nbC5jcmVhdGVTaGFkZXIoRlJBR01FTlRfU0hBREVSKSwgZnJhZ21lbnRTb3VyY2UpXG4gICAgKTtcblxuICAgIHRoaXMuZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cbiAgICBpZiAoISB0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgdGhpcy5nbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbGluayBlcnJvcjogJyArIHRoaXMuZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xuICAgICAgICB0aGlzLnByb2dyYW0gPSBudWxsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAgICAgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh0aGlzLnVuaWZvcm1OYW1lcywgdGhpcy51bmlmb3JtVmFsdWVzKTtcblxuICAgIHZhciB0ZXh0dXJlTG9jYXRpb24gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sICd1X3RleHR1cmVzWzBdJyk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWl2KHRleHR1cmVMb2NhdGlvbiwgWzAsIDEsIDIsIDMsIDQsIDUsIDZdKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb21wYXJlcyB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IHVuaWZvcm0gdmFsdWUgYWdhaW5zdFxuICogdGhlIGNhY2hlZCB2YWx1ZSBzdG9yZWQgb24gdGhlIFByb2dyYW0gY2xhc3MuICBVcGRhdGVzIGFuZFxuICogY3JlYXRlcyBuZXcgZW50cmllcyBpbiB0aGUgY2FjaGUgd2hlbiBuZWNlc3NhcnkuXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHRhcmdldE5hbWUgS2V5IG9mIHVuaWZvcm0gc3BlYyBiZWluZyBldmFsdWF0ZWQuXG4gKiBAcGFyYW0ge051bWJlcnxBcnJheX0gdmFsdWUgVmFsdWUgb2YgdW5pZm9ybSBzcGVjIGJlaW5nIGV2YWx1YXRlZC5cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSBib29sZWFuIEluZGljYXRpbmcgd2hldGhlciB0aGUgdW5pZm9ybSBiZWluZyBzZXQgaXMgY2FjaGVkLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS51bmlmb3JtSXNDYWNoZWQgPSBmdW5jdGlvbih0YXJnZXROYW1lLCB2YWx1ZSkge1xuICAgIGlmKHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV0gPT0gbnVsbCkge1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdID0gbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGkgPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGlmKHZhbHVlW2ldICE9PSB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdW2ldKSB7XG4gICAgICAgICAgICAgICAgaSA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZShpLS0pIHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV1baV0gPSB2YWx1ZVtpXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbHNlIGlmICh0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdICE9PSB2YWx1ZSkge1xuICAgICAgICB0aGlzLmNhY2hlZFVuaWZvcm1zW3RhcmdldE5hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogSGFuZGxlcyBhbGwgcGFzc2luZyBvZiB1bmlmb3JtcyB0byBXZWJHTCBkcmF3aW5nIGNvbnRleHQuICBUaGlzXG4gKiBmdW5jdGlvbiB3aWxsIGZpbmQgdGhlIHVuaWZvcm0gbG9jYXRpb24gYW5kIHRoZW4sIGJhc2VkIG9uXG4gKiBhIHR5cGUgaW5mZXJyZWQgZnJvbSB0aGUgamF2YXNjcmlwdCB2YWx1ZSBvZiB0aGUgdW5pZm9ybSwgaXQgd2lsbCBjYWxsXG4gKiB0aGUgYXBwcm9wcmlhdGUgZnVuY3Rpb24gdG8gcGFzcyB0aGUgdW5pZm9ybSB0byBXZWJHTC4gIEZpbmFsbHksXG4gKiBzZXRVbmlmb3JtcyB3aWxsIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcGFzc2VkIGluIHNoYWRlckNodW5rcyAoaWYgYW55KVxuICogYW5kIHNldCB0aGUgYXBwcm9wcmlhdGUgdW5pZm9ybXMgdG8gc3BlY2lmeSB3aGljaCBjaHVua3MgdG8gdXNlLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7QXJyYXl9IHVuaWZvcm1OYW1lcyBBcnJheSBjb250YWluaW5nIHRoZSBrZXlzIG9mIGFsbCB1bmlmb3JtcyB0byBiZSBzZXQuXG4gKiBAcGFyYW0ge0FycmF5fSB1bmlmb3JtVmFsdWUgQXJyYXkgY29udGFpbmluZyB0aGUgdmFsdWVzIG9mIGFsbCB1bmlmb3JtcyB0byBiZSBzZXQuXG4gKlxuICogQHJldHVybiB7UHJvZ3JhbX0gQ3VycmVudCBwcm9ncmFtLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS5zZXRVbmlmb3JtcyA9IGZ1bmN0aW9uICh1bmlmb3JtTmFtZXMsIHVuaWZvcm1WYWx1ZSkge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgdmFyIGxvY2F0aW9uO1xuICAgIHZhciB2YWx1ZTtcbiAgICB2YXIgbmFtZTtcbiAgICB2YXIgbGVuO1xuICAgIHZhciBpO1xuXG4gICAgaWYgKCF0aGlzLnByb2dyYW0pIHJldHVybiB0aGlzO1xuXG4gICAgbGVuID0gdW5pZm9ybU5hbWVzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IHVuaWZvcm1OYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB1bmlmb3JtVmFsdWVbaV07XG5cbiAgICAgICAgLy8gUmV0cmVpdmUgdGhlIGNhY2hlZCBsb2NhdGlvbiBvZiB0aGUgdW5pZm9ybSxcbiAgICAgICAgLy8gcmVxdWVzdGluZyBhIG5ldyBsb2NhdGlvbiBmcm9tIHRoZSBXZWJHTCBjb250ZXh0XG4gICAgICAgIC8vIGlmIGl0IGRvZXMgbm90IHlldCBleGlzdC5cblxuICAgICAgICBsb2NhdGlvbiA9IHRoaXMudW5pZm9ybUxvY2F0aW9uc1tuYW1lXSB8fCBnbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCBuYW1lKTtcbiAgICAgICAgaWYgKCFsb2NhdGlvbikgY29udGludWU7XG5cbiAgICAgICAgdGhpcy51bmlmb3JtTG9jYXRpb25zW25hbWVdID0gbG9jYXRpb247XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGFscmVhZHkgc2V0IGZvciB0aGVcbiAgICAgICAgLy8gZ2l2ZW4gdW5pZm9ybS5cblxuICAgICAgICBpZiAodGhpcy51bmlmb3JtSXNDYWNoZWQobmFtZSwgdmFsdWUpKSBjb250aW51ZTtcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIGNvcnJlY3QgZnVuY3Rpb24gYW5kIHBhc3MgdGhlIHVuaWZvcm1cbiAgICAgICAgLy8gdmFsdWUgdG8gV2ViR0wuXG5cbiAgICAgICAgaWYgKCF0aGlzLnVuaWZvcm1UeXBlc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhpcy51bmlmb3JtVHlwZXNbbmFtZV0gPSB0aGlzLmdldFVuaWZvcm1UeXBlRnJvbVZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGwgdW5pZm9ybSBzZXR0ZXIgZnVuY3Rpb24gb24gV2ViR0wgY29udGV4dCB3aXRoIGNvcnJlY3QgdmFsdWVcblxuICAgICAgICBzd2l0Y2ggKHRoaXMudW5pZm9ybVR5cGVzW25hbWVdKSB7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtNGZ2JzogIGdsLnVuaWZvcm00ZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtM2Z2JzogIGdsLnVuaWZvcm0zZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtMmZ2JzogIGdsLnVuaWZvcm0yZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtMWZ2JzogIGdsLnVuaWZvcm0xZnYobG9jYXRpb24sIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtMWYnIDogIGdsLnVuaWZvcm0xZihsb2NhdGlvbiwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm1NYXRyaXgzZnYnOiBnbC51bmlmb3JtTWF0cml4M2Z2KGxvY2F0aW9uLCBmYWxzZSwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm1NYXRyaXg0ZnYnOiBnbC51bmlmb3JtTWF0cml4NGZ2KGxvY2F0aW9uLCBmYWxzZSwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbmZlcnMgdW5pZm9ybSBzZXR0ZXIgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHRoZSBXZWJHTCBjb250ZXh0LCBiYXNlZFxuICogb24gYW4gaW5wdXQgdmFsdWUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfEFycmF5fSB2YWx1ZSBWYWx1ZSBmcm9tIHdoaWNoIHVuaWZvcm0gdHlwZSBpcyBpbmZlcnJlZC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdW5pZm9ybSBmdW5jdGlvbiBmb3IgZ2l2ZW4gdmFsdWUuXG4gKi9cblByb2dyYW0ucHJvdG90eXBlLmdldFVuaWZvcm1UeXBlRnJvbVZhbHVlID0gZnVuY3Rpb24gZ2V0VW5pZm9ybVR5cGVGcm9tVmFsdWUodmFsdWUpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgc3dpdGNoICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMTogIHJldHVybiAndW5pZm9ybTFmdic7XG4gICAgICAgICAgICBjYXNlIDI6ICByZXR1cm4gJ3VuaWZvcm0yZnYnO1xuICAgICAgICAgICAgY2FzZSAzOiAgcmV0dXJuICd1bmlmb3JtM2Z2JztcbiAgICAgICAgICAgIGNhc2UgNDogIHJldHVybiAndW5pZm9ybTRmdic7XG4gICAgICAgICAgICBjYXNlIDk6ICByZXR1cm4gJ3VuaWZvcm1NYXRyaXgzZnYnO1xuICAgICAgICAgICAgY2FzZSAxNjogcmV0dXJuICd1bmlmb3JtTWF0cml4NGZ2JztcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICghaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpICYmIGlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gJ3VuaWZvcm0xZic7XG4gICAgfVxuXG4gICAgdGhyb3cgJ2NhbnQgbG9hZCB1bmlmb3JtIFwiJyArIG5hbWUgKyAnXCIgd2l0aCB2YWx1ZTonICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xufTtcblxuLyoqXG4gKiBBZGRzIHNoYWRlciBzb3VyY2UgdG8gc2hhZGVyIGFuZCBjb21waWxlcyB0aGUgaW5wdXQgc2hhZGVyLiAgQ2hlY2tzXG4gKiBjb21waWxlIHN0YXR1cyBhbmQgbG9ncyBlcnJvciBpZiBuZWNlc3NhcnkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzaGFkZXIgUHJvZ3JhbSB0byBiZSBjb21waWxlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgU291cmNlIHRvIGJlIHVzZWQgaW4gdGhlIHNoYWRlci5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IENvbXBpbGVkIHNoYWRlci5cbiAqL1xuUHJvZ3JhbS5wcm90b3R5cGUuY29tcGlsZVNoYWRlciA9IGZ1bmN0aW9uIGNvbXBpbGVTaGFkZXIoc2hhZGVyLCBzb3VyY2UpIHtcbiAgICB2YXIgaSA9IDE7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlciA9IERlYnVnLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5nbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xuICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuICAgIGlmICghdGhpcy5nbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCB0aGlzLmdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdjb21waWxlIGVycm9yOiAnICsgdGhpcy5nbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcxOiAnICsgc291cmNlLnJlcGxhY2UoL1xcbi9nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcbicgKyAoaSs9MSkgKyAnOiAnO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYWRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvZ3JhbTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUZXh0dXJlIGlzIGEgcHJpdmF0ZSBjbGFzcyB0aGF0IHN0b3JlcyBpbWFnZSBkYXRhXG4gKiB0byBiZSBhY2Nlc3NlZCBmcm9tIGEgc2hhZGVyIG9yIHVzZWQgYXMgYSByZW5kZXIgdGFyZ2V0LlxuICpcbiAqIEBjbGFzcyBUZXh0dXJlXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0dMfSBnbCBHTFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9uc1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIFRleHR1cmUoZ2wsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IDA7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCAwO1xuICAgIHRoaXMubWlwbWFwID0gb3B0aW9ucy5taXBtYXA7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRpb25zLmZvcm1hdCB8fCAnUkdCQSc7XG4gICAgdGhpcy50eXBlID0gb3B0aW9ucy50eXBlIHx8ICdVTlNJR05FRF9CWVRFJztcbiAgICB0aGlzLmdsID0gZ2w7XG5cbiAgICB0aGlzLmJpbmQoKTtcblxuICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIGZhbHNlKTtcbiAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKTtcblxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbFtvcHRpb25zLm1hZ0ZpbHRlcl0gfHwgZ2wuTkVBUkVTVCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsW29wdGlvbnMubWluRmlsdGVyXSB8fCBnbC5ORUFSRVNUKTtcblxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsW29wdGlvbnMud3JhcFNdIHx8IGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsW29wdGlvbnMud3JhcFRdIHx8IGdsLkNMQU1QX1RPX0VER0UpO1xufVxuXG4vKipcbiAqIEJpbmRzIHRoaXMgdGV4dHVyZSBhcyB0aGUgc2VsZWN0ZWQgdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCB0ZXh0dXJlIGluc3RhbmNlLlxuICovXG5UZXh0dXJlLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gYmluZCgpIHtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVyYXNlcyB0aGUgdGV4dHVyZSBkYXRhIGluIHRoZSBnaXZlbiB0ZXh0dXJlIHNsb3QuXG4gKlxuICogQG1ldGhvZFxuICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IHRleHR1cmUgaW5zdGFuY2UuXG4gKi9cblRleHR1cmUucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uIHVuYmluZCgpIHtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlcGxhY2VzIHRoZSBpbWFnZSBkYXRhIGluIHRoZSB0ZXh0dXJlIHdpdGggdGhlIGdpdmVuIGltYWdlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0ltYWdlfSAgIGltZyAgICAgVGhlIGltYWdlIG9iamVjdCB0byB1cGxvYWQgcGl4ZWwgZGF0YSBmcm9tLlxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgIEN1cnJlbnQgdGV4dHVyZSBpbnN0YW5jZS5cbiAqL1xuVGV4dHVyZS5wcm90b3R5cGUuc2V0SW1hZ2UgPSBmdW5jdGlvbiBzZXRJbWFnZShpbWcpIHtcbiAgICB0aGlzLmdsLnRleEltYWdlMkQodGhpcy5nbC5URVhUVVJFXzJELCAwLCB0aGlzLmdsW3RoaXMuZm9ybWF0XSwgdGhpcy5nbFt0aGlzLmZvcm1hdF0sIHRoaXMuZ2xbdGhpcy50eXBlXSwgaW1nKTtcbiAgICBpZiAodGhpcy5taXBtYXApIHRoaXMuZ2wuZ2VuZXJhdGVNaXBtYXAodGhpcy5nbC5URVhUVVJFXzJEKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVwbGFjZXMgdGhlIGltYWdlIGRhdGEgaW4gdGhlIHRleHR1cmUgd2l0aCBhbiBhcnJheSBvZiBhcmJpdHJhcnkgZGF0YS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gICBpbnB1dCAgIEFycmF5IHRvIGJlIHNldCBhcyBkYXRhIHRvIHRleHR1cmUuXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgQ3VycmVudCB0ZXh0dXJlIGluc3RhbmNlLlxuICovXG5UZXh0dXJlLnByb3RvdHlwZS5zZXRBcnJheSA9IGZ1bmN0aW9uIHNldEFycmF5KGlucHV0KSB7XG4gICAgdGhpcy5nbC50ZXhJbWFnZTJEKHRoaXMuZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5nbFt0aGlzLmZvcm1hdF0sIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCAwLCB0aGlzLmdsW3RoaXMuZm9ybWF0XSwgdGhpcy5nbFt0aGlzLnR5cGVdLCBpbnB1dCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIER1bXBzIHRoZSByZ2ItcGl4ZWwgY29udGVudHMgb2YgYSB0ZXh0dXJlIGludG8gYW4gYXJyYXkgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlc1xuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCAgICAgICAgeC1vZmZzZXQgYmV0d2VlbiB0ZXh0dXJlIGNvb3JkaW5hdGVzIGFuZCBzbmFwc2hvdFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgICAgIHktb2Zmc2V0IGJldHdlZW4gdGV4dHVyZSBjb29yZGluYXRlcyBhbmQgc25hcHNob3RcbiAqIEBwYXJhbSB7TnVtYmVyfSB3aWR0aCAgICB4LWRlcHRoIG9mIHRoZSBzbmFwc2hvdFxuICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCAgIHktZGVwdGggb2YgdGhlIHNuYXBzaG90XG4gKlxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgIEFuIGFycmF5IG9mIHRoZSBwaXhlbHMgY29udGFpbmVkIGluIHRoZSBzbmFwc2hvdC5cbiAqL1xuVGV4dHVyZS5wcm90b3R5cGUucmVhZEJhY2sgPSBmdW5jdGlvbiByZWFkQmFjayh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICB2YXIgcGl4ZWxzO1xuICAgIHggPSB4IHx8IDA7XG4gICAgeSA9IHkgfHwgMDtcbiAgICB3aWR0aCA9IHdpZHRoIHx8IHRoaXMud2lkdGg7XG4gICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xuICAgIHZhciBmYiA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmYik7XG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCB0aGlzLmlkLCAwKTtcbiAgICBpZiAoZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikgPT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICAgIHBpeGVscyA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0ICogNCk7XG4gICAgICAgIGdsLnJlYWRQaXhlbHMoeCwgeSwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxzKTtcbiAgICB9XG4gICAgcmV0dXJuIHBpeGVscztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dHVyZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUZXh0dXJlID0gcmVxdWlyZSgnLi9UZXh0dXJlJyk7XG52YXIgY3JlYXRlQ2hlY2tlcmJvYXJkID0gcmVxdWlyZSgnLi9jcmVhdGVDaGVja2VyYm9hcmQnKTtcblxuLyoqXG4gKiBIYW5kbGVzIGxvYWRpbmcsIGJpbmRpbmcsIGFuZCByZXNhbXBsaW5nIG9mIHRleHR1cmVzIGZvciBXZWJHTFJlbmRlcmVyLlxuICpcbiAqIEBjbGFzcyBUZXh0dXJlTWFuYWdlclxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtXZWJHTF9Db250ZXh0fSBnbCBDb250ZXh0IHVzZWQgdG8gY3JlYXRlIGFuZCBiaW5kIHRleHR1cmVzLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIFRleHR1cmVNYW5hZ2VyKGdsKSB7XG4gICAgdGhpcy5yZWdpc3RyeSA9IFtdO1xuICAgIHRoaXMuX25lZWRzUmVzYW1wbGUgPSBbXTtcblxuICAgIHRoaXMuX2FjdGl2ZVRleHR1cmUgPSAwO1xuICAgIHRoaXMuX2JvdW5kVGV4dHVyZSA9IG51bGw7XG5cbiAgICB0aGlzLl9jaGVja2VyYm9hcmQgPSBjcmVhdGVDaGVja2VyYm9hcmQoKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgZnVuY3Rpb24gdXNlZCBieSBXZWJHTFJlbmRlcmVyIHRvIHF1ZXVlIHJlc2FtcGxlcyBvblxuICogcmVnaXN0ZXJlZCB0ZXh0dXJlcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9ICAgICAgdGltZSAgICBUaW1lIGluIG1pbGxpc2Vjb25kcyBhY2NvcmRpbmcgdG8gdGhlIGNvbXBvc2l0b3IuXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9ICAgICAgICAgIHVuZGVmaW5lZFxuICovXG5UZXh0dXJlTWFuYWdlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKHRpbWUpIHtcbiAgICB2YXIgcmVnaXN0cnlMZW5ndGggPSB0aGlzLnJlZ2lzdHJ5Lmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcmVnaXN0cnlMZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGV4dHVyZSA9IHRoaXMucmVnaXN0cnlbaV07XG5cbiAgICAgICAgaWYgKHRleHR1cmUgJiYgdGV4dHVyZS5pc0xvYWRlZCAmJiB0ZXh0dXJlLnJlc2FtcGxlUmF0ZSkge1xuICAgICAgICAgICAgaWYgKCF0ZXh0dXJlLmxhc3RSZXNhbXBsZSB8fCB0aW1lIC0gdGV4dHVyZS5sYXN0UmVzYW1wbGUgPiB0ZXh0dXJlLnJlc2FtcGxlUmF0ZSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbmVlZHNSZXNhbXBsZVt0ZXh0dXJlLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9uZWVkc1Jlc2FtcGxlW3RleHR1cmUuaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5sYXN0UmVzYW1wbGUgPSB0aW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNwZWMgYW5kIGNyZWF0ZXMgYSB0ZXh0dXJlIGJhc2VkIG9uIGdpdmVuIHRleHR1cmUgZGF0YS5cbiAqIEhhbmRsZXMgbG9hZGluZyBhc3NldHMgaWYgbmVjZXNzYXJ5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gIGlucHV0ICAgT2JqZWN0IGNvbnRhaW5pbmcgdGV4dHVyZSBpZCwgdGV4dHVyZSBkYXRhXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIG9wdGlvbnMgdXNlZCB0byBkcmF3IHRleHR1cmUuXG4gKiBAcGFyYW0ge051bWJlcn0gIHNsb3QgICAgVGV4dHVyZSBzbG90IHRvIGJpbmQgZ2VuZXJhdGVkIHRleHR1cmUgdG8uXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9ICAgICAgdW5kZWZpbmVkXG4gKi9cblRleHR1cmVNYW5hZ2VyLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGlucHV0LCBzbG90KSB7XG4gICAgdmFyIHNvdXJjZSA9IGlucHV0LmRhdGE7XG4gICAgdmFyIHRleHR1cmVJZCA9IGlucHV0LmlkO1xuICAgIHZhciBvcHRpb25zID0gaW5wdXQub3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgdGV4dHVyZSA9IHRoaXMucmVnaXN0cnlbdGV4dHVyZUlkXTtcbiAgICB2YXIgc3BlYztcblxuICAgIGlmICghdGV4dHVyZSkge1xuXG4gICAgICAgIHRleHR1cmUgPSBuZXcgVGV4dHVyZSh0aGlzLmdsLCBvcHRpb25zKTtcbiAgICAgICAgdGV4dHVyZS5zZXRJbWFnZSh0aGlzLl9jaGVja2VyYm9hcmQpO1xuXG4gICAgICAgIC8vIEFkZCB0ZXh0dXJlIHRvIHJlZ2lzdHJ5XG5cbiAgICAgICAgc3BlYyA9IHRoaXMucmVnaXN0cnlbdGV4dHVyZUlkXSA9IHtcbiAgICAgICAgICAgIHJlc2FtcGxlUmF0ZTogb3B0aW9ucy5yZXNhbXBsZVJhdGUgfHwgbnVsbCxcbiAgICAgICAgICAgIGxhc3RSZXNhbXBsZTogbnVsbCxcbiAgICAgICAgICAgIGlzTG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHRleHR1cmU6IHRleHR1cmUsXG4gICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgICAgIGlkOiB0ZXh0dXJlSWQsXG4gICAgICAgICAgICBzbG90OiBzbG90XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSGFuZGxlIGFycmF5XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSB8fCBzb3VyY2UgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IHNvdXJjZSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAgICAgdGhpcy5iaW5kVGV4dHVyZSh0ZXh0dXJlSWQpO1xuICAgICAgICAgICAgdGV4dHVyZS5zZXRBcnJheShzb3VyY2UpO1xuICAgICAgICAgICAgc3BlYy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgdmlkZW9cblxuICAgICAgICBlbHNlIGlmICh3aW5kb3cgJiYgc291cmNlIGluc3RhbmNlb2Ygd2luZG93LkhUTUxWaWRlb0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkZWRkYXRhJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kVGV4dHVyZSh0ZXh0dXJlSWQpO1xuICAgICAgICAgICAgICAgIHRleHR1cmUuc2V0SW1hZ2Uoc291cmNlKTtcblxuICAgICAgICAgICAgICAgIHNwZWMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNwZWMuc291cmNlID0gc291cmNlO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBpbWFnZSB1cmxcblxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbG9hZEltYWdlKHNvdXJjZSwgZnVuY3Rpb24gKGltZykge1xuICAgICAgICAgICAgICAgIHRoaXMuYmluZFRleHR1cmUodGV4dHVyZUlkKTtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLnNldEltYWdlKGltZyk7XG5cbiAgICAgICAgICAgICAgICBzcGVjLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzcGVjLnNvdXJjZSA9IGltZztcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGV4dHVyZUlkO1xufTtcblxuLyoqXG4gKiBMb2FkcyBhbiBpbWFnZSBmcm9tIGEgc3RyaW5nIG9yIEltYWdlIG9iamVjdCBhbmQgZXhlY3V0ZXMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gaW5wdXQgVGhlIGlucHV0IGltYWdlIGRhdGEgdG8gbG9hZCBhcyBhbiBhc3NldC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBmaXJlZCB3aGVuIHRoZSBpbWFnZSBoYXMgZmluaXNoZWQgbG9hZGluZy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IEltYWdlIG9iamVjdCBiZWluZyBsb2FkZWQuXG4gKi9cbmZ1bmN0aW9uIGxvYWRJbWFnZSAoaW5wdXQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGltYWdlID0gKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycgPyBuZXcgSW1hZ2UoKSA6IGlucHV0KSB8fCB7fTtcbiAgICAgICAgaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblxuICAgIGlmICghaW1hZ2Uuc3JjKSBpbWFnZS5zcmMgPSBpbnB1dDtcbiAgICBpZiAoIWltYWdlLmNvbXBsZXRlKSB7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGltYWdlKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKGltYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1hZ2U7XG59XG5cbi8qKlxuICogU2V0cyBhY3RpdmUgdGV4dHVyZSBzbG90IGFuZCBiaW5kcyB0YXJnZXQgdGV4dHVyZS4gIEFsc28gaGFuZGxlc1xuICogcmVzYW1wbGluZyB3aGVuIG5lY2Vzc2FyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGlkIElkZW50aWZpZXIgdXNlZCB0byByZXRyZWl2ZSB0ZXh0dXJlIHNwZWNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5UZXh0dXJlTWFuYWdlci5wcm90b3R5cGUuYmluZFRleHR1cmUgPSBmdW5jdGlvbiBiaW5kVGV4dHVyZShpZCkge1xuICAgIHZhciBzcGVjID0gdGhpcy5yZWdpc3RyeVtpZF07XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlVGV4dHVyZSAhPT0gc3BlYy5zbG90KSB7XG4gICAgICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwICsgc3BlYy5zbG90KTtcbiAgICAgICAgdGhpcy5fYWN0aXZlVGV4dHVyZSA9IHNwZWMuc2xvdDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYm91bmRUZXh0dXJlICE9PSBpZCkge1xuICAgICAgICB0aGlzLl9ib3VuZFRleHR1cmUgPSBpZDtcbiAgICAgICAgc3BlYy50ZXh0dXJlLmJpbmQoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbmVlZHNSZXNhbXBsZVtzcGVjLmlkXSkge1xuXG4gICAgICAgIC8vIFRPRE86IEFjY291bnQgZm9yIHJlc2FtcGxpbmcgb2YgYXJyYXlzLlxuXG4gICAgICAgIHNwZWMudGV4dHVyZS5zZXRJbWFnZShzcGVjLnNvdXJjZSk7XG4gICAgICAgIHRoaXMuX25lZWRzUmVzYW1wbGVbc3BlYy5pZF0gPSBmYWxzZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVNYW5hZ2VyO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUHJvZ3JhbSA9IHJlcXVpcmUoJy4vUHJvZ3JhbScpO1xudmFyIEJ1ZmZlclJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi9CdWZmZXJSZWdpc3RyeScpO1xudmFyIFBsYW5lID0gcmVxdWlyZSgnLi4vd2ViZ2wtZ2VvbWV0cmllcy9wcmltaXRpdmVzL1BsYW5lJyk7XG52YXIgc29ydGVyID0gcmVxdWlyZSgnLi9yYWRpeFNvcnQnKTtcbnZhciBrZXlWYWx1ZVRvQXJyYXlzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2tleVZhbHVlVG9BcnJheXMnKTtcbnZhciBUZXh0dXJlTWFuYWdlciA9IHJlcXVpcmUoJy4vVGV4dHVyZU1hbmFnZXInKTtcbnZhciBjb21waWxlTWF0ZXJpYWwgPSByZXF1aXJlKCcuL2NvbXBpbGVNYXRlcmlhbCcpO1xuXG52YXIgaWRlbnRpdHkgPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV07XG5cbnZhciBnbG9iYWxVbmlmb3JtcyA9IGtleVZhbHVlVG9BcnJheXMoe1xuICAgICd1X251bUxpZ2h0cyc6IDAsXG4gICAgJ3VfYW1iaWVudExpZ2h0JzogbmV3IEFycmF5KDMpLFxuICAgICd1X2xpZ2h0UG9zaXRpb24nOiBuZXcgQXJyYXkoMyksXG4gICAgJ3VfbGlnaHRDb2xvcic6IG5ldyBBcnJheSgzKSxcbiAgICAndV9wZXJzcGVjdGl2ZSc6IG5ldyBBcnJheSgxNiksXG4gICAgJ3VfdGltZSc6IDAsXG4gICAgJ3Vfdmlldyc6IG5ldyBBcnJheSgxNilcbn0pO1xuXG4vKipcbiAqIFdlYkdMUmVuZGVyZXIgaXMgYSBwcml2YXRlIGNsYXNzIHRoYXQgbWFuYWdlcyBhbGwgaW50ZXJhY3Rpb25zIHdpdGggdGhlIFdlYkdMXG4gKiBBUEkuIEVhY2ggZnJhbWUgaXQgcmVjZWl2ZXMgY29tbWFuZHMgZnJvbSB0aGUgY29tcG9zaXRvciBhbmQgdXBkYXRlcyBpdHNcbiAqIHJlZ2lzdHJpZXMgYWNjb3JkaW5nbHkuIFN1YnNlcXVlbnRseSwgdGhlIGRyYXcgZnVuY3Rpb24gaXMgY2FsbGVkIGFuZCB0aGVcbiAqIFdlYkdMUmVuZGVyZXIgaXNzdWVzIGRyYXcgY2FsbHMgZm9yIGFsbCBtZXNoZXMgaW4gaXRzIHJlZ2lzdHJ5LlxuICpcbiAqIEBjbGFzcyBXZWJHTFJlbmRlcmVyXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNhbnZhcyBUaGUgRE9NIGVsZW1lbnQgdGhhdCBHTCB3aWxsIHBhaW50IGl0c2VsZiBvbnRvLlxuICogQHBhcmFtIHtDb21wb3NpdG9yfSBjb21wb3NpdG9yIENvbXBvc2l0b3IgdXNlZCBmb3IgcXVlcnlpbmcgdGhlIHRpbWUgZnJvbS5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBXZWJHTFJlbmRlcmVyKGNhbnZhcywgY29tcG9zaXRvcikge1xuICAgIGNhbnZhcy5jbGFzc0xpc3QuYWRkKCdmYW1vdXMtd2ViZ2wtcmVuZGVyZXInKTtcblxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIHRoaXMuY29tcG9zaXRvciA9IGNvbXBvc2l0b3I7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5jb25zdHJ1Y3Rvci5ERUZBVUxUX1NUWUxFUykge1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZVtrZXldID0gdGhpcy5jb25zdHJ1Y3Rvci5ERUZBVUxUX1NUWUxFU1trZXldO1xuICAgIH1cblxuICAgIHZhciBnbCA9IHRoaXMuZ2wgPSB0aGlzLmdldFdlYkdMQ29udGV4dCh0aGlzLmNhbnZhcyk7XG5cbiAgICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDAuMCk7XG4gICAgZ2wucG9seWdvbk9mZnNldCgwLjEsIDAuMSk7XG4gICAgZ2wuZW5hYmxlKGdsLlBPTFlHT05fT0ZGU0VUX0ZJTEwpO1xuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xuICAgIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgIGdsLmVuYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgIGdsLmN1bGxGYWNlKGdsLkJBQ0spO1xuXG4gICAgdGhpcy5tZXNoUmVnaXN0cnkgPSB7fTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeUtleXMgPSBbXTtcblxuICAgIHRoaXMuY3V0b3V0UmVnaXN0cnkgPSB7fTtcblxuICAgIHRoaXMuY3V0b3V0UmVnaXN0cnlLZXlzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBMaWdodHNcbiAgICAgKi9cbiAgICB0aGlzLm51bUxpZ2h0cyA9IDA7XG4gICAgdGhpcy5hbWJpZW50TGlnaHRDb2xvciA9IFswLCAwLCAwXTtcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnkgPSB7fTtcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnlLZXlzID0gW107XG4gICAgdGhpcy5saWdodFBvc2l0aW9ucyA9IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTtcbiAgICB0aGlzLmxpZ2h0Q29sb3JzID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdO1xuXG4gICAgdGhpcy50ZXh0dXJlTWFuYWdlciA9IG5ldyBUZXh0dXJlTWFuYWdlcihnbCk7XG4gICAgdGhpcy50ZXhDYWNoZSA9IHt9O1xuICAgIHRoaXMuYnVmZmVyUmVnaXN0cnkgPSBuZXcgQnVmZmVyUmVnaXN0cnkoZ2wpO1xuICAgIHRoaXMucHJvZ3JhbSA9IG5ldyBQcm9ncmFtKGdsLCB7IGRlYnVnOiB0cnVlIH0pO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgYm91bmRBcnJheUJ1ZmZlcjogbnVsbCxcbiAgICAgICAgYm91bmRFbGVtZW50QnVmZmVyOiBudWxsLFxuICAgICAgICBsYXN0RHJhd246IG51bGwsXG4gICAgICAgIGVuYWJsZWRBdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgZW5hYmxlZEF0dHJpYnV0ZXNLZXlzOiBbXVxuICAgIH07XG5cbiAgICB0aGlzLnJlc29sdXRpb25OYW1lID0gWyd1X3Jlc29sdXRpb24nXTtcbiAgICB0aGlzLnJlc29sdXRpb25WYWx1ZXMgPSBbXTtcblxuICAgIHRoaXMuY2FjaGVkU2l6ZSA9IFtdO1xuXG4gICAgLypcbiAgICBUaGUgcHJvamVjdGlvblRyYW5zZm9ybSBoYXMgc29tZSBjb25zdGFudCBjb21wb25lbnRzLCBpLmUuIHRoZSB6IHNjYWxlLCBhbmQgdGhlIHggYW5kIHkgdHJhbnNsYXRpb24uXG5cbiAgICBUaGUgeiBzY2FsZSBrZWVwcyB0aGUgZmluYWwgeiBwb3NpdGlvbiBvZiBhbnkgdmVydGV4IHdpdGhpbiB0aGUgY2xpcCdzIGRvbWFpbiBieSBzY2FsaW5nIGl0IGJ5IGFuXG4gICAgYXJiaXRyYXJpbHkgc21hbGwgY29lZmZpY2llbnQuIFRoaXMgaGFzIHRoZSBhZHZhbnRhZ2Ugb2YgYmVpbmcgYSB1c2VmdWwgZGVmYXVsdCBpbiB0aGUgZXZlbnQgb2YgdGhlXG4gICAgdXNlciBmb3Jnb2luZyBhIG5lYXIgYW5kIGZhciBwbGFuZSwgYW4gYWxpZW4gY29udmVudGlvbiBpbiBkb20gc3BhY2UgYXMgaW4gRE9NIG92ZXJsYXBwaW5nIGlzXG4gICAgY29uZHVjdGVkIHZpYSBwYWludGVyJ3MgYWxnb3JpdGhtLlxuXG4gICAgVGhlIHggYW5kIHkgdHJhbnNsYXRpb24gdHJhbnNmb3JtcyB0aGUgd29ybGQgc3BhY2Ugb3JpZ2luIHRvIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlIHNjcmVlbi5cblxuICAgIFRoZSBmaW5hbCBjb21wb25lbnQgKHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVsxNV0pIGlzIGluaXRpYWxpemVkIGFzIDEgYmVjYXVzZSBjZXJ0YWluIHByb2plY3Rpb24gbW9kZWxzLFxuICAgIGUuZy4gdGhlIFdDMyBzcGVjaWZpZWQgbW9kZWwsIGtlZXAgdGhlIFhZIHBsYW5lIGFzIHRoZSBwcm9qZWN0aW9uIGh5cGVycGxhbmUuXG4gICAgKi9cbiAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm0gPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgLTAuMDAwMDAxLCAwLCAtMSwgMSwgMCwgMV07XG5cbiAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyBoYWNrXG5cbiAgICB2YXIgY3V0b3V0ID0gdGhpcy5jdXRvdXRHZW9tZXRyeSA9IG5ldyBQbGFuZSgpO1xuXG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2FfcG9zJywgY3V0b3V0LnNwZWMuYnVmZmVyVmFsdWVzWzBdLCAzKTtcbiAgICB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LmFsbG9jYXRlKGN1dG91dC5zcGVjLmlkLCAnYV90ZXhDb29yZCcsIGN1dG91dC5zcGVjLmJ1ZmZlclZhbHVlc1sxXSwgMik7XG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2Ffbm9ybWFscycsIGN1dG91dC5zcGVjLmJ1ZmZlclZhbHVlc1syXSwgMyk7XG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2luZGljZXMnLCBjdXRvdXQuc3BlYy5idWZmZXJWYWx1ZXNbM10sIDEpO1xufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHJldHJlaXZlIHRoZSBXZWJHTFJlbmRlcmVyIGNvbnRleHQgdXNpbmcgc2V2ZXJhbFxuICogYWNjZXNzb3JzLiBGb3IgYnJvd3NlciBjb21wYXRhYmlsaXR5LiBUaHJvd3Mgb24gZXJyb3IuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjYW52YXMgQ2FudmFzIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgY29udGV4dCBpcyByZXRyZWl2ZWRcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IFdlYkdMQ29udGV4dCBvZiBjYW52YXMgZWxlbWVudFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5nZXRXZWJHTENvbnRleHQgPSBmdW5jdGlvbiBnZXRXZWJHTENvbnRleHQoY2FudmFzKSB7XG4gICAgdmFyIG5hbWVzID0gWyd3ZWJnbCcsICdleHBlcmltZW50YWwtd2ViZ2wnLCAnd2Via2l0LTNkJywgJ21vei13ZWJnbCddO1xuICAgIHZhciBjb250ZXh0ID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQobmFtZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBjcmVhdGluZyBXZWJHTCBjb250ZXh0OiAnICsgZXJyb3IucHJvdG90eXBlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0ID8gY29udGV4dCA6IGZhbHNlO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbmV3IGJhc2Ugc3BlYyB0byB0aGUgbGlnaHQgcmVnaXN0cnkgYXQgYSBnaXZlbiBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbmV3IGxpZ2h0IGluIGxpZ2h0UmVnaXN0cnlcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IE5ld2x5IGNyZWF0ZWQgbGlnaHQgc3BlY1xuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVMaWdodCA9IGZ1bmN0aW9uIGNyZWF0ZUxpZ2h0KHBhdGgpIHtcbiAgICB0aGlzLm51bUxpZ2h0cysrO1xuICAgIHRoaXMubGlnaHRSZWdpc3RyeUtleXMucHVzaChwYXRoKTtcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnlbcGF0aF0gPSB7XG4gICAgICAgIGNvbG9yOiBbMCwgMCwgMF0sXG4gICAgICAgIHBvc2l0aW9uOiBbMCwgMCwgMF1cbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmxpZ2h0UmVnaXN0cnlbcGF0aF07XG59O1xuXG4vKipcbiAqIEFkZHMgYSBuZXcgYmFzZSBzcGVjIHRvIHRoZSBtZXNoIHJlZ2lzdHJ5IGF0IGEgZ2l2ZW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIG5ldyBtZXNoIGluIG1lc2hSZWdpc3RyeS5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IE5ld2x5IGNyZWF0ZWQgbWVzaCBzcGVjLlxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVNZXNoID0gZnVuY3Rpb24gY3JlYXRlTWVzaChwYXRoKSB7XG4gICAgdGhpcy5tZXNoUmVnaXN0cnlLZXlzLnB1c2gocGF0aCk7XG5cbiAgICB2YXIgdW5pZm9ybXMgPSBrZXlWYWx1ZVRvQXJyYXlzKHtcbiAgICAgICAgdV9vcGFjaXR5OiAxLFxuICAgICAgICB1X3RyYW5zZm9ybTogaWRlbnRpdHksXG4gICAgICAgIHVfc2l6ZTogWzAsIDAsIDBdLFxuICAgICAgICB1X2Jhc2VDb2xvcjogWzAuNSwgMC41LCAwLjUsIDFdLFxuICAgICAgICB1X3Bvc2l0aW9uT2Zmc2V0OiBbMCwgMCwgMF0sXG4gICAgICAgIHVfbm9ybWFsczogWzAsIDAsIDBdLFxuICAgICAgICB1X2ZsYXRTaGFkaW5nOiAwLFxuICAgICAgICB1X2dsb3NzaW5lc3M6IFswLCAwLCAwLCAwXVxuICAgIH0pO1xuICAgIHRoaXMubWVzaFJlZ2lzdHJ5W3BhdGhdID0ge1xuICAgICAgICBkZXB0aDogbnVsbCxcbiAgICAgICAgdW5pZm9ybUtleXM6IHVuaWZvcm1zLmtleXMsXG4gICAgICAgIHVuaWZvcm1WYWx1ZXM6IHVuaWZvcm1zLnZhbHVlcyxcbiAgICAgICAgYnVmZmVyczoge30sXG4gICAgICAgIGdlb21ldHJ5OiBudWxsLFxuICAgICAgICBkcmF3VHlwZTogbnVsbCxcbiAgICAgICAgdGV4dHVyZXM6IFtdLFxuICAgICAgICB2aXNpYmxlOiB0cnVlXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF07XG59O1xuXG4vKipcbiAqIFNldHMgZmxhZyBvbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZG8gc2tpcCBkcmF3IHBoYXNlIGZvclxuICogY3V0b3V0IG1lc2ggYXQgZ2l2ZW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIHRhcmdldCBjdXRvdXQgbWVzaC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdXNlc0N1dG91dCBJbmRpY2F0ZXMgdGhlIHByZXNlbmNlIG9mIGEgY3V0b3V0IG1lc2hcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRDdXRvdXRTdGF0ZSA9IGZ1bmN0aW9uIHNldEN1dG91dFN0YXRlKHBhdGgsIHVzZXNDdXRvdXQpIHtcbiAgICB2YXIgY3V0b3V0ID0gdGhpcy5nZXRPclNldEN1dG91dChwYXRoKTtcblxuICAgIGN1dG91dC52aXNpYmxlID0gdXNlc0N1dG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBvciByZXRyZWl2ZXMgY3V0b3V0XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgY3V0b3V0IG1lc2guXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBOZXdseSBjcmVhdGVkIGN1dG91dCBzcGVjLlxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5nZXRPclNldEN1dG91dCA9IGZ1bmN0aW9uIGdldE9yU2V0Q3V0b3V0KHBhdGgpIHtcbiAgICBpZiAodGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciB1bmlmb3JtcyA9IGtleVZhbHVlVG9BcnJheXMoe1xuICAgICAgICAgICAgdV9vcGFjaXR5OiAwLFxuICAgICAgICAgICAgdV90cmFuc2Zvcm06IGlkZW50aXR5LnNsaWNlKCksXG4gICAgICAgICAgICB1X3NpemU6IFswLCAwLCAwXSxcbiAgICAgICAgICAgIHVfb3JpZ2luOiBbMCwgMCwgMF0sXG4gICAgICAgICAgICB1X2Jhc2VDb2xvcjogWzAsIDAsIDAsIDFdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY3V0b3V0UmVnaXN0cnlLZXlzLnB1c2gocGF0aCk7XG5cbiAgICAgICAgdGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXSA9IHtcbiAgICAgICAgICAgIHVuaWZvcm1LZXlzOiB1bmlmb3Jtcy5rZXlzLFxuICAgICAgICAgICAgdW5pZm9ybVZhbHVlczogdW5pZm9ybXMudmFsdWVzLFxuICAgICAgICAgICAgZ2VvbWV0cnk6IHRoaXMuY3V0b3V0R2VvbWV0cnkuc3BlYy5pZCxcbiAgICAgICAgICAgIGRyYXdUeXBlOiB0aGlzLmN1dG91dEdlb21ldHJ5LnNwZWMudHlwZSxcbiAgICAgICAgICAgIHZpc2libGU6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldHMgZmxhZyBvbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZG8gc2tpcCBkcmF3IHBoYXNlIGZvclxuICogbWVzaCBhdCBnaXZlbiBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgbWVzaC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdmlzaWJpbGl0eSBJbmRpY2F0ZXMgdGhlIHZpc2liaWxpdHkgb2YgdGFyZ2V0IG1lc2guXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TWVzaFZpc2liaWxpdHkgPSBmdW5jdGlvbiBzZXRNZXNoVmlzaWJpbGl0eShwYXRoLCB2aXNpYmlsaXR5KSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICBtZXNoLnZpc2libGUgPSB2aXNpYmlsaXR5O1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgbWVzaCBmcm9tIHRoZSBtZXNoUmVnaXN0cnkuXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIHRhcmdldCBtZXNoLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnJlbW92ZU1lc2ggPSBmdW5jdGlvbiByZW1vdmVNZXNoKHBhdGgpIHtcbiAgICB2YXIga2V5TG9jYXRpb24gPSB0aGlzLm1lc2hSZWdpc3RyeUtleXMuaW5kZXhPZihwYXRoKTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeUtleXMuc3BsaWNlKGtleUxvY2F0aW9uLCAxKTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSA9IG51bGw7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgb3IgcmV0cmVpdmVzIGN1dG91dFxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBjdXRvdXQgaW4gY3V0b3V0IHJlZ2lzdHJ5LlxuICogQHBhcmFtIHtTdHJpbmd9IHVuaWZvcm1OYW1lIElkZW50aWZpZXIgdXNlZCB0byB1cGxvYWQgdmFsdWVcbiAqIEBwYXJhbSB7QXJyYXl9IHVuaWZvcm1WYWx1ZSBWYWx1ZSBvZiB1bmlmb3JtIGRhdGFcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRDdXRvdXRVbmlmb3JtID0gZnVuY3Rpb24gc2V0Q3V0b3V0VW5pZm9ybShwYXRoLCB1bmlmb3JtTmFtZSwgdW5pZm9ybVZhbHVlKSB7XG4gICAgdmFyIGN1dG91dCA9IHRoaXMuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG5cbiAgICB2YXIgaW5kZXggPSBjdXRvdXQudW5pZm9ybUtleXMuaW5kZXhPZih1bmlmb3JtTmFtZSk7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh1bmlmb3JtVmFsdWUpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB1bmlmb3JtVmFsdWUubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGN1dG91dC51bmlmb3JtVmFsdWVzW2luZGV4XVtpXSA9IHVuaWZvcm1WYWx1ZVtpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY3V0b3V0LnVuaWZvcm1WYWx1ZXNbaW5kZXhdID0gdW5pZm9ybVZhbHVlO1xuICAgIH1cbn07XG5cbi8qKlxuICogRWRpdHMgdGhlIG9wdGlvbnMgZmllbGQgb24gYSBtZXNoXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIHRhcmdldCBtZXNoXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBNYXAgb2YgZHJhdyBvcHRpb25zIGZvciBtZXNoXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TWVzaE9wdGlvbnMgPSBmdW5jdGlvbihwYXRoLCBvcHRpb25zKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICBtZXNoLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRoZSBjb2xvciBvZiB0aGUgZml4ZWQgaW50ZW5zaXR5IGxpZ2h0aW5nIGluIHRoZSBzY2VuZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbGlnaHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByIHJlZCBjaGFubmVsXG4gKiBAcGFyYW0ge051bWJlcn0gZyBncmVlbiBjaGFubmVsXG4gKiBAcGFyYW0ge051bWJlcn0gYiBibHVlIGNoYW5uZWxcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuKiovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRBbWJpZW50TGlnaHRDb2xvciA9IGZ1bmN0aW9uIHNldEFtYmllbnRMaWdodENvbG9yKHBhdGgsIHIsIGcsIGIpIHtcbiAgICB0aGlzLmFtYmllbnRMaWdodENvbG9yWzBdID0gcjtcbiAgICB0aGlzLmFtYmllbnRMaWdodENvbG9yWzFdID0gZztcbiAgICB0aGlzLmFtYmllbnRMaWdodENvbG9yWzJdID0gYjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgbG9jYXRpb24gb2YgdGhlIGxpZ2h0IGluIHRoZSBzY2VuZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbGlnaHRcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IHggcG9zaXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IHkgcG9zaXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IHogcG9zaXRpb25cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuKiovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRMaWdodFBvc2l0aW9uID0gZnVuY3Rpb24gc2V0TGlnaHRQb3NpdGlvbihwYXRoLCB4LCB5LCB6KSB7XG4gICAgdmFyIGxpZ2h0ID0gdGhpcy5saWdodFJlZ2lzdHJ5W3BhdGhdIHx8IHRoaXMuY3JlYXRlTGlnaHQocGF0aCk7XG5cbiAgICBsaWdodC5wb3NpdGlvblswXSA9IHg7XG4gICAgbGlnaHQucG9zaXRpb25bMV0gPSB5O1xuICAgIGxpZ2h0LnBvc2l0aW9uWzJdID0gejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgY29sb3Igb2YgYSBkeW5hbWljIGludGVuc2l0eSBsaWdodGluZyBpbiB0aGUgc2NlbmVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGxpZ2h0IGluIGxpZ2h0IFJlZ2lzdHJ5LlxuICogQHBhcmFtIHtOdW1iZXJ9IHIgcmVkIGNoYW5uZWxcbiAqIEBwYXJhbSB7TnVtYmVyfSBnIGdyZWVuIGNoYW5uZWxcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGJsdWUgY2hhbm5lbFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldExpZ2h0Q29sb3IgPSBmdW5jdGlvbiBzZXRMaWdodENvbG9yKHBhdGgsIHIsIGcsIGIpIHtcbiAgICB2YXIgbGlnaHQgPSB0aGlzLmxpZ2h0UmVnaXN0cnlbcGF0aF0gfHwgdGhpcy5jcmVhdGVMaWdodChwYXRoKTtcblxuICAgIGxpZ2h0LmNvbG9yWzBdID0gcjtcbiAgICBsaWdodC5jb2xvclsxXSA9IGc7XG4gICAgbGlnaHQuY29sb3JbMl0gPSBiO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb21waWxlcyBtYXRlcmlhbCBzcGVjIGludG8gcHJvZ3JhbSBzaGFkZXJcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGN1dG91dCBpbiBjdXRvdXQgcmVnaXN0cnkuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIHRoYXQgdGhlIHJlbmRlcmluZyBpbnB1dCB0aGUgbWF0ZXJpYWwgaXMgYm91bmQgdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXRlcmlhbCBNYXRlcmlhbCBzcGVjXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuaGFuZGxlTWF0ZXJpYWxJbnB1dCA9IGZ1bmN0aW9uIGhhbmRsZU1hdGVyaWFsSW5wdXQocGF0aCwgbmFtZSwgbWF0ZXJpYWwpIHtcbiAgICB2YXIgbWVzaCA9IHRoaXMubWVzaFJlZ2lzdHJ5W3BhdGhdIHx8IHRoaXMuY3JlYXRlTWVzaChwYXRoKTtcbiAgICBtYXRlcmlhbCA9IGNvbXBpbGVNYXRlcmlhbChtYXRlcmlhbCwgbWVzaC50ZXh0dXJlcy5sZW5ndGgpO1xuXG4gICAgLy8gU2V0IHVuaWZvcm1zIHRvIGVuYWJsZSB0ZXh0dXJlIVxuXG4gICAgbWVzaC51bmlmb3JtVmFsdWVzW21lc2gudW5pZm9ybUtleXMuaW5kZXhPZihuYW1lKV1bMF0gPSAtbWF0ZXJpYWwuX2lkO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGV4dHVyZXMhXG5cbiAgICB2YXIgaSA9IG1hdGVyaWFsLnRleHR1cmVzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIG1lc2gudGV4dHVyZXMucHVzaChcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZU1hbmFnZXIucmVnaXN0ZXIobWF0ZXJpYWwudGV4dHVyZXNbaV0sIG1lc2gudGV4dHVyZXMubGVuZ3RoICsgaSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBSZWdpc3RlciBtYXRlcmlhbCFcblxuICAgIHRoaXMucHJvZ3JhbS5yZWdpc3Rlck1hdGVyaWFsKG5hbWUsIG1hdGVyaWFsKTtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZVNpemUoKTtcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgZ2VvbWV0cnkgZGF0YSBvZiBhIG1lc2hcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGN1dG91dCBpbiBjdXRvdXQgcmVnaXN0cnkuXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbWV0cnkgR2VvbWV0cnkgb2JqZWN0IGNvbnRhaW5pbmcgdmVydGV4IGRhdGEgdG8gYmUgZHJhd25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkcmF3VHlwZSBQcmltaXRpdmUgaWRlbnRpZmllclxuICogQHBhcmFtIHtCb29sZWFufSBkeW5hbWljIFdoZXRoZXIgZ2VvbWV0cnkgaXMgZHluYW1pY1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldEdlb21ldHJ5ID0gZnVuY3Rpb24gc2V0R2VvbWV0cnkocGF0aCwgZ2VvbWV0cnksIGRyYXdUeXBlLCBkeW5hbWljKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICBtZXNoLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgbWVzaC5kcmF3VHlwZSA9IGRyYXdUeXBlO1xuICAgIG1lc2guZHluYW1pYyA9IGR5bmFtaWM7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVXBsb2FkcyBhIG5ldyB2YWx1ZSBmb3IgdGhlIHVuaWZvcm0gZGF0YSB3aGVuIHRoZSBtZXNoIGlzIGJlaW5nIGRyYXduXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBtZXNoIGluIG1lc2ggcmVnaXN0cnlcbiAqIEBwYXJhbSB7U3RyaW5nfSB1bmlmb3JtTmFtZSBJZGVudGlmaWVyIHVzZWQgdG8gdXBsb2FkIHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5fSB1bmlmb3JtVmFsdWUgVmFsdWUgb2YgdW5pZm9ybSBkYXRhXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TWVzaFVuaWZvcm0gPSBmdW5jdGlvbiBzZXRNZXNoVW5pZm9ybShwYXRoLCB1bmlmb3JtTmFtZSwgdW5pZm9ybVZhbHVlKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICB2YXIgaW5kZXggPSBtZXNoLnVuaWZvcm1LZXlzLmluZGV4T2YodW5pZm9ybU5hbWUpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICBtZXNoLnVuaWZvcm1LZXlzLnB1c2godW5pZm9ybU5hbWUpO1xuICAgICAgICBtZXNoLnVuaWZvcm1WYWx1ZXMucHVzaCh1bmlmb3JtVmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbWVzaC51bmlmb3JtVmFsdWVzW2luZGV4XSA9IHVuaWZvcm1WYWx1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFRyaWdnZXJzIHRoZSAnZHJhdycgcGhhc2Ugb2YgdGhlIFdlYkdMUmVuZGVyZXIuIEl0ZXJhdGVzIHRocm91Z2ggcmVnaXN0cmllc1xuICogdG8gc2V0IHVuaWZvcm1zLCBzZXQgYXR0cmlidXRlcyBhbmQgaXNzdWUgZHJhdyBjb21tYW5kcyBmb3IgcmVuZGVyYWJsZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBtZXNoIGluIG1lc2ggcmVnaXN0cnlcbiAqIEBwYXJhbSB7TnVtYmVyfSBnZW9tZXRyeUlkIElkIG9mIGdlb21ldHJ5IGluIGdlb21ldHJ5IHJlZ2lzdHJ5XG4gKiBAcGFyYW0ge1N0cmluZ30gYnVmZmVyTmFtZSBBdHRyaWJ1dGUgbG9jYXRpb24gbmFtZVxuICogQHBhcmFtIHtBcnJheX0gYnVmZmVyVmFsdWUgVmVydGV4IGRhdGFcbiAqIEBwYXJhbSB7TnVtYmVyfSBidWZmZXJTcGFjaW5nIFRoZSBkaW1lbnNpb25zIG9mIHRoZSB2ZXJ0ZXhcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNEeW5hbWljIFdoZXRoZXIgZ2VvbWV0cnkgaXMgZHluYW1pY1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLmJ1ZmZlckRhdGEgPSBmdW5jdGlvbiBidWZmZXJEYXRhKHBhdGgsIGdlb21ldHJ5SWQsIGJ1ZmZlck5hbWUsIGJ1ZmZlclZhbHVlLCBidWZmZXJTcGFjaW5nLCBpc0R5bmFtaWMpIHtcbiAgICB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LmFsbG9jYXRlKGdlb21ldHJ5SWQsIGJ1ZmZlck5hbWUsIGJ1ZmZlclZhbHVlLCBidWZmZXJTcGFjaW5nLCBpc0R5bmFtaWMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyaWdnZXJzIHRoZSAnZHJhdycgcGhhc2Ugb2YgdGhlIFdlYkdMUmVuZGVyZXIuIEl0ZXJhdGVzIHRocm91Z2ggcmVnaXN0cmllc1xuICogdG8gc2V0IHVuaWZvcm1zLCBzZXQgYXR0cmlidXRlcyBhbmQgaXNzdWUgZHJhdyBjb21tYW5kcyBmb3IgcmVuZGVyYWJsZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJTdGF0ZSBQYXJhbWV0ZXJzIHByb3ZpZGVkIGJ5IHRoZSBjb21wb3NpdG9yLCB0aGF0IGFmZmVjdCB0aGUgcmVuZGVyaW5nIG9mIGFsbCByZW5kZXJhYmxlcy5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdyhyZW5kZXJTdGF0ZSkge1xuICAgIHZhciB0aW1lID0gdGhpcy5jb21wb3NpdG9yLmdldFRpbWUoKTtcblxuICAgIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUIHwgdGhpcy5nbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB0aGlzLnRleHR1cmVNYW5hZ2VyLnVwZGF0ZSh0aW1lKTtcblxuICAgIHRoaXMubWVzaFJlZ2lzdHJ5S2V5cyA9IHNvcnRlcih0aGlzLm1lc2hSZWdpc3RyeUtleXMsIHRoaXMubWVzaFJlZ2lzdHJ5KTtcblxuICAgIHRoaXMuc2V0R2xvYmFsVW5pZm9ybXMocmVuZGVyU3RhdGUpO1xuICAgIHRoaXMuZHJhd0N1dG91dHMoKTtcbiAgICB0aGlzLmRyYXdNZXNoZXMoKTtcbn07XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBhbmQgZHJhd3MgYWxsIHJlZ2lzdGVyZWQgbWVzaGVzLiBUaGlzIGluY2x1ZGVzXG4gKiBiaW5kaW5nIHRleHR1cmVzLCBoYW5kbGluZyBkcmF3IG9wdGlvbnMsIHNldHRpbmcgbWVzaCB1bmlmb3Jtc1xuICogYW5kIGRyYXdpbmcgbWVzaCBidWZmZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5kcmF3TWVzaGVzID0gZnVuY3Rpb24gZHJhd01lc2hlcygpIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgIHZhciBidWZmZXJzO1xuICAgIHZhciBtZXNoO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubWVzaFJlZ2lzdHJ5S2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZXNoID0gdGhpcy5tZXNoUmVnaXN0cnlbdGhpcy5tZXNoUmVnaXN0cnlLZXlzW2ldXTtcbiAgICAgICAgYnVmZmVycyA9IHRoaXMuYnVmZmVyUmVnaXN0cnkucmVnaXN0cnlbbWVzaC5nZW9tZXRyeV07XG5cbiAgICAgICAgaWYgKCFtZXNoLnZpc2libGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmIChtZXNoLnVuaWZvcm1WYWx1ZXNbMF0gPCAxKSB7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayh0cnVlKTtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFidWZmZXJzKSBjb250aW51ZTtcblxuICAgICAgICB2YXIgaiA9IG1lc2gudGV4dHVyZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoai0tKSB0aGlzLnRleHR1cmVNYW5hZ2VyLmJpbmRUZXh0dXJlKG1lc2gudGV4dHVyZXNbal0pO1xuXG4gICAgICAgIGlmIChtZXNoLm9wdGlvbnMpIHRoaXMuaGFuZGxlT3B0aW9ucyhtZXNoLm9wdGlvbnMsIG1lc2gpO1xuXG4gICAgICAgIHRoaXMucHJvZ3JhbS5zZXRVbmlmb3JtcyhtZXNoLnVuaWZvcm1LZXlzLCBtZXNoLnVuaWZvcm1WYWx1ZXMpO1xuICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKGJ1ZmZlcnMsIG1lc2guZHJhd1R5cGUsIG1lc2guZ2VvbWV0cnkpO1xuXG4gICAgICAgIGlmIChtZXNoLm9wdGlvbnMpIHRoaXMucmVzZXRPcHRpb25zKG1lc2gub3B0aW9ucyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIGFuZCBkcmF3cyBhbGwgcmVnaXN0ZXJlZCBjdXRvdXQgbWVzaGVzLiBCbGVuZGluZ1xuICogaXMgZGlzYWJsZWQsIGN1dG91dCB1bmlmb3JtcyBhcmUgc2V0IGFuZCBmaW5hbGx5IGJ1ZmZlcnMgYXJlIGRyYXduLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5kcmF3Q3V0b3V0cyA9IGZ1bmN0aW9uIGRyYXdDdXRvdXRzKCkge1xuICAgIHZhciBjdXRvdXQ7XG4gICAgdmFyIGJ1ZmZlcnM7XG4gICAgdmFyIGxlbiA9IHRoaXMuY3V0b3V0UmVnaXN0cnlLZXlzLmxlbmd0aDtcblxuICAgIGlmIChsZW4pIHtcbiAgICAgICAgdGhpcy5nbC5lbmFibGUodGhpcy5nbC5CTEVORCk7XG4gICAgICAgIHRoaXMuZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY3V0b3V0ID0gdGhpcy5jdXRvdXRSZWdpc3RyeVt0aGlzLmN1dG91dFJlZ2lzdHJ5S2V5c1tpXV07XG4gICAgICAgIGJ1ZmZlcnMgPSB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LnJlZ2lzdHJ5W2N1dG91dC5nZW9tZXRyeV07XG5cbiAgICAgICAgaWYgKCFjdXRvdXQudmlzaWJsZSkgY29udGludWU7XG5cbiAgICAgICAgdGhpcy5wcm9ncmFtLnNldFVuaWZvcm1zKGN1dG91dC51bmlmb3JtS2V5cywgY3V0b3V0LnVuaWZvcm1WYWx1ZXMpO1xuICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKGJ1ZmZlcnMsIGN1dG91dC5kcmF3VHlwZSwgY3V0b3V0Lmdlb21ldHJ5KTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldHMgdW5pZm9ybXMgdG8gYmUgc2hhcmVkIGJ5IGFsbCBtZXNoZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJTdGF0ZSBEcmF3IHN0YXRlIG9wdGlvbnMgcGFzc2VkIGRvd24gZnJvbSBjb21wb3NpdG9yLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldEdsb2JhbFVuaWZvcm1zID0gZnVuY3Rpb24gc2V0R2xvYmFsVW5pZm9ybXMocmVuZGVyU3RhdGUpIHtcbiAgICB2YXIgbGlnaHQ7XG4gICAgdmFyIHN0cmlkZTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxpZ2h0UmVnaXN0cnlLZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxpZ2h0ID0gdGhpcy5saWdodFJlZ2lzdHJ5W3RoaXMubGlnaHRSZWdpc3RyeUtleXNbaV1dO1xuICAgICAgICBzdHJpZGUgPSBpICogNDtcblxuICAgICAgICAvLyBCdWlsZCB0aGUgbGlnaHQgcG9zaXRpb25zJyA0eDQgbWF0cml4XG5cbiAgICAgICAgdGhpcy5saWdodFBvc2l0aW9uc1swICsgc3RyaWRlXSA9IGxpZ2h0LnBvc2l0aW9uWzBdO1xuICAgICAgICB0aGlzLmxpZ2h0UG9zaXRpb25zWzEgKyBzdHJpZGVdID0gbGlnaHQucG9zaXRpb25bMV07XG4gICAgICAgIHRoaXMubGlnaHRQb3NpdGlvbnNbMiArIHN0cmlkZV0gPSBsaWdodC5wb3NpdGlvblsyXTtcblxuICAgICAgICAvLyBCdWlsZCB0aGUgbGlnaHQgY29sb3JzJyA0eDQgbWF0cml4XG5cbiAgICAgICAgdGhpcy5saWdodENvbG9yc1swICsgc3RyaWRlXSA9IGxpZ2h0LmNvbG9yWzBdO1xuICAgICAgICB0aGlzLmxpZ2h0Q29sb3JzWzEgKyBzdHJpZGVdID0gbGlnaHQuY29sb3JbMV07XG4gICAgICAgIHRoaXMubGlnaHRDb2xvcnNbMiArIHN0cmlkZV0gPSBsaWdodC5jb2xvclsyXTtcbiAgICB9XG5cbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbMF0gPSB0aGlzLm51bUxpZ2h0cztcbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbMV0gPSB0aGlzLmFtYmllbnRMaWdodENvbG9yO1xuICAgIGdsb2JhbFVuaWZvcm1zLnZhbHVlc1syXSA9IHRoaXMubGlnaHRQb3NpdGlvbnM7XG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzNdID0gdGhpcy5saWdodENvbG9ycztcblxuICAgIC8qXG4gICAgICogU2V0IHRpbWUgYW5kIHByb2plY3Rpb24gdW5pZm9ybXNcbiAgICAgKiBwcm9qZWN0aW5nIHdvcmxkIHNwYWNlIGludG8gYSAyZCBwbGFuZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgY2FudmFzLlxuICAgICAqIFRoZSB4IGFuZCB5IHNjYWxlICh0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMF0gYW5kIHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVs1XSByZXNwZWN0aXZlbHkpXG4gICAgICogY29udmVydCB0aGUgcHJvamVjdGVkIGdlb21ldHJ5IGJhY2sgaW50byBjbGlwc3BhY2UuXG4gICAgICogVGhlIHBlcnBlY3RpdmUgZGl2aWRlICh0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMTFdKSwgYWRkcyB0aGUgeiB2YWx1ZSBvZiB0aGUgcG9pbnRcbiAgICAgKiBtdWx0aXBsaWVkIGJ5IHRoZSBwZXJzcGVjdGl2ZSBkaXZpZGUgdG8gdGhlIHcgdmFsdWUgb2YgdGhlIHBvaW50LiBJbiB0aGUgcHJvY2Vzc1xuICAgICAqIG9mIGNvbnZlcnRpbmcgZnJvbSBob21vZ2Vub3VzIGNvb3JkaW5hdGVzIHRvIE5EQyAobm9ybWFsaXplZCBkZXZpY2UgY29vcmRpbmF0ZXMpXG4gICAgICogdGhlIHggYW5kIHkgdmFsdWVzIG9mIHRoZSBwb2ludCBhcmUgZGl2aWRlZCBieSB3LCB3aGljaCBpbXBsZW1lbnRzIHBlcnNwZWN0aXZlLlxuICAgICAqL1xuICAgIHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVswXSA9IDEgLyAodGhpcy5jYWNoZWRTaXplWzBdICogMC41KTtcbiAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bNV0gPSAtMSAvICh0aGlzLmNhY2hlZFNpemVbMV0gKiAwLjUpO1xuICAgIHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVsxMV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMV07XG5cbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbNF0gPSB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm07XG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzVdID0gdGhpcy5jb21wb3NpdG9yLmdldFRpbWUoKSAqIDAuMDAxO1xuICAgIGdsb2JhbFVuaWZvcm1zLnZhbHVlc1s2XSA9IHJlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm07XG5cbiAgICB0aGlzLnByb2dyYW0uc2V0VW5pZm9ybXMoZ2xvYmFsVW5pZm9ybXMua2V5cywgZ2xvYmFsVW5pZm9ybXMudmFsdWVzKTtcbn07XG5cbi8qKlxuICogTG9hZHMgdGhlIGJ1ZmZlcnMgYW5kIGlzc3VlcyB0aGUgZHJhdyBjb21tYW5kIGZvciBhIGdlb21ldHJ5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmVydGV4QnVmZmVycyBBbGwgYnVmZmVycyB1c2VkIHRvIGRyYXcgdGhlIGdlb21ldHJ5LlxuICogQHBhcmFtIHtOdW1iZXJ9IG1vZGUgRW51bWVyYXRvciBkZWZpbmluZyB3aGF0IHByaW1pdGl2ZSB0byBkcmF3XG4gKiBAcGFyYW0ge051bWJlcn0gaWQgSUQgb2YgZ2VvbWV0cnkgYmVpbmcgZHJhd24uXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZHJhd0J1ZmZlcnMgPSBmdW5jdGlvbiBkcmF3QnVmZmVycyh2ZXJ0ZXhCdWZmZXJzLCBtb2RlLCBpZCkge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgdmFyIGxlbmd0aCA9IDA7XG4gICAgdmFyIGF0dHJpYnV0ZTtcbiAgICB2YXIgbG9jYXRpb247XG4gICAgdmFyIHNwYWNpbmc7XG4gICAgdmFyIG9mZnNldDtcbiAgICB2YXIgYnVmZmVyO1xuICAgIHZhciBpdGVyO1xuICAgIHZhciBqO1xuICAgIHZhciBpO1xuXG4gICAgaXRlciA9IHZlcnRleEJ1ZmZlcnMua2V5cy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGl0ZXI7IGkrKykge1xuICAgICAgICBhdHRyaWJ1dGUgPSB2ZXJ0ZXhCdWZmZXJzLmtleXNbaV07XG5cbiAgICAgICAgLy8gRG8gbm90IHNldCB2ZXJ0ZXhBdHRyaWJQb2ludGVyIGlmIGluZGV4IGJ1ZmZlci5cblxuICAgICAgICBpZiAoYXR0cmlidXRlID09PSAnaW5kaWNlcycpIHtcbiAgICAgICAgICAgIGogPSBpOyBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHJlaXZlIHRoZSBhdHRyaWJ1dGUgbG9jYXRpb24gYW5kIG1ha2Ugc3VyZSBpdCBpcyBlbmFibGVkLlxuXG4gICAgICAgIGxvY2F0aW9uID0gdGhpcy5wcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9uc1thdHRyaWJ1dGVdO1xuXG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gLTEpIGNvbnRpbnVlO1xuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnByb2dyYW0ucHJvZ3JhbSwgYXR0cmlidXRlKTtcbiAgICAgICAgICAgIHRoaXMucHJvZ3JhbS5hdHRyaWJ1dGVMb2NhdGlvbnNbYXR0cmlidXRlXSA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uID09PSAtMSkgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNbYXR0cmlidXRlXSkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5lbmFibGVkQXR0cmlidXRlc1thdHRyaWJ1dGVdID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNLZXlzLnB1c2goYXR0cmlidXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHJlaXZlIGJ1ZmZlciBpbmZvcm1hdGlvbiB1c2VkIHRvIHNldCBhdHRyaWJ1dGUgcG9pbnRlci5cblxuICAgICAgICBidWZmZXIgPSB2ZXJ0ZXhCdWZmZXJzLnZhbHVlc1tpXTtcbiAgICAgICAgc3BhY2luZyA9IHZlcnRleEJ1ZmZlcnMuc3BhY2luZ1tpXTtcbiAgICAgICAgb2Zmc2V0ID0gdmVydGV4QnVmZmVycy5vZmZzZXRbaV07XG4gICAgICAgIGxlbmd0aCA9IHZlcnRleEJ1ZmZlcnMubGVuZ3RoW2ldO1xuXG4gICAgICAgIC8vIFNraXAgYmluZEJ1ZmZlciBpZiBidWZmZXIgaXMgY3VycmVudGx5IGJvdW5kLlxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmJvdW5kQXJyYXlCdWZmZXIgIT09IGJ1ZmZlcikge1xuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihidWZmZXIudGFyZ2V0LCBidWZmZXIuYnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuYm91bmRBcnJheUJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmxhc3REcmF3biAhPT0gaWQpIHtcbiAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jYXRpb24sIHNwYWNpbmcsIGdsLkZMT0FULCBnbC5GQUxTRSwgMCwgNCAqIG9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEaXNhYmxlIGFueSBhdHRyaWJ1dGVzIHRoYXQgbm90IGN1cnJlbnRseSBiZWluZyB1c2VkLlxuXG4gICAgdmFyIGxlbiA9IHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNLZXlzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNLZXlzW2ldO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lbmFibGVkQXR0cmlidXRlc1trZXldICYmIHZlcnRleEJ1ZmZlcnMua2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5wcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9uc1trZXldKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNba2V5XSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxlbmd0aCkge1xuXG4gICAgICAgIC8vIElmIGluZGV4IGJ1ZmZlciwgdXNlIGRyYXdFbGVtZW50cy5cblxuICAgICAgICBpZiAoaiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBidWZmZXIgPSB2ZXJ0ZXhCdWZmZXJzLnZhbHVlc1tqXTtcbiAgICAgICAgICAgIG9mZnNldCA9IHZlcnRleEJ1ZmZlcnMub2Zmc2V0W2pdO1xuICAgICAgICAgICAgc3BhY2luZyA9IHZlcnRleEJ1ZmZlcnMuc3BhY2luZ1tqXTtcbiAgICAgICAgICAgIGxlbmd0aCA9IHZlcnRleEJ1ZmZlcnMubGVuZ3RoW2pdO1xuXG4gICAgICAgICAgICAvLyBTa2lwIGJpbmRCdWZmZXIgaWYgYnVmZmVyIGlzIGN1cnJlbnRseSBib3VuZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYm91bmRFbGVtZW50QnVmZmVyICE9PSBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGJ1ZmZlci50YXJnZXQsIGJ1ZmZlci5idWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuYm91bmRFbGVtZW50QnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2xbbW9kZV0sIGxlbmd0aCwgZ2wuVU5TSUdORURfU0hPUlQsIDIgKiBvZmZzZXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2wuZHJhd0FycmF5cyhnbFttb2RlXSwgMCwgbGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RhdGUubGFzdERyYXduID0gaWQ7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHdpZHRoIGFuZCBoZWlnaHQgb2YgcGFyZW50IGNhbnZhcywgc2V0cyB0aGUgdmlld3BvcnQgc2l6ZSBvblxuICogdGhlIFdlYkdMIGNvbnRleHQgYW5kIHVwZGF0ZXMgdGhlIHJlc29sdXRpb24gdW5pZm9ybSBmb3IgdGhlIHNoYWRlciBwcm9ncmFtLlxuICogU2l6ZSBpcyByZXRyZWl2ZWQgZnJvbSB0aGUgY29udGFpbmVyIG9iamVjdCBvZiB0aGUgcmVuZGVyZXIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHNpemUgd2lkdGgsIGhlaWdodCBhbmQgZGVwdGggb2YgY2FudmFzXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uIHVwZGF0ZVNpemUoc2l6ZSkge1xuICAgIGlmIChzaXplKSB7XG4gICAgICAgIHRoaXMuY2FjaGVkU2l6ZVswXSA9IHNpemVbMF07XG4gICAgICAgIHRoaXMuY2FjaGVkU2l6ZVsxXSA9IHNpemVbMV07XG4gICAgICAgIHRoaXMuY2FjaGVkU2l6ZVsyXSA9IChzaXplWzBdID4gc2l6ZVsxXSkgPyBzaXplWzBdIDogc2l6ZVsxXTtcbiAgICB9XG5cbiAgICB0aGlzLmdsLnZpZXdwb3J0KDAsIDAsIHRoaXMuY2FjaGVkU2l6ZVswXSwgdGhpcy5jYWNoZWRTaXplWzFdKTtcblxuICAgIHRoaXMucmVzb2x1dGlvblZhbHVlc1swXSA9IHRoaXMuY2FjaGVkU2l6ZTtcbiAgICB0aGlzLnByb2dyYW0uc2V0VW5pZm9ybXModGhpcy5yZXNvbHV0aW9uTmFtZSwgdGhpcy5yZXNvbHV0aW9uVmFsdWVzKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiB0aGUgV2ViR0wgZHJhd2luZyBjb250ZXh0IGJhc2VkIG9uIGN1c3RvbSBwYXJhbWV0ZXJzXG4gKiBkZWZpbmVkIG9uIGEgbWVzaC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgRHJhdyBzdGF0ZSBvcHRpb25zIHRvIGJlIHNldCB0byB0aGUgY29udGV4dC5cbiAqIEBwYXJhbSB7TWVzaH0gbWVzaCBBc3NvY2lhdGVkIE1lc2hcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5oYW5kbGVPcHRpb25zID0gZnVuY3Rpb24gaGFuZGxlT3B0aW9ucyhvcHRpb25zLCBtZXNoKSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICBpZiAoIW9wdGlvbnMpIHJldHVybjtcblxuICAgIGlmIChvcHRpb25zLnNpZGUgPT09ICdkb3VibGUnKSB7XG4gICAgICAgIHRoaXMuZ2wuY3VsbEZhY2UodGhpcy5nbC5GUk9OVCk7XG4gICAgICAgIHRoaXMuZHJhd0J1ZmZlcnModGhpcy5idWZmZXJSZWdpc3RyeS5yZWdpc3RyeVttZXNoLmdlb21ldHJ5XSwgbWVzaC5kcmF3VHlwZSwgbWVzaC5nZW9tZXRyeSk7XG4gICAgICAgIHRoaXMuZ2wuY3VsbEZhY2UodGhpcy5nbC5CQUNLKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5ibGVuZGluZykgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FKTtcbiAgICBpZiAob3B0aW9ucy5zaWRlID09PSAnYmFjaycpIGdsLmN1bGxGYWNlKGdsLkZST05UKTtcbn07XG5cbi8qKlxuICogUmVzZXRzIHRoZSBzdGF0ZSBvZiB0aGUgV2ViR0wgZHJhd2luZyBjb250ZXh0IHRvIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBEcmF3IHN0YXRlIG9wdGlvbnMgdG8gYmUgc2V0IHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnJlc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIHJlc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICBpZiAoIW9wdGlvbnMpIHJldHVybjtcbiAgICBpZiAob3B0aW9ucy5ibGVuZGluZykgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSk7XG4gICAgaWYgKG9wdGlvbnMuc2lkZSA9PT0gJ2JhY2snKSBnbC5jdWxsRmFjZShnbC5CQUNLKTtcbn07XG5cbldlYkdMUmVuZGVyZXIuREVGQVVMVF9TVFlMRVMgPSB7XG4gICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIHpJbmRleDogMSxcbiAgICB0b3A6ICcwcHgnLFxuICAgIGxlZnQ6ICcwcHgnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYkdMUmVuZGVyZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZXMgPSB7XG4gICAgMTogJ2Zsb2F0ICcsXG4gICAgMjogJ3ZlYzIgJyxcbiAgICAzOiAndmVjMyAnLFxuICAgIDQ6ICd2ZWM0ICdcbn07XG5cbi8qKlxuICogVHJhdmVyc2VzIG1hdGVyaWFsIHRvIGNyZWF0ZSBhIHN0cmluZyBvZiBnbHNsIGNvZGUgdG8gYmUgYXBwbGllZCBpblxuICogdGhlIHZlcnRleCBvciBmcmFnbWVudCBzaGFkZXIuXG4gKlxuICogQG1ldGhvZFxuICogQHByb3RlY3RlZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXRlcmlhbCBNYXRlcmlhbCB0byBiZSBjb21waWxlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0ZXh0dXJlU2xvdCBOZXh0IGF2YWlsYWJsZSB0ZXh0dXJlIHNsb3QgZm9yIE1lc2guXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gY29tcGlsZU1hdGVyaWFsKG1hdGVyaWFsLCB0ZXh0dXJlU2xvdCkge1xuICAgIHZhciBnbHNsID0gJyc7XG4gICAgdmFyIHVuaWZvcm1zID0ge307XG4gICAgdmFyIHZhcnlpbmdzID0ge307XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcbiAgICB2YXIgZGVmaW5lcyA9IFtdO1xuICAgIHZhciB0ZXh0dXJlcyA9IFtdO1xuXG4gICAgX3RyYXZlcnNlKG1hdGVyaWFsLCBmdW5jdGlvbiAobm9kZSwgZGVwdGgpIHtcbiAgICAgICAgaWYgKCEgbm9kZS5jaHVuaykgcmV0dXJuO1xuXG4gICAgICAgIHZhciB0eXBlID0gdHlwZXNbX2dldE91dHB1dExlbmd0aChub2RlKV07XG4gICAgICAgIHZhciBsYWJlbCA9IF9tYWtlTGFiZWwobm9kZSk7XG4gICAgICAgIHZhciBvdXRwdXQgPSBfcHJvY2Vzc0dMU0wobm9kZS5jaHVuay5nbHNsLCBub2RlLmlucHV0cywgdGV4dHVyZXMubGVuZ3RoICsgdGV4dHVyZVNsb3QpO1xuXG4gICAgICAgIGdsc2wgKz0gdHlwZSArIGxhYmVsICsgJyA9ICcgKyBvdXRwdXQgKyAnXFxuICc7XG5cbiAgICAgICAgaWYgKG5vZGUudW5pZm9ybXMpIF9leHRlbmQodW5pZm9ybXMsIG5vZGUudW5pZm9ybXMpO1xuICAgICAgICBpZiAobm9kZS52YXJ5aW5ncykgX2V4dGVuZCh2YXJ5aW5ncywgbm9kZS52YXJ5aW5ncyk7XG4gICAgICAgIGlmIChub2RlLmF0dHJpYnV0ZXMpIF9leHRlbmQoYXR0cmlidXRlcywgbm9kZS5hdHRyaWJ1dGVzKTtcbiAgICAgICAgaWYgKG5vZGUuY2h1bmsuZGVmaW5lcykgZGVmaW5lcy5wdXNoKG5vZGUuY2h1bmsuZGVmaW5lcyk7XG4gICAgICAgIGlmIChub2RlLnRleHR1cmUpIHRleHR1cmVzLnB1c2gobm9kZS50ZXh0dXJlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIF9pZDogbWF0ZXJpYWwuX2lkLFxuICAgICAgICBnbHNsOiBnbHNsICsgJ3JldHVybiAnICsgX21ha2VMYWJlbChtYXRlcmlhbCkgKyAnOycsXG4gICAgICAgIGRlZmluZXM6IGRlZmluZXMuam9pbignXFxuJyksXG4gICAgICAgIHVuaWZvcm1zOiB1bmlmb3JtcyxcbiAgICAgICAgdmFyeWluZ3M6IHZhcnlpbmdzLFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICB0ZXh0dXJlczogdGV4dHVyZXNcbiAgICB9O1xufVxuXG4vLyBSZWN1cnNpdmVseSBpdGVyYXRlcyBvdmVyIGEgbWF0ZXJpYWwncyBpbnB1dHMsIGludm9raW5nIGEgZ2l2ZW4gY2FsbGJhY2tcbi8vIHdpdGggdGhlIGN1cnJlbnQgbWF0ZXJpYWxcbmZ1bmN0aW9uIF90cmF2ZXJzZShtYXRlcmlhbCwgY2FsbGJhY2spIHtcblx0dmFyIGlucHV0cyA9IG1hdGVyaWFsLmlucHV0cztcbiAgICB2YXIgbGVuID0gaW5wdXRzICYmIGlucHV0cy5sZW5ndGg7XG4gICAgdmFyIGlkeCA9IC0xO1xuXG4gICAgd2hpbGUgKCsraWR4IDwgbGVuKSBfdHJhdmVyc2UoaW5wdXRzW2lkeF0sIGNhbGxiYWNrKTtcblxuICAgIGNhbGxiYWNrKG1hdGVyaWFsKTtcblxuICAgIHJldHVybiBtYXRlcmlhbDtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHVzZWQgdG8gaW5mZXIgbGVuZ3RoIG9mIHRoZSBvdXRwdXRcbi8vIGZyb20gYSBnaXZlbiBtYXRlcmlhbCBub2RlLlxuZnVuY3Rpb24gX2dldE91dHB1dExlbmd0aChub2RlKSB7XG5cbiAgICAvLyBIYW5kbGUgY29uc3RhbnQgdmFsdWVzXG5cbiAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdudW1iZXInKSByZXR1cm4gMTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkgcmV0dXJuIG5vZGUubGVuZ3RoO1xuXG4gICAgLy8gSGFuZGxlIG1hdGVyaWFsc1xuXG4gICAgdmFyIG91dHB1dCA9IG5vZGUuY2h1bmsub3V0cHV0O1xuICAgIGlmICh0eXBlb2Ygb3V0cHV0ID09PSAnbnVtYmVyJykgcmV0dXJuIG91dHB1dDtcblxuICAgIC8vIEhhbmRsZSBwb2x5bW9ycGhpYyBvdXRwdXRcblxuICAgIHZhciBrZXkgPSBub2RlLmlucHV0cy5tYXAoZnVuY3Rpb24gcmVjdXJzZShub2RlKSB7XG4gICAgICAgIHJldHVybiBfZ2V0T3V0cHV0TGVuZ3RoKG5vZGUpO1xuICAgIH0pLmpvaW4oJywnKTtcblxuICAgIHJldHVybiBvdXRwdXRba2V5XTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHJ1biByZXBsYWNlIGlucHV0cyBhbmQgdGV4dHVyZSB0YWdzIHdpdGhcbi8vIGNvcnJlY3QgZ2xzbC5cbmZ1bmN0aW9uIF9wcm9jZXNzR0xTTChzdHIsIGlucHV0cywgdGV4dHVyZVNsb3QpIHtcbiAgICByZXR1cm4gc3RyXG4gICAgICAgIC5yZXBsYWNlKC8lXFxkL2csIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gX21ha2VMYWJlbChpbnB1dHNbc1sxXS0xXSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5yZXBsYWNlKC9cXCRURVhUVVJFLywgJ3VfdGV4dHVyZXNbJyArIHRleHR1cmVTbG90ICsgJ10nKTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGdsc2wgZGVmaW5pdGlvbiBvZiB0aGVcbi8vIGlucHV0IG1hdGVyaWFsIG5vZGUuXG5mdW5jdGlvbiBfbWFrZUxhYmVsIChuKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobikpIHJldHVybiBfYXJyYXlUb1ZlYyhuKTtcbiAgICBpZiAodHlwZW9mIG4gPT09ICdvYmplY3QnKSByZXR1cm4gJ2ZhXycgKyAobi5faWQpO1xuICAgIGVsc2UgcmV0dXJuIG4udG9GaXhlZCg2KTtcbn1cblxuLy8gSGVscGVyIHRvIGNvcHkgdGhlIHByb3BlcnRpZXMgb2YgYW4gb2JqZWN0IG9udG8gYW5vdGhlciBvYmplY3QuXG5mdW5jdGlvbiBfZXh0ZW5kIChhLCBiKSB7XG5cdGZvciAodmFyIGsgaW4gYikgYVtrXSA9IGJba107XG59XG5cbi8vIEhlbHBlciB0byBjcmVhdGUgZ2xzbCB2ZWN0b3IgcmVwcmVzZW50YXRpb24gb2YgYSBqYXZhc2NyaXB0IGFycmF5LlxuZnVuY3Rpb24gX2FycmF5VG9WZWMoYXJyYXkpIHtcbiAgICB2YXIgbGVuID0gYXJyYXkubGVuZ3RoO1xuICAgIHJldHVybiAndmVjJyArIGxlbiArICcoJyArIGFycmF5LmpvaW4oJywnKSAgKyAnKSc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29tcGlsZU1hdGVyaWFsO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBHZW5lcmF0ZXMgYSBjaGVja2VyYm9hcmQgcGF0dGVybiB0byBiZSB1c2VkIGFzIGEgcGxhY2Vob2xkZXIgdGV4dHVyZSB3aGlsZSBhblxuLy8gaW1hZ2UgbG9hZHMgb3ZlciB0aGUgbmV0d29yay5cbmZ1bmN0aW9uIGNyZWF0ZUNoZWNrZXJCb2FyZCgpIHtcbiAgICB2YXIgY29udGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgY29udGV4dC5jYW52YXMud2lkdGggPSBjb250ZXh0LmNhbnZhcy5oZWlnaHQgPSAxMjg7XG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCBjb250ZXh0LmNhbnZhcy5oZWlnaHQ7IHkgKz0gMTYpIHtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBjb250ZXh0LmNhbnZhcy53aWR0aDsgeCArPSAxNikge1xuICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAoeCBeIHkpICYgMTYgPyAnI0ZGRicgOiAnI0RERCc7XG4gICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHksIDE2LCAxNik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29udGV4dC5jYW52YXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQ2hlY2tlckJvYXJkO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHJhZGl4Qml0cyA9IDExLFxuICAgIG1heFJhZGl4ID0gMSA8PCAocmFkaXhCaXRzKSxcbiAgICByYWRpeE1hc2sgPSBtYXhSYWRpeCAtIDEsXG4gICAgYnVja2V0cyA9IG5ldyBBcnJheShtYXhSYWRpeCAqIE1hdGguY2VpbCg2NCAvIHJhZGl4Qml0cykpLFxuICAgIG1zYk1hc2sgPSAxIDw8ICgoMzIgLSAxKSAlIHJhZGl4Qml0cyksXG4gICAgbGFzdE1hc2sgPSAobXNiTWFzayA8PCAxKSAtIDEsXG4gICAgcGFzc0NvdW50ID0gKCgzMiAvIHJhZGl4Qml0cykgKyAwLjk5OTk5OTk5OTk5OTk5OSkgfCAwLFxuICAgIG1heE9mZnNldCA9IG1heFJhZGl4ICogKHBhc3NDb3VudCAtIDEpLFxuICAgIG5vcm1hbGl6ZXIgPSBNYXRoLnBvdygyMCwgNik7XG5cbnZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNCk7XG52YXIgZmxvYXRWaWV3ID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXIsIDAsIDEpO1xudmFyIGludFZpZXcgPSBuZXcgSW50MzJBcnJheShidWZmZXIsIDAsIDEpO1xuXG4vLyBjb21wYXJhdG9yIHB1bGxzIHJlbGV2YW50IHNvcnRpbmcga2V5cyBvdXQgb2YgbWVzaFxuZnVuY3Rpb24gY29tcChsaXN0LCByZWdpc3RyeSwgaSkge1xuICAgIHZhciBrZXkgPSBsaXN0W2ldO1xuICAgIHZhciBpdGVtID0gcmVnaXN0cnlba2V5XTtcbiAgICByZXR1cm4gKGl0ZW0uZGVwdGggPyBpdGVtLmRlcHRoIDogcmVnaXN0cnlba2V5XS51bmlmb3JtVmFsdWVzWzFdWzE0XSkgKyBub3JtYWxpemVyO1xufVxuXG4vL211dGF0b3IgZnVuY3Rpb24gcmVjb3JkcyBtZXNoJ3MgcGxhY2UgaW4gcHJldmlvdXMgcGFzc1xuZnVuY3Rpb24gbXV0YXRvcihsaXN0LCByZWdpc3RyeSwgaSwgdmFsdWUpIHtcbiAgICB2YXIga2V5ID0gbGlzdFtpXTtcbiAgICByZWdpc3RyeVtrZXldLmRlcHRoID0gaW50VG9GbG9hdCh2YWx1ZSkgLSBub3JtYWxpemVyO1xuICAgIHJldHVybiBrZXk7XG59XG5cbi8vY2xlYW4gZnVuY3Rpb24gcmVtb3ZlcyBtdXRhdG9yIGZ1bmN0aW9uJ3MgcmVjb3JkXG5mdW5jdGlvbiBjbGVhbihsaXN0LCByZWdpc3RyeSwgaSkge1xuICAgIHJlZ2lzdHJ5W2xpc3RbaV1dLmRlcHRoID0gbnVsbDtcbn1cblxuLy9jb252ZXJ0cyBhIGphdmFzY3JpcHQgZmxvYXQgdG8gYSAzMmJpdCBpbnRlZ2VyIHVzaW5nIGFuIGFycmF5IGJ1ZmZlclxuLy9vZiBzaXplIG9uZVxuZnVuY3Rpb24gZmxvYXRUb0ludChrKSB7XG4gICAgZmxvYXRWaWV3WzBdID0gaztcbiAgICByZXR1cm4gaW50Vmlld1swXTtcbn1cbi8vY29udmVydHMgYSAzMiBiaXQgaW50ZWdlciB0byBhIHJlZ3VsYXIgamF2YXNjcmlwdCBmbG9hdCB1c2luZyBhbiBhcnJheSBidWZmZXJcbi8vb2Ygc2l6ZSBvbmVcbmZ1bmN0aW9uIGludFRvRmxvYXQoaykge1xuICAgIGludFZpZXdbMF0gPSBrO1xuICAgIHJldHVybiBmbG9hdFZpZXdbMF07XG59XG5cbi8vc29ydHMgYSBsaXN0IG9mIG1lc2ggSURzIGFjY29yZGluZyB0byB0aGVpciB6LWRlcHRoXG5mdW5jdGlvbiByYWRpeFNvcnQobGlzdCwgcmVnaXN0cnkpIHtcbiAgICB2YXIgcGFzcyA9IDA7XG4gICAgdmFyIG91dCA9IFtdO1xuXG4gICAgdmFyIGksIGosIGssIG4sIGRpdiwgb2Zmc2V0LCBzd2FwLCBpZCwgc3VtLCB0c3VtLCBzaXplO1xuXG4gICAgcGFzc0NvdW50ID0gKCgzMiAvIHJhZGl4Qml0cykgKyAwLjk5OTk5OTk5OTk5OTk5OSkgfCAwO1xuXG4gICAgZm9yIChpID0gMCwgbiA9IG1heFJhZGl4ICogcGFzc0NvdW50OyBpIDwgbjsgaSsrKSBidWNrZXRzW2ldID0gMDtcblxuICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBkaXYgPSBmbG9hdFRvSW50KGNvbXAobGlzdCwgcmVnaXN0cnksIGkpKTtcbiAgICAgICAgZGl2IF49IGRpdiA+PiAzMSB8IDB4ODAwMDAwMDA7XG4gICAgICAgIGZvciAoaiA9IDAsIGsgPSAwOyBqIDwgbWF4T2Zmc2V0OyBqICs9IG1heFJhZGl4LCBrICs9IHJhZGl4Qml0cykge1xuICAgICAgICAgICAgYnVja2V0c1tqICsgKGRpdiA+Pj4gayAmIHJhZGl4TWFzayldKys7XG4gICAgICAgIH1cbiAgICAgICAgYnVja2V0c1tqICsgKGRpdiA+Pj4gayAmIGxhc3RNYXNrKV0rKztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDw9IG1heE9mZnNldDsgaiArPSBtYXhSYWRpeCkge1xuICAgICAgICBmb3IgKGlkID0gaiwgc3VtID0gMDsgaWQgPCBqICsgbWF4UmFkaXg7IGlkKyspIHtcbiAgICAgICAgICAgIHRzdW0gPSBidWNrZXRzW2lkXSArIHN1bTtcbiAgICAgICAgICAgIGJ1Y2tldHNbaWRdID0gc3VtIC0gMTtcbiAgICAgICAgICAgIHN1bSA9IHRzdW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKC0tcGFzc0NvdW50KSB7XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZGl2ID0gZmxvYXRUb0ludChjb21wKGxpc3QsIHJlZ2lzdHJ5LCBpKSk7XG4gICAgICAgICAgICBvdXRbKytidWNrZXRzW2RpdiAmIHJhZGl4TWFza11dID0gbXV0YXRvcihsaXN0LCByZWdpc3RyeSwgaSwgZGl2IF49IGRpdiA+PiAzMSB8IDB4ODAwMDAwMDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2FwID0gb3V0O1xuICAgICAgICBvdXQgPSBsaXN0O1xuICAgICAgICBsaXN0ID0gc3dhcDtcbiAgICAgICAgd2hpbGUgKCsrcGFzcyA8IHBhc3NDb3VudCkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbiA9IGxpc3QubGVuZ3RoLCBvZmZzZXQgPSBwYXNzICogbWF4UmFkaXgsIHNpemUgPSBwYXNzICogcmFkaXhCaXRzOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZGl2ID0gZmxvYXRUb0ludChjb21wKGxpc3QsIHJlZ2lzdHJ5LCBpKSk7XG4gICAgICAgICAgICAgICAgb3V0WysrYnVja2V0c1tvZmZzZXQgKyAoZGl2ID4+PiBzaXplICYgcmFkaXhNYXNrKV1dID0gbGlzdFtpXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dhcCA9IG91dDtcbiAgICAgICAgICAgIG91dCA9IGxpc3Q7XG4gICAgICAgICAgICBsaXN0ID0gc3dhcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aCwgb2Zmc2V0ID0gcGFzcyAqIG1heFJhZGl4LCBzaXplID0gcGFzcyAqIHJhZGl4Qml0czsgaSA8IG47IGkrKykge1xuICAgICAgICBkaXYgPSBmbG9hdFRvSW50KGNvbXAobGlzdCwgcmVnaXN0cnksIGkpKTtcbiAgICAgICAgb3V0WysrYnVja2V0c1tvZmZzZXQgKyAoZGl2ID4+PiBzaXplICYgbGFzdE1hc2spXV0gPSBtdXRhdG9yKGxpc3QsIHJlZ2lzdHJ5LCBpLCBkaXYgXiAofmRpdiA+PiAzMSB8IDB4ODAwMDAwMDApKTtcbiAgICAgICAgY2xlYW4obGlzdCwgcmVnaXN0cnksIGkpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFkaXhTb3J0O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZ2xzbGlmeSA9IHJlcXVpcmUoXCJnbHNsaWZ5XCIpO1xudmFyIHNoYWRlcnMgPSByZXF1aXJlKFwiZ2xzbGlmeS9zaW1wbGUtYWRhcHRlci5qc1wiKShcIlxcbiNkZWZpbmUgR0xTTElGWSAxXFxuXFxubWF0MyBhX3hfZ2V0Tm9ybWFsTWF0cml4KGluIG1hdDQgdCkge1xcbiAgbWF0MyBtYXROb3JtO1xcbiAgbWF0NCBhID0gdDtcXG4gIGZsb2F0IGEwMCA9IGFbMF1bMF0sIGEwMSA9IGFbMF1bMV0sIGEwMiA9IGFbMF1bMl0sIGEwMyA9IGFbMF1bM10sIGExMCA9IGFbMV1bMF0sIGExMSA9IGFbMV1bMV0sIGExMiA9IGFbMV1bMl0sIGExMyA9IGFbMV1bM10sIGEyMCA9IGFbMl1bMF0sIGEyMSA9IGFbMl1bMV0sIGEyMiA9IGFbMl1bMl0sIGEyMyA9IGFbMl1bM10sIGEzMCA9IGFbM11bMF0sIGEzMSA9IGFbM11bMV0sIGEzMiA9IGFbM11bMl0sIGEzMyA9IGFbM11bM10sIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCwgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLCBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSwgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLCBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCwgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLCBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSwgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLCBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcXG4gIGRldCA9IDEuMCAvIGRldDtcXG4gIG1hdE5vcm1bMF1bMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcXG4gIG1hdE5vcm1bMF1bMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcXG4gIG1hdE5vcm1bMF1bMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcXG4gIG1hdE5vcm1bMV1bMF0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcXG4gIG1hdE5vcm1bMV1bMV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcXG4gIG1hdE5vcm1bMV1bMl0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcXG4gIG1hdE5vcm1bMl1bMF0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcXG4gIG1hdE5vcm1bMl1bMV0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcXG4gIG1hdE5vcm1bMl1bMl0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcXG4gIHJldHVybiBtYXROb3JtO1xcbn1cXG5mbG9hdCBiX3hfaW52ZXJzZShmbG9hdCBtKSB7XFxuICByZXR1cm4gMS4wIC8gbTtcXG59XFxubWF0MiBiX3hfaW52ZXJzZShtYXQyIG0pIHtcXG4gIHJldHVybiBtYXQyKG1bMV1bMV0sIC1tWzBdWzFdLCAtbVsxXVswXSwgbVswXVswXSkgLyAobVswXVswXSAqIG1bMV1bMV0gLSBtWzBdWzFdICogbVsxXVswXSk7XFxufVxcbm1hdDMgYl94X2ludmVyc2UobWF0MyBtKSB7XFxuICBmbG9hdCBhMDAgPSBtWzBdWzBdLCBhMDEgPSBtWzBdWzFdLCBhMDIgPSBtWzBdWzJdO1xcbiAgZmxvYXQgYTEwID0gbVsxXVswXSwgYTExID0gbVsxXVsxXSwgYTEyID0gbVsxXVsyXTtcXG4gIGZsb2F0IGEyMCA9IG1bMl1bMF0sIGEyMSA9IG1bMl1bMV0sIGEyMiA9IG1bMl1bMl07XFxuICBmbG9hdCBiMDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjE7XFxuICBmbG9hdCBiMTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xcbiAgZmxvYXQgYjIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xcbiAgZmxvYXQgZGV0ID0gYTAwICogYjAxICsgYTAxICogYjExICsgYTAyICogYjIxO1xcbiAgcmV0dXJuIG1hdDMoYjAxLCAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSksIChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpLCBiMTEsIChhMjIgKiBhMDAgLSBhMDIgKiBhMjApLCAoLWExMiAqIGEwMCArIGEwMiAqIGExMCksIGIyMSwgKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApLCAoYTExICogYTAwIC0gYTAxICogYTEwKSkgLyBkZXQ7XFxufVxcbm1hdDQgYl94X2ludmVyc2UobWF0NCBtKSB7XFxuICBmbG9hdCBhMDAgPSBtWzBdWzBdLCBhMDEgPSBtWzBdWzFdLCBhMDIgPSBtWzBdWzJdLCBhMDMgPSBtWzBdWzNdLCBhMTAgPSBtWzFdWzBdLCBhMTEgPSBtWzFdWzFdLCBhMTIgPSBtWzFdWzJdLCBhMTMgPSBtWzFdWzNdLCBhMjAgPSBtWzJdWzBdLCBhMjEgPSBtWzJdWzFdLCBhMjIgPSBtWzJdWzJdLCBhMjMgPSBtWzJdWzNdLCBhMzAgPSBtWzNdWzBdLCBhMzEgPSBtWzNdWzFdLCBhMzIgPSBtWzNdWzJdLCBhMzMgPSBtWzNdWzNdLCBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCwgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLCBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSwgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLCBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCwgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLCBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSwgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLCBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XFxuICByZXR1cm4gbWF0NChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDksIGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSwgYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzLCBhMjIgKiBiMDQgLSBhMjEgKiBiMDUgLSBhMjMgKiBiMDMsIGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNywgYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3LCBhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEsIGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSwgYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2LCBhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYsIGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCwgYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwLCBhMTEgKiBiMDcgLSBhMTAgKiBiMDkgLSBhMTIgKiBiMDYsIGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNiwgYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwLCBhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApIC8gZGV0O1xcbn1cXG5mbG9hdCBjX3hfdHJhbnNwb3NlKGZsb2F0IG0pIHtcXG4gIHJldHVybiBtO1xcbn1cXG5tYXQyIGNfeF90cmFuc3Bvc2UobWF0MiBtKSB7XFxuICByZXR1cm4gbWF0MihtWzBdWzBdLCBtWzFdWzBdLCBtWzBdWzFdLCBtWzFdWzFdKTtcXG59XFxubWF0MyBjX3hfdHJhbnNwb3NlKG1hdDMgbSkge1xcbiAgcmV0dXJuIG1hdDMobVswXVswXSwgbVsxXVswXSwgbVsyXVswXSwgbVswXVsxXSwgbVsxXVsxXSwgbVsyXVsxXSwgbVswXVsyXSwgbVsxXVsyXSwgbVsyXVsyXSk7XFxufVxcbm1hdDQgY194X3RyYW5zcG9zZShtYXQ0IG0pIHtcXG4gIHJldHVybiBtYXQ0KG1bMF1bMF0sIG1bMV1bMF0sIG1bMl1bMF0sIG1bM11bMF0sIG1bMF1bMV0sIG1bMV1bMV0sIG1bMl1bMV0sIG1bM11bMV0sIG1bMF1bMl0sIG1bMV1bMl0sIG1bMl1bMl0sIG1bM11bMl0sIG1bMF1bM10sIG1bMV1bM10sIG1bMl1bM10sIG1bM11bM10pO1xcbn1cXG52ZWM0IGFwcGx5VHJhbnNmb3JtKHZlYzQgcG9zKSB7XFxuICBtYXQ0IE1WTWF0cml4ID0gdV92aWV3ICogdV90cmFuc2Zvcm07XFxuICBwb3MueCArPSAxLjA7XFxuICBwb3MueSAtPSAxLjA7XFxuICBwb3MueHl6ICo9IHVfc2l6ZSAqIDAuNTtcXG4gIHBvcy55ICo9IC0xLjA7XFxuICB2X3Bvc2l0aW9uID0gKE1WTWF0cml4ICogcG9zKS54eXo7XFxuICB2X2V5ZVZlY3RvciA9ICh1X3Jlc29sdXRpb24gKiAwLjUpIC0gdl9wb3NpdGlvbjtcXG4gIHBvcyA9IHVfcGVyc3BlY3RpdmUgKiBNVk1hdHJpeCAqIHBvcztcXG4gIHJldHVybiBwb3M7XFxufVxcbiN2ZXJ0X2RlZmluaXRpb25zXFxuXFxudmVjMyBjYWxjdWxhdGVPZmZzZXQodmVjMyBJRCkge1xcbiAgXFxuICAjdmVydF9hcHBsaWNhdGlvbnNcXG4gIHJldHVybiB2ZWMzKDAuMCk7XFxufVxcbnZvaWQgbWFpbigpIHtcXG4gIHZfdGV4dHVyZUNvb3JkaW5hdGUgPSBhX3RleENvb3JkO1xcbiAgdmVjMyBpbnZlcnRlZE5vcm1hbHMgPSBhX25vcm1hbHMgKyAodV9ub3JtYWxzLnggPCAwLjAgPyBjYWxjdWxhdGVPZmZzZXQodV9ub3JtYWxzKSAqIDIuMCAtIDEuMCA6IHZlYzMoMC4wKSk7XFxuICBpbnZlcnRlZE5vcm1hbHMueSAqPSAtMS4wO1xcbiAgdl9ub3JtYWwgPSBjX3hfdHJhbnNwb3NlKG1hdDMoYl94X2ludmVyc2UodV90cmFuc2Zvcm0pKSkgKiBpbnZlcnRlZE5vcm1hbHM7XFxuICB2ZWMzIG9mZnNldFBvcyA9IGFfcG9zICsgY2FsY3VsYXRlT2Zmc2V0KHVfcG9zaXRpb25PZmZzZXQpO1xcbiAgZ2xfUG9zaXRpb24gPSBhcHBseVRyYW5zZm9ybSh2ZWM0KG9mZnNldFBvcywgMS4wKSk7XFxufVwiLCBcIlxcbiNkZWZpbmUgR0xTTElGWSAxXFxuXFxuI2Zsb2F0X2RlZmluaXRpb25zXFxuXFxuZmxvYXQgYV94X2FwcGx5TWF0ZXJpYWwoZmxvYXQgSUQpIHtcXG4gIFxcbiAgI2Zsb2F0X2FwcGxpY2F0aW9uc1xcbiAgcmV0dXJuIDEuO1xcbn1cXG4jdmVjM19kZWZpbml0aW9uc1xcblxcbnZlYzMgYV94X2FwcGx5TWF0ZXJpYWwodmVjMyBJRCkge1xcbiAgXFxuICAjdmVjM19hcHBsaWNhdGlvbnNcXG4gIHJldHVybiB2ZWMzKDApO1xcbn1cXG4jdmVjNF9kZWZpbml0aW9uc1xcblxcbnZlYzQgYV94X2FwcGx5TWF0ZXJpYWwodmVjNCBJRCkge1xcbiAgXFxuICAjdmVjNF9hcHBsaWNhdGlvbnNcXG4gIHJldHVybiB2ZWM0KDApO1xcbn1cXG52ZWM0IGJfeF9hcHBseUxpZ2h0KGluIHZlYzQgYmFzZUNvbG9yLCBpbiB2ZWMzIG5vcm1hbCwgaW4gdmVjNCBnbG9zc2luZXNzKSB7XFxuICBpbnQgbnVtTGlnaHRzID0gaW50KHVfbnVtTGlnaHRzKTtcXG4gIHZlYzMgYW1iaWVudENvbG9yID0gdV9hbWJpZW50TGlnaHQgKiBiYXNlQ29sb3IucmdiO1xcbiAgdmVjMyBleWVWZWN0b3IgPSBub3JtYWxpemUodl9leWVWZWN0b3IpO1xcbiAgdmVjMyBkaWZmdXNlID0gdmVjMygwLjApO1xcbiAgYm9vbCBoYXNHbG9zc2luZXNzID0gZ2xvc3NpbmVzcy5hID4gMC4wO1xcbiAgYm9vbCBoYXNTcGVjdWxhckNvbG9yID0gbGVuZ3RoKGdsb3NzaW5lc3MucmdiKSA+IDAuMDtcXG4gIGZvcihpbnQgaSA9IDA7IGkgPCA0OyBpKyspIHtcXG4gICAgaWYoaSA+PSBudW1MaWdodHMpXFxuICAgICAgYnJlYWs7XFxuICAgIHZlYzMgbGlnaHREaXJlY3Rpb24gPSBub3JtYWxpemUodV9saWdodFBvc2l0aW9uW2ldLnh5eiAtIHZfcG9zaXRpb24pO1xcbiAgICBmbG9hdCBsYW1iZXJ0aWFuID0gbWF4KGRvdChsaWdodERpcmVjdGlvbiwgbm9ybWFsKSwgMC4wKTtcXG4gICAgaWYobGFtYmVydGlhbiA+IDAuMCkge1xcbiAgICAgIGRpZmZ1c2UgKz0gdV9saWdodENvbG9yW2ldLnJnYiAqIGJhc2VDb2xvci5yZ2IgKiBsYW1iZXJ0aWFuO1xcbiAgICAgIGlmKGhhc0dsb3NzaW5lc3MpIHtcXG4gICAgICAgIHZlYzMgaGFsZlZlY3RvciA9IG5vcm1hbGl6ZShsaWdodERpcmVjdGlvbiArIGV5ZVZlY3Rvcik7XFxuICAgICAgICBmbG9hdCBzcGVjdWxhcldlaWdodCA9IHBvdyhtYXgoZG90KGhhbGZWZWN0b3IsIG5vcm1hbCksIDAuMCksIGdsb3NzaW5lc3MuYSk7XFxuICAgICAgICB2ZWMzIHNwZWN1bGFyQ29sb3IgPSBoYXNTcGVjdWxhckNvbG9yID8gZ2xvc3NpbmVzcy5yZ2IgOiB1X2xpZ2h0Q29sb3JbaV0ucmdiO1xcbiAgICAgICAgZGlmZnVzZSArPSBzcGVjdWxhckNvbG9yICogc3BlY3VsYXJXZWlnaHQgKiBsYW1iZXJ0aWFuO1xcbiAgICAgIH1cXG4gICAgfVxcbiAgfVxcbiAgcmV0dXJuIHZlYzQoYW1iaWVudENvbG9yICsgZGlmZnVzZSwgYmFzZUNvbG9yLmEpO1xcbn1cXG52b2lkIG1haW4oKSB7XFxuICB2ZWM0IG1hdGVyaWFsID0gdV9iYXNlQ29sb3IuciA+PSAwLjAgPyB1X2Jhc2VDb2xvciA6IGFfeF9hcHBseU1hdGVyaWFsKHVfYmFzZUNvbG9yKTtcXG4gIGJvb2wgbGlnaHRzRW5hYmxlZCA9ICh1X2ZsYXRTaGFkaW5nID09IDAuMCkgJiYgKHVfbnVtTGlnaHRzID4gMC4wIHx8IGxlbmd0aCh1X2FtYmllbnRMaWdodCkgPiAwLjApO1xcbiAgdmVjMyBub3JtYWwgPSBub3JtYWxpemUodl9ub3JtYWwpO1xcbiAgdmVjNCBnbG9zc2luZXNzID0gdV9nbG9zc2luZXNzLnggPCAwLjAgPyBhX3hfYXBwbHlNYXRlcmlhbCh1X2dsb3NzaW5lc3MpIDogdV9nbG9zc2luZXNzO1xcbiAgdmVjNCBjb2xvciA9IGxpZ2h0c0VuYWJsZWQgPyBiX3hfYXBwbHlMaWdodChtYXRlcmlhbCwgbm9ybWFsaXplKHZfbm9ybWFsKSwgZ2xvc3NpbmVzcykgOiBtYXRlcmlhbDtcXG4gIGdsX0ZyYWdDb2xvciA9IGNvbG9yO1xcbiAgZ2xfRnJhZ0NvbG9yLmEgKj0gdV9vcGFjaXR5O1xcbn1cIiwgW10sIFtdKTtcbm1vZHVsZS5leHBvcnRzID0gc2hhZGVyczsiLCIvLyAndXNlIHN0cmljdCc7XG5cbi8vIEZhbW91cyBkZXBlbmRlbmNpZXNcbnZhciBET01FbGVtZW50ID0gcmVxdWlyZSgnZmFtb3VzL2RvbS1yZW5kZXJhYmxlcy9ET01FbGVtZW50Jyk7XG52YXIgRmFtb3VzRW5naW5lID0gcmVxdWlyZSgnZmFtb3VzL2NvcmUvRmFtb3VzRW5naW5lJyk7XG52YXIgQ2xvY2sgPSByZXF1aXJlKCdmYW1vdXMvY29yZS9DbG9jaycpO1xuXG52YXIgbWFpbiA9IEZhbW91c0VuZ2luZS5jcmVhdGVTY2VuZSgpXG52YXIgbm9kZSA9IG1haW4uYWRkQ2hpbGQoKVxuXG52YXIgbGlnaHQgPSBub2RlLmFkZENoaWxkKClcbnZhciBjZW50ZXIgPSBub2RlLmFkZENoaWxkKClcblxubmV3IERPTUVsZW1lbnQobm9kZSwgeyB0YWdOYW1lOiBcImRpdlwiIH0pXG4gICAgLnNldEF0dHJpYnV0ZShcImlkXCIsIFwiYmFja2dyb3VuZFwiIClcbiAgICAuc2V0Q29udGVudChcIi89PXx8PT09PT09PT0+XCIpXG5cbm5ldyBET01FbGVtZW50KG5vZGUsIHsgdGFnTmFtZTogXCJkaXZcIiB9KVxuICAgIC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImNlbnRlci1kb3RcIiApXG5cbi8vIHZhciB0aW1lID0gbmV3IENsb2NrKCkuX3RpbWVcblxubm9kZVxuICAgIC8vIFNldCBzaXplIG1vZGUgdG8gJ2Fic29sdXRlJyB0byB1c2UgYWJzb2x1dGUgcGl4ZWwgdmFsdWVzOiAod2lkdGggMjUwcHgsIGhlaWdodCAyNTBweClcbiAgICAuc2V0U2l6ZU1vZGUoJ2Fic29sdXRlJywgJ2Fic29sdXRlJywgJ2Fic29sdXRlJylcbiAgICAuc2V0QWJzb2x1dGVTaXplKDEyNSwgMTI1KVxuICAgIC8vIENlbnRlciB0aGUgJ25vZGUnIHRvIHRoZSBwYXJlbnQgKHRoZSBzY3JlZW4sIGluIHRoaXMgaW5zdGFuY2UpXG4gICAgLnNldEFsaWduKDAuNSwgMC41KVxuICAgIC8vIFNldCB0aGUgdHJhbnNsYXRpb25hbCBvcmlnaW4gdG8gdGhlIGNlbnRlciBvZiB0aGUgJ25vZGUnXG4gICAgLnNldE1vdW50UG9pbnQoMC41LCAwLjUpXG4gICAgLy8gU2V0IHRoZSByb3RhdGlvbmFsIG9yaWdpbiB0byB0aGUgY2VudGVyIG9mIHRoZSAnbm9kZSdcbiAgICAuc2V0T3JpZ2luKDAuNSwgMC41KTtcblxubGlnaHRcbiAgICAuc2V0U2l6ZU1vZGUoJ2Fic29sdXRlJywgJ2Fic29sdXRlJywgJ2Fic29sdXRlJylcbiAgICAuc2V0QWJzb2x1dGVTaXplKDEyNSwgMTI1KVxuICAgIC5zZXRBbGlnbigwLjUsIDAuNSlcbiAgICAvLyBTZXQgdGhlIHRyYW5zbGF0aW9uYWwgb3JpZ2luIHRvIHRoZSBjZW50ZXIgb2YgdGhlICdub2RlJ1xuICAgIC5zZXRNb3VudFBvaW50KDAuNSwgMC41KVxuICAgIC8vIFNldCB0aGUgcm90YXRpb25hbCBvcmlnaW4gdG8gdGhlIGNlbnRlciBvZiB0aGUgJ25vZGUnXG4gICAgLnNldE9yaWdpbigwLjUsIDAuNSk7XG5cbmNlbnRlciBcbiAgICAuc2V0U2l6ZU1vZGUoJ2Fic29sdXRlJywgJ2Fic29sdXRlJywgJ2Fic29sdXRlJylcbiAgICAuc2V0QWJzb2x1dGVTaXplKDYyLCA2MilcbiAgICAuc2V0QWxpZ24oMC41LCAwLjUpXG4gICAgLy8gU2V0IHRoZSB0cmFuc2xhdGlvbmFsIG9yaWdpbiB0byB0aGUgY2VudGVyIG9mIHRoZSAnbm9kZSdcbiAgICAuc2V0TW91bnRQb2ludCgwLjUsIDAuNSlcbiAgICAvLyBTZXQgdGhlIHJvdGF0aW9uYWwgb3JpZ2luIHRvIHRoZSBjZW50ZXIgb2YgdGhlICdub2RlJ1xuICAgIC5zZXRPcmlnaW4oMC41LCAwLjUpO1xuXG52YXIgc3Bpbm5lciA9IG5vZGUuYWRkQ29tcG9uZW50KHtcbiAgICBvblVwZGF0ZTogZnVuY3Rpb24odGltZSkge1xuICAgICAgICBub2RlLnNldFJvdGF0aW9uKHRpbWUgLyA1MDAsIHRpbWUgLyAxMDAwLCB0aW1lIC8gMjUwKVxuICAgICAgICBub2RlLnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrKHNwaW5uZXIpOyBcbiAgICB9XG59KSBcblxudmFyIGxpZ2h0X3NwaW5uZXIgPSBsaWdodC5hZGRDb21wb25lbnQoe1xuICAgIG9uVXBkYXRlOiBmdW5jdGlvbih0aW1lKSB7XG4gICAgICAgIGxpZ2h0LnNldFJvdGF0aW9uKHRpbWUgLyAxMDAwLCAwLjIsIDApXG4gICAgICAgIGxpZ2h0LnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrKGxpZ2h0X3NwaW5uZXIpOyBcbiAgICB9XG59KVxuXG5uZXcgRE9NRWxlbWVudChsaWdodCwge3RhZ05hbWU6IFwiZGl2XCJ9KVxuICAgIC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcImxpZ2h0XCIpXG4gICAgXG5cbm5vZGUucmVxdWVzdFVwZGF0ZShzcGlubmVyKVxubGlnaHQucmVxdWVzdFVwZGF0ZShsaWdodF9zcGlubmVyKVxuXG4vLyBCb2lsZXJwbGF0ZSBjb2RlIHRvIG1ha2UgeW91ciBsaWZlIGVhc2llclxuRmFtb3VzRW5naW5lLmluaXQoKTsiXX0=
