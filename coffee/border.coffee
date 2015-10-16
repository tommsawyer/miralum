define ['physicalObject'], (physicalObject) ->
	class Border extends physicalObject
		constructor: (@place, @size, @material) ->
			super(@place, @size, @material)
			@door = false
		openDoor: ->
			if @door
				#@obj.rotation.y+=0.0
			#	@obj.TranslateY(0.01)
				@obj.rotateY(0.01)
				#@showCaseGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(@size.x , @size.y , @size.z))
				@door = false if @obj.rotation.y > Math.PI / 2


