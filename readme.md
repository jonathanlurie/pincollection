The pin collection makes it easy to create pins like in Google Map, but for ThreeJS.  
First, the WebGL environment must be made with [ThreeContext](https://github.com/jonathanlurie/threecontext), then you can:


```javascript
let pc = new PinCollection(myThreeCtx)
// pc.addPointCloud(1000, 1000, '#FF0000', false)
pc.addPin({x: 0, y: 0, z: 0},
{
  size: 1300, // default: 300
  id: 'the point', // random large int if not provided
  makeVisible: true, // default: true
  color: '#ff00ff', // default: '#ffffff'
  constantSize: false, // makes the point having a constant size on screen, no matter the camera zoom
  callback: function(pinId, position){ // this is what will happen when double clicking on the pin
    console.log(`callback A: The pin ${pinId} was clicked at position ${position}.`)
    alert('This is the purple pin.')
  }
})


pc.addPin({x: 1000, y: 0, z: 0},
{
  size: 1000, // default: 300
  id: 'the other point', // random large int if not provided
  makeVisible: true, // default: true
  color: '#ffff00', // default: '#ffffff'
  constantSize: false, // makes the point having a constant size on screen, no matter the camera zoom
  callback: function(pinId, position){ // this is what will happen when double clicking on the pin
    console.log(`callback B: The pin ${pinId} was clicked at position ${position}.`)
    alert('This is the yellow pin.')
  }
})
```
