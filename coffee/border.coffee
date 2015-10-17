define ['physicalObject'], (physicalObject) ->
	class Border extends physicalObject
		constructor: (@place, @size, @material) ->
			super(@place, @size, @material)
			@door = false
			@angle = 0
			@radius = 0.7
		openDoor: ->
			if @door
				@obj.rotation.y-=Math.PI/180* 2

				@obj.position.x -= @radius/2 * Math.cos(@angle)
				@obj.position.z -= @radius/2 * Math.sin(@angle)
				@angle += Math.PI/180* 2
				#@showCaseGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(@size.x , @size.y , @size.z))
				@door = false if Math.abs(@obj.rotation.y) > Math.PI / 2


