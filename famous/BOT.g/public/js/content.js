
//actual content 
var content = "<div id='Menu' style='padding: 1em;'> \
	<h1>Welcome, to my playground.</h1> \
	<p id='name'> Fayadh al-Mosawi, Web Developer. </p><br> \
	<span id='ibashDescription'> this is the <em>ibash</em> project, an experimental, dynamic, <br> personal space  concept built for the web. <br><br> <hr> <span id='clickIbash'> Click on ibash to proceed. <br> or you can play BOT.g on the left. <br><br> \
	P.S. This is <em> NOT </em> meant to be a 'user-friendly' and 'obvious' website. <br> The point is to induce mystery, and maximize curiosity. \
	<br><br>\
	<!-- <em><strong>SCORE</strong><em>: \
	 <div id='score-form'> \
		<form id='form'> \
		</form> \
	</div> --> \
	</span></span> \
	<br><br><br><br> <br><br><br><br> \
	<div class='console'> \
	<span id='cd2'>  \
		<img id='bashImage' src='images/ibash_title2.png' height='50%' style='position: absolute;' class='/>  \
	</span> \
	<span id='cd1'>  \
		<em><strong> ~ibash </strong> </em>  \
	</span> \
	<form method='post' action='/'>	 \
		<input id='cd1' name='command' placeholder='Hi! :) Confused? type: open world'></input><br> \
		<input id='hiddenButton' type='submit' name='Submit' style='display: none;'></button> \
	</form> \
	<span id='cdexample'><em> ex: open world, botg. </em></span> \
	<hr> \
	<div id='subContentContainer' style='overflow: auto;'>  \
		<table> \
		</table> \
	</div> \
</div>";

//content container
var contentSurface = new Surface({ 
	size: [,],
	content: content,
	properties: {
		backgroundColor: "yellow",
		zIndex: -1,
		color: "black",
		opacity: "0.4"
	} 
})

var contentStateModifier = new StateModifier ({
	transform: Transform.translate(860, 0),
});

mainContext.add(contentStateModifier).add(contentSurface);