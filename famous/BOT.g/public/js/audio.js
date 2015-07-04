// /////////////////////////////////////////////////////////////////////////////////////////

// AUDIO

// //////////////////////////////////////////////////////////////////////////////////////////

// 	var context = new AudioContext();

// 	//scale
// 		frequency = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46]
// 		frequency_bass = [392.00, 349.23, 329.63, 293.66, 261.63, 246.94, 220]
		
// 		scale_int = [0, 2, 3, 5, 7, 8]
// 		mau5 = [0, 3, -2, 3, -2]

// 	//main melody
// 		var sin_wave = context.createOscillator(); 
// 		sin_wave.type = 'square'
// 		//initial frequency = silence 
// 		sin_wave.frequency.value = frequency[0]
// 		sin_wave.connect(context.destination)
// 		sin_wave.start()

// 	// //bass line
// 	// 	var bass = context.createOscillator(); 
// 	// 	bass.type = 'sine'
// 	// 	//initial frequency = silence 	
// 	// 	bass.frequency.value = frequency_bass[0]
// 	// 	bass.connect(context.destination)
// 	// 	bass.start()

// 	// note function
// 	function note(n) {
// 		//fn = f0 * (a)^n
// 		//base note
// 		f0 = 440;
// 		//twelfth root of 2
// 		a = Math.pow(2, 1/12)
// 		fn = f0 * Math.pow(a, n)
// 		return fn
// 	}

// 	var mau5_i = 0
// 	Timer.every(function() { 
// 		sin_wave.frequency.value = note(mau5[mau5_i])
// 		mau5_i++
// 	}, 50)

// 	// Timer.every(function() { 
// 	// 	x = randomIntFromInterval(0, scale_int.length - 1)
// 	// 	choice = scale_int[x]
// 	// 	bass.frequency.value = note(choice)
// 	// }, 200)