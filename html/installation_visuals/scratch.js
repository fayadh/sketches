var scope1 = function(in) {
	var hidden1 = 'look at me!' + in
	var properties = {
		getHidden: function() {
			return hidden1
		}
	}
	return properties
}

s1 = new s1('first scope')
s2 = new s1('second scope')
