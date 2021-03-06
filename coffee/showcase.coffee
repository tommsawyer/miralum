define ['utils', 'border', 'physicalObject','materials', 'dimension', 'door'], (Utils, Border, physicalObject, Materials, Dimension, Door) ->
	class ShowCase extends physicalObject
		constructor: (@place, @size, @borderMaterial, @backBorderMaterial, @bottomStorageHeigth, @topStorageHeight, @storageMaterial) ->
			super
			@borderWidth = 0.5
			@shelfs = []
			@borders = {
				'leftBorder': new Border(
				 	new Utils.place(- @size.x / 2 + @borderWidth / 2, 0, 0), 
				 	new Utils.size(@borderWidth, @size.y, @size.z),
				 	@borderMaterial,
				 	"yz"),
				'rightBorder': new Border(
					new Utils.place(@size.x / 2 - @borderWidth / 2, 0, 0), 
					new Utils.size(@borderWidth, @size.y, @size.z),
					@borderMaterial,
					"yz"),
				'backBorder': new Border(
					new Utils.place(0, 0,- @size.z/ 2 + @borderWidth / 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@backBorderMaterial,
					"xy"),
				'frontBorder': new Door(
					new Utils.place(0, 0, @size.z/ 2 - @borderWidth / 2), 
					new Utils.size(@size.x, @size.y, @borderWidth),
					@borderMaterial,
					"xy",
					"Left",
					"slide",
					false),
			}

			@bottomStoragePlace = new Utils.place 0, - @size.y / 2 - @bottomStorageHeigth/2, 0
			@topStoragePlace = new Utils.place 0, 0 + @size.y / 2 + @topStorageHeight / 2, 0
			# Накопители
			@storageStands = {
				'bottomStorage': {
					'leftBorder': new Border(
							new Utils.place(@bottomStoragePlace.x - @size.x / 2  + @borderWidth / 2, @bottomStoragePlace.y, @bottomStoragePlace.z), 
							new Utils.size(@borderWidth, @bottomStorageHeigth, @size.z),
							@storageMaterial,
							"yz"
						),
					'rightBorder': new Border(
							new Utils.place(@bottomStoragePlace.x + @size.x / 2 - @borderWidth / 2, @bottomStoragePlace.y, @bottomStoragePlace.z), 
							new Utils.size(@borderWidth, @bottomStorageHeigth, @size.z),
							@storageMaterial,
							"yz"
						),
					'backBorder': new Border(
							new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y, @bottomStoragePlace.z - @size.z / 2 + @borderWidth / 2), 
							new Utils.size(@size.x, @bottomStorageHeigth, @borderWidth),
							@storageMaterial,
							"xy"
						),
					'frontBorder': new Door(
							new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y, @bottomStoragePlace.z + @size.z / 2 - @borderWidth / 2), 
							new Utils.size(@size.x, @bottomStorageHeigth, @borderWidth),
							@storageMaterial,
							"xy",
							"Left",
							"border",
							false
						),
					'bottomBorder': new Border(
					 		new Utils.place(@bottomStoragePlace.x, @bottomStoragePlace.y - @bottomStorageHeigth / 2 + @borderWidth / 2, @bottomStoragePlace.z), 
							new Utils.size(@size.x, @borderWidth, @size.z),
							@storageMaterial,
							"xz"
						),				
					},
				'topStorage': {
					'leftBorder': new Border(
							new Utils.place(@topStoragePlace.x - @size.x / 2 + @borderWidth / 2, @topStoragePlace.y, @topStoragePlace.z), 
							new Utils.size(@borderWidth, @topStorageHeight, @size.z),
							@storageMaterial,
							"yz"
						),
					'rightBorder': new Border(
							new Utils.place(@topStoragePlace.x + @size.x / 2 - @borderWidth / 2, @topStoragePlace.y, @topStoragePlace.z), 
							new Utils.size(@borderWidth, @topStorageHeight, @size.z),
							@storageMaterial,
							"yz"
						),
					'backBorder': new Border(
							new Utils.place(@topStoragePlace.x, @topStoragePlace.y, @topStoragePlace.z - @size.z / 2 + @borderWidth / 2), 
							new Utils.size(@size.x, @topStorageHeight, @borderWidth),
							@storageMaterial,
							"xy"
						),
					'frontBorder': new Door(
							new Utils.place(@topStoragePlace.x, @topStoragePlace.y, @topStoragePlace.z + @size.z / 2 - @borderWidth / 2), 
							new Utils.size(@size.x, @topStorageHeight, @borderWidth),
							@storageMaterial,
							"xy",
							"Left",
							"border",
							false
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
				depth = 10
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
										placeX -= kx * width / 2
										placeY -= ky * width / 2		
									when "xz" 
										if ky == 0 then continue
										if Math.abs(kx) + Math.abs(kz) != 1 then continue
										sizeX = if kz != 0 then border.size.x else width
										sizeY = depth
										sizeZ = if kx != 0 then border.size.z else width
										placeX -= kx * width / 2
										placeZ -= kz * width / 2
									when "yz" 
										if kx == 0 then continue
										if Math.abs(ky) + Math.abs(kz) != 1 then continue
										sizeX = depth
										sizeY = if kz != 0 then border.size.y else width
										sizeZ = if ky != 0 then border.size.z else width
										placeY -= ky * width / 2
										placeZ -= kz * width / 2
								borderWinding.add new Border(
							 		new Utils.place(placeX, placeY, placeZ), 
									new Utils.size(sizeX, sizeY, sizeZ),
									Materials.winding
								);
				return borderWinding

			@add @borders[borderName] for borderName in Object.keys @borders
			@add @storageStands[storageName][ind2] for ind2 in Object.keys @storageStands[storageName] for storageName in Object.keys @storageStands
			#@add winding @borders["leftBorder"], 1
			windingWidth = 10
			@add winding @borders[borderName], windingWidth for borderName in Object.keys @borders
			@add winding @storageStands[storageName][ind2], windingWidth for ind2 in Object.keys @storageStands[storageName] for storageName in Object.keys @storageStands

		changeDoor: (doorContainer, type, isDouble) =>
			switch doorContainer
				when "border" 
					container = @borders
				when "storageTop" 
					container = @storageStands.topStorage
					if container.size.y < 600
						return
				when "storageBottom" 
					container = @storageStands.bottomStorage
					if container.size.y < 600
						return
			borderPlace = new THREE.Vector3(container.frontBorder.place.x, container.frontBorder.place.y, container.frontBorder.place.z)
			borderSize = new THREE.Vector3(container.frontBorder.size.x, container.frontBorder.size.y, container.frontBorder.size.z)
			doorMaterial = container.frontBorder.material
			@removeChildrenObject container.frontBorder
			container.frontBorder = new Door(
					new Utils.place(borderPlace.x, borderPlace.y, borderPlace.z), 
					new Utils.size(borderSize.x, borderSize.y, @borderWidth),
					doorMaterial,
					"xy",
					"Left",
					type,
					isDouble)
			@add container.frontBorder

		changeSize: (size) =>
			@removeChildrenObject @
			@addChildrenObject new ShowCase(
				new Utils.place(@place.x, @place.y + size.y - @size.y, @place.z), 
				size, @borderMaterial, @backBorderMaterial, @bottomStorageHeigth, @topStorageHeight, @storageMaterial)

		changeBorderMaterial: (material) =>
			@borderMaterial = material
			for borderName in Object.keys(@borders)
				for mesh in @borders[borderName].children
					mesh.material = material


		changeBorderThickness: (thickness) =>
			scale = thickness / @borderWidth
			
			for borderName in Object.keys(@borders)
				for mesh in @borders[borderName].children
					size = Utils.getObjectSize mesh
					for axis in ['x', 'y', 'z']
						mesh.scale[axis] = scale if size[axis] == @borderWidth 

			for storageType in Object.keys(@storageStands)
				for storageName in Object.keys(@storageStands[storageType])
					for mesh in @storageStands[storageType][storageName].children
						size = Utils.getObjectSize mesh
						for axis in ['x', 'y', 'z']
							mesh.scale[axis] = scale if size[axis] == @borderWidth 


		addShelf: (height) ->
			height = Math.min(Math.max(0, height), @size.y - @topStorageHeight)
			@shelfs.push new Border(
					new Utils.place(@place.x, @place.y + height - @size.y /2, @place.z), 
					new Utils.size(@size.x, @borderWidth, @size.z),
					Materials.glass
				)
			@bOrder @shelfs.last()
			@addChildrenObject.call @, @shelfs.last()

		addPart:(arg) ->
			for in arg
				arrParts.push config[arg]

		getParts: ->
			details = []
			console.log @children
			details.push @borders[border].getParts() for border in Object.keys(@borders)
			details.push shelf.getParts() for shelf in @shelfs
			details
