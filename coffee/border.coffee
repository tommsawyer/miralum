define ['physicalObject'], (physicalObject) ->
	class Border extends physicalObject
		constructor: (@place, @size, @material) ->
			super(@place, @size, @material)
			@door = false
			@angle = 0
			@radius = 0.7
		openDoor: ->
			if @door
				@mesh.rotation.y-=Math.PI/180* 2
				@mesh.position.x -= @radius/2 * Math.cos(@angle)
				@mesh.position.z -= @radius/2 * Math.sin(@angle)
				
				@angle += Math.PI/180* 2
				@door = false if Math.abs(@mesh.rotation.y) > Math.PI / 2


