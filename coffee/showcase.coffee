define ['utils', 'border', 'physicalObject','materials', 'dimension'], (Utils, Border, physicalObject, Materials, Dimension) ->
	class ShowCase extends physicalObject
		constructor: (@place, @size, @borderMaterial, @backBorderMaterial, @bottomStorageHeigth, @topStorageHeight, @storageMaterial) ->
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
				'backBorder': new Border(
					new Utils.place(@place.x, @place.y, @place.z- @size.z/ 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial),
				'frontBorder': new Border(
					new Utils.place(@place.x, @place.y, @place.z+ @size.z/ 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial),
			}

			@bottomStoragePlace = new Utils.place @place.x, @place.y - @size.y / 2 - @bottomStorageHeigth/2, @place.z
			@topStoragePlace = new Utils.place @place.x, @place.y + @size.y / 2 + @topStorageHeight / 2, @place.z
			# Накопители
			@storageStands = {
				'bottomStorage': {
					'leftBorder': new Border(
							new Utils.place(@bottomStoragePlace.x - @size.x / 2, @bottomStoragePlace.y, @bottomStoragePlace.z), 
							new Utils.size(@borderWidth, @bottomStorageHeigth, @size.z),
							@storageMaterial
						),
					'rightBorder': new Border(
							new Utils.place(@bottomStoragePlace.x + @size.x / 2, @bottomStoragePlace.y, @bottomStoragePlace.z), 
							new Utils.size(@borderWidth, @bottomStorageHeigth, @size.z),
							@storageMaterial
						),
					'backBorder': new Border(
							new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y, @bottomStoragePlace.z - @size.z / 2), 
							new Utils.size(@size.x, @bottomStorageHeigth, @borderWidth),
							@storageMaterial
						),
					'frontBorder': new Border(
							new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y, @bottomStoragePlace.z + @size.z / 2), 
							new Utils.size(@size.x, @bottomStorageHeigth, @borderWidth),
							@storageMaterial
						),
					'bottomBorder': new Border(
					 		new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y - @bottomStorageHeigth / 2, @bottomStoragePlace.z), 
							new Utils.size(@size.x, @borderWidth, @size.z),
							@storageMaterial
						),				
					},
				'topStorage': {
					'leftBorder': new Border(
							new Utils.place(@topStoragePlace.x - @size.x / 2, @topStoragePlace.y, @topStoragePlace.z), 
							new Utils.size(@borderWidth, @topStorageHeight, @size.z),
							@storageMaterial
						),
					'rightBorder': new Border(
							new Utils.place(@topStoragePlace.x + @size.x / 2, @topStoragePlace.y, @topStoragePlace.z), 
							new Utils.size(@borderWidth, @topStorageHeight, @size.z),
							@storageMaterial
						),
					'backBorder': new Border(
							new Utils.place(@topStoragePlace.x, @topStoragePlace.y, @topStoragePlace.z - @size.z / 2), 
							new Utils.size(@size.x, @topStorageHeight, @borderWidth),
							@storageMaterial
						),
					'frontBorder': new Border(
							new Utils.place(@topStoragePlace.x, @topStoragePlace.y, @topStoragePlace.z + @size.z / 2), 
							new Utils.size(@size.x, @topStorageHeight, @borderWidth),
							@storageMaterial
						),
					'topBorder': new Border(
					 		new Utils.place(@topStoragePlace.x, @topStoragePlace.y + @topStorageHeight / 2 - @borderWidth / 2, @topStoragePlace.z), 
							new Utils.size(@size.x, @borderWidth, @size.z),
							@storageMaterial
						),
						
					}
			}

			@mesh = new THREE.Object3D
			@mesh.add @borders[borderName].mesh for borderName in Object.keys @borders
			@mesh.add @storageStands[storageName][ind2].mesh for ind2 in Object.keys @storageStands[storageName] for storageName in Object.keys @storageStands

		addToScene: (callback) ->
			 callback @mesh

		addShelf: (height) ->
			@shelfs.push new Border(
					new Utils.place(@place.x,height - @size.y /2, @place.z), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					Materials.wood
				)
			@addChildrenObject.call @, @shelfs[@shelfs.length - 1].mesh
