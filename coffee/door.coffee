define ['physicalObject', 'border'], (physicalObject, Border) ->
	class Door extends Border
		constructor: (@place, @size, @material, @planeName, @openingDirection, @openingType) ->
			super(@place, @size, @material, @planeName)
			@angle = 0

			@doorState = {
				"opened",
				"opening", 
				"closing",
				"closed"
			}

			@currentState = @doorState.closed
			@width = @.size.x
			@elementaryAngle = 2
			@radius = @width / (90 / @elementaryAngle) * (Math.PI/2)

		open: ->
			if @currentState == @doorState.closed
				@currentState = @doorState.opening

		close: ->
			if @currentState == @doorState.opened
				@currentState = @doorState.closing

		moving: ->
			if @currentState == @doorState.opening or @currentState == @doorState.closing
				funcX = Math.sin(@angle)
				funcZ = Math.cos(@angle)
				deltaZ = 1

				if @openingDirection == "Left"
					ky = -1
					deltaX = -1
				else
					ky = 1
					deltaX = 1
					
				if @currentState == @doorState.closing and @openingType == "swing"
					ky*=-1
					deltaZ*=-1
					deltaX*=-1
					funcX = Math.cos(@angle)
					funcZ = Math.sin(@angle)

				if @openingType == "slide"
					ky = 0
					deltaZ = 0
					deltaX *= if @currentState == @doorState.opening then 2 else -2

				@.rotation.y += (Math.PI/180 * @elementaryAngle) * ky
				@.position.x += deltaX * (@radius/2 * funcX)
				@.position.z += deltaZ * (@radius/2 * funcZ)
				@angle += Math.PI/180 * @elementaryAngle
			
				if @currentState == @doorState.opening
					if Math.abs(@angle) >= Math.PI / 2
						@angle = 0
						@currentState = @doorState.opened
				else
					if Math.abs(@angle) >= Math.PI / 2
						@angle = 0
						@currentState = @doorState.closed
	