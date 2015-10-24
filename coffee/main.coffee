require ['engine', 'physicalObject', 'utils', 'materials', 'showcase', 'border'], (Engine, physicalObject, Utils, Materials, ShowCase, Border) ->
	engine = new Engine
	i = 20
	obj = new ShowCase new Utils.place(0,0,-5), new Utils.size(20,60,10), Materials.glass, Materials.glass, 10, 3, Materials.panel
	engine.addToScene obj
	obj.addShelf 10

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
			bord = new Border(new Utils.place(0,0,0), new Utils.size(20,1,10), Materials.wood)
			engine.addToScene bord
			engine.controls.createControllableObject bord, (shelf) ->
				obj.addShelf (shelf.position.y + obj.size.y / 2)

	document.getElementById('addShowCase').onclick = ->
		obj2 = new ShowCase new Utils.place(0,0,i), new Utils.place(10,60,20), Materials.glass
		engine.addToScene obj2
		engine.controls.createControllableObject obj2, (showcase) ->
			console.dir showcase
			engine.addToScene showcase

	document.getElementById('openDoor').onclick = ->
		do obj.borders["frontBorder"].open

	document.getElementById('closeDoor').onclick = ->
		do obj.borders["frontBorder"].close

	document.getElementById('rotateLeft').onclick = ->
		do engine.rotateCameraLeft
		
	document.getElementById('rotateRight').onclick = ->

	engine.addEventListener("render", -> do obj.borders["frontBorder"].moving)

	changeDoor = (showcaseEntity) ->
			showcaseEntity.changeDoor document.getElementById('typeDoor').value, +document.getElementById('countDoor').value
	
	document.getElementById('typeDoor').onchange = ->
		changeDoor obj

	document.getElementById('countDoor').onchange = ->
		changeDoor obj

	