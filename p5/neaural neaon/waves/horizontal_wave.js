var k = function(k) {
	var width = k.windowWidth
	var height = k.windowHeight

	k.preload = function() {
		
	}

	k.setup = function() {
		k.createCanvas(width, height)
		rocket = k.loadImage('rocket.png', function() {
				k.image(rocket, height/2, width/2, 100, 100)
		}, function(err) {
			console.log(err)
		})

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
		for(var i = 0; i < waveform.length - 600; i++) {
			value = k.map(waveform[i], -1, 1, -255, 255)
			var i_width = (i / waveform.length) * width
			var c = k.color(
				sound > 1? 0: k.random(100, 255),
				k.random(0, 255), 
				k.abs(value)
			)
			// console.log(fft.getEnergy('mid', 'treble'))
			k.stroke(c)
			k.strokeWeight(10)
			k.line(i_width*3, hw, i_width, hw+value)
			k.image(rocket, width/2, height/2 - 120)
		}
	}
}

var scratch = new p5(k)
