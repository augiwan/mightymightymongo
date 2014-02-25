//A set of methods for easily making DOM elements.  This is a shortcut for the document.createElement(...) methods

function makeDiv(){
	return document.createElement('div')
}

function makeInputText(){
	var inpt = document.createElement('input')
	inpt.setAttribute('type', 'text')
	return inpt
}

function makeImg(source){
	var newImg = document.createElement('img')
	newImg.setAttribute('src', source)
	
	return newImg
}

function makeUl(){
	return document.createElement('ul')
}

function makeLi(){
	return document.createElement('li')
}

function makeTable(){
	return document.createElement('table')
}
function makeSelect(){
	return document.createElement('select')
}
function makeOption(val, html){
	newEl = document.createElement('option')
	$(newEl).attr('value', val)
	$(newEl).html(html)
}

//html is an optional parameter.  If not include, an empty <tr> is provided
function makeTr(html){
	html = (typeof html === "undefined") ? "" : html;
	var newTr = document.createElement('tr')
	$(newTr).html(html)
	return newTr
}
//html is an optional parameter.  If not include, an empty <td> is provided
function makeTd(content){
	content = (typeof content === "undefined") ? "" : content;
	var newTd = document.createElement('td')
	$(newTd).html(content)
	return newTd
}