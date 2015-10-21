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

		###
			Пример конфига кнопки:
				{
					label: 'Добавить полку',
					onclick: functionName
				}
		###

		createButtonsMarkup: (buttons) ->
			for button in buttons
				btn = document.createElement 'button'
				btn.onclick = button['onclick']
				btn.innerText = button['label']

				td = document.createElement 'td'
				td.colSpan = 2;
				td.appendChild btn
				
				tr = document.createElement 'tr'
				tr.appendChild td
				tr

	return new Interface