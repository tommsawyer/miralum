define ['physicalObject','engine'], (physicalObject, Engine) ->
	class Border extends physicalObject
		constructor: (@place, @size, @material, @planeName) ->
			super(@place, @size, @material)	
			@showCaseGeometry = new THREE.BoxGeometry @size.x, @size.y, @size.z
			#showCaseMaterial = @material

			@add new THREE.Mesh @showCaseGeometry, @material
