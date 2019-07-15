import { Object3D, Color, SpriteMaterial, TextureLoader, Sprite, CanvasTexture } from 'three';
import EventManager from '@jonathanlurie/eventmanager';

const EVENT_SUFFIX = {
  DBL_CLICK: '_DOUBLECLICK_EVENT',
  CLICK: '_CLICK_EVENT',
  MOVE: '_MOVE_EVENT',
  LEAVE: '_LEAVE_EVENT'
};

/**
 * Events expected:
 *
 * - 'onPinCreated': whenever a mesh is loaded. the callback of this event is called with the arg:
 *    @param {THREE.Mesh} mesh - mesh object (of type THREE.Point)
 *    @param {string} id - id of the mesh (as used within this collection)
 *
 * - 'onPinWarning': if a pin is added and the provided id corresponds to an already existing id
 *    @param {String} message - the warning message
 *    @param {String} id - id of the point to be added
 *
 */
class PinCollection extends EventManager {

  constructor(threeContext=null){
    super();
    let that = this;
    this._threeContext = threeContext;

    this._container = new Object3D();
    this._container.name = 'meshContainer';
    this._threeContext.getScene().add(this._container);
    this._collection = {};

    // // DEBUG
    // let axesHelper = new THREE.AxesHelper(100)
    // this._threeContext.getScene().add(axesHelper)

    this._threeContext._raycaster.params.Points.threshold = 500;


    this._threeContext._renderer.domElement.addEventListener('dblclick', (evt) => {
      let intersections = that._threeContext.performRaycast({
        parent: that._container,
        emitEvent: false
      });
      console.log(intersections);

      if(!intersections)
        return

      let eventName = `${intersections[0].object.name}${EVENT_SUFFIX.DBL_CLICK}`;
      that.emit(eventName, [intersections[0].object.name, intersections[0].object.position, evt]);
    }, false);


    let currentlyHovered = null;
    let throttleDelay = 100;
    let lastMoveTimestamp = 0;
    this._threeContext._renderer.domElement.addEventListener('mousemove', (evt) => {

      let now = Date.now();
      if((now - lastMoveTimestamp)<=throttleDelay){
        return
      }
      lastMoveTimestamp = now;

      let intersections = that._threeContext.performRaycast({
        parent: that._container,
        emitEvent: false
      });
      // console.log(intersections)
      that._unHoverAll();

      if(!intersections){
        that.emit(`${currentlyHovered}${EVENT_SUFFIX.LEAVE}`, [currentlyHovered, evt]);
        currentlyHovered = null;
        return
      }

      let currentId = intersections[0].object.name;
      if(currentlyHovered && currentlyHovered !== currentId){
        that.emit(`${currentlyHovered}${EVENT_SUFFIX.LEAVE}`, [currentlyHovered, evt]);
      }

      currentlyHovered = currentId;
      let pin = intersections[0].object;
      pin.userData.hovered = true;
      pin.material.color.addScalar(0.3);
      pin.material.needsUpdate = true;
      that.emit(`${currentId}${EVENT_SUFFIX.MOVE}`, [currentId, pin.position, evt]);
    }, false);

  }


  /**
   * Is a mesh with such id in the collection?
   * @return {boolean} true if present in collection, false if not
   */
  has(id){
    return (id in this._collection)
  }


  /**
   * Show the mesh that has such id
   */
  show(id){
    if(id in this._collection){
      this._collection[id].visible = true;
    }
  }


  /**
   * Hide the mesh that has such id
   */
  hide(id){
    if(id in this._collection){
      this._collection[id].visible = false;
    }
  }


  /**
   * TODO
   * NOT WORKING FOR NOW
   */
  detach(id){
    if(id in this._collection){
      // this._container
      let mesh = this._collection[id];
      this._container.remove(mesh);
    }
  }


  /**
   * Add a pin to the collection. This pin can have an image or be a circle, or a star
   * @param {Object} position - 3D coordinates such as {x: Number, y: Number, z: Number}
   * @param {Object} options - the option object
   * @param {string} options.id - the unique ID of this pin within the collection. (default: auto generated)
   * @param {boolean} options.makeVisible - whether to make this pin visible or not by default (default: true)
   * @param {String} options.color - hex string color of the pin (default: '#ffffff')
   * @param {Number} options.size - size (diameter of a circle) of the pin (default: 1000)
   * @param {string} options.textureUrl - URL of an image (png or jpg) to load on the pin (default: null)
   * @param {String} options.shape - shape of the pin. Can be 'circle' or 'star'. Not compatible with options.textureUrl (default: circle)
   * @param {Number} options.sides - only with options.shape is 'star'. Number of branches in the star (default: 16)
   * @param {Number} options.spikiness - only with options.shape to 'star'. In range [0, 1], very spiky when 0, very not spiky when 1. (default: 0.3)
   * @param {Function} options.onDoubleClick - Callback function called when the pin is double-clicked. Will be called with the args: (pinID: String, pinPosition: {x: Number, y: Number, z: Number}, dblclickMouseEvent: Object)
   * @param {Function} options.onMouseMove - Callback function called when the pin is hovered. Will be called with the args: (pinID: String, pinPosition: {x: Number, y: Number, z: Number}, dblclickMouseEvent: Object)
   * @param {Function} options.onLeave - Callback function called when the pointer leaves the pin. Will be called with the args: (pinID: String, dblclickMouseEvent: Object)
   */
  addPin(position, options = {}){
    let that = this;
    let id = 'id' in options ? options.id : Math.random().toString().split('.')[1];

    if(id in this._collection){
      return this.emit('onPinWarning', ['A pin with such id is already loaded.', id])
    }

    let makeVisible = 'makeVisible' in options ? options.makeVisible : true;
    let color = new Color('color' in options ? options.color : '#FFFFFF');
    let size = 'size' in options ? options.size : 1000;
    let textureUrl = 'textureUrl' in options ? options.textureUrl : null;


    if('onDoubleClick' in options){
      this.on(`${id}${EVENT_SUFFIX.DBL_CLICK}`, options.onDoubleClick);
    }

    if('onMouseMove' in options){
      this.on(`${id}${EVENT_SUFFIX.MOVE}`, options.onMouseMove);
    }

    if('onLeave' in options){
      this.on(`${id}${EVENT_SUFFIX.LEAVE}`, options.onLeave);
    }

    let material = new SpriteMaterial( { color: color } );
    material.userData.originalColor = color;
    let sprite = null;
    if(textureUrl){
      let textureLoader = new TextureLoader();
      sprite = textureLoader.load(textureUrl);
    } else {
      sprite = this._generateShapeTexture(options);
    }
    material.map = sprite;

    let pin = new Sprite( material );
    pin.userData.hovered = false;
    pin.scale.set( size, size, size );
    pin.position.set(position.x, position.y, position.z);

    pin.name = id;
    pin.visible = makeVisible;
    that._collection[id] = pin;
    that._container.add(pin);

    that.emit('onPinCreated', [pin, id]);
  }


  _generateShapeTexture(options){
    let shape = 'shape' in options ? options.shape : 'circle';

    switch (shape) {
      case 'star':
        return  this._generateStarTexture(options)
        break;

      case 'circle':
      default:
        return this._generateCircleTexture()
    }
  }

  _generateCircleTexture(){
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    let ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(256, 256, 254, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    let texture = new CanvasTexture(canvas);
    return texture
  }


  /**
   * @private
   */
  _generateStarTexture(options){
    let spikes = 'sides' in options ? options.sides : 16;
    let spikiness = 'spikiness' in options ? options.spikiness : 0.3;
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    let ctx = canvas.getContext('2d');
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;
    let outerRadius = canvas.width / 2;
    let innerRadius = outerRadius * (1 - spikiness);
    let rot=Math.PI/2*3;
    let x=cx;
    let y=cy;
    let step=Math.PI/spikes;

    ctx.beginPath();
    ctx.moveTo(cx,cy-outerRadius);
    for(let i=0;i<spikes;i++){
      x=cx+Math.cos(rot)*outerRadius;
      y=cy+Math.sin(rot)*outerRadius;
      ctx.lineTo(x,y);
      rot+=step;

      x=cx+Math.cos(rot)*innerRadius;
      y=cy+Math.sin(rot)*innerRadius;
      ctx.lineTo(x,y);
      rot+=step;
    }
    ctx.lineTo(cx,cy-outerRadius);
    ctx.closePath();
    //ctx.lineWidth=5;
    //ctx.strokeStyle='blue';
    //ctx.stroke();
    ctx.fillStyle='#ffffff';
    ctx.fill();
    let texture = new CanvasTexture(canvas);
    return texture
  }

  /**
   * Add a callback to a specific pin
   * @param {string} id - the id of the pin to add a callback to
   * @param {Function} cb - the callback
   */
  addCallback(id, cb){
    if(id in this._collection){
      this.on(id, cb);
    }
  }


  /**
   * @private
   */
  _unHoverAll(){
    let ids = Object.keys(this._collection);
    for(let i=0; i<ids.length; i++){
      let pin = this._collection[ids[i]];
      if(pin.userData.hovered){
        pin.userData.hovered = false;
        pin.material.color = pin.material.userData.originalColor.clone();
        pin.material.needsUpdate = true;
      }
    }
  }

}

export default PinCollection;
//# sourceMappingURL=pincollection.js.map
