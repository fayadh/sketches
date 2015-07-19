var f = function(f) {
	f.docW = $(document).width();
	f.docH = $(document).height();

	// f.eye = function(ew, eh, mount_point) { 
	// 	// ew: eye width
	// 	// eh: eye height
	// 	// bw: brow width
	// 	// bh: brow height

	// 	//set defaults
	// 	!mount_point? mount_point = [0,0]: null;

	// 	bh = 50
	// 	divider = 30

	// 	mx = mount_point[0]
	// 	my = mount_point[1]

	// 	//all the points of the eye
	// 	this.e1 = [ew, (0 + eh)/2]
	// 	this.e2 = [(ew/2), 0]
	// 	this.e3 = [0, (0 + eh)/2]
	// 	this.e4 = [(ew/2), eh]

	// 	//all brow points
	// 	this.b1 = [0, bh]
	// 	this.b2 = [ew/2, 0]
	// 	this.b3 = [ew, bh]

	// 	this.blink = function() {
	// 			//distance the brow and the eye can chang
	// 			sp = (bh/2) * (f.mouseY/docH)

	// 			//brow
	// 			f.strokeWeight(4)
	// 			f.stroke(255)

	// 			f.line(
	// 				this.b1[0] + mx, 
	// 				this.b1[1] + my, 
	// 				this.b2[0] + mx, 
	// 				this.b2[1] + my + sp
	// 			)
	// 			f.line(
	// 				this.b2[0] + mx, 
	// 				this.b2[1] + my + sp, 
	// 				this.b3[0] + mx, 
	// 				this.b3[1] + my
	// 			)

	// 			//eye
	// 			f.noStroke()
	// 			f.quad(
	// 				this.e1[0] + mx, 
	// 				this.e1[1] + my + divider, 
	// 				this.e2[0] + mx, 
	// 				this.e2[1] + my + divider + sp, 
	// 				this.e3[0] + mx, 
	// 				this.e3[1] + my + divider, 
	// 				this.e4[0] + mx, 
	// 				this.e4[1] + my + divider
	// 			)
	// 		}

	// 	this.anger = function() {
	// 			this.e1 = [ew, eh]
	// 			this.e2 = [ew, (eh/2)]
	// 			this.e3 = [0, 0]
	// 			this.e4 = [(3*ew/4), eh]

	// 			//all brow points
	// 			this.b1 = [0, bh]
	// 			this.b2 = [ew/2, 0]
	// 			this.b3 = [ew, bh]

	// 			//distance the brow and the eye can change
	// 			sp = (bh/2) * (f.mouseY/docH)

	// 			//brow
	// 			f.strokeWeight(4)
	// 			f.stroke(255)

	// 			f.line(
	// 				this.b1[0] + mx, 
	// 				this.b1[1] + my + sp, 
	// 				this.b2[0] + mx, 
	// 				this.b2[1] + my 
	// 			)
	// 			f.line(
	// 				this.b2[0] + mx, 
	// 				this.b2[1] + my, 
	// 				this.b3[0] + mx, 
	// 				this.b3[1] + my + sp
	// 			)

	// 			//eye
	// 			f.noStroke()
	// 			f.quad(
	// 				this.e1[0] + mx, 
	// 				this.e1[1] + my + divider, 
	// 				this.e2[0] + mx, 
	// 				this.e2[1] + my + divider + sp, 
	// 				this.e3[0] + mx, 
	// 				this.e3[1] + my + divider, 
	// 				this.e4[0] + mx, 
	// 				this.e4[1] + my + divider
	// 			)
	// 		}
	// }

	f.eye = function(bcw, bch, ech, mount_point) { 
		// bcw: brow container width
		// bch: brow container height
		// ech: eye container height

		//just incase
		!mount_point? mount_point = [0,0]: null;

		//for the sake of clarity
		X0 = mount_point[0]
		Y0 = mount_point[1]
		Xb = X0 + bcw
		Yb = Y0 + bch
		Ye = Yb + ech

		// vertices of master grid
		this.ver = {}
		ver = this.ver 
		ver.v1 = [X0, Y0]
		ver.v2 = [X0, Yb]
		ver.v3 = [X0, Ye]
		ver.v4 = [Xb, Ye]
		ver.v5 = [Xb, Yb]
		ver.v6 = [Xb, Y0]

		//brow container
		this.bCon = {}
		bCon = this.bCon;
		b1 = bCon.b1 = ver.v1
		b2 = bCon.b2 = ver.v2
		b3 = bCon.b3 = ver.v5
		b4 = bCon.b4 = ver.v6

		//eye container
		this.eCon = {}
		eCon = this.eCon;
		e1 = eCon.e1 = ver.v2
		e2 = eCon.e2 = ver.v3
		e3 = eCon.e3 = ver.v4
		e4 = eCon.e4 = ver.v5

		//default eye shape
		//setup once
		this.def = {}
		def = this.def
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
		this.vars = {}
		vars = this.vars
		vars.e1 = def.e1
		vars.e2 = def.e2
		vars.e3 = def.e3
		vars.e4 = def.e4

		vars.b1 = def.b1
		vars.b2 = def.b2
		vars.b3 = def.b3

		this.present = function() {
			f.strokeWeight(4)
			f.stroke(123)

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
			f.endShape()
		}
	}

	f.mouth = function(ew, eh, mount_point) {
		//set defaults
		!mount_point? mount_point = [0,0]: null;

		mx = mount_point[0]
		my = mount_point[1]
	} 


	f.setup = function() {
		f.createCanvas(docW, docH);
		// mic = new p5.AudioIn();
		// mic.start();
		// left_eye = new f.eye(200, 100, [350, 150])
		left_eye = new f.eye(100, 50, 100, [300, 300])
	}

	f.draw = function() {
		//clear the picture with every run so you don't layer images on top of each other.
		f.clear()
		// f.key == 'a'? left_eye.blink(): null;
		// f.key == 's'? left_eye.anger(): null;
		left_eye.present()


		// Sound
		// sound = mic.getLevel() * 1000
		x = f.docW/2 - 50
		y = f.docH/2 - 50
	}
}

var face = new p5(f)