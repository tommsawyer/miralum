define ['utils', 'border', 'physicalObject','materials', 'dimension'], (Utils, Border, physicalObject, Materials, Dimension) ->
	class ShowCase extends physicalObject
		constructor: (@place, @size, @borderMaterial, @backBorderMaterial, @bottomStorageHeigth, @topStorageHeight, @storageMaterial) ->
			super(@place, @size, @borderMaterial)
			@borderWidth = 0.5
			@shelfs = []
			@borders = {
				# 'leftBorder': new Border(
				# 	new Utils.place(@place.x - @size.x / 2, @place.y, @place.z ), 
				# 	new Utils.size(@borderWidth, @size.y, @size.z),
				# 	@borderMaterial,
				# 	"yz"),
				'rightBorder': new Border(
					new Utils.place(@place.x + @size.x / 2, @place.y, @place.z ), 
					new Utils.size(@borderWidth, @size.y, @size.z),
					@backBorderMaterial,
					"yz"),
				'backBorder': new Border(
					new Utils.place(@place.x, @place.y, @place.z- @size.z/ 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial,
					"xy"),
				'frontBorder': new Border(
					new Utils.place(@place.x, @place.y, @place.z+ @size.z/ 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial,
					"xy"),
			}

			@bottomStoragePlace = new Utils.place @place.x, @place.y - @size.y / 2 - @bottomStorageHeigth/2, @place.z
			@topStoragePlace = new Utils.place @place.x, @place.y + @size.y / 2 + @topStorageHeight / 2, @place.z
			# Накопители
			@storageStands = {
				'bottomStorage': {
					'leftBorder': new Border(
							new Utils.place(@bottomStoragePlace.x - @size.x / 2, @bottomStoragePlace.y, @bottomStoragePlace.z), 
							new Utils.size(@borderWidth, @bottomStorageHeigth, @size.z),
							@storageMaterial,
							"yz"
						),
					'rightBorder': new Border(
							new Utils.place(@bottomStoragePlace.x + @size.x / 2, @bottomStoragePlace.y, @bottomStoragePlace.z), 
							new Utils.size(@borderWidth, @bottomStorageHeigth, @size.z),
							@storageMaterial,
							"yz"
						),
					'backBorder': new Border(
							new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y, @bottomStoragePlace.z - @size.z / 2), 
							new Utils.size(@size.x, @bottomStorageHeigth, @borderWidth),
							@storageMaterial,
							"xy"
						),
					'frontBorder': new Border(
							new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y, @bottomStoragePlace.z + @size.z / 2), 
							new Utils.size(@size.x, @bottomStorageHeigth, @borderWidth),
							@storageMaterial,
							"xy"
						),
					'bottomBorder': new Border(
					 		new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y - @bottomStorageHeigth / 2, @bottomStoragePlace.z), 
							new Utils.size(@size.x, @borderWidth, @size.z),
							@storageMaterial,
							"xz"
						),				
					},
				'topStorage': {
					'leftBorder': new Border(
							new Utils.place(@topStoragePlace.x - @size.x / 2, @topStoragePlace.y, @topStoragePlace.z), 
							new Utils.size(@borderWidth, @topStorageHeight, @size.z),
							@storageMaterial,
							"yz"
						),
					'rightBorder': new Border(
							new Utils.place(@topStoragePlace.x + @size.x / 2, @topStoragePlace.y, @topStoragePlace.z), 
							new Utils.size(@borderWidth, @topStorageHeight, @size.z),
							@storageMaterial,
							"yz"
						),
					'backBorder': new Border(
							new Utils.place(@topStoragePlace.x, @topStoragePlace.y, @topStoragePlace.z - @size.z / 2), 
							new Utils.size(@size.x, @topStorageHeight, @borderWidth),
							@storageMaterial,
							"xy"
						),
					'frontBorder': new Border(
							new Utils.place(@topStoragePlace.x, @topStoragePlace.y, @topStoragePlace.z + @size.z / 2), 
							new Utils.size(@size.x, @topStorageHeight, @borderWidth),
							@storageMaterial,
							"xy"
						),
					'topBorder': new Border(
					 		new Utils.place(@topStoragePlace.x, @topStoragePlace.y + @topStorageHeight / 2 - @borderWidth / 2, @topStoragePlace.z), 
							new Utils.size(@size.x, @borderWidth, @size.z),
							@storageMaterial,
							"xz"
						),
						
					}
			}

			# Обмотка краев
			winding = (border, width) =>
				borderWinding = new THREE.Object3D
				depth = 0.1
				for kx in [-1..1]
					for ky in [-1..1]
						for kz in [-1..1]
							# Если смещение только по 2 осям
							if Math.abs(kx) + Math.abs(ky) + Math.abs(kz) == 2
								placeX = border.place.x + kx * border.size.x / 2
								placeY = border.place.y + ky * border.size.y / 2
								placeZ = border.place.z + kz * border.size.z / 2
								switch border.planeName
									when "xy"
										if kz == 0 then continue
										if Math.abs(kx) + Math.abs(ky) != 1 then continue
										sizeX = if ky != 0 then border.size.x else width
										sizeY = if kx != 0 then border.size.y else width
										sizeZ = depth
									when "xz" 
										if ky == 0 then continue
										if Math.abs(kx) + Math.abs(kz) != 1 then continue
										sizeX = if kz != 0 then border.size.x else width
										sizeY = depth
										sizeZ = if kx != 0 then border.size.z else width
									when "yz" 
										if kx == 0 then continue
										if Math.abs(ky) + Math.abs(kz) != 1 then continue
										sizeX = depth
										sizeY = if kz != 0 then border.size.y else width
										sizeZ = if ky != 0 then border.size.z else width
								borderWinding.add new Border(
							 		new Utils.place(placeX, placeY, placeZ), 
									new Utils.size(sizeX, sizeY, sizeZ),
									Materials.winding
								);
				return borderWinding

			@add @borders[borderName] for borderName in Object.keys @borders
			@add @storageStands[storageName][ind2] for ind2 in Object.keys @storageStands[storageName] for storageName in Object.keys @storageStands
			#@add winding @borders["leftBorder"], 1
			@add winding @borders[borderName], 1 for borderName in Object.keys @borders
			@add winding @storageStands[storageName][ind2], 1 for ind2 in Object.keys @storageStands[storageName] for storageName in Object.keys @storageStands

		addToScene: (callback) ->
			 callback @

		addShelf: (height) ->
			@shelfs.push new Border(
					new Utils.place(@place.x,height - @size.y /2, @place.z), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					Materials.wood
				)
			@addChildrenObject.call @, @shelfs[@shelfs.length - 1]
