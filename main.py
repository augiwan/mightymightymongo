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
	return render_template('colView.html',dbName=dbName,colName=colName)

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

def makeKeyStats(db,col):
	output = os.popen('''mongo %s --eval "var collection = '%s', limit = 1" variety-master/variety.js''' % (db, col) ).read()
	output = output.split('\n')
	output = output[10:-1] # first ten lines are just printouts, the last is an empty string
	
def addToKeyCount(stats, keys):
	for key in keys:
		keyType = keys[key][0]
		value = keys[key][1]
		if key in stats:
			stats[key]['count'] += 1
			if keyType not in stats[key]['types']:
				stats[key]['types'].append(keyType)
			
			if value not in stats[key]['values'] and type(value) in [type(0),type(''), type(u''),type(True), type(None)]:
				stats[key]['values'].append(value)
		else:
			stats[key] = {'count':1, 'types':[keyType], 'subKeys':{}, 'values':[]}
			print "comparing:", value, type(value), [type(0),type(''), type(u''),type(True), type(None)]
			if type(value) in [type(0),type(''), type(u''),type(True), type(None)]:
				stats[key]['values'].append(value)
		if keyType == type({}).__name__: #recurse if it's a subdictionary
			addToKeyCount(stats[key]['subKeys'], value)
		
def getKeys(dic):
	"returns a dictionary of all keys and sub-keys in the dictionary.  Keys values are the key names and the values is a tuple of (key type, <subKeys>) if it's a dictionary, otherwise it's (<key type>, <value>"
	newDic = {}
	for key in [unicodedata.normalize('NFKD', x).encode('ascii','ignore') for x in dic.keys()]:
		if type(dic[key]) == type({}): ##recurse if it's a sub-dictionary
			newDic[key] = (type({}).__name__, getKeys(dic[key]))
		else:
			newDic[key] = (type(dic[key]).__name__, dic[key])
	return newDic

if __name__ == '__main__':
	app.static_url_path='static'
	app.run(debug=True)
