const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017/users';

// Database name
const dbName = 'users'

// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to server");

    const db = client.db(dbName);

    findTweets(db, function() {
        
    });

    findRecipes(db, function() {
        client.close();
    });
});

// Define the function that queries tweets
const findTweets = function(db, callback) {
    // Get the documents collection
    const collection = db.collection('tweets_sandy');
    collection.count({}, function(error, numOfDocs) {
        console.log("There are " + numOfDocs + " tweets in tweets_sandy");
    });

    // Find some documents
    collection.find(
        {text: /water/i}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found " + docs.length + " tweets with 'water' in the text:");
            console.log(docs);
           callback(docs); 
    });
}

// Define the function that queries recipes
const findRecipes = function(db, callback){
    const collection2 = db.collection('reviewYelp2');
    collection2.find({text: /dog/}).toArray(function(err, docs2){
        assert.equal(err, null);
        console.log("found the following recipes");
        console.log(docs2);
        callback(docs2);
    });
}	

