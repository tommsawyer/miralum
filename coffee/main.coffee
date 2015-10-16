require ['engine', 'physicalObject', 'utils', 'materials', 'showcase'], (Engine, physicalObject, Utils, Materials, ShowCase) ->
	engine = new Engine
	i = 20
	obj = new ShowCase new Utils.place(0,0,0), new Utils.place(10,60,20), Materials.glass
	engine.addToScene obj

	engine.scene.add(obj.addShelf 15)
	engine.scene.add(obj.addShelf 30)
	engine.scene.add(obj.addShelf 45)

	obj = new ShowCase new Utils.place(0,-30,0), new Utils.place(10,10,20), Materials.wood
	engine.addToScene obj

	document.getElementById('addShowCase').onclick = ->
		obj = new ShowCase new Utils.place(0,0,i), new Utils.place(10,60,20), Materials.glass
		engine.addToScene obj

		engine.scene.add(obj.addShelf 15)
		engine.scene.add(obj.addShelf 30)
		engine.scene.add(obj.addShelf 45)

		obj = new ShowCase new Utils.place(0,-30,i), new Utils.place(10,10,20), Materials.wood
		engine.addToScene obj		
		i+=20
	
	
