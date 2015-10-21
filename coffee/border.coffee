define ['physicalObject','engine'], (physicalObject, Engine) ->
	class Border extends physicalObject
		constructor: (@place, @size, @material, @planeName) ->
			super(@place, @size, @material)		
