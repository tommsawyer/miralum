define [], () ->
	class Controls
		constructor: (@canvas) ->
			@raycaster = new THREE.Raycaster
			@mouse = new THREE.Vector2
			@canvas.addEventListener 'mousemove', @onMouseMove, false
			@canvas.addEventListener 'mousedown', @onMouseClick, false
			@activeMesh = {
				object: null,
				material: null
			}
			@selected = null
			@material = new THREE.MeshLambertMaterial {
				color: 0x00ff00
				}	
			@blockInfo = document.getElementById('blockInfo')
			@blockName = document.getElementById('blockName')
			@blockWidth = document.getElementById('blockWidth')
			@blockHeight = document.getElementById('blockHeight')

		onMouseClick: (event) =>
			do event.preventDefault
			if @selected.length > 1
				@setActiveMesh @selected[1].object

		onMouseMove: (event) =>
			do event.preventDefault
			@mouse.x = ( event.clientX / @canvas.width ) * 2 - 1
			@mouse.y = - ( event.clientY / @canvas.height ) * 2 + 1.3

		setActiveMesh: (mesh) ->
			unless @activeMesh.object == mesh
				@activeMesh.object.material = @activeMesh.material unless @activeMesh.object == null
				@activeMesh.object = mesh
				@activeMesh.material = mesh.material
				@activeMesh.object.material = @material
				@fillBlockFields true, @activeMesh.object.type

		findIntersect: (scene, camera) ->
			@raycaster.setFromCamera @mouse, camera
			intersects = @raycaster.intersectObjects scene.children, true

			if intersects.length > 0 
				unless intersects == @selected
					@setActiveMesh intersects[0].object
					@selected = do intersects.slice
			else
				@activeMesh.object.material = @activeMesh.material unless @activeMesh.object == null
				@activeMesh.object = null
				@fillBlockFields false
				@selected = null

		fillBlockFields: (visible, name, width, height) ->
			if visible 
				@blockInfo.style.display = 'block' 
				@blockName.innerText  = name
				@blockWidth.innerHtml  = width
				@blockHeight.innerHtml = height
			else 
				@blockInfo.style.display = 'none'
