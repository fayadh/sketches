$(function(){

function RandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


// playerData is an array of many objects.


//FAKE DATA
var playerData = [
{
"GamesPlayed"     : 4,
"MinionsKilled"   : 133.11,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
},
{
"GamesPlayed"     : 4,
"MinionsKilled"   : 173.21,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
},
{
"GamesPlayed"     : 4,
"MinionsKilled"   : 33.16,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
},
{
"GamesPlayed"     : 4,
"MinionsKilled"   : 83.47,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
},
{
"GamesPlayed"     : 4,
"MinionsKilled"   : 123.24,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
},

{
"GamesPlayed"     : 4,
"MinionsKilled"   : 153.33,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
},
{
"GamesPlayed"     : 4,
"MinionsKilled"   : 200.84,
"GoldEarned"      : 11737,
"KillDeath_Ratio" : 0.89,
"Assists"         : 7.69,
"DamageDealt"     : 147945,
"DamageTaken"     : 26054,
"color"           : RandomColor()
}
];

//




d3.select(".mainBodyContainer")
	.append("div")
		.attr("class", "playerCard row")
	.append("div")
		.attr("class", "playerInfo large-4 columns")
		.append("div")
			.attr("class", "playerPic large-12 columns")

d3.select(".playerInfo")
	.append("div")
		.attr("class", "playerBio large-12 columns")

d3.select(".playerCard")
	.append("div")
		.attr("class", "playerStats large-8 columns")
	.append("div")
		.attr("class", "playerSkillContainer row")
		.append("div")
			.attr("class", "playerSkillLabel large-2 columns")

for(var i = 0; i < 5; i++) {
	console.log(playerData[i])
	siloarray = [playerData[i]]

	d3.select(".playerSkillContainer")
		.append("div")
			.attr("class", "playerBarContainer large-10 columns")
			.selectAll(".playerBar")
			.data(siloarray)
			.enter()
			.append("div")
				.attr("class", "playerBar")
				.style("width", function(d) { return d.MinionsKilled + "px" })
				.style("height", "25px")
				.style("background-Color", function(d) { return d.color })
				.style("border-radius", "0 10px 10px 0")
				.style("text-align", "right")
				.style("color", "white")
				.style("font-family", "Arial")
				.style("padding", "0.5em 0 0 0.5em")
				.style("line-height", "30%")

		d3.select(".playerSkillContainer")
		.append("div")
			.attr("class", "playerBarContainer large-10 columns")
			.selectAll(".playerBar")
			.data(siloarray)
			.enter()
			.append("div")
				.attr("class", "playerBar")
				.style("width", function(d) { return d.GoldEarned/100 + "px" })
				.style("height", "25px")
				.style("background-Color", function(d) { return d.color })
				.style("border-radius", "0 10px 10px 0")
				.style("text-align", "right")
				.style("color", "white")
				.style("font-family", "Arial")
				.style("padding", "0.5em 0 0 0.5em")
				.style("line-height", "30%")
				.text("goldEarn")
}

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

	});










