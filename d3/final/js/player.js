// $(function(){

// function RandomColor() {
//   var letters = '0123456789ABCDEF'.split('');
//   var color = '#';
//   for (var i = 0; i < 6; i++ ) {
//     color += letters[Math.floor(Math.random() * 16)];
//   }
//   return color;
// }

// //FAKE DATA
// var playerData = [
// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 133.11,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// },
// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 173.21,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// },
// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 33.16,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// },
// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 83.47,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// },
// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 123.24,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// },

// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 153.33,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// },
// {
// "GamesPlayed"     : 4,
// "MinionsKilled"   : 200.84,
// "GoldEarned"      : 11737,
// "KillDeath_Ratio" : 0.89,
// "Assists"         : 7.69,
// "DamageDealt"     : 147945,
// "DamageTaken"     : 26054,
// "color"           : RandomColor()
// }];

// d3.select(".players")
// 	.append("div")
// 		.attr("class", "playerContainer")
// 	.append("div")
// 		.attr("class", "chart row")
// 	.selectAll(".bar")
// 	.data(playerData)
// 	.enter()
// 	.append("div")
// 		.attr("class", "line row")
// 	//skillLabel
// 	d3.selectAll("div.line")
// 		.append("div")
// 			.attr("class", "skillLabel large-3 medium-3 small-3 columns")
// 			.text(function(d) { return d.Assists })

// 	d3.selectAll("div.line")
// 			.append("div")
// 				.attr("class","barContainer large-3 medium-3 small-3 columns")
// 			.append("div")
// 				.attr("class", "bar")
// 				.style("width", function(d) { return d.MinionsKilled + "px" })
// 				.style("height", "25px")
// 				.style("background-Color", function(d) { return d.color })
// 				.style("border-radius", "0 10px 10px 0")
// 				.style("text-align", "right")
// 				.style("color", "white")
// 				.style("font-family", "Arial")
// 				.style("padding", "0.5em 0 0 0.5em")
// 				.style("line-height", "30%")


// 	d3.selectAll("div.line")
// 					.append("div")
// 						.attr("class", "large-3 medium-3 small-3 columns")
// 						.text("text")

// 	});










