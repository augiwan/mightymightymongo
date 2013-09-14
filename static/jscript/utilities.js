//inserts string <toInsert> into string <string> so that it is located at index <index>
function insertAt(string, toInsert, index){
	return [string.slice(0, index), toInsert, string.slice(index)].join('');
}

//returns true if object is a dictionary.  False otherwise
function isDic(obj){
	return obj.constructor == Object
	}