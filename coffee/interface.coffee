define [], ->
	class Interface
		constructor: ->
			@blockInfo     = document.getElementById('blockInfo')
			@blockName = document.getElementById('blockName')
			@blockWidth  = document.getElementById('blockWidth')
			@blockHeight = document.getElementById('blockHeight')

			document.getElementById('openDoor').onclick = =>
				do @activeShowCase.storageStands.bottomStorage['frontBorder'].open

			document.getElementById('closeDoor').onclick = =>
				do @activeShowCase.storageStands.bottomStorage['frontBorder'].close

			document.getElementById('typeDoor').onchange = =>
				@activeShowCase.changeDoor "storageBottom", document.getElementById('typeDoor').value, +document.getElementById('countDoor').value

			document.getElementById('countDoor').onchange = =>
				@activeShowCase.changeDoor "storageBottom", document.getElementById('typeDoor').value, +document.getElementById('countDoor').value
		

		openDoor: ->
			do @activeShowCase.borders['frontBorder'].open

		openDoor: ->
			do @activeShowCase.borders['frontBorder'].close

		clickOnShowCase: (showcase) ->
			@activeShowCase = showcase
			do @openDoor
			@fillBlockFields true, 'Витрина', showcase.size.z, showcase.size.y

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