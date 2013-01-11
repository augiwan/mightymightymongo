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
	
	schemas = {}
	for doc in col.find():
		schemas[str(getKeys(doc))] = True
		schemasList = schemas.keys()
	return render_template('colView.html', db=db, col=col, schemasList=schemasList)


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
