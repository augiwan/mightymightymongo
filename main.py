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

#def sanitizeKeyStats(stats):
#	"takes in stats and formats it properly for javascript"
	
def addToKeyCount(stats, keys):
	for key in keys:
		if key in stats:
			stats[key]['count'] += 1
			if keys[key][0] not in stats[key]['types']:
				stats[key]['types'].append(keys[key][0])
			#stats[key]['types'][keys[key][0]] = True
		else:
			stats[key] = {'count':1, 'types':[keys[key][0]], 'subKeys':{}}
		if keys[key][0] == type({}).__name__: #recurse if it's a subdictionary
			addToKeyCount(stats[key]['subKeys'], keys[key][1])
		
def getKeys(dic):
	"returns a dictionary of all keys and sub-keys in the dictionary"
	newDic = {}
	for key in [unicodedata.normalize('NFKD', x).encode('ascii','ignore') for x in dic.keys()]:
		if type(dic[key]) == type({}):
			newDic[key] = (type({}).__name__, getKeys(dic[key]))
		else:
			newDic[key] = (type(dic[key]).__name__, dic[key])
	return newDic

if __name__ == '__main__':
	app.run(debug=True)
