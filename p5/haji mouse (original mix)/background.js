//background

var b = function(b) { 
	var mic; 
	b.setup = function() {
		docW = $(document).width();
		docH = $(document).height();
		b.createCanvas(docW, docH);
		mic = new p5.AudioIn();
		mic.setSource(0)
		mic.start();
		//setup your artwork here 
		b.background(51);
	}

	var x = 0
	var audio = new p5.AudioIn()
	
	b.draw = function() {
		for (var i = 0; i < 5; i++) {
			var sound = mic.getLevel() * 1000
			c = b.color(
				b.random(120, 255),
				sound > 1? mic.getLevel() * 1000: b.random(100, 255),
				b.random(mic.getLevel() * 1000, 255))
			b.noStroke()
			b.fill(c)
			b.ellipse(b.random(0, docW), b.random(0, docH), 50, 50)
			b.stroke(0, 0, 0)
			b.fill(0, 0, 0)
			b.ellipse(b.random(0, docW), b.random(0, docH), 50, 50)
		};

		document.getElementsByTagName("BODY")[0].onresize = function() { 
			width = $(document).width()
			$('.inner').css('left', width/2)
		}
	}
}

var mainBackground = new p5(b)