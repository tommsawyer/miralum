define [], ->	
	class Engine extends THREE.EventDispatcher
		#
		# Public functions
		#
		constructor: () ->
			do @_initialize

		#
		# Private Functions
		#	
		_initialize: ->
			@event = new CustomEvent 'render', {
				}
			@scene = new THREE.Scene
			@camera = new THREE.PerspectiveCamera 75, window.innerWidth / window.innerHeight, 0.1, 1000

			@renderer = new THREE.WebGLRenderer
			@renderer.setClearColor 0xEEEEEE
			@renderer.setSize window.innerWidth, window.innerHeight
			document.body.appendChild @renderer.domElement
			# @renderer.domElement.onclick = (event) ->
			# 	console.log event
			@camera.position.x = -30
			@camera.position.y = 40
			@camera.position.z = 30
			#@camAngle = 0;

			# document.addEventListener 'mousemove', (event) =>
			# 	@camera.rotation.x -= event.movementX / 100
			# 	@camera.rotation.y -= event.movementY / 100

			@camera.lookAt @scene.position

			@axes = new THREE.AxisHelper 20
			spotlight = new THREE.AmbientLight 0xffffff
			spotlight.position.set -30, 30, -10
			@scene.add spotlight
			spotlight.position.set 32, 30, 0
			@scene.add spotlight
			@scene.add @axes
			#@renderer.render @scene, @camera

			@cameraDistance = {
				x: 50,
				y: 50,
				z: 50
			}

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

			document.addEventListener('click', (event) =>
				do @nextCamera
				@camera.lookAt @scene.position
			)
			
			do @run

		run: ->
			renderScene = =>
				@dispatchEvent @event
				requestAnimationFrame renderScene
				@renderer.render @scene, @camera
			do renderScene

		addToScene: (obj) =>
			if obj.addToScene instanceof Function
				obj.addToScene (object) =>
					@scene.add object
				return	
			@scene.add obj

		nextCamera: =>
			if @currentCamera < @cameraPositions.length - 1 then @currentCamera++ else  @currentCamera = 0
			@camera.position.x = @cameraPositions[@currentCamera].x
			@camera.position.y = @cameraPositions[@currentCamera].y
			@camera.position.z = @cameraPositions[@currentCamera].z
				
