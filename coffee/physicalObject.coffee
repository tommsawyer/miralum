define ['materials'], (Materials) ->
	class PhysicalObject extends THREE.EventDispatcher
		constructor: (@place, @size, @material) ->
			@showCaseGeometry = new THREE.BoxGeometry @size.x, @size.y, @size.z
			showCaseMaterial = @material
			@obj = new THREE.Mesh @showCaseGeometry, showCaseMaterial
			@obj.position.x = @place.x
			@obj.position.y = @place.y
			@obj.position.z = @place.z
		addToScene: (callback) ->
			do callback @obj
			