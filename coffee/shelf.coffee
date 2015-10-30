define ['border'], (Border) ->
	class Shelf extends Border
		constructor: (@place, @size, @material) ->
			super @place, @size, @material, 'xz'
