var f = function(f) {

	f.eye = function(ew, eh, mount_point) {
		// ew: eye width
		// eh: eye height
		// bt: brow thickness

		//set default mount
		!mount_point? mount_point = [0,0]: null;

		mx = mount_point[0]
		my = mount_point[1]

		//all the points of the eye
		e1 = [ew, (0 + eh)/2]
		e2 = [(ew/2), 0]
		e3 = [0, (0 + eh)/2]
		e4 = [(ew/2), eh]

		this.display = function() {
			f.quad(e1[0], e1[1], e2[0], e2[1], e3[0], e3[1], e4[0], e4[1])
		}
	}

	f.docW = $(document).width();
	f.docH = $(document).height();

	f.setup = function() {
		f.createCanvas(docW, docH);
		// mic = new p5.AudioIn();
		// mic.start();

		left_eye = new f.eye(200, 100)
		
	}

	f.draw = function() {

		f.clear()
		left_eye.display()
		
		// sound
		// sound = mic.getLevel() * 1000
		x = f.docW/2 - 50
		y = f.docH/2 - 50
		
	}
}

var face = new p5(f)