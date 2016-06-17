var k = function(k) {
	var width = k.windowWidth
	var height = k.windowHeight

	k.setup = function() {
		k.createCanvas(width, height)
		mic = new p5.AudioIn();
		mic.start()
		
		fft = new p5.FFT();
	}

	k.draw = function() {
		k.clear()
		fft.setInput(mic)
		waveform = fft.waveform()
		var hp = height/2 //half way point

		for(var i = 0; i < waveform.length; i++) {
			value = k.map(waveform[i], -1, 1, -255, 255)

			var c = k.color(0, k.random(0, 255), k.abs(value))
			k.stroke(c)
			k.strokeWeight(20) 

			line_width = k.map(i, 0, 1, 0, 300)
			k.line(i*10, hp, i*10, hp+value)
		}
	}
}

var scratch = new p5(k)
