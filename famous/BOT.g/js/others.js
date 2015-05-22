Element.prototype.remove = function() {
		    this.parentElement.removeChild(this);
		}
		NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
		    for(var i = 0, len = this.length; i < len; i++) {
		        if(this[i] && this[i].parentElement) {
		            this[i].parentElement.removeChild(this[i]);
		        }
		    }
		}


var db = { 
	"docs" : {
		"popular" : [
			{ "command": "open world", "description": "use this to access my resume.", "example":"" },
			{ "command": "botg", "description": "play the game BOT.g", "example":"" },
			{ "command": "share botg [insert social network]", "description": "share the game BOT.g", "example":"share botg facebook" },
			{ "command": "facebook", "description": "my facebook page", "example":"" },
			{ "command": "github", "description": "my github page", "example":"" },
			{ "command": "linkedin", "description": "my linkedin page", "example":"" },
			{ "command": "soundcloud", "description": "my soundcloud page", "example":"" },
			{ "command": "music", "description": "music from Me&MyAI", "example":"" },
			{ "command": "1080p", "description": "WebGL container full screen.", "example":"" },
			{ "command": "720p", "description": "back to normal size.", "example":"" },
			{ "command": "youtube", "description": "my youtube page", "example":"" },
			{ "command": "expresspad", "description": "turns the grid to paper and allows you to draw", "example":"share botg facebook" },
		]
	}
}

$(function() {

	//build docs
	for(var i = 0; i < db.docs.popular.length; i++) {
		$('table').append('<tr><td>'+ db.docs.popular[i].command +'</td><td>' + db.docs.popular[i].description + '</td></tr>')
	}

	//setup toggle
	$('hr').hide();
	$('#subContentContainer').hide();
	$('td').hide();
	$('#cdexample').hide();
	$('#cd1').hide();
	$('input').hide();

	$('#cd2').on('click', function(){
		$('#cd2').toggle(150);
		$('#cd1').toggle(150);
		$('input').toggle(150);
		$('hr').toggle(150);
		$('#subContentContainer').toggle(150);
		$('#cdexample').toggle(150);
		$('td').toggle(150);
		$('#clickIbash').hide();
	})

	$('#cd1').on('click', function(){
		$('#cd1').toggle(150);
		$('#cd2').toggle(150);
		$('input').toggle(150);
		$('hr').toggle(150);
		$('#subContentContainer').toggle(150);
		$('#cdexample').toggle(150);
		$('td').toggle(150);
		$('#clickIbash').toggle(150);
	})

})
	
// $(function(){
// 	    $('input').keypress(function(e){
// 	      if(e.keyCode==13)
// 	      $('#hiddenButton').click();
// 	    });
// 		});

