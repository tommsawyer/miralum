define ['physicalObject', 'border', 'utils'], (physicalObject, Border, Utils) ->
	class Door extends Border
		constructor: (@place, @size, @material, @planeName, @openingDirection, @openingType, @isDouble = false) ->
			
			@doorState = {
				"opened",
				"opening", 
				"closing",
				"closed"
			}

			if @isDouble
				@obj = new THREE.Object3D
				rightFlapPlace = new Utils.place @place.x + @size.x / 4, @place.y, @place.z
				rightFlapSize = new Utils.size @size.x / 2, @size.y, @size.z
				rightFlapOpeningDirection = "Right"
				rightFlap = new Door rightFlapPlace, rightFlapSize, @material, @planeName, rightFlapOpeningDirection, @openingType

				@place.x -= @size.x / 4
				@size.x /= 2
				@openingDirection = "Left"
				leftFlap = new Door @place, @size, @material, @planeName, "Left", @openingType
				@obj.add rightFlap
				@obj.add leftFlap
				@obj.place = @place
				@obj.size = @size
				@obj.moving = @moving
				@obj.open = @open
				@obj.close = @close
				@obj.doorState = @doorState
				@obj.isDouble = @isDouble
				return	@obj
			else
				super(@place, @size, @material, @planeName)
				@angle = 0
				@currentState = @doorState.closed
				@width = @.size.x
				@elementaryAngle = 2
				@radius = @width / (90 / @elementaryAngle) * (Math.PI/2)
				@renderOrder = 10


		open: ->
			if @isDouble
				for item in @.children
					if item.currentState == item.doorState.closed
						item.currentState = item.doorState.opening
			if @currentState == @doorState.closed
				@currentState = @doorState.opening

		close: ->
			if @isDouble
				for item in @.children
					if item.currentState == item.doorState.opened
						item.currentState = item.doorState.closing
			if @currentState == @doorState.opened
				@currentState = @doorState.closing

		moving: ->
			if @isDouble
				do item.moving for item in @.children
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
	
		getParts: ->
			{
				size: @size,
				material: @material,
				isDouble: @isDouble,
				type: @openingType
		}
