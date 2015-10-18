define ['physicalObject', 'materials'], (physicalObject, Materials) ->
	class Dimension
		constructor: (mesh, correction) ->
			@mesh = new THREE.Object3D
			sizes = do (new THREE.Box3().setFromObject(mesh)).size
			bottomLeftCorner = new THREE.Vector3(
				mesh.position.x - sizes.x / 2 - correction,
				mesh.position.y - sizes.y / 2,
				mesh.position.z - sizes.z / 2
				)
			bottomRightCorner = new THREE.Vector3(
				mesh.position.x - sizes.x / 2 - correction,
				mesh.position.y - sizes.y / 2,
				mesh.position.z + sizes.z / 2
				)
			topLeftCorner = new THREE.Vector3(
				mesh.position.x - sizes.x / 2 - correction,
				mesh.position.y + sizes.y / 2,
				mesh.position.z - sizes.z / 2
				)
			LeftCorner = new THREE.Vector3(
				mesh.position.x - sizes.x / 2 - correction,
				mesh.position.y + sizes.y / 2,
				mesh.position.z - sizes.z / 2
				)
			bottomBackCorner = new THREE.Vector3(
				mesh.position.x - sizes.x / 2,
				mesh.position.y - sizes.y / 2,
				mesh.position.z + sizes.z / 2 + correction
				)
			bottomFrontCorner = new THREE.Vector3(
				mesh.position.x + sizes.x / 2,
				mesh.position.y - sizes.y / 2,
				mesh.position.z + sizes.z / 2 + correction
				)
			@mesh.add @createLine bottomLeftCorner, bottomRightCorner
			@mesh.add @createLine topLeftCorner, bottomLeftCorner
			@mesh.add @createLine bottomBackCorner, bottomFrontCorner

		createLine: (from, to) ->
			geometry = new THREE.Geometry
			geometry.vertices.push new THREE.Vector3(from.x, from.y, from.z)
			geometry.vertices.push new THREE.Vector3(to.x, to.y, to.z)

			new THREE.Line geometry, Materials.line

		sceneSizeToReal: (size) ->
			# переводит экранные координаты в реальные размеры
			size
