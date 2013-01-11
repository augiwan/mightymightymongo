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
	return stats
	
def addToKeyCount(stats, keys):
	for key in keys:
		if key in stats:
			stats[key]['count'] += 1
		else:
			stats[key] = {'count':1, 'subKeys':{}}
		addToKeyCount(stats[key], keys[key])
		
def getKeys(dic):
	"returns a dictionary of all keys and sub-keys in the dictionary"
	newDic = {}
	for key in dic.keys():
		if type(dic[key]) == type({}):
			newDic[key] = getKeys(dic[key])
		else:
			newDic[key] = {}
	return newDic


if __name__ == '__main__':
	app.run(debug=True)
