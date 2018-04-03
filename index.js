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
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
// Add support for encoding types
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// Set up stylesheets
app.get('/public/stylesheets/bootstrap.min.css', function(req,res) { res.send('public/stylesheets/bootstrap.min.css'); res.end();});
app.get('/public/stylesheets/bootstrap.css.map', function(req,res) { res.send('public/stylesheets/bootstrap.css.map'); res.end(); });
app.get('/public/stylesheets/style.css', function(req, res){ res.send('public/stylesheets/style.css'); res.end(); });
app.use(express.static(path.join(__dirname, '/public')));

// Set up Mongo client
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');  
var util=require('util');
var url = 'mongodb://admin:student@localhost:27017/users?authSource=admin';
// var url = 'mongodb://localhost:27017/users';
var db;
var query;
var currentCollection;

connectToDatabase();

// Display home page with search form
app.get("/", function(req, res) {
    // Display search form
    res.render('search', {
        searching: true
    });
});

// Display results after back button pressed
app.get("/showResults", function(req, res) {
    // Show results
    console.log("Getting results...");
    showResults(res);
});

// Display results after search form submitted
app.post("/showResults", function(req, res) {
    // Get the user's collection choice
    chosenCollection = req.body.database;
    console.log("User chose the database collection " + chosenCollection);

    if (!currentCollection || currentCollection != chosenCollection) {
        currentCollection = chosenCollection;
    }
    
    // Save query as a global
    query = req.body.query;
    // Show results
    console.log("Posting results...");
    showResults(res);
});


// Displays individual review
app.get("/viewReview", function(req, res) {
    // Get review ID from URL
    var reviewID = req.query.reviewID;

    // Find review using its review ID
    db.collection(currentCollection).find({
        review_id: new RegExp(reviewID)
    }).toArray(function(err, reviews) {
        // Show first review (necessary in case of mongodb duplicity)
        showReview(reviews[0], res);
    });
});

// Adds comment to review and displays updated review
app.post("/viewReview", function(req, res) {
    // Get comment and review ID
    var comment = req.body.comment;
    var reviewID = req.query.reviewID;
    
    // Insert comment and display updated review 
    db.collection(currentCollection).findOneAndUpdate(
        // Review to find
        { review_id: new RegExp(reviewID) },
        // Add comment to comments array,
        // $addToSet checks if array exists first & if nonexistent, creates array 
        { $addToSet: { "comments" : comment } },
        // Return updated tweet, not the original
        { returnOriginal: false },
        function(err, result) {
            console.log("Added comment to review " + result.value.review_id);
            // Show updated review
            showReview(result.value, res);
        }
    );
});

// Displays individual review
app.get("/viewTweet", function(req, res) {
    // Get review ID from URL
    var tweetID = parseInt(req.query.tweetID);

    // Find review using its review ID
    db.collection(currentCollection).find({
        id: tweetID
    }).toArray(function(err, tweets) {
        // Show first review (necessary in case of mongodb duplicity)
        showTweet(tweets[0], res);
    });
});

// Adds comment to tweet and displays updated tweet
app.post("/viewTweet", function(req, res) {
    // Get comment and tweet ID
    var comment = req.body.comment;
    var tweetID = parseInt(req.query.tweetID);

    // Insert comment and display updated tweet
    db.collection(currentCollection).findOneAndUpdate(
        // Tweet to find
        { id: tweetID },
        // Add comments to comments array
        { $addToSet: { "comments" : comment }},
        // Return updated tweet
        { returnOriginal: false },
        function(err, result) {
            console.log("Added comment to tweet " + result.value.id);
            // Show updated tweet
            showTweet(result.value, res);
        }
    );
});

// Tells app to listen on port 3000
app.listen(3000, function() {
    console.log("App listening on localhost:3000");
});

// Connects to database and both collections, tweets_sandy & reviewYelp2
function connectToDatabase() {
    // Connect to Mongo database 'users'
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        db = client.db('users');
        console.log("Connected to users");

        // Connect to 'reviewYelp2' collection
        db.collection("reviewYelp2", { }, function(err, coll) {
            console.log("Connecting to reviewYelp2");
            if (err !== null) {
                console.log(err);
            }
            // Index the 'reviewYelp2' collection based on field "text"
            db.ensureIndex("reviewYelp2", { document: "text"}, function(err, indexname) {
                assert.equal(null, err);
                console.log("Created index for reviewYelp2 collection");
            });
        });

        // Connect to 'tweets_sandy' collection 
        db.collection("tweets_sandy", { }, function(err, coll) {
            console.log("Connecting to tweets_sandy");
            if (err !== null) {
                console.log(err);
            }
            // Index the 'tweets_sandy' collection based on field "text"
            db.ensureIndex("tweets_sandy", { document: "text"}, function(err, indexname) {
                assert.equal(null, err);
                console.log("Created index for tweets_sandy collection");
            });
        });
    });
}

// Creates HTML for list of results 
function pagelist(items) {
    result = "<div class='list-group'>";
    // If collection is reviewYelp2, format this way
    if (currentCollection == 'reviewYelp2') {
        items.forEach(function(item) {
            // Add document description
            str = "<a href='/viewReview?reviewID=" + item.review_id + "' class='list-group-item list-group-item-action'>Date: " + item.date + "<br/>Review ID: " + item.review_id + "</a></li>";
            result = result + str;
        });
    } else if (currentCollection == 'tweets_sandy') {
        // If collection is tweets_sandy, format this way 
        items.forEach(function(item) {
            // Add document description
            str = "<a href='/viewTweet?tweetID=" + item.id + "' class='list-group-item list-group-item-action'>Date: " + item.createdAt + "<br/>User: " + item.fromUser + "</a></li>";
            result = result + str;
        });
    }

    result = result + "</div>";
    return result;
}

// Queries database & shows results matching query
function showResults(res) {
    console.log("Showing results...");

    // Show results matching query and display in asc order by date
    db.collection(currentCollection).find({
        text: new RegExp(query)
    }).sort({date: 1}).toArray(function(err, items) {
        // Render page with list of results
        res.render('search', {
            // Pass HTML 
            helpers: {
                message: function() {return pagelist(items);}
            },
            // Hide search form
            searching: false,
            // Display what the query was
            query: query
        });
    });
}

// Displays review document
function showReview(review, res) {
    // Check if review contains comments
    var hasComments = false;
    if (review.comments) {
        hasComments = true;
    }

    // Show review with viewDocument.handlebars
    res.render('viewDocument', {
        showTweet: false,
        showReview: true,
        // Show comments if review contains comments
        showComments: hasComments,
        comments: review.comments,
        // Show other pieces of review
        reviewId: review.review_id,
        businessId: review.business_id,
        date: review.date,
        stars: review.stars,
        useful: review.useful,
        funny: review.funny,
        cool: review.cool,
        text: review.text
    });
}

// Displays tweet document
function showTweet(tweet, res) {
    // Check if tweet contains comments
    var hasComments = false;
    if (tweet.comments) {
        hasComments = true;
    }

    // Show tweet with viewDocument.handlebars
    res.render('viewDocument', {
        showTweet: true,
        showReview: false,
        // Show comments if tweet contains comments
        showComments: hasComments,
        comments: tweet.comments,
        // Show other pieces of tweet
        tweetId: tweet.id,
        userHandle: tweet.fromUser,
        userName: tweet.fromUserName,
        date: tweet.createdAt,
        latitude: tweet.latitude,
        longitude: tweet.longitude,
        text: tweet.text
    });
}
