//use for automatically converting types for query and syntax hilighting


var regBool = new RegExp(/^(False|True)$/)
var formatBool = {'color':'orange','font-weight':'bold'}
var regStr = new RegExp(/^".*"$/)
var formatStr = {'color':'blue', 'font-weight':'bold'}
var regNum = new RegExp(/^[1-9]\d*(\.\d+)?$/)
var formatNum = {'color':'red','font-weight':'bold'}
var regNone = new RegExp(/^None$/)
var formatNone = {'color':'brown','font-weight':'bold'}
var formatUnknown = {'background':'#FF8D8D'}
formats = []
formats.push([regBool,formatBool],[regStr,formatStr],[regNum,formatNum],[regNone,formatNone],formatUnknown)




function appendCriteriaField(){
	var newCrit = $('<div>',{'class':"oneCrit"})
	var field = $('<input>',{'type':'text', 'class':'field', 'placeholder':'field','onchange':"queryChange(this)"})
	
	
	
	var select = $('<select>', {'class':'operation', 'onchange':"queryChange(this)"})
	var ops = ["$eq","$gt","$gte","$lt","$lte","$exists"]
	for(var i=0; i<ops.length;i++)
		select.append($('<option>', {'value':ops[i],'html':ops[i]}))
	var value = $("<input>",{'type':'text','class':'value','placeholder':'value', 'onchange':"queryChange(this)"})
	$(value).keyup(formatValue)
	

	var removeIcon = $('<img>', {'class':'operatorIcon', 'src':'/static/images/remove-icon.png'})
	
	
	$(newCrit).append(field)
	$(newCrit).append(select)
	$(newCrit).append(value)
	//$(newCrit).append(valueBool)
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
	console.log("querying")
	var crits = $('#queryDiv').children('.oneCrit')
	var queryDic = {}
	for(var i=0;i<crits.length;i++){
		var curCrit = crits[i];
		var field = $(curCrit).attr('data-field')
		if(field == '' || field==undefined) // ignore if the field is blank
			continue
		var operation = $(curCrit).attr('data-operation')
		var value = $(curCrit).attr('data-value')
		//handle type converstion
		if(regBool.test(value)){
			if(value == "True")
				value = true
			else //it's false
				value = false
		}
		
		if(operation == '$eq')
			queryDic[field] = value
		else{
			var dic = {}
			dic[operation] = value
			queryDic[field] = dic
		}
	}
	
	var data = {}
	data['dbName'] = dbName
	data['colName'] = colName
	data['query'] = queryDic
	$.ajax({url:'/ajax/query', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:queryReceived})
}

function queryReceived(data){
	$('#queryCount').html('Total Results: ' + data['count'])
	var results = data['results']
	$(resultsDiv).html('')
	for(var i=0;i<results.length;i++){
		var resultContainer = $('<div>', {'class':'resultContainer'})
		$(resultContainer).attr('data-loaded', false) //has the expanded doc been loaded yet?
		$(resultContainer).attr('data-expaned', false) //is the div currently expaned
		
		var divSummary = $('<div>', {'class':'resultSummary'})
		
		var doc = results[i]
		var img = $('<img>', {class:'operatorIcon', src:"/static/images/expandLogo.png",onclick:"javascript:toggleExpanded($(this).parent().parent())"})
		$(divSummary).append(img)
		$(divSummary).append('{')
		for(var j in doc){
			if(j=='_id'){
				var id = doc[j]['$oid']
				$(divSummary).append(j+':'+id)
				$(resultContainer).attr('data-_id',id)
			}
			else
				$(divSummary).append(j+':'+doc[j])
		}
		$(divSummary).append('}')
		
		var expanded = $('<div>', {'class':'resultExpanded','style':'display:none'})
		
		$(resultContainer).append(divSummary)
		$(resultContainer).append(expanded)
		$(resultsDiv).append(resultContainer)
	}	
}

function toggleExpanded(div){
	var expanded = $(div).children('.resultExpanded')[0]
	if(!$(div).data('loaded'))
		loadDoc(div)
	$(expanded).slideToggle()
}

function loadDoc(div){
	console.log('loading doc with id ' + $(div).data('_id'))
	var data = {}
	data['dbName'] = dbName
	data['colName'] = colName
	data['objID'] = $(div).data('_id')
	$.ajax({url:'/ajax/loadDocument', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:docReceived})
	
	function docReceived(data){
		var expand = $(div).children('.resultExpanded')[0]
		var serialized = serializeDoc(data['doc'])
		for(var i in serialized){
			console.log(i+':'+serialized[i])
			$(expand).append("<div class='oneAttr'> "+i+": "+serialized[i]+"</div>")
		}
	}
	
	$(div).data('loaded', true)
}

function loadSchema(){
	console.log('getting schema')
	var data = {}
	data['dbName'] = dbName
	data['colName'] = colName
	$.ajax({url:'/ajax/getschema', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:schemaReceived})
	
	function schemaReceived(data){
		var schemaDiv = $("#schema")
		$(schemaDiv).html('')
		schema = data['schema']
		for(i=0;i<schema.length;i++){
			var curKey = schema[i]
			var newDiv = $("<div>", {'class':'oneKeyContainer'})
			$(newDiv).attr('data-field', curKey['_id']['key'])
			$(newDiv).click( function(){loadDistinctVals(this)})
			newDiv.append(curKey['_id']['key']+': ' + curKey['percentContaining']+"% (" + curKey['value']['type'] + ")") 
			$(schemaDiv).append(newDiv)
		}
	
	}
}

//used to format the text fields for values depending the type of value (Boolean, String, etc)
function formatValue(event){
	var input = event.target
	var val = $(input).val()
	val = $.trim(val) //removing spaces on the ends
	$(input).css({'background':'white','font-weight':'normal'})
	var recognized = false
	for(var i=0;i<formats.length-1;i++){ //last element is the default, hence the -1
		var rule = formats[i][0]
		var css = formats[i][1]
		if(rule.test(val)){
			recognized = true
			$(input).css(css)
		}
	}
	if(!recognized){
			$(input).css(formats[formats.length-1])
	}
}

//same as format value, but takes in a div with the value of interest in the HTML
function formatValueDiv(div){
	event = {}
	event.target = div
	formatValue(event)
}
//takes in a field value and retrieves the unique values for that field
function loadDistinctVals(field){
	data = {}
	data['dbName'] = dbName
	data['colName'] = colName
	data['field'] = $(field).attr('data-field')
	$.ajax({url:'/ajax/loadDistinctVals', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:valsReceived})
	
	function valsReceived(data){
		var fieldList = $('#fieldList')
		$(fieldList).html("")
		var vals = data['vals']
		for(var i=0;i<vals.length;i++){
			var newDiv = $('<div>')
			newDiv.append(vals[i])
			formatValueDiv(newDiv)
			console.log(vals[i])
			$(fieldList).append(newDiv)
		}
	}
}