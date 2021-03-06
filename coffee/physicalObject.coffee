define ['materials', 'dimension'], (Materials, Dimension) ->
	class PhysicalObject extends THREE.Object3D
		constructor: (@place, @size, @material) ->
			super
			
			@dimension = null
			@position.x = @place.x
			@position.y = @place.y
			@position.z = @place.z

		addToScene: (callback) ->
			callback @

		addChildrenObject: (object)=>
			event = new CustomEvent 'newObject', {
				detail: object
			}
			@dispatchEvent event

		removeChildrenObject: (object) =>
			# event = new CustomEvent 'removeObject', {
			# 	detail: object
			# }
			# @dispatchEvent event
			object.parent.remove object

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
		
		bOrder: (obj) =>
			if obj.children.length > 0
				for child in obj.children
					@bOrder child
			else
				obj.renderOrder = -1