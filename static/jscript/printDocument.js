function serializeDoc(doc){
	var result = {};
	
	function serialize(keys, parentKey){
    for(var key in keys){
        if($.inArray($.type(keys[key]), ['number','array','string', 'boolean']) > -1){ //only process certain types
            result[parentKey+key] = keys[key];
        }else if ($.type(keys[key]) == 'object') {
            serialize(keys[key], parentKey+key+".");
        	}
        else
        	console.log('omitting key ' + key + ' with type ' + $.type(keys[key]))
    	}
	}


	
	serialize(doc, "")
	return result
}

