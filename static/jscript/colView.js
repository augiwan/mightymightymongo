//Collection of JS code for colView.html

keyStats = 5;
vals2Change = {}
function docValChange(event){
	var field = event.target
	console.log($(field).html())
}

function getKeyStats(){
	var data = {};
	data["dbName"] = dbName
	data["colName"] = colName
	$.getJSON("/ajax/getkeystats", data, function(data){keyStats = data['stats']; printKeyStats(keyStats)})
}

function printKeyStats(keyStats, div){
	var statsList = makeKeysList(keyStats)
	$("#keyStatsDiv").append(statsList)
} //end printKeyStats

//run when a list item is clicked.  Get's the <field>.<field>... string
// and then adds this string along with value and [equals, exists, ...]
// fields for searching to the appropriate div
function addToCriteria(e){
	keyChain = getKeyChain.apply(this, [e])
	addKeyChainToCriteria(keyChain)
}
//returns a <key>.<key>... structure for the node represented
// by "this" in the list
function getKeyChain(e){
	
	e.stopPropagation()
	keyName = $(this).children(".keyName").html()
	parentList = $($(this).parent()).parent();
	if($(parentList).attr('class') == 'keyListLi'){
		return keyName+"."+getKeyChain.apply(parentList, [e])
	}
	return keyName
	console.log($(parentList).children('.keyName').html())
}

function addKeyChainToCriteria(keyChain){
	newCriteria = document.createElement('div')
	$(newCriteria).append("<span class='field'>"+keyChain+"</span>")
	var logicType = document.createElement('select')
	$(logicType).attr('class', 'logicType')
		var types = ['equals', 'in', 'exists']
		for(var type in types){
			var option = document.createElement('option')
			$(option).html(types[type])
			$(logicType).append(option)
		}
	valueField = document.createElement('input')
	$(valueField).attr('class', 'valueField')
	$(newCriteria).append("<br>")
	$(newCriteria).append(logicType)
	$(newCriteria).append(valueField)
	$("#queryFields").append(newCriteria)
}
//takes in the key stats from the server and makes a DOM HTML list
function makeKeysList(keyStats){
	var list = document.createElement('ul')
	for (var key in keyStats){
		var li = document.createElement('li')
		$(li).attr('class', 'keyListLi')
		$(li).append("<span class=keyName>"+key+"</span> ")
		$(li).append("(<span class=keyCount>"+keyStats[key]['count']+"</span>: ")
		$(li).append("<span class=keyTypes>"+keyStats[key]['types']+"</span>)")
		//$(li).click(function(){console.log($(self).children(".keyName")[0])})
		$(li).click(addToCriteria)
		if(Object.keys(keyStats[key]['subKeys']).length > 0)
			$(li).append(makeKeysList(keyStats[key]['subKeys']))
		$(list).append(li)
	}
	return list
} //end makeKeysList

//takes in a single document and turns it into an expandable DOM HTML list
function makeDocExpandList(document){
	var table = makeTable(); $(table).attr('border',1)
	makeListRec(document, '','')
	
	function makeListRec(document, indent, parentKeys){
		var sortedKeys = Object.keys(document).sort()
		for (var index in sortedKeys){
			var key = sortedKeys[index]
			var val = document[key]
			//var li = makeLi()
			var tr = makeTr()
			var keyStr = ''
			if (parentKeys == '')
				keyStr = key
			else
				keyStr = parentKeys+'.'+key
			if (!isDic(val)){ // if it's not dictionary, just print it
				var td1 = makeTd(indent+key)
				var td2 = makeTd(''+val)
				$(td2).attr('contenteditable','true')
				$(td2).data('keyStr',keyStr)
				td2.addEventListener('input', docValChange)
				$(tr).append(td1);$(tr).append(td2)
				$(table).append(tr)
			}
			else{ //recurse into it
				var td1 = makeTd(indent+key)
				$(tr).append(td1)
				$(table).append(tr)
				makeListRec(document[key], indent+'&nbsp&nbsp&nbsp&nbsp', keyStr)
			}
		}
	} // end makeListRec
	
	
	
	return table
} // end makeDocExpandList