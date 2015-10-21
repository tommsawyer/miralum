require ['engine', 'physicalObject', 'utils', 'materials', 'showcase', 'border'], (Engine, physicalObject, Utils, Materials, ShowCase, Border) ->
	engine = new Engine
	i = 20
	obj = new ShowCase new Utils.place(0,0,0), new Utils.size(20,60,10), Materials.glass, Materials.wood, 10, 3, Materials.panel
	engine.addToScene obj
	obj.addShelf 15
	obj.addShelf 30
	obj.addShelf 45


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
			bord = new Border(new Utils.place(0,0,0), new Utils.size(10,1,20), Materials.wood)
			engine.addToScene bord
			engine.controls.createControllableObject bord, (shelf) ->
				obj.addShelf (shelf.position.y + obj.size.y / 2)

	document.getElementById('addShowCase').onclick = ->
		obj = new ShowCase new Utils.place(0,0,i), new Utils.place(10,60,20), Materials.glass
		engine.addToScene obj

		obj.addShelf 15
		obj.addShelf 30
		obj.addShelf 45

		i+=20

	document.getElementById('openDoor').onclick = ->
		do obj.borders["frontBorder"].open
	document.getElementById('closeDoor').onclick = ->
		do obj.borders["frontBorder"].close
	engine.addEventListener("render", -> do obj.borders["frontBorder"].moving)
	