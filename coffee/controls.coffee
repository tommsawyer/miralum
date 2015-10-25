define ['utils', 'interface', 'showcase'], (Utils, Interface, ShowCase) ->
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

			obj = @activeMesh.object

			while obj.parent != null
				if obj.parent instanceof ShowCase
					Interface.clickOnShowCase obj.parent
					break
				obj = obj.parent

			@activeMesh.object.parent.click event

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
				distance = - @engine.camera.position.z / dir.z
				pos = @engine.camera.position.clone().add dir.multiplyScalar(distance)

				@controllableObject.position.x = pos.x
				@controllableObject.position.y = pos.y

		createControllableObject: (object, callback) ->
			@state.activeState = 'controlObject'
			@controllableObject = object

			@addEventListener 'remove', listener = (event) ->
				callback event.detail
				@removeEventListener 'remove', listener

		removeControllableObject: =>
			event = new CustomEvent 'remove', {
				detail: @controllableObject
			}

			@dispatchEvent event

			@controllableObject.removeChildrenObject @controllableObject
			@controllableObject = null
			@state.activeState = 'waiting'
