require ['engine', 'physicalObject', 'utils', 'materials', 'showcase', 'border', 'calculations'], (Engine, physicalObject, Utils, Materials, ShowCase, Border, Calculations) ->
	engine = new Engine
	i = 20
	obj = new ShowCase new Utils.place(0,0,0), new Utils.size(900,2050,400), Materials.glass, Materials.glass, 300, 100, Materials.panel
	engine.addToScene obj
	# obj2 = new ShowCase new Utils.place(20,0,0), new Utils.size(20,60,10), Materials.glass, Materials.glass, 10, 3, Materials.panel
	# engine.addToScene obj2
	# obj3 = new ShowCase new Utils.place(-20,0,0), new Utils.size(20,60,10), Materials.glass, Materials.glass, 10, 3, Materials.panel
	# engine.addToScene obj3

	document.getElementById('changeCamera').onclick = ->
		do engine.nextCamera
		
	document.getElementById('centerCamera').onclick = ->
		engine.viewObject obj

	document.getElementById('cameraUp').onclick = ->
		engine.moveCamera 5

	document.getElementById('cameraDown').onclick = ->
		engine.moveCamera -5

	document.getElementById('toggleDimensions').onclick = ->
		do obj.toggleDimensions

	document.getElementById('addShelf').onclick = ->
		bord = new Border(new Utils.place(0,0,0), new Utils.size(obj.size.x,10,obj.size.z), Materials.glass)
		bord.bOrder(bord)
		engine.addToScene bord
		engine.controls.createControllableObject bord, (shelf) ->
			showcase = engine.getCloserShowCase(bord.position)
			showcase.addShelf(shelf.position.y + obj.size.y / 2)

	document.getElementById('rotateLeft').onclick = ->
		engine.rotateCamera -5
		
	document.getElementById('rotateRight').onclick = ->

	engine.addEventListener("render", -> do obj.borders["frontBorder"].moving)
	engine.addEventListener("render", -> do obj.storageStands.topStorage["frontBorder"].moving)
	engine.addEventListener("render", -> do obj.storageStands.bottomStorage["frontBorder"].moving)
	# engine.addEventListener("render", -> do obj2.borders["frontBorder"].moving)
	# engine.addEventListener("render", -> do obj3.borders["frontBorder"].moving)
	console.dir obj.getParts()