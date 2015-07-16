var f = function(f) {
	f.eye = function(ew, eh, mount_point) { 

		// ew: eye width
		// eh: eye height
		// bw: brow width
		// bh: brow height

		//set defaults
		!mount_point? mount_point = [0,0]: null;
		// !bh? bh = 50: null;

		bh = 50
		diff = 30

		mx = mount_point[0]
		my = mount_point[1]

		//all the points of the eye
		e1 = [ew, (0 + eh)/2]
		e2 = [(ew/2), 0]
		e3 = [0, (0 + eh)/2]
		e4 = [(ew/2), eh]

		//all brow points
		b1 = [0, bh]
		b2 = [ew/2, 0]
		b3 = [ew, bh]

		this.display = function() {
			//brow
			f.strokeWeight(4)
			f.stroke(255)
			f.line(b1[0] + mx, b1[1] + my, b2[0] + mx, b2[1] + my)
			f.line(b2[0] + mx, b2[1] + my, b3[0] + mx, b3[1] + my)
			//eye
			f.noStroke()
			f.quad(
				e1[0] + mx, 
				e1[1] + my + diff, 
				e2[0] + mx, 
				e2[1] + my + diff, 
				e3[0] + mx, 
				e3[1] + my + diff, 
				e4[0] + mx, 
				e4[1] + my + diff
			)
		}

		// this function just updates the points with each run
		this.move = function(max, minimum) {
			//this would work in terms of proportion

			//current position
			f.mouseY 

			//relative position
			(f.mouseY/docH) * eye 
		}
	}

	f.docW = $(document).width();
	f.docH = $(document).height();

	f.setup = function() {
		f.createCanvas(docW, docH);
		// mic = new p5.AudioIn();
		// mic.start();
		left_eye = new f.eye(200, 100, [350, 150])
	}

	f.draw = function() {
		//clear the picture with every run so you don't layer images on top of each other.
		f.clear()
		left_eye.display()
		left_eye.move()

		// Sound
		// sound = mic.getLevel() * 1000
		x = f.docW/2 - 50
		y = f.docH/2 - 50
	}
}

var face = new p5(f)