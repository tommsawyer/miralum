define ['physicalObject'], (physicalObject) ->
	class Border extends physicalObject
		constructor: (@place, @size, @material) ->
			super(@place, @size, @material)
			@door = false
			@angle = 0

			# Сюда записывать ширину, в зависимости от направления
			@width = @.size.z
			
			@elementaryAngle = 2
			@radius = @width / (90 / @elementaryAngle) * (Math.PI/2)
		openDoor: ->
			if @door
				@.rotation.y-=Math.PI/180 * @elementaryAngle
				@.position.x -= @radius/2 * Math.cos(@angle)
				@.position.z -= @radius/2 * Math.sin(@angle)				
				@angle += Math.PI/180 * @elementaryAngle
				@door = false if Math.abs(@.rotation.y) > Math.PI / 2


