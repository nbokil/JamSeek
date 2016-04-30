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
		$.ajax({
			url: './users',
			type: 'PUT',
			data: { firstname: first_name, lastname: last_name, email: user_email, 
				username: user_name, password: user_password },
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

//------------------------------ANSWERS FUNCTIONALITY-------------------------------------------
	
	$('#answer').on('click', getAnswers);

	function getAnswers(event) {
		$.ajax({
			url: './answers',
			type: 'GET',
			success: function(result) {
				$('#mysongs').html(result);
			}
		})
	}

});