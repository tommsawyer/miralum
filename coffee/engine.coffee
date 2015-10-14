define [], ->	
	class Engine
		#
		# Public functions
		#
		constructor: (@canvas) ->
			do @_initialize

		#
		# Private Functions
		#	
		_initialize: ->
			console.log 'init'
