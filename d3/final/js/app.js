// d3 works in the following manor: 
// to add a new element: 
// selectAll('foo').data('fooData').enter().append('foo')
// .enter() basically tells us to "do the following with whatever makes it through the pipeline"
function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

$(function() {
	var jsonSquares = [
	{ "width": 20, "height": 20, "color": "green", "transform": randomIntFromInterval(0, 100)},
	{ "width": 40, "height": 40, "color": "red", "transform": randomIntFromInterval(0, 100)}
	];

	var body = d3.select("body")
							.append("div")

	var svg = body.append("svg")
								.attr("width", 300)
								.attr("height", 300)

	var rectangles = svg.selectAll("rect")
											.data(jsonSquares)
											.enter()
											.append("rect")

	var rectangleAttributs = rectangles
													.attr("width", function(d) { return d.width })
													.attr("height", function(d) { return d.height})
													.attr("transform", function(d) { return "translate(" + d.transform + ")"})
													.style("fill", function(d) { return d.color })
})


$(function() {
	var playerData = [
		{ "name": "lardin", "age": 26, "member_since": "April 23, 2011", "" },
		{}
	]
})
