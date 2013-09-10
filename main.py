from flask import Flask, render_template, jsonify, request, Response
from pymongo import Connection
from ast import literal_eval
app = Flask(__name__)
import unicodedata
mongo = Connection()
from bson.json_util import dumps
from json import loads

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
	return render_template('colView.html', db=db, col=col)

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
	queryText = data['queryText']
	print "queryText is", queryText
	criteria = literal_eval(queryText)
	print "criteria is", criteria
	query = collection.find(criteria)
	print "found", query.count(), "results"
	jsonStr = dumps({'results':query}) #converts cursor to jsonified string
	return Response(jsonStr, mimetype='application/json')
	

def makeKeysStats(col):
	"returns stats about each key"
	stats = {}
	for doc in col.find(limit=100):
		keys = getKeys(doc)
		addToKeyCount(stats, keys)
	ret = {}
	return stats

	
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
	app.run(debug=True)
