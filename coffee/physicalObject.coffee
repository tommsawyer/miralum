define ['materials', 'dimension'], (Materials, Dimension) ->
	class PhysicalObject extends THREE.Object3D
		constructor: (@place, @size, @material) ->
			super()
			
			@dimension = null
			@showCaseGeometry = new THREE.BoxGeometry @size.x, @size.y, @size.z
			#showCaseMaterial = @material

			@.add new THREE.Mesh @showCaseGeometry, @material
			@.position.x = @place.x
			@.position.y = @place.y
			@.position.z = @place.z
		addToScene: (callback) ->
			callback @

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

		remove: ->
			@removeChildrenObject @

		toggleDimensions: ->
			unless @dimension
				@dimension = new Dimension @, 2
				@addChildrenObject @dimension
			else
				@removeChildrenObject @dimension
				@dimension = null

		click: (params) ->
			event = new CustomEvent 'click', {
				detail: params
			}
			@dispatchEvent event

		getMesh: ->
			@
			