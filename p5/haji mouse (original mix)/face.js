var f = function(f) {
	f.docW = $(document).width();
	f.docH = $(document).height();

	f.Eye = function(bcw, bch, ech, mount_point, inversed) { 
			// bcw: brow container width
			// bch: brow container height
			// ech: eye container height
			var inversed = inversed;

			//just incase
			!mount_point? mount_point = [0,0]: null;
			!inversed? inversed = false: null;

			if(inversed == false) {
				var X0 = mount_point[0]
				var Y0 = mount_point[1]
				var Xb = X0 + bcw
				var Yb = Y0 + bch
				var Ye = Yb + ech
			} else {
				var X0 = mount_point[0]
				var Y0 = mount_point[1]
				var Xb = X0 + bcw
				var Yb = Y0 + bch
				var Ye = Yb + ech
			}

			//for the sake of clarity
			
			// vertices of master grid
			var ver = {} 
			ver.v1 = [X0, Y0]
			ver.v2 = [X0, Yb]
			ver.v3 = [X0, Ye]
			ver.v4 = [Xb, Ye]
			ver.v5 = [Xb, Yb]
			ver.v6 = [Xb, Y0]

			//brow container
			var bCon = {}
			b1 = bCon.b1 = ver.v1
			b2 = bCon.b2 = ver.v2
			b3 = bCon.b3 = ver.v5
			b4 = bCon.b4 = ver.v6

			//eye container
			var eCon = {}
			e1 = eCon.e1 = ver.v2
			e2 = eCon.e2 = ver.v3
			e3 = eCon.e3 = ver.v4
			e4 = eCon.e4 = ver.v5

			//default eye shape
			//setup once
			var def = {}
			def.e1 = [ e1[0], (e2[1] + e1[1])/2 ]
			def.e2 = [ (e3[0] + e2[0]) / 2, e2[1]]
			def.e3 = [ e3[0], (e3[1] + e4[1]) / 2]
			def.e4 = [ (e4[0] + e1[0]) / 2, e4[1] ]

			//brow
			def.b1 = [b2[0], b2[1]]
			def.b2 = [((b1[0] + b4[0])/2), b4[1]]
			def.b3 = [b3[0], b3[1]]

			//variable stats; clones of the defaults 
			//when we animate, we only change the state of vars, not the defaults.
			var vars = {}

			//the state object holds all the animations that we could want
			var state = {}

			//globals
			var current_animation = 'default'
			var global_speed = 2;

			//so far, these are NOT manipulating the FIXED positions of the variables. 
			state.default = function() {	
				//vars are simply a clone of the defaults.
				var array = []
				array[0] = vars.e1 = def.e1
				array[1] = vars.e2 = def.e2
				array[2] = vars.e3 = def.e3
				array[3] = vars.e4 = def.e4

				array[4] = vars.b1 = def.b1
				array[5] = vars.b2 = def.b2
				array[6] = vars.b3 = def.b3

				return array
			}

			//automatically set defaults
			state.default();

			state.angry = function() {
				// = state[current_animation]()[0]
				var angryE1 = [ 450, 300 ]
				// debugger

				var check = function() {
					//checking for slope m 
					var nominator = (angryE1[1] - vars.e1[1])
					var denominator = (angryE1[0] - vars.e1[0])
					var slope = nominator/denominator
				}

				if(vars.e1[0] == angryE1[0]) { 
					current_animation = 'angry'
				} else {
					var sps = 60;
					vars.e1[0] += (angryE1[0] - vars.e1[0]) / sps	//x value  //sps is stesps per second
					vars.e1[1] += (angryE1[1] - vars.e1[1]) / sps //y value
				} 
				// = state[current_animation]()[0]
			}

			state.draw = function() {
				f.fill(f.color(255))
				f.strokeWeight(4)
				f.stroke(255)

				f.line(
					vars.b1[0], vars.b1[1],
					vars.b2[0], vars.b2[1]
				)

				f.line(
					vars.b2[0], vars.b2[1],
					vars.b3[0], vars.b3[1]
				)

				f.beginShape()
				f.vertex(vars.e1[0], vars.e1[1])
				f.vertex(vars.e2[0], vars.e2[1])
				f.vertex(vars.e3[0], vars.e3[1]) 
				f.vertex(vars.e4[0], vars.e4[1])
				f.endShape(f.CLOSE)
			}

			// state.blink = function() {
			// 	f.fill(f.color(0))
			// 	f.strokeWeight(4)
			// 	f.stroke(255)

			// 	f.line(
			// 		vars.b1[0], vars.b1[1],
			// 		vars.b2[0] , vars.b2[1] + ((f.mouseY / f.docW) * ech)
			// 	)

			// 	f.line(
			// 		vars.b2[0], vars.b2[1] + ((f.mouseY / f.docW) * ech),
			// 		vars.b3[0], vars.b3[1]
			// 	)

			// 	f.beginShape()
			// 	f.vertex(vars.e1[0], vars.e1[1])
			// 	f.vertex(vars.e2[0], vars.e2[1])
			// 	f.vertex(vars.e3[0], vars.e3[1]) 
			// 	f.vertex(vars.e4[0], vars.e4[1] + ((f.mouseY / f.docW) * ech))
			// 	f.endShape(f.CLOSE)
			// }
			return state
		}

	f.setup = function() {
		f.createCanvas(f.docW, f.docH);
		w = 400;
		h = 200;
		left_eye = new f.Eye(100, 50, 100, [w+0, h+0]);
		right_eye = new f.Eye(100, 50, 100, [w+400, h+0]);
	}

	f.transition = function(obj, curAni, nextAni) {
		startingPoint = vars.e1
		endingPoint = obj.retrieve(nextAni, 'e1')										//yields vars.e1
		steps = (endingPoint - startingPoint) / tLength 			//steps = 2
	}

	f.draw = function() {
		f.clear()
		left_eye.angry()

		left_eye.default()
		right_eye.default()

		left_eye.draw()
		right_eye.draw()

		time = Math.round(f.millis())
	}
}

var face = new p5(f)