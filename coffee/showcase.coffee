define ['utils', 'border', 'physicalObject','materials'], (Utils, Border, physicalObject, Materials) ->
	class ShowCase 
		constructor: (@place, @size, @material) ->
			@borderWidth = 0.5
			@shelfs = []
			@borderMaterial = @material
			@borders = {
				'leftBorder': new Border(
					new Utils.place(@place.x - @size.x / 2, @place.y, @place.z ), 
					new Utils.size(@borderWidth, @size.y, @size.z),
					@borderMaterial),
				'rightBorder': new Border(
					new Utils.place(@place.x + @size.x / 2, @place.y, @place.z ), 
					new Utils.size(@borderWidth, @size.y, @size.z),
					@borderMaterial),
				'topBorder': new Border(
					new Utils.place(@place.x, @place.y + @size.y / 2 - @borderWidth / 2, @place.z ), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					@borderMaterial),
				'bottomBorder': new Border(
					new Utils.place(@place.x, @place.y - @size.y / 2 + @borderWidth / 2, @place.z ), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					@borderMaterial),
				'backBorder': new Border(
					new Utils.place(@place.x, @place.y, @place.z- @size.z/ 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial),
				'frontBorder': new Border(
					new Utils.place(@place.x, @place.y, @place.z+ @size.z/ 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial),
			}
			

		addToScene: (callback) ->
			 for borderName in Object.keys @borders
			 	callback @borders[borderName].obj

		addShelf: (height) ->
			@shelfs.push new Border(
					new Utils.place(@place.x,height - @size.y /2, @place.z), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					Materials.wood
				)
			console.log Materials
			return @shelfs[@shelfs.length - 1].obj