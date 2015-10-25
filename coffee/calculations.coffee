# все параметры в итоге должны подгружаться из конфига.
# это важно

define [], ->
	Number.prototype.toMetres = ->
		this / 1000

	class Calculations
		constructor: (configurationFile)->
		
		getGlassCost: (thickness, width, height, grinding, polishing) ->
			square = width.toMetres() * height.toMetres()
			length = width.toMetres() * height.toMetres() * 2;
			{
				square: square,
				length: length,
				cost: square * @config.glassCost + length * (@config.grindingCost + @config.polishingCost)
			}

	return new Calculations '../config/configurationTable.json'
