var f = function(f) {
	f.docW = $(document).width();
	f.docH = $(document).height();

	f.Eye = function(bcw, bch, ech, mount_point) { 
			// bcw: brow container width
			// bch: brow container height
			// ech: eye container height

			//just incase
			!mount_point? mount_point = [0,0]: null;

			//for the sake of clarity
			var X0 = mount_point[0]
			var Y0 = mount_point[1]
			var Xb = X0 + bcw
			var Yb = Y0 + bch
			var Ye = Yb + ech

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
			vars.e1 = def.e1
			vars.e2 = def.e2
			vars.e3 = def.e3
			vars.e4 = def.e4

			vars.b1 = def.b1
			vars.b2 = def.b2
			vars.b3 = def.b3

			return { 
				getDefault: function() {
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
		}
	}

	f.setup = function() {
		f.createCanvas(docW, docH);
		left_eye = new f.Eye(100, 50, 100, [0, 0]);
		right_eye = new f.Eye(100, 50, 100, [400, 0]);
	}

	f.draw = function() {
		//clear the picture with every run so you don't layer images on top of each other.
		f.clear()
		// f.key == 'a'? left_eye.blink(): null;
		// f.key == 's'? left_eye.anger(): null;

		left_eye.getDefault()
		right_eye.getDefault()
	}
}

var face = new p5(f)