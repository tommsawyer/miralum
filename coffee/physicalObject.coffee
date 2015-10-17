define ['materials'], (Materials) ->
	class PhysicalObject extends THREE.EventDispatcher
		constructor: (@place, @size, @material) ->
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

		getMesh: ->
			@mesh
			