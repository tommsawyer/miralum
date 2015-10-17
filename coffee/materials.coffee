define ['engine'], (Engine) ->
	glassTexture = THREE.ImageUtils.loadTexture  '../img/glass.jpg', undefined, Engine.renderer
	glassTexture.minFilter = THREE.LinearFilter
	woodTexture = THREE.ImageUtils.loadTexture  '../img/wood.jpg', undefined, Engine.renderer
	woodTexture.minFilter = THREE.LinearFilter
	{
		'glass' :  new THREE.MeshLambertMaterial({
			map: glassTexture,
			opacity: 0.3,
			transparent: on,
		}),
		'panel' :  new THREE.MeshLambertMaterial({
			map: glassTexture,
		}),
		'wood' :  new THREE.MeshLambertMaterial({
			map: woodTexture,
		})
	}