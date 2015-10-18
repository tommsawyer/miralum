define ['utils', 'border', 'physicalObject','materials', 'dimension'], (Utils, Border, physicalObject, Materials, Dimension) ->
	class ShowCase extends physicalObject
		constructor: (@place, @size, @borderMaterial, @backBorderMaterial) ->
			@borderWidth = 0.5
			@shelfs = []
			@borders = {
				'leftBorder': new Border(
					new Utils.place(@place.x - @size.x / 2, @place.y, @place.z ), 
					new Utils.size(@borderWidth, @size.y, @size.z),
					@borderMaterial),
				'rightBorder': new Border(
					new Utils.place(@place.x + @size.x / 2, @place.y, @place.z ), 
					new Utils.size(@borderWidth, @size.y, @size.z),
					@backBorderMaterial),
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

			@mesh = new THREE.Object3D
			@mesh.add @borders[borderName].mesh for borderName in Object.keys @borders

		addToScene: (callback) ->
			 callback @mesh

		addShelf: (height) ->
			@shelfs.push new Border(
					new Utils.place(@place.x,height - @size.y /2, @place.z), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					Materials.wood
				)
			@addChildrenObject.call @, @shelfs[@shelfs.length - 1].mesh
