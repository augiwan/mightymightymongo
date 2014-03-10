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
	return render_template('colView.html',dbName=dbName,colName=colName,count=count)

@app.route('/ajax/getkeystats/')
def getKeyStats():
	dbName = request.args.get("dbName");
	colName = request.args.get("colName");
	collection = mongo[dbName][colName]
	stats = makeKeysStats(collection)
	return jsonify({"stats":stats})

@app.route('/ajax/query', methods=['GET','POST'])
def query():
	data = request.json
	print "received " + str(data)
	dbName = data['dbName']
	colName = data['colName']
	collection = mongo[dbName][colName]
	queryCrit = data['query']
	
	selectFields = {'_id':1} #which fields are sent to display
	#query = collection.find(queryCrit, selectFields)
	query = collection.find({'email':'jacobgheller@gmail.com'}, selectFields)
	jsonStr = dumps({'results':query}) #converts cursor to jsonified string
	return Response(jsonStr, mimetype='application/json')
	

@app.route('/ajax/loadDocument', methods=['GET','POST'])
def loadDocument():
	data = request.json
	dbName = data['dbName']
	colName = data['colName']
	collection = mongo[dbName][colName]
	objID = ObjectId(data['objID'])
	
	query = collection.find_one({'_id':objID})
	jsonStr = dumps({'doc':query}) #convert result to jsonified string
	
	return Response(jsonStr, mimetype='application/json')

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
