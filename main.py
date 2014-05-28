from flask import Flask, render_template, jsonify, request, Response
from pymongo import Connection
from ast import literal_eval
from bson.objectid import ObjectId
app = Flask(__name__)
import unicodedata
mongo = Connection()
from bson.json_util import dumps, loads
from json import loads
import os
from pdb import set_trace
from datetime import datetime

@app.route('/')
def home():
	return render_template('home.html', mongo=mongo)

@app.route('/db/<dbName>')
def dbView(dbName):
	db = mongo[dbName]
	return render_template('dbView.html', db=db)
	

@app.route('/db/<dbName>/col/<colName>')
def colView(dbName, colName):
	db = mongo[dbName]
	col = db[colName]
	count = col.count()
	
	variety = mongo['varietyResults']
	if (colName+'Keys') in variety.collection_names(): #see if keys have been created
		colSchema = variety[colName+'Keys']
		schema = [doc for doc in colSchema.find()]
		schema.sort(key=lambda x: x['_id']['key'])
	else:
		schema = None
		print "collection doesn't exist"
	return render_template('colView.html',dbName=dbName,colName=colName,count=count, schema=schema)

@app.route('/queryinstructions')
def queryInstructions():
	'''an html view to show instructions for doing queries'''
	return render_template('queryInstructions.html')

@app.route('/ajax/getKeysList', methods=['POST','GET'])
def getKeysList():
	'''takes in a dbName and colName and returns a JSON list of all the keys in that table in a the "keys" field.  Returns None if the field has not been created by variety'''
	data = request.json
	db = data['dbName']
	col = data['colName']
	keys = None
	variety = mongo['varietyResults']
	if (col+'Keys') in variety.collection_names(): #see if keys have been created
		colSchema = variety[col+'Keys']
		keys = [doc['_id']['key'] for doc in colSchema.find()]
	return jsonify({'keys':keys})
	
@app.route('/ajax/query', methods=['GET','POST'])
def query():
	data = request.json
	dbName = data['dbName']
	colName = data['colName']
	collection = mongo[dbName][colName]
	queryCrit = data['query']
	convertIncomingTypes(data)
	selectFields = {'_id':1} #which fields are sent to display
	
	limit = data['limit'] #limit the number returned
	#handle conversion to objID if it's anywhere
	for key in queryCrit:
		queryCrit[key] = queryCrit[key]
	
	if data['geoSearch']: # are we doing a geospatial search?
		geoX = float(data['geoSearchX'])
		geoY = float(data['geoSearchY'])
		queryCrit['cached.geoLoc'] = {'$near':[geoX,geoY]}
	print "converted criteria is ", queryCrit
	#set_trace()
	query = collection.find(queryCrit, selectFields).limit(limit)
	if 'sortField' in data: #if a sort field was specified
		sortField = data['sortField']
		sortDirection = data['sortDirection']
		query.sort(sortField,sortDirection)
	query.skip(data['skip'])
	print "found %d items" % query.count()
	jsonStr = dumps({'results':query,'count':query.count()}) #converts cursor to jsonified string
	return Response(jsonStr, mimetype='application/json')

	
def convertIncomingTypes(queryCrit):
	'''a recursive method takes in the whole query as an arguemt and returns it with specially encoded types (i.e. objectID's and date) converted to their proper format'''
	for key in  queryCrit:
		val = queryCrit[key]
		# if val is a dictionary with only one key which is '$oid'
		if type(val) == type({}) and val.keys() == ['$oid']:
			print "converting oid"
			queryCrit[key] =  ObjectId(val['$oid'])
		elif type(val) == type({}) and val.keys() == ['$date']:
			print "converint date"
			queryCrit[key] =  datetime.fromtimestamp(val['$date'])
		elif type(val) == type({}):
			print "recursing"
			convertIncomingTypes(val)

@app.route('/ajax/loadDocument', methods=['GET','POST'])
def loadDocument():
	data = request.json
	dbName = data['dbName']
	colName = data['colName']
	collection = mongo[dbName][colName]
	#objID = ObjectId(data['objID'])
	id = data['objID']
	if type(id) == type({}) and '$oid' in id: #special case if it's an objectID
		objID = ObjectId(data['objID']['$oid'])
	else:
		objID = data['objID']
	
	query = collection.find_one({'_id':objID})
	jsonStr = dumps({'doc':query}) #convert result to jsonified string
	return Response(jsonStr, mimetype='application/json')

@app.route('/ajax/loadDistinctVals', methods=['GET','POST'])
def loadDistinctVals():
	limit = 50 #if we get more than this returned, don't print them
	data = request.json
	dbName = data['dbName']
	colName = data['colName']
	field = request.json['field']
	vals = mongo[dbName][colName].find().distinct(field)
	data = {}
	if len(vals) > limit:
		data['status'] = 'tooMany'
		data['limit'] = limit
	else:
		data['status'] = 'ok'
		data['vals'] = vals
	return Response(dumps(data), mimetype='application/json')
	

@app.route('/ajax/getschema', methods=['GET','POST'])
def getKeyStats():
	print "get schema"
	data = request.json
	print "test1"
	db = data['dbName']
	col = data['colName']
	output = os.popen('''mongo %s --eval "var collection = '%s'" variety/variety.js''' % (db, col) ).read()
	output = output.split('\n')[:]
	
	#evaled = [literal_eval(i) for i in output]
	evaled = []
	for i in output:
		try:
			evaled.append(literal_eval(i))
		except SyntaxError:
			pass
	return Response(dumps({'schema':evaled}), mimetype='application/json')


@app.route('/ajax/gettablesstats/<dbName>', methods=['GET','POST'])
def getTabelsStats(dbName):
	'''given a specified <dbName>, return all metadata about all tables in that DB'''
	db = mongo[dbName]
	stats = {}
	for tableName in db.collection_names():
		newStats = {}
		
		table = db[tableName]
		newStats['count'] = table.count()
		newStats['indexInfo'] = table.index_information()
		
		stats[tableName] = newStats
	return Response(dumps({'stats':stats}), mimetype='application/json')
		

if __name__ == '__main__':
	app.static_url_path='static'
	app.run(debug=True, port=5001)
