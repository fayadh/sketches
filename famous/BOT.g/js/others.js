Element.prototype.remove = function() {
		    this.parentElement.removeChild(this);
		}
		NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
		    for(var i = 0, len = this.length; i < len; i++) {
		        if(this[i] && this[i].parentElement) {
		            this[i].parentElement.removeChild(this[i]);
		        }
		    }
		}

$(function() {


	$('#cd1').hide();
	$('input').hide();

	$('#cd2').on('click', function(){
			$('#cd2').toggle(100);
			$('#cd1').toggle(100);
			$('input').toggle(100);
		})


	$('#cd1').on('click', function(){
				$('#cd1').toggle(100);
				$('#cd2').toggle(100);
				$('input').toggle(100);
			})
		})
