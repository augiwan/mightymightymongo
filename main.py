from flask import Flask, render_template
from pymongo import Connection
app = Flask(__name__)

mongo = Connection()

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
	keyStats = makeKeysStats(col)
	return render_template('colView.html', db=db, col=col, keyStats = keyStats)

def makeKeysStats(col):
	"returns stats about each key"
	stats = {}
	for doc in col.find():
		keys = getKeys(doc)
		addToKeyCount(stats, keys)
	
	ret = {}
	
	return stats

def clarifyStats(stats, 
def addToKeyCount(stats, keys):
	for key in keys:
		if key in stats:
			stats[key]['count'] += 1
			stats[key]['types'][keys[key][0]] = True
		else:
			stats[key] = {'count':1, 'types':{keys[key][0]:True}, 'subKeys':{}}
		if keys[key][0] == type({}): #recurse if it's a subdictionary
			addToKeyCount(stats[key]['subKeys'], keys[key][1])
		
def getKeys(dic):
	"returns a dictionary of all keys and sub-keys in the dictionary"
	newDic = {}
	for key in dic.keys():
		if type(dic[key]) == type({}):
			newDic[key] = (type({}), getKeys(dic[key]))
		else:
			newDic[key] = (type(dic[key]), dic[key])
	return newDic


if __name__ == '__main__':
	app.run(debug=True)
