//A set of methods for easily making DOM elements.  This is a shortcut for the document.createElement(...) methods

function makeDiv(){
	return document.createElement('div')
}

function makeImg(source){
	var newImg = document.createElement('img')
	newImg.setAttribute('src', source)
	
	return newImg
}