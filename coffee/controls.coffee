define ['utils', 'interface'], (Utils, Interface) ->
	class Controls extends THREE.EventDispatcher
		constructor: (@canvas, @engine) ->
			@raycaster = new THREE.Raycaster
			@canvas.addEventListener 'mousemove', @onMouseMove, false
			@canvas.addEventListener 'mousedown', @onMouseClick, false
			@mouse = new THREE.Vector3

			@state = {
				activeState: 'waiting',
				waiting: {
					mouseMove: @findIntersect,
					mouseClick: @clickOnObject,
				},
				controlObject: {
					mouseMove: @moveControllableObject,
					mouseClick: @removeControllableObject,
				}
			}

			@controllableObject = null

			@activeMesh = {
				object: null,
				material: null
			}
			@material = new THREE.MeshLambertMaterial {
				color: 0x00ff00,
				transparent: true,
				opacity: 0.3
				}	

		onMouseClick: (event) =>
			do @state[@state.activeState].mouseClick

		onMouseMove: (event) =>
			do event.preventDefault

			@mouse.x = ( event.clientX / @canvas.width ) * 2 - 1
			@mouse.y = - ( event.clientY / @canvas.height ) * 2 + 1.3

			do @state[@state.activeState].mouseMove

		setActiveMesh: (mesh) ->
			unless @activeMesh.object == mesh && @activeMesh.object != null
				@activeMesh.object.material = @activeMesh.material unless @activeMesh.object == null
				@activeMesh.object = mesh
				@activeMesh.material = mesh.material
				@activeMesh.object.material = @material

		clickOnObject: =>
			if @activeMesh.object == null
				Interface.fillBlockFields false
				return

			sizes = Utils.getObjectSize @activeMesh.object
			Interface.fillBlockFields true, @activeMesh.object.type, sizes.x, sizes.y
			@activeMesh.object.parent.click event
			@engine.viewObject @activeMesh.object.parent

		findIntersect: =>
			@raycaster.setFromCamera @mouse, @engine.camera
			intersects = @raycaster.intersectObjects @engine.scene.children, true

			if intersects.length > 0 
				unless intersects.first() == @activeMesh.object
					@setActiveMesh intersects.first().object 
			else
				@activeMesh.object.material = @activeMesh.material unless @activeMesh.object == null
				@activeMesh.object = null

		moveControllableObject: =>
			if @controllableObject
				vector = @mouse.unproject @engine.camera
				dir = do vector.sub(@engine.camera.position).normalize
				distance = - @engine.camera.position.x / dir.x
				pos = @engine.camera.position.clone().add dir.multiplyScalar(distance)

				@controllableObject.position.z = pos.z
				@controllableObject.position.y = pos.y

		createControllableObject: (object, callback) ->
			@state.activeState = 'controlObject'
			@controllableObject = object

			@addEventListener 'remove', (event) ->
				callback event.detail

		removeControllableObject: =>
			event = new CustomEvent 'remove', {
				detail: @controllableObject
			}

			@dispatchEvent event

			do @controllableObject.remove
			@controllableObject = null
			@state.activeState = 'waiting'
