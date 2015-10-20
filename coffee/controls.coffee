define ['utils'], (Utils) ->
	class Controls
		constructor: (@canvas, @engine) ->
			@raycaster = new THREE.Raycaster
			@mouse = new THREE.Vector2
			@canvas.addEventListener 'mousemove', @onMouseMove, false
			@canvas.addEventListener 'mousedown', @onMouseClick, false
			@activeMesh = {
				object: null,
				material: null
			}
			@material = new THREE.MeshLambertMaterial {
				color: 0x00ff00
				}	

			@blockInfo = document.getElementById('blockInfo')
			@blockName = document.getElementById('blockName')
			@blockWidth = document.getElementById('blockWidth')
			@blockHeight = document.getElementById('blockHeight')

		onMouseClick: (event) =>
			@activeMesh.object.parent.click event unless @activeMesh.object == null
			@engine.viewObject @activeMesh.object.parent

		onMouseMove: (event) =>
			do event.preventDefault
			@mouse.x = ( event.clientX / @canvas.width ) * 2 - 1
			@mouse.y = - ( event.clientY / @canvas.height ) * 2 + 1.3

		setActiveMesh: (mesh) ->
			unless @activeMesh.object == mesh && @activeMesh.object != null
				@activeMesh.object.material = @activeMesh.material unless @activeMesh.object == null
				@activeMesh.object = mesh
				@activeMesh.material = mesh.material
				@activeMesh.object.material = @material
				sizes = Utils.getObjectSize @activeMesh.object
				@fillBlockFields true, @activeMesh.object.type, sizes.x, sizes.y

		findIntersect: (scene, camera) ->
			@raycaster.setFromCamera @mouse, camera
			intersects = @raycaster.intersectObjects scene.children, true

			if intersects.length > 0 
				unless intersects.first() == @activeMesh.object
					@setActiveMesh intersects.first().object 
			else
				@activeMesh.object.material = @activeMesh.material unless @activeMesh.object == null
				@activeMesh.object = null
				@fillBlockFields false
				@selected = null

		fillBlockFields: (visible, name, width, height) ->
			if visible 
				@blockInfo.style.display = 'block' 
				@blockName.innerText  = name
				@blockWidth.innerText  = width
				@blockHeight.innerText = height
			else 
				@blockInfo.style.display = 'none'
