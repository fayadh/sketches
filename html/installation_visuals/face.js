var f = function(f) {
	f.setup = function() {
		docW = $(document).width();
		docH = $(document).height();
		f.createCanvas(docW, docH);
		mic = new p5.AudioIn();
		mic.start();
	}

	f.draw = function() {
		if(mic.getLevel() * 1000 > 10) {
			
		}
	}
}

var face = new p5(f)