define [], ->
	Array.prototype.last = ->
		this[this.length - 1]

	Array.prototype.first = ->
		this[0]

	Number.prototype.toDegress = ->
		this * 180 / Math.PI

	Number.prototype.toRadians = ->
		Math.PI * this / 180

	Number.prototype.square = ->
		this * this
		
	class Place
		constructor: (@x, @y, @z) ->

	return {
			getObjectSize: (object) ->
				do (new THREE.Box3().setFromObject(object)).size
			getDistance: (firstPoint, secondPoint) ->
				Math.sqrt((firstPoint.x - secondPoint.x).square() + (firstPoint.y - secondPoint.y).square( ) + (firstPoint.z - secondPoint.z).square())
			place: Place,
			size: Place
	}
