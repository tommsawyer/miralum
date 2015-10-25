define ['controls', 'utils', 'showcase'], (Controls, Utils, ShowCase) ->	
	class Engine extends THREE.EventDispatcher
		#
		# Public functions
		#
		constructor: () ->
			@event = new CustomEvent 'render', {
				}


			do @_initialize
			@camAngle = 0
			do @_initializeCameras
			do @_initializeSpotilights
			@_addAxes 2000

			@controls = new Controls @renderer.domElement, @

			do @run

		addToScene: (obj) =>
			if obj.addToScene instanceof Function
				obj.addEventListener 'newObject', (event) =>
					@addToScene event.detail
				obj.addEventListener 'removeObject', (event) =>
					@removeFromScene event.detail
				obj.addToScene (object) =>
					@scene.add object
				return	
			@scene.add obj

		removeFromScene: (obj) ->
			# if obj.children.length > 0
			# 	@removeFromScene child for child in obj.children

			@scene.remove obj
			console.log 'удаляю'
			console.dir obj


		nextCamera: =>
			if @currentCamera < @cameraPositions.length - 1 then @currentCamera++ else  @currentCamera = 0
			@camera.position.x = @cameraPositions[@currentCamera].x
			@camera.position.y = @cameraPositions[@currentCamera].y
			@camera.position.z = @cameraPositions[@currentCamera].z
			@camera.lookAt @scene.position

		moveCamera: (y) ->
			@camera.position.y += y
		# rotateCameraLeft: () =>				
		# 	radius = Math.pow @camera.position.x*@camera.position.x + @camera.position.y*@camera.position.y + @camera.position.z*@camera.position.z, 1/2
			
		# 	radius = Math.round(radius)
		# 	console.dir radius
		# 	@camera.position.y = 10;
		# 	@camera.position.x = radius * Math.cos(@camAngle)
		# 	@camera.position.z = radius * Math.sin(@camAngle)
		# 	console.dir 'x: ' + @camera.position.x
		# 	console.dir 'y: ' + @camera.position.y
		# 	console.dir 'z: ' + @camera.position.z
		# 	@camAngle += 10.toRadians()
		# 	@camera.lookAt(@scene.position)

		getCloserShowCase: (position) ->
			currentShowCase = null
			minDistance = null
			for showcase in @scene.children when showcase instanceof ShowCase
				if minDistance == null or minDistance > Utils.getDistance(position, showcase.place)
					currentShowCase = showcase
					minDistance = Utils.getDistance position, showcase.place
			currentShowCase

		viewObject: (object) ->
			correction = -5

			viewAngle = do (@camera.fov / 2).toRadians
			sizes = Utils.getObjectSize object
			@camera.position.z = object.position.z
			@camera.position.y = object.position.y

			@camera.position.x = object.position.x - sizes.x / 2 + correction  - (Math.cos(viewAngle) * sizes.y / 2) / Math.sin(viewAngle)
			@camera.lookAt object.position
		run: ->
			renderScene = =>
				@dispatchEvent @event
				requestAnimationFrame renderScene
				@renderer.render @scene, @camera
			do renderScene
				
		#
		# Private Functions
		#	
		_initialize: ->
			@scene = new THREE.Scene
			@renderer = new THREE.WebGLRenderer
			@renderer.setClearColor 0xEEEEEE
			@renderer.setSize document.body.clientWidth, document.body.clientHeight

			document.body.appendChild @renderer.domElement

		_initializeSpotilights: ->
			spotlight = new THREE.AmbientLight 0xffffff
			spotlight.position.set -60, 30, -10
			@scene.add spotlight
			spotlight.position.set 32, 30, 0
			@scene.add spotlight

		_initializeCameras: ->
			@cameraDistance = {
				x: 1000,
				y: 1500,
				z: 1500
			}

			@camera = new THREE.PerspectiveCamera 75, window.innerWidth / window.innerHeight, 0.1, 5000
			@camera.position.x = -@cameraDistance.x
			@camera.position.y = @cameraDistance.y
			@camera.position.z = @cameraDistance.z
			@camera.lookAt @scene.position

			@cameraPositionValues = {
				'LeftFront': new THREE.Vector3(-@cameraDistance.x, @cameraDistance.y, @cameraDistance.z),
				'Front': new THREE.Vector3(0, @cameraDistance.y, @cameraDistance.z),
				'RightFront': new THREE.Vector3(@cameraDistance.x, @cameraDistance.y, @cameraDistance.z),
			}

			@cameraPositions = [
				@cameraPositionValues.LeftFront,
				@cameraPositionValues.Front,
				@cameraPositionValues.RightFront
			]

			@currentCamera = 0

		_addAxes: (size) ->
			@axes = new THREE.AxisHelper size
			@scene.add @axes
