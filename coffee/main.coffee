require ['engine', 'physicalObject', 'utils', 'materials', 'showcase'], (Engine, physicalObject, Utils, Materials, ShowCase) ->
	engine = new Engine
	i = 20
	obj = new ShowCase new Utils.place(0,0,0), new Utils.place(10,60,20), Materials.glass
	engine.addToScene obj

	obj.addShelf 15
	obj.addShelf 30
	obj.addShelf 45

	obj.borders["leftBorder"].door = on

	engine.addEventListener("render", ->
			do obj.borders["leftBorder"].openDoor
		)

	document.getElementById('changeCamera').onclick = ->
		do engine.nextCamera

	document.getElementById('addShowCase').onclick = ->
		obj = new ShowCase new Utils.place(0,0,i), new Utils.place(10,60,20), Materials.glass
		engine.addToScene obj

		obj.addShelf 15
		obj.addShelf 30
		obj.addShelf 45

		i+=20