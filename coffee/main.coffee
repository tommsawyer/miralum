require ['engine', 'physicalObject', 'utils', 'materials', 'showcase'], (Engine, physicalObject, Utils, Materials, ShowCase) ->
	engine = new Engine
	i = 20
	obj = new ShowCase new Utils.place(0,0,0), new Utils.size(10,60,20), Materials.glass, Materials.wood, 10, 3, Materials.panel
	engine.addToScene obj
	obj.addShelf 15
	obj.addShelf 30
	obj.addShelf 45

	obj.borders["leftBorder"].door = on

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
		height = document.getElementById('shelfHeight').value
		obj.addShelf height


	document.getElementById('addShowCase').onclick = ->
		obj = new ShowCase new Utils.place(0,0,i), new Utils.place(10,60,20), Materials.glass
		engine.addToScene obj

		obj.addShelf 15
		obj.addShelf 30
		obj.addShelf 45

		i+=20