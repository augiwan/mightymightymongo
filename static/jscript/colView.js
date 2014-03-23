//use for automatically converting types for query and syntax hilighting
var regBool = new RegExp(/^(false|true)$/)
var regStr = new RegExp(/^".*"$/)
var regNum = new RegExp(/^[1-9]\d*(\.\d+)?$/)
var regNone = new RegExp(/^null$/)


//format is <className>:[<regex>,<conversion function for JSON>]
var formats = {'boolType':[regBool, function(val){if (val=="false") return false; else return true}],
'stringType':[regStr, function(val){return val.substring(1,val.length-1)}],
'numType':[regNum, function(val){return Number(val)}],
'noneType':[regNone, function(val){return null}],
}

//keep track of the first and last objID currently displayed so we can do paging



function appendCriteriaField(){
	var newCrit = $('<div>',{'class':"oneCrit"})
	var field = $('<input>',{'type':'text', 'class':'field', 'placeholder':'field','onchange':"queryChange(this)"})
	
	
	
	var select = $('<select>', {'class':'operation', 'onchange':"queryChange(this)"})
	var ops = ["$eq","$gt","$gte","$lt","$lte","$exists"]
	for(var i=0; i<ops.length;i++)
		select.append($('<option>', {'value':ops[i],'html':ops[i]}))
	var value = $("<input>",{'type':'text','class':'value','placeholder':'value'})
	$(value).keyup(function(self){formatValueDiv(self.target);queryChange(self.target)})
	

	var removeIcon = $('<img>', {'class':'operatorIcon', 'src':'/static/images/remove-icon.png'})
	
	
	$(newCrit).append(field)
	$(newCrit).append(select)
	$(newCrit).append(value)
	//$(newCrit).append(valueBool)
	$(newCrit).append(removeIcon)
	$("#queryDiv").append(newCrit)
}



function queryChange(self){
	console.log("change")
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
		for(i in formats){
			var regex = formats[i][0]
			var conversion = formats[i][1]
			if(regex.test(value))
				value = conversion(value)
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
	//if(lastID) //if this is loading the next page of a current query
	//	data['lastID'] = lastID
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
			$(divSummary).append(j+':'+JSON.stringify(doc[j]))
			if(j=='_id'){
				$(resultContainer).attr('data-_id',JSON.stringify(doc[j]))
			}		
		}
		$(divSummary).append('}')
		var expanded = $('<div>', {'class':'resultExpanded','style':'display:none'})
		
		$(resultContainer).append(divSummary)
		$(resultContainer).append(expanded)
		$(resultsDiv).append(resultContainer)
	}
	$(resultsDiv).attr('data-firstID', results[0]['_id'])
	$(resultsDiv).attr('data-lastID', results[results.length-1]['_id'])
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
			var newDiv = $("<div>", {'class':'oneAttr'})
			$(newDiv).append(i+': ')
			var val = $("<span>")
			$(val).append(JSON.stringify(serialized[i]))
			formatValueDiv(val)
			$(newDiv).append(val)
			$(expand).append(newDiv)
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
	
}

//takes in a DIV containing a value and styles it according to it's type
function formatValueDiv(div){
	console.log('change')
	var val = $(div).html()
	if(val == "")
		val = $(div).val() //handle inputs as well, not just divs
	val = $.trim(val) //removing spaces on the ends
	$(div).removeClass(Object.keys(formats).join(' '))
	for(var i in formats){
		if(formats[i][0].test(val))
			$(div).addClass(i)
	}
}
//takes in a field value and retrieves the unique values for that field
function loadDistinctVals(event){
	data = {}
	var field = $(event.target).attr('data-field')
	data['dbName'] = dbName
	data['colName'] = colName
	data['field'] = field
	$.ajax({url:'/ajax/loadDistinctVals', type:'POST', data:JSON.stringify(data), contentType:'application/json', success:valsReceived})
	
	function valsReceived(data){
		var fieldList = $('#fieldlist')
		$(fieldList).html(field)
		if(data['status'] == 'tooMany'){
			$(fieldList).append("<h2>Error more than "+data['limit']+" distinct values found.</h2>")
			return
		}
		var vals = data['vals']
		for(var i=0;i<vals.length;i++){
			var newDiv = $('<div>')
			newDiv.append(JSON.stringify(vals[i]))
			formatValueDiv(newDiv)
			console.log(vals[i])
			$(fieldList).append(newDiv)
		}
	}
}