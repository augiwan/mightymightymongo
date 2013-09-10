function makeAutocompleteField(queryField, haystack, suggestionsDiv){
	$(queryField).keyup(function()
	{
		
		
		var querySoFar = $(queryField).val()
		
		var keyChain = getCurrentKeyChain(querySoFar)
		var	prevFields = keyChain.splice(0, keyChain.length-1)

		var curField = keyChain.reverse()[0]
		var queryLen = curField.length
		$(suggestionsDiv).html('')
		
		$(suggestionsDiv).append("<div>")
		for(var index in prevFields){
			$(suggestionsDiv).append(prevFields[index]+" > ")
		}
			
		//now dig into the keystats to find out where to look for suggestions
		var subKeyStats = keyStats
		for(var index in prevFields)
			subKeyStats = subKeyStats[prevFields[index]]['subKeys']
	
	if(isTypingField(querySoFar)){
		if(queryLen == 0)
			return
		for (var key in subKeyStats){
			if(key.substr(0,queryLen) == curField){
				$(suggestionsDiv).append("<div>"+key+"</div>")
			}
		}
	
	} // end isTypingField
	
	else if(isTypingValue(querySoFar)){
		var types = subKeyStats[curField]['types']
		var values = subKeyStats[curField]['values']
		
		$(suggestionsDiv).append("<div>Value types:</div>")
		for(var index in types)
			$(suggestionsDiv).append("<div>"+types[index]+"</div>")
		
		$(suggestionsDiv).append("<div>Values:</div>")
		for (var index in values)
			$(suggestionsDiv).append("<div>"+values[index]+"</div>")
	}
	})
	
	
}


// returns true if the user is currently typing in a field name
function isTypingField(string){
	var tokens = string.split('')
	var lastComma = tokens.lastIndexOf(',')
	var lastColon = tokens.lastIndexOf(':')
	var lastDot = tokens.lastIndexOf('.')
	
	//if the most recent thing we saw was a colon
	if(lastColon > lastDot && lastColon > lastComma)
		return false
	return true
}

//returns true if the user is currently typing in a value for a field
function isTypingValue(string){
	var tokens = string.split('')
	var lastComma = tokens.lastIndexOf(',')
	var lastColon = tokens.lastIndexOf(':')
	var lastDot = tokens.lastIndexOf('.')
	
	//if the most recent thing we saw was a colon
	if(lastColon > lastDot && lastColon > lastComma)
		return true	
	return false
	
}

// returns a list of the chain of subfields entered for the current search term being typed in
function getCurrentKeyChain(string){
	var tokens = string.split(',').reverse()
	var current = tokens[0].split(':')[0]
	var fields = current.split('.')
	
	trimmed = []
	for(var tok in fields)
		trimmed.push(fields[tok].trim())
	
	return trimmed
}