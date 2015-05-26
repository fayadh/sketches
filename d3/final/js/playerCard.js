$(function(){
	function RandomColor() {
	  var letters = '0123456789ABCDEF'.split('');
	  var color = '#';
	  for (var i = 0; i < 6; i++ ) {
	    color += letters[Math.floor(Math.random() * 16)];
	  }
	  return color;
	}

	//FAKE DATA
		var playerData = [
		{
		"GamesPlayed"     : 4,
		"MinionsKilled"   : 133.11,
		"GoldEarned"      : 13737,
		"KillDeath_Ratio" : 0.89,
		"Assists"         : 7.69,
		"DamageDealt"     : 147945,
		"DamageTaken"     : 26054,
		"color"           : RandomColor(),
		},
		{
		"GamesPlayed"     : 4,
		"MinionsKilled"   : 173.21,
		"GoldEarned"      : 8737,
		"KillDeath_Ratio" : 0.89,
		"Assists"         : 7.69,
		"DamageDealt"     : 147945,
		"DamageTaken"     : 26054,
		"color"           : RandomColor()
		},
		{
		"GamesPlayed"     : 4,
		"MinionsKilled"   : 33.16,
		"GoldEarned"      : 4737,
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
	for(var i = 0; i < 3; i++) {
		d3.select(".mainBodyContainer")
			.append("div")
				.attr("class", "playerCard"+ i +" row")
				.style("background-Color", RandomColor())
				.style("border", "solid 10px black")
			.append("div")
				.attr("class", "playerInfo" + i + " large-4 columns")
				.append("div")
					.attr("class", "playerPic" + i + " large-12 columns")
					.append("img")
						.attr("src", "http://rankedboost.com/file/2014/09/unranked-season-rewards-lol.png")

		d3.select(".playerInfo" + i)
			.append("div")
				.attr("class", "playerBio" + i + " large-12 columns")
				.text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec at bibendum metus, nec rhoncus eros. In tristique scelerisque sagittis. Suspendisse venenatis ullamcorper massa, ut facilisis mauris bibendum sed. Ut vestibulum aliquam felis, a feugiat justo porta id. Pellentesque et justo quam.")


		d3.select(".playerCard" + i)
			.append("div")
				.attr("class", "playerStats" + i + " large-8 columns")
				
		var skillname = ['MinionsKilled','GoldEarned', "KillDeath_Ratio", "Assists"]
		for(var j = 0; j < skillname.length; j++) {
			d3.select(".playerStats" + i)
				.append("div")
					.attr("class", "playerSkillContainer" + j + " large-12 columns")
					.append("div")
						.attr("class", "playerSkillLabel" + j + " large-2 columns")
							.text(skillname[j])
							.style("background-Color", "red")

			siloarray = [playerData[i]]
			console.log(playerData[i])
			console.log(siloarray[0].Assists)
			

			d3.select(".playerStats" + i + " .playerSkillContainer" + j)
				.append("div")
					.attr("class", "playerBarContainer"+ j + " large-10 columns")
					.selectAll(".playerBar")
					.data(siloarray)
					.enter()
					.append("div")
						.attr("class", "playerBar")
						.style("width", function(d) { 
							console.log(skillname[j])
							return d[skillname[j]] + "px" 
						})
						.style("height", "25px")
						.style("background-Color", function(d) { return d.color })
						.style("border-radius", "0 10px 10px 0")
						.style("text-align", "right")
						.style("color", "white")
						.style("font-family", "Arial")
						.style("padding", "0.5em 0 0 0.5em")
						.style("line-height", "30%")
			}
		}
	})

// d3.select(".playerSkillContainer" + j)
// .append("div")
// 	.attr("class", "playerBarContainer"+ j + " large-12 columns")
// 	.selectAll(".playerBar")
// 	.data(siloarray)
// 	.enter()
// 	.append("div")
// 		.attr("class", "playerBar")
// 		.style("width", function(d) { return d.GoldEarned/100 + "px" })
// 		.style("height", "25px")
// 		.style("background-Color", function(d) { return d.color })
// 		.style("border-radius", "0 10px 10px 0")
// 		.style("text-align", "right")
// 		.style("color", "white")
// 		.style("font-family", "Arial")
// 		.style("padding", "0.5em 0 0 0.5em")
// 		.style("line-height", "30%")
// 		.text("goldEarn")
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











