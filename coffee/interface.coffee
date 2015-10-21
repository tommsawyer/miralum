define [], ->
	class Interface
		constructor: ->
			@blockInfo     = document.getElementById('blockInfo')
			@blockName = document.getElementById('blockName')
			@blockWidth  = document.getElementById('blockWidth')
			@blockHeight = document.getElementById('blockHeight')

		fillBlockFields: (visible, name, width, height) ->
			if visible 
				@blockInfo.style.display = 'block' 
				@blockName.innerText  = name
				@blockWidth.innerText  = width
				@blockHeight.innerText = height
			else 
				@blockInfo.style.display = 'none'

	return new Interface