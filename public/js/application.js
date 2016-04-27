$(document).ready(function() {

//------------------------------SONGS FUNCTIONALITY-------------------------------------------

	//Create functionality for songs
	$('#requestSong').submit(addSong);

	//show a user's songs when they are on the song page
	$.ajax({
			url: './songs',
			type: 'GET',
			success:function(result) {
				$('#mysongs').html(result);
			}
		});

	function addSong(event) {
		var genre = $('#genre').val();
		var lyrics = $('#lyrics').val();
		var tempo = $('input[type="radio"][name="speed"]:checked').val();
		var age = $('#age').val();
		var location = $('#location').val();
		var extras = $('#extras').val();
		var answer = null;
		$.ajax({
			url: './songs',
			type: 'PUT',
			data: { genre: genre, lyrics: lyrics, tempo: tempo, age: age, location: location, extras: extras, answer: answer },
			success: function(result) {
				$('#success').html(result);
			}
		});
	}

//-----------------------------USER LOGIN AND REGISTRATION CR FUNCTIONALITY----------------------------------------

	//CR functionality for users
	$('#login').submit(login_user); //read logged in user
	$('#register').submit(new_user); //create new user

	//show leaderboard when user loads / is on the home page
	$.ajax({
			url: './allusers',
			type: 'GET',
			success:function(result) {
				$('#leaderboard').html(result);
			}
		});

	function login_user(event) {
		var user_name = $('#login input')[0].value;
		var user_password = $('#login input')[1].value;
		$.ajax({
			url: './users',
			type: 'GET',
			data: { username: user_name, password: user_password },
			success: function(result) {
				if (result.length == 0) {
					$('#error').html("<p>Incorrect username or password. Please try again!</p>");
				}
				console.log("Successfully found user!");
				window.location.reload(true);
			},
			error: function(response, status) {
				alert("Incorrect username or password. Please try again!");
			}
		});
		event.preventDefault();
	}

	function new_user(event) {
		var first_name = $('#register input')[0].value;
		var last_name = $('#register input')[1].value;
		var user_email = $('#register input')[2].value;
		var user_name = $('#register input')[3].value;
		var user_password = $('#register input')[4].value;
		var user_points = 0;
		$.ajax({
			url: './users',
			type: 'PUT',
			data: { firstname: first_name, lastname: last_name, email: user_email, 
				username: user_name, password: user_password, points: user_points },
			success: function(result) {
				$('#error').html("<p>Congrats! You've been added to our system. Enter your login information below to get started.</p>");
				console.log("Successfully added user to system!");
			}
		});
		event.preventDefault();
	}

//------------------------------GAMEPLAY FUNCTIONALITY-------------------------------------------

	$('#next').on('click', gamePlay);
	$('#answerSong').submit(answerSong);

	function gamePlay() {
		$('#game').html('');
		var game_display = '<center>'
		$('#game').append(game_display);
		$.ajax({
			url: './rand_song',
			type: 'GET',
			success: function(result) {
				$('#game').append(result);
			},
			error: function(response, status) {
				console.log(response);
				alert("Game currently not functioning. We are sorry for the inconvenience!");
			}
		});
	}

	function answerSong(event) {
		event.preventDefault();
		var song = $('#answerSong input')[0].value;
		var user = $('#hiddenuser input')[0].value;
		if (song == "") {
			gamePlay();
		}
		else {
			$.ajax({
				url: './answers',
				type: 'PUT',
				data: { requested_by: user, answer: song },
				success: function(result) {
					gamePlay();
					$('#name').val("");
				}
			});
		}
	}






//------------------------------YUMMLY API CALL-------------------------------------------

	//API Call: Search for recipes using 3 leftover ingredients submitted by users
	$('#leftovers').submit(getLeftoverRecipes);

	//Perform GET recipe functions for finding recipe IDs, then SEARCH recipe function to get ingredients
	function getLeftoverRecipes(event) {
		var ingredient_1 = $('#leftovers input')[0].value;
		var ingredient_2 = $('#leftovers input')[1].value;
		var ingredient_3 = $('#leftovers input')[2].value;
		//clear search inputs
		$('#leftovers input')[0].value = "";
		$('#leftovers input')[1].value = "";
		$('#leftovers input')[2].value = "";

		//below information received from API documentation
		//following example pattern of: http://api.yummly.com/v1/api/recipes?_app_id=YOUR_ID&_app_key=YOUR_APP_KEY
		try{
			$.ajax({ 
			url: 'http://api.yummly.com/v1/api/recipes?', 
            type: 'GET',
            data: {
            	"_app_id": "bb50ec71",
            	"_app_key": "dd855000279fc5780e8a0e9ae507d0e7",
            	"allowedIngredient[]": [ingredient_1, ingredient_2, ingredient_3]
            }, 
            success: function(result) {
            	$('#leftover_results').empty();
            	console.log('successfully called ajax for recipe search!');
            	if (result.matches.length == 0) {
            		$('#leftover_results').append("<p>Sorry we could not find any recipes with those ingredients. Please try another search!</p>");
            	}
            	else {
            		searchRecipes(result.matches); //calls function to search for recipes using result IDs
            	}
            	console.log(result);
            },
            error: function(response){
                console.log(response);                
            },
            dataType: "jsonp",
            crossDomain: true
        	});
			return false;
		} catch (e) {console.log(e.description);}

	}

	function searchRecipes(data) {
		$.each(data, function() {
			var food = this;
			//GET the ID of each matched recipe, and perform another API request to search for specific ingredients
			//below information received from API documentation
			//following example pattern of: http://api.yummly.com/v1/api/recipe/recipe-id?_app_id=YOUR_ID&_app_key=YOUR_APP_KEY
			try{
				$.ajax({ 
				url: 'http://api.yummly.com/v1/api/recipe/'+food.id+'?', 
	            type: 'GET',
	            data: {
	            	"_app_id": "bb50ec71",
	            	"_app_key": "dd855000279fc5780e8a0e9ae507d0e7"
	            }, 
	            success: function(result) {
	            	console.log('successfully called ajax for ingredient search!');
	            	showIngredients(result);
	            	console.log(result);
	            },
	            error: function(response){
	                console.log(response);                
	            },
	            dataType: "jsonp",
	            crossDomain: true
	        	});
				//return false;
			} catch (e) {console.log(e.description);}
		});
	}

	function showIngredients(data) {
		var result = "";
		//create left col with Recipe name and picture
		result += "<div class='row'><div class='col-md-6'><h3><a href='"+data.source.sourceRecipeUrl+"' target='_blank'>"+data.name+"</a></h3>";
		result += "<img class='img-responsive' src='"+data.images[0].hostedLargeUrl+"'></div>";
		//create right col with Recipe information and ingredients
		result += "<div class='col-md-6' id='recipePic'><h4><span class='glyphicon glyphicon-user'></span> "+data.numberOfServings+" servings</h4><h4><span class='glyphicon glyphicon-time'></span> "+data.totalTime+"</h4><h4><span class='glyphicon glyphicon-star-empty'></span> "+data.rating+" stars</h4>";
		result += "<h4>Ingredients:</h4><ul>"
		//List out ingredients
		$.each(data.ingredientLines, function() {
			ingredient = this;
			result += "<li>"+ingredient+"</li>"
		});
		result += "</ul></div>";
		$('#leftover_results').append(result);
	}

});