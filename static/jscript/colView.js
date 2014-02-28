function appendCriteriaField(){
	var newCrit = $('<div>',{'class':"oneCrit"})
	var field = $('<input>',{'type':'text', 'class':'field', 'placeholder':'field','onchange':"queryChange(this)"})
	
	var select = $('<select>', {'class':'operation', 'onchange':"queryChange(this)"})
	ops = ["$eq","$gt","$gte","$lt","lte"]
	for(var i=0; i<ops.length;i++)
		select.append($('<option>', {'value':ops[i],'html':ops[i]}))
	var value = $("<input>",{'type':'text','class':'value','placeholder':'value', 'onchange':"queryChange(this)"})
	
	var changeValType = $("<a>", {'href':'javascript:changeValueType()','html':'Change Type'})

	removeIcon = $('<img>', {'class':'operatorIcon', 'src':'/static/images/remove-icon.png'})
	
	$(newCrit).append(field)
	$(newCrit).append(select)
	$(newCrit).append(value)
	//$(newCrit).append(valueBool)
	$(newCrit).append(changeValType)
	$(newCrit).append(removeIcon)
	$("#queryDiv").append(newCrit)
}



function queryChange(self){
	var oneCrit = $(self).parent()
	var field = $(oneCrit).children('.field')[0]
	var operation = $(oneCrit).children('.operation')[0]
	var value = $(oneCrit).children('.value')[0]
	
	oneCrit.attr('data-field',$(field).val())
	oneCrit.attr('data-operation',$(operation).val())
	oneCrit.attr('data-value',$(value).val())
	
}

function query(){
	crits = $('#queryDiv').children('.oneCrit')
	queryDic = {}
	for(i=0;i<crits.length;i++){
		curCrit = crits[i];
		var field = $(curCrit).data('field')
		var operation = $(curCrit).data('operation')
		var value = $(curCrit).data('value')
		if(operation == '$eq')
			queryDic[field] = value
		else{
			var dic = {}
			dic[operation] = value
			queryDic[field] = dic
		}
	}
	
	data = {}
	data['dbName'] = dbName
	data['colName'] = colName
	data['query'] = queryDic
	$.ajax({url:'/ajax/query', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:queryReceived})
}

function queryReceived(data){
	results = data['results']
	for(i=0;i<results.length;i++){
		var resultContainer = $('<div>', {'class':'resultContainer'})
		$(resultContainer).attr('data-loaded', false) //has the expanded doc been loaded yet?
		
		
		var divSummary = $('<div>', {'class':'resultSummary'})
		
		var doc = results[i]
		var img = $('<img>', {class:'operatorIcon', src:"/static/images/expandLogo.png",onclick:"javascript:loadDoc($(this).parent())"})
		$(divSummary).append(img)
		$(divSummary).append('{')
		for(var j in doc){
			if(j=='_id'){
				var id = doc[j]['$oid']
				$(divSummary).append(j+':'+id)
				$(divSummary).attr('data-_id',id)
			}
			else
				$(divSummary).append(j+':'+doc[j])
		}
		$(divSummary).append('}')
		
		var expanded = $('<div>', {'class':'resultExpanded', 'style':'display:none'})
		
		$(resultContainer).append(divSummary)
		$(resultContainer).append(expanded)
		$(resultsDiv).append(resultContainer)
	}	
}

function loadDoc(div){
	console.log('loading doc with id ' + $(div).data('_id'))
	var data = {}
	data['dbName'] = dbName
	data['colName'] = colName
	data['objID'] = $(div).data('_id')
	$.ajax({url:'/ajax/loadDocument', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:docReceived})
	
	function docReceived(data){
		console.log('received')
		var serialized = serializeDoc(data['doc'])
		for(var i in serialized){
			console.log(i+':'+serialized[i])
		}
	}
}