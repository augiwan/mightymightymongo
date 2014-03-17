from flask import Flask, render_template, jsonify, request, Response
from pymongo import Connection
from ast import literal_eval
from bson.objectid import ObjectId
app = Flask(__name__)
import unicodedata
mongo = Connection()
from bson.json_util import dumps
from json import loads
import os
from pdb import set_trace

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
	else:
		schema = None
		print "collection doesn't exist"
	return render_template('colView.html',dbName=dbName,colName=colName,count=count, schema=schema)

@app.route('/ajax/query', methods=['GET','POST'])
def query():
	print "running"
	data = request.json
	print "received " + str(data)
	dbName = data['dbName']
	colName = data['colName']
	collection = mongo[dbName][colName]
	queryCrit = data['query']
	
	selectFields = {'_id':1} #which fields are sent to display
	query = collection.find(queryCrit, selectFields)
	#query = collection.find({'email':{'$in':['jacobgheller@gmail.com','jacob@thewelcomingcommittee.com','danielgheller@gmail.com']}}, selectFields)
	jsonStr = dumps({'results':query,'count':query.count()}) #converts cursor to jsonified string
	return Response(jsonStr, mimetype='application/json')
	

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
	output = os.popen('''mongo %s --eval "var collection = '%s'" variety-master/variety.js''' % (db, col) ).read()
	output = output.split('\n')[:]
	
	#evaled = [literal_eval(i) for i in output]
	evaled = []
	for i in output:
		try:
			evaled.append(literal_eval(i))
		except SyntaxError:
			pass
	return Response(dumps({'schema':evaled}), mimetype='application/json')

if __name__ == '__main__':
	app.static_url_path='static'
	app.run(debug=True)
