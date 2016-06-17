var k = function(k) {
	var width = k.windowWidth
	var height = k.windowHeight

	k.setup = function() {
		k.createCanvas(width, height)
		mic = new p5.AudioIn();
		mic.start()
		sound = mic.getLevel()
		fft = new p5.FFT();
		
	}

	k.draw = function() {
		// var c = (0, 255, 255)
		k.background(0)
		fft.setInput(mic)
		waveform = fft.waveform()
		var hw = height/2 //half way point
		var hh = width/2 //half way point
		var fraction

		// debugger

		fft.analyze()
		// debugger
		for(var i = 200; i < waveform.length; i++) {
			value = k.map(waveform[i], -1, 1, -255, 255)
			var i_width = (i / waveform.length) * width
			var c = k.color(
				sound > 100? 0: fft.getEnergy('bass', 'lowMid'), 
				k.random(0, 255), 
				k.abs(value)
			)
			// console.log(fft.getEnergy('mid', 'treble'))
			k.stroke(c)
			k.strokeWeight(10)
			k.line(hh, i_width*3, hh+value, i_width)
		}
	}
}

var scratch = new p5(k)
