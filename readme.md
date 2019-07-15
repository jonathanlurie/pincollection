`npm install --save pincollection`


The pin collection makes it easy to create pins like in Google Map, but for ThreeJS.  
First, the WebGL environment must be made with [ThreeContext](https://github.com/jonathanlurie/threecontext), then you can:

```javascript
let pc = new PinCollection(myThreeCtx)

// add a pin with an image (the image can be jpg or png, transparency is accepted)
pc.addPin(
  // position (mandatory)
  {x: 100, y: 200, z: 50},

  // options
  {
    // shape:
    textureUrl: 'images/some_icon.png'
    size: 300,        // default: 1000
    color: '#ff0000', // default: '#FFFFFF'

    // callback when the mouse pointer is hovering the pin (tied to the 'mousemove' event).
    // This event is throttled to 100ms.
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} position - position of the pin such as {x: Number, y: Number, z: Number}
    // @param {Object} originalEvent - event sent by the original 'mousemove' event
    onMouseMove: function(pinId, position, originalEvent){
      // do something
    },

    // callback when the pin is double clicked (tied to the 'dblclick' event)
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} position - position of the pin such as {x: Number, y: Number, z: Number}
    // @param {Object} originalEvent - event sent by the original 'dblclick' event
    onDoubleClick: function(pinId, position, originalEvent){
      // do something
    },

    // callback when the pin is double clicked (tied to the 'mousemove' event)
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} originalEvent - event sent by the original 'mousemove' event
    onLeave: function(pinId, originalEvent){
      // do something
    }
  })

// create a circular pin
pc.addPin(
  // position (mandatory)
  {x: 100, y: 200, z: 50},

  // options
  {
    // shape:
    shape: 'circle',  // default: circle
    size: 300,        // default: 1000
    color: '#ff0000', // default: '#FFFFFF'

    // callback when the mouse pointer is hovering the pin (tied to the 'mousemove' event).
    // This event is throttled to 100ms.
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} position - position of the pin such as {x: Number, y: Number, z: Number}
    // @param {Object} originalEvent - event sent by the original 'mousemove' event
    onMouseMove: function(pinId, position, originalEvent){
      // do something
    },

    // callback when the pin is double clicked (tied to the 'dblclick' event)
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} position - position of the pin such as {x: Number, y: Number, z: Number}
    // @param {Object} originalEvent - event sent by the original 'dblclick' event
    onDoubleClick: function(pinId, position, originalEvent){
      // do something
    },

    // callback when the pin is double clicked (tied to the 'mousemove' event)
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} originalEvent - event sent by the original 'mousemove' event
    onLeave: function(pinId, originalEvent){
      // do something
    }
  })


// create a star-shaped pin
pc.addPin(
  // position (mandatory)
  {x: 300, y: 150, z: 350},

  // options
  {
    // shape:
    shape: 'circle',  // default: circle
    size: 300,        // default: 1000
    color: '#ff0000', // default: '#FFFFFF'
    sides: 8, // Number of branches of the star (default: 16)
    spikiness: 0.3, // 0= not spiky, 1= very spiky (default: 0.3)

    // callback when the mouse pointer is hovering the pin (tied to the 'mousemove' event).
    // This event is throttled to 100ms.
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} position - position of the pin such as {x: Number, y: Number, z: Number}
    // @param {Object} originalEvent - event sent by the original 'mousemove' event
    onMouseMove: function(pinId, position, originalEvent){
      // do something
    },

    // callback when the pin is double clicked (tied to the 'dblclick' event)
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} position - position of the pin such as {x: Number, y: Number, z: Number}
    // @param {Object} originalEvent - event sent by the original 'dblclick' event
    onDoubleClick: function(pinId, position, originalEvent){
      // do something
    },

    // callback when the pin is double clicked (tied to the 'mousemove' event)
    // @param {string} pinId - ID of the pin being hovered
    // @param {Object} originalEvent - event sent by the original 'mousemove' event
    onLeave: function(pinId, originalEvent){
      // do something
    }
  })
```
