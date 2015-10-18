define ['materials', 'dimension'], (Materials, Dimension) ->
	class PhysicalObject extends THREE.EventDispatcher
		constructor: (@place, @size, @material) ->
			@dimension = null
			@showCaseGeometry = new THREE.BoxGeometry @size.x, @size.y, @size.z
			showCaseMaterial = @material

			@mesh = new THREE.Mesh @showCaseGeometry, showCaseMaterial
			@mesh.position.x = @place.x
			@mesh.position.y = @place.y
			@mesh.position.z = @place.z
		addToScene: (callback) ->
			do callback @mesh

		addChildrenObject: (object)=>
			event = new CustomEvent 'newObject', {
				detail: object
			}
			@dispatchEvent event
		removeChildrenObject: (object) =>
			event = new CustomEvent 'removeObject', {
				detail: object
			}
			@dispatchEvent event
		toggleDimensions: ->
			unless @dimension
				@dimension = new Dimension @mesh, 2
				@addChildrenObject @dimension.mesh
			else
				@removeChildrenObject @dimension.mesh
				@dimension = null

		getMesh: ->
			@mesh
			