# ISTE 610 MongoDB Project

## Authors:

- Shatha Alotaibi
- Alexander Kramer
- Brienna Herold

## Program description: 

A basic search application that queries a Yelp review dataset.

## Program functionality:

- Connects to database and shows connection process at startup. 
- Presents user with web-based display that asks the user for a query string, supporting partial words.
- Response to user's request presents the user with a selection list of reviews answering the request, but not the content of the review.
- Once presented with the selection list, the user can select the desired document to view the content.
- User can search again and again until exiting page. 
- User has the ability to add comments to the selected document.

## How to use: 

### Set up database

Extract mongo_proj.tar.gz, cd to its root folder, then set up the database:

	mongoimport -u admin -p student --authenticationDatabase admin --db users --collection reviewYelp2  --file review15.json

If you are using a computer other than the lab computer, you'll need to set `url` in index.js to `mongodb://localhost:27017/users` and set up the database this way:

	mongoimport --db users --collection reviewYelp2 --file review15.json

### Run search application

Install the dependencies (mongodb, express, express-handlebars, hbs), then run the application:

	npm init 

	npm install mongodb --save

	npm install express

	npm install express-handlebars

	npm install hbs 

	node index.js



