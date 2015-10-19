define [], ->
	Array.prototype.last = ->
		this[this.length - 1]

	Array.prototype.first = ->
		this[0]

	Number.prototype.toDegress = ->
		this * 180 / Math.PI

	Number.prototype.toRadians = ->
		Math.PI * this / 180
		
	class Place
		constructor: (@x, @y, @z) ->

	return {
			place: Place,
			size: Place
	}
