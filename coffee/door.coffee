define ['physicalObject','engine', 'border'], (physicalObject, Engine, Border) ->
	class Door extends Border
		constructor: (@place, @size, @material, @planeName, @openingDirection, @openingType) ->
			super(@place, @size, @material, @planeName)
			engine = new Engine
			@door = on
			#engine.addEventListener("render", (e) => open(e))
			@angle = 0

			# @doorState = {
			# 	"open": 
			# 	"opening": 
			# 	"closing":
			# 	"close":
			# }
			#@door = off
			# Сюда записывать ширину, в зависимости от направления
			@width = @.size.x
			@elementaryAngle = 2
			@radius = @width / (90 / @elementaryAngle) * (Math.PI/2)

		open: ->
			#alert(1)
			if @door
				# funcX = if @openingDirection == "Left" then Math.sin(@angle) else Math.cos(@angle)
				# funcZ = if @openingDirection == "Left" then Math.cos(@angle) else Math.sin(@angle)
				# deltaX = (@radius/2 * funcX) * if @planeName
				# deltaZ = 

				if @openingDirection == "Left"
					ky = -1
					funcX = Math.sin(@angle)
					funcZ = Math.cos(@angle)
					deltaX = -1
					deltaZ = 1
				else
					ky = 1
					funcX = Math.cos(@angle)
					funcZ = Math.sin(@angle)
					deltaX = 1
					deltaZ = 1
				if @openingType == "slide"
					ky = 0
					deltaZ = 0
					deltaX *= 2

				@.rotation.y += (Math.PI/180 * @elementaryAngle) * ky
				@.position.x += deltaX * (@radius/2 * funcX)
				@.position.z += deltaZ * (@radius/2 * funcZ)
				@angle += Math.PI/180 * @elementaryAngle
				#@door = false if Math.abs(@.rotation.y) > Math.PI / 2
				@door = false if Math.abs(@angle) > Math.PI / 2

		close: ->
			#alert(2)