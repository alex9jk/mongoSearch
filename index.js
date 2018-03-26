// Set up express-handlebars template engine 
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser'); 
var path = require('path');
var app = express();
var hbs = exphbs.create({
  // Register helpers that will later aid in rendering layouts
  helpers: {
    message: function() {return '';},
    doc: function() {return '';}
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
// Add support for encoding types
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// Set up Mongo client
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');  
var util=require('util');
var url = 'mongodb://admin:student@localhost:27017/users?authSource=admin';
//var url = 'mongodb://localhost:27017/users';
var dbName = 'users';
var db;
var query;

// Connect to Mongo DB users, reviewYelp2 collection
MongoClient.connect(url, function(err, client) {
 assert.equal(null, err);
  console.log("Connected successfully to server");
  db = client.db(dbName);
  console.log("connected to " + dbName);
    db.collection("reviewYelp2", { }, function(err, coll) {
        console.log("connecting to reviewYelp2");
        if (err !== null) {
            console.log(err);
            // Create the collection if it doesn't exist (we don't expect this)
            db.createCollection("reviewYelp2", function(err, result) {
                assert.equal(null, err);  
                console.log("Created reviewYelp2 collection");
            });
        }
        // Index the collection
        db.ensureIndex("reviewYelp2", { document: "text"}, function(err, indexname) {
            assert.equal(null, err);
            console.log("created index for reviewYelp2 collection");
         });
    });
});

// Set up stylesheets
app.get('/public/stylesheets/bootstrap.min.css', function(req,res) { res.send('public/stylesheets/bootstrap.min.css'); res.end();});
app.get('/public/stylesheets/bootstrap.css.map', function(req,res) { res.send('public/stylesheets/bootstrap.css.map'); res.end(); });
app.get('/public/stylesheets/style.css', function(req, res){ res.send('public/stylesheets/style.css'); res.end(); });
app.use(express.static(path.join(__dirname, '/public')));

// DISPLAY HOME PAGE WITH THE SEARCH FORM / QUERY RESULTS
app.get("/", function(req, res) { 
    // If user has not made a query, display only search form,
    if (!query || req.query.showSearch) {
        res.render('search', {
            // Show search 
            searching: true
        });
    } else {
        // Otherwise retrieve results matching query and display in ascending order by date
        db.collection('reviewYelp2').find({
            text: new RegExp(query)
        }).sort({date: 1}).toArray(function(err, items) {
            // Render page with list of results
            res.render('search', {
                helpers: {
                    message: function() {return pagelist(items);}
                },
                // Hide search 
                searching: false,
                // Display what the query was
                query: query
            });
        });
    }
});

// RETURN MATCHING RESULTS WHEN USER SUBMITS SEARCH QUERY
app.post("/", function(req, res) {  
    query = req.body.query;

    // Find query, sort by date asc
    db.collection('reviewYelp2').find({
        text: new RegExp(req.body.query)
    }).sort({date: 1}).toArray(function(err, items) {
        console.log('querying database for ' + query);
        res.render('search', {
            // Override helper only for this rendering
            helpers: {
                message: function() {return pagelist(items);}
            },
            // Hide search
            searching: false,
            // Display what the query was
            query: req.body.query
        });
    });
});

// DISPLAY INDIVIDUAL REVIEW DOCUMENT PAGE 
app.get("/viewReview", function(req, res) {
    // Get review ID from URL
    var reviewID = req.query.reviewID;

    // Find review using its review ID
    db.collection('reviewYelp2').find({
        review_id: new RegExp(reviewID)
    }).toArray(function(err, items) {
        // Check if review contains comments
        var hasComments = false;
        if (items[0].comments) {
            hasComments = true;
        }

        // Display review on viewItem.handlebars, where {{ doc }} is
        // Note: Using toArray and items[0], due to potential mongodb duplicity
        res.render('viewItem', {
            helpers: {
                doc: function() { return showDocument(items[0]); }
            },
            showComments: hasComments,
            comments: items[0].comments
        });
    });
});

// ACTION TO TAKE AFTER USER SUBMITS COMMENT
app.post("/viewReview", function(req, res) {
    // Get comment and review ID
    var comment = req.body.comment; 
    var reviewID = req.query.reviewID;  // unsure why it persisted
    
    // Insert comment and display updated document 
    db.collection('reviewYelp2').findOneAndUpdate(
        // Document to find
        { review_id: new RegExp(reviewID) },
        // Add comment to comments array,
        // checking if array exists first, if not creates array too
        { $addToSet: { "comments" : comment } },
        // Return updated document, not the original
        { returnOriginal: false },
        function(err, result) {
            res.render('viewItem', {
                // Display review on viewItem.handlebars, where {{ doc }} is
                helpers: {
                    doc: function() { return showDocument(result.value); }
                },
                showComments: true,
                comments: result.value.comments
            });
        }
    );
});

// Tells app to listen on port 3000
app.listen(3000, function() {
    console.log("App listening on localhost:3000");
});

// Creates HTML for individual result document
function showDocument(docum) {
     var result = "<ul class='list-group'><li class='list-group-item'>review_id: " + docum.review_id + "</li><li class= 'list-group-item'>business_id: " + 
     docum.business_id +"</li><li class= 'list-group-item'>Date: " + docum.date +"</li><li class= 'list-group-item'>Stars: " + docum.stars +
"</li><li class= 'list-group-item'>Useful? " + docum.useful + "</li><li class= 'list-group-item'>Funny? "+ docum.funny +"</li><li class='list-group-item'>Cool? " + 
docum.cool +"</li></ul><p>" + docum.text + "</p>";

    return result;
}

// Creates HTML for list of results 
function pagelist(items) {
    result = "<div class='list-group'>";
    items.forEach(function(item) {
        // Add document description
        str = "<a href='/viewReview?reviewID=" + item.review_id+"'class="+item.review_id+ " 'list-group-item list-group-item-action' >" + item.date + "    " + item.review_id + "</a></li>";
        result = result + str;
    });
    result = result + "</div>";
    return result;
}


