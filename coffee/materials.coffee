define [], ->
	glassTexture = THREE.ImageUtils.loadTexture  '../img/blueGlass.jpg', undefined
	glassTexture.minFilter = THREE.LinearFilter
	woodTexture = THREE.ImageUtils.loadTexture  '../img/wood.jpg', undefined
	woodTexture.minFilter = THREE.LinearFilter
	panelTexture = THREE.ImageUtils.loadTexture  '../img/pan.jpg', undefined
	panelTexture.minFilter = THREE.LinearFilter
	{
		'glass' :  new THREE.MeshLambertMaterial({
			map: glassTexture,
			opacity: 0.3,
			transparent: on,
		}),
		'panel' :  new THREE.MeshLambertMaterial({
			map: panelTexture,
		}),
		'wood' :  new THREE.MeshLambertMaterial({
			map: woodTexture,
		}),
		'line': new THREE.LineBasicMaterial({
			color: 0x000000
		}),
		'winding': new THREE.MeshLambertMaterial({
			color: 0xffffff,
			#wireframe: true
			#map: panelTexture
		}),
	}