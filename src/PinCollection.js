import * as THREE from 'three'
import EventManager from '@jonathanlurie/eventmanager'

const EVENT_SUFFIX = {
  DBL_CLICK: '_DOUBLECLICK_EVENT',
  CLICK: '_CLICK_EVENT',
  MOVE: '_MOVE_EVENT',
  LEAVE: '_LEAVE_EVENT'
}

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
    super()
    let that = this
    this._threeContext = threeContext

    this._container = new THREE.Object3D()
    this._container.name = 'meshContainer'
    this._threeContext.getScene().add(this._container)
    this._collection = {}

    // // DEBUG
    // let axesHelper = new THREE.AxesHelper(100)
    // this._threeContext.getScene().add(axesHelper)

    this._threeContext._raycaster.params.Points.threshold = 500


    this._threeContext._renderer.domElement.addEventListener('dblclick', (evt) => {
      let intersections = that._threeContext.performRaycast({
        parent: that._container,
        emitEvent: false
      })
      console.log(intersections)

      if(!intersections)
        return

      let eventName = `${intersections[0].object.name}${EVENT_SUFFIX.DBL_CLICK}`
      that.emit(eventName, [intersections[0].object.name, intersections[0].point, evt])
    }, false)


    let currentlyHovered = null
    let throttleDelay = 100
    let lastMoveTimestamp = 0
    this._threeContext._renderer.domElement.addEventListener('mousemove', (evt) => {

      let now = Date.now()
      if((now - lastMoveTimestamp)<=throttleDelay){
        return
      }
      lastMoveTimestamp = now

      let intersections = that._threeContext.performRaycast({
        parent: that._container,
        emitEvent: false
      })
      // console.log(intersections)
      that._unHoverAll()

      if(!intersections){
        that.emit(`${currentlyHovered}${EVENT_SUFFIX.LEAVE}`, [currentlyHovered, evt])
        currentlyHovered = null
        return
      }



      let currentId = intersections[0].object.name

      if(currentlyHovered && currentlyHovered !== currentId){
        that.emit(`${currentlyHovered}${EVENT_SUFFIX.LEAVE}`, [currentlyHovered, evt])
      }

      currentlyHovered = currentId



      intersections[0].object.material.uniforms.hovered.value = true
      that.emit(`${currentId}${EVENT_SUFFIX.MOVE}`, [currentId, intersections[0].point, evt])

    }, false)

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
      this._collection[id].visible = true
    }
  }


  /**
   * Hide the mesh that has such id
   */
  hide(id){
    if(id in this._collection){
      this._collection[id].visible = false
    }
  }


  /**
   * NOT WORKING FOR NOW
   */
  detach(id){
    if(id in this._collection){
      // this._container
      let mesh = this._collection[id]
      this._container.remove(mesh)
    }
  }





  /**
   * Load a mesh file from a distant file, with the provided url.
   * @param {Object} position - object in shape of {x: Number, y: Number, z: Number}
   * @param {object} options - the options object
   * @param {number} options.size - size of each point (default: 1000, as the space unit is probably going to be micron)
   * @param {string} options.id - the id to attribute to the mesh once it will be part of the collection. Automatically generated if not provided
   * @param {boolean} options.makeVisible - if true, the mesh will be added and made visible once loaded. If false, it's just going to be parsed and will have to be added later using its id (default: true)
   * @param {string} options.color - the color to apply to the mesh in the format '#FFFFFF' (default: '#FFFFFF', does not apply if a material is given)
   * @param {Function} options.onDoubleClick - callback associated with doubleclicking on this pin
   * @param {Function} options.onMouseMove - callback associated with hovering this pin
   * @param {Function} options.onLeave - callback associated with no longer hovering this pin
   */
  addPin(position, options = {}){
    let that = this
    let id = 'id' in options ? options.id : Math.random().toString().split('.')[1]

    if(id in this._collection){
      return this.emit('onPinWarning', ['A pin with such id is already loaded.', id])
    }

    let makeVisible = 'makeVisible' in options ? options.makeVisible : true
    let color = 'color' in options ? options.color : '#FFFFFF'
    let size = 'size' in options ? options.size : 1000
    let constantSize = 'constantSize' in options ? options.constantSize : false

    if('onDoubleClick' in options){
      this.on(`${id}${EVENT_SUFFIX.DBL_CLICK}`, options.onDoubleClick)
    }

    if('onMouseMove' in options){
      this.on(`${id}${EVENT_SUFFIX.MOVE}`, options.onMouseMove)
    }

    if('onLeave' in options){
      this.on(`${id}${EVENT_SUFFIX.LEAVE}`, options.onLeave)
    }


    let material = that._generatePointCloudMaterial(color, size, constantSize)
    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [position.x, position.y, position.z], 3 ) )

    let pin = new THREE.Points( geometry, material )

    pin.name = id
    pin.visible = makeVisible
    that._collection[id] = pin
    that._container.add(pin)

    that.emit('onPinCreated', [pin, id])
  }


  /**
   * Add a callback to a specific pin
   * @param {string} id - the id of the pin to add a callback to
   * @param {Function} cb - the callback
   */
  addCallback(id, cb){
    if(id in this._collection){
      this.on(id, cb)
    }
  }



  /**
   *
   * TEST
   */
  addPointCloud(nbPoints=1000, size=100, color='#FF0000', constantSize=false){
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_points_sprites.html

    let axesHelper = new THREE.AxesHelper(100)
    // axesHelper.position.set(geometry.boundingSphere.center.x, geometry.boundingSphere.center.y, geometry.boundingSphere.center.z)
    this._threeContext.getScene().add(axesHelper)

    let geometry = new THREE.BufferGeometry();
    let vertices = [];
    // let textureLoader = new THREE.TextureLoader();


    for ( let i = 0; i < nbPoints; i ++ ) {
      let x = Math.random() * 10000;
      let y = Math.random() * 10000;
      let z = Math.random() * 10000;
      vertices.push( x, y, z )
    }

    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) )

    // material
    var material = this._generatePointCloudMaterial(color, size, constantSize)

    let particles = new THREE.Points( geometry, material )

    this._collection['someparticle'] = particles
    this._container.add(particles)
  }


  _generatePointCloudMaterial(color='#FFFFFF', pointSize=100, constantSize=false){
    let shader = {
      vertex: `
      uniform float size;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size ${constantSize ? '' : '* ( size / -mvPosition.z )'};
        gl_Position = projectionMatrix * mvPosition;
      }`,

      fragment: `
      uniform vec3 color;
      uniform bool hovered;

      void main() {
        vec2 uv = vec2( gl_PointCoord.x -0.5, 1.0 - gl_PointCoord.y-0.5 );
        float dFromCenter = sqrt(uv.x*uv.x + uv.y*uv.y);
        float ringStart = 0.35;
        vec3 ringColor = color * 0.5;

        if(hovered){
          ringColor = vec3(1., 1., 1.);
        }

        if(dFromCenter > 0.5){
          discard;
        }else if(dFromCenter > ringStart) {
          gl_FragColor = vec4(ringColor, 1.0);
        } else {
          gl_FragColor = vec4(color, 1.0);
        }
      }`
    }

    let uniforms = {
      size: { value: pointSize},
      hovered: { value: false },
      color: { type: "c", value: new THREE.Color(color) },
    }

    // material
    var material = new THREE.ShaderMaterial( {
      uniforms:       uniforms,
      vertexShader:   shader.vertex,
      fragmentShader: shader.fragment,
      transparent:    false,
      // blending: THREE.AdditiveBlending,
      //depthTest: false, // default: true
    })

    return material
  }


  _unHoverAll(){
    let ids = Object.keys(this._collection)
    for(let i=0; i<ids.length; i++){
      let pin = this._collection[ids[i]]
      pin.material.uniforms.hovered.value = false
    }
  }

}

export default PinCollection
