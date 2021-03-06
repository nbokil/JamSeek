/*
 * This model uses the Node.js MongoDB Driver.
 * To install:  npm install mongodb --save
 */
var mongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcryptjs'); //used for encrypting password

/*
 * This connection_string is for mongodb running locally.
 * Change nameOfMyDb to reflect the name you want for your database
 */
var connection_string = 'localhost:27017/jamSeek';
/*
 * If OPENSHIFT env variables have values, then this app must be running on 
 * OPENSHIFT.  Therefore use the connection info in the OPENSHIFT environment
 * variables to replace the connection_string.
 */
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}
// Global variable of the connected database
var mongoDB; 

// Use connect method to connect to the MongoDB server
mongoClient.connect('mongodb://'+connection_string, function(err, db) {
  if (err) doError(err);
  console.log("Connected to MongoDB server at: "+connection_string);
  mongoDB = db; // Make reference to db globally available.
});

/********** CRUD Create -> Mongo insert ***************************************
 * @param {string} collection - The collection within the database
 * @param {object} data - The object to insert as a MongoDB document
 * @param {function} callback - Function to call upon insert completion
 *
 * See the API for more information on insert:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#insertOne
 */
exports.create = function(collection, data, callback) {
  //If creating new user, need to encrypt password before storing
  if (collection == "users") {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(data.password, salt);
    data.password = hash;
    data.points = 0;
  }

  //If collection is answers, update points for user to display on leaderboard
  if (collection == "answers") {
    mongoDB.collection("users").update(
      {username: data.answered_by},
      {"$inc": {"points": 10}}
    );
  }

  // Do an asynchronous insert into the given collection
  mongoDB.collection(collection).insertOne(
    data,                     // the object to be inserted
    function(err, status) {   // callback upon completion
      if (err) doError(err);
      // use the callback function supplied by the controller to pass
      // back true if successful else false
      var success = (status.result.n == 1 ? true : false);
      callback(success);
    });
}

exports.retrieveAll = function(collection, callback) {
  mongoDB.collection(collection).find().sort( { points: -1, username: 1 }).toArray(function(err, docs) {
    if (err) doError(err);
    // docs are MongoDB documents, returned as an array of JavaScript objects
    // Use the callback provided by the controller to send back the docs.
    callback(docs);
  });
}

//retrieve random song for gameplay that is not a song requested by current user
exports.retrieveSong = function(collection, query, callback) {
  var count = mongoDB.collection(collection).count({$and: [{username: {$ne: query.user}}, {answer: ''}]});
  count.then(
    function(value) {
      var rand = Math.floor( Math.random() * value);
      var song = mongoDB.collection(collection).find( {$and: [{username: {$ne: query.user}}, {answer: ''}]} ).limit(-1).skip(rand).toArray();
      song.then(
        function(randsong) {
          callback(randsong);
        },
        function(error){
          console.log(error);
        });
    },
    function(error) {
      console.log(error);
    }
  );
}

/********** CRUD Retrieve -> Mongo find ***************************************
 * @param {string} collection - The collection within the database
 * @param {object} query - The query object to search with
 * @param {function} callback - Function to call upon completion
 *
 * See the API for more information on find:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#find
 * and toArray:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Cursor.html#toArray
 */
exports.retrieve = function(collection, query, callback) {
  //If user is logging in, need to decrypt stored password to check with password user entered
  if (collection == "users") {
    var user = query.username;
    var search = {};
    search.username = user;
    //First, search for users with entered username
    mongoDB.collection(collection).find(search).toArray(function(err, docs) {
      //If no users found, callback empty []
      if (docs.length == 0) {
        callback(docs);
      }
      //If users found (should only be 1 user since username is unique!), check if password matches hash password
      else {
        var password = docs[0].password;
        var match = bcrypt.compareSync(query.password, password);
        if (match == true) {
          callback(docs);
        }
        else {
          callback([]);
        }
      }
    });
  }
  else{
    /*
     * The find sets up the cursor which you can iterate over and each
     * iteration does the actual retrieve. toArray asynchronously retrieves the
     * whole result set and returns an array.
     */
    mongoDB.collection(collection).find(query).toArray(function(err, docs) {
      if (err) doError(err);
      // docs are MongoDB documents, returned as an array of JavaScript objects
      // Use the callback provided by the controller to send back the docs.
      callback(docs);
    });
  }
}

/********** CRUD Update -> Mongo updateMany ***********************************
 * @param {string} collection - The collection within the database
 * @param {object} filter - The MongoDB filter
 * @param {object} update - The update operation to perform
 * @param {function} callback - Function to call upon completion
 *
 * See the API for more information on insert:
 * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#updateMany
 */
exports.update = function(collection, filter, update, callback) {
  mongoDB
    .collection(collection)     // The collection to update
    .updateOne(                // Use updateOne to only update 1 document
      filter,                   // Filter selects which documents to update
      update,                   // The update operation
      {upsert:true},            // If document not found, insert one with this update
                                // Set upsert false (default) to not do insert
      function(err, status) {   // Callback upon error or success
        if (err) doError(err);
        callback('Modified '+ status.modifiedCount 
                 +' and added '+ status.upsertedCount+" documents");
        });
}

var doError = function(e) {
        console.error("ERROR: " + e);
        throw new Error(e);
    }
