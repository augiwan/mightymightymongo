function appendCriteriaField(){
	var newCrit = $('<div>',{'class':"oneCrit"})
	var field = $('<input>',{'type':'text', 'class':'field', 'placeholder':'field'})
	
	var select = $('<select>', {'class':'operation'})
	ops = ["$eq","$gt","$gte","$lt","lte"]
	for(var i=0; i<ops.length;i++)
		select.append($('<option>', {'value':ops[i],'html':ops[i]}))
	var valueString = $("<input>",{'type':'text','class':'valueString','placeholder':'value'})
	var valueBool = $("<select>", {'style':'display:none', 'class':'valueBool'})
	valueBool.append("<option>True</option>");valueBool.append("<option>False</option>")
	
	var changeValType = $("<a>", {'href':'javascript:changeValueType()','html':'Change Type'})

	removeIcon = $('<img>', {'class':'operatorIcon', 'src':'/static/images/remove-icon.png'})
	
	$(newCrit).append(field)
	$(newCrit).append(select)
	$(newCrit).append(valueString)
	$(newCrit).append(valueBool)
	$(newCrit).append(changeValType)
	$(newCrit).append(removeIcon)
	$("#queryDiv").append(newCrit)
}

function changeValueType(self){
	console.log(self)
	//changes the visible field type for the focused criteria
	allVals = $(focused).siblings(".value*")
	console.log(allvals)
}
