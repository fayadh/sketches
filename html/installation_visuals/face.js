var f = function(f) {
	f.eye = function(ew, eh, mount_point) { 

		// ew: eye width
		// eh: eye height
		// bw: brow width
		// bh: brow height

		//set defaults
		!mount_point? mount_point = [0,0]: null;

		bh = 50
		divider = 30

		mx = mount_point[0]
		my = mount_point[1]

		//all the points of the eye
		this.e1 = [ew, (0 + eh)/2]
		this.e2 = [(ew/2), 0]
		this.e3 = [0, (0 + eh)/2]
		this.e4 = [(ew/2), eh]

		//all brow points
		b1 = [0, bh]
		b2 = [ew/2, 0]
		b3 = [ew, bh]

		this.display = function() {
			sp = (bh/2) * (f.mouseY/docH)

			console.log(sp)
			//brow
			f.strokeWeight(4)
			f.stroke(255)

			f.line(
				b1[0] + mx, 
				b1[1] + my, 
				b2[0] + mx, 
				b2[1] + my + sp
				)
			f.line(
				b2[0] + mx, 
				b2[1] + my + sp, 
				b3[0] + mx, 
				b3[1] + my
				)
			//eye
			f.noStroke()
			f.quad(
				this.e1[0] + mx, 
				this.e1[1] + my + divider, 
				this.e2[0] + mx, 
				this.e2[1] + my + divider + sp, 
				this.e3[0] + mx, 
				this.e3[1] + my + divider, 
				this.e4[0] + mx, 
				this.e4[1] + my + divider
				)
		}

		// this function just updates the points with each run
		this.move = function(max, minimum) {
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

		// console.log(f.mouseY/docH * 100)

		// Sound
		// sound = mic.getLevel() * 1000
		x = f.docW/2 - 50
		y = f.docH/2 - 50
	}
}

var face = new p5(f)