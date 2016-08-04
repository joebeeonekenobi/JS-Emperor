loadStringRepresentations = function(){

	Object.defineProperty(Symbol.prototype, 'stringRepresentation', {
	    value: function () {

	    	return "Symbol " + this.fullName;
	    },
	    enumerable: false
	});

	Object.defineProperty(Instruction.prototype, 'stringRepresentation', {
	    value: function () {

	    	if(this.f == Instruction.functionIncursion){
	    		return "Function ("+this.a[0].join(", ")+")"
	    	}
	    	else if(this.f == Instruction.javascriptFunctionIncursion){
	    		return "JSFunction ("+this.a[1].join(", ")+")"
	    	}
	    	else if(this.f == Instruction.procedureActivation){
	    		return "Procedure watching ["+this.a[1].join(", ")+"]"
	    	}
			return "Unknown Instruction Value";
	    },
	    enumerable: false
	});

	Object.defineProperty(Array.prototype, 'stringRepresentation', {
	    value: function () {

	    	var build = [];

			for(var i=0; i<this.length; i++){

				build.push(this[i].stringRepresentation());
			}

			return "[" + build.join(", ") + "]";
	    },
	    enumerable: false
	});

	Object.defineProperty(String.prototype, 'stringRepresentation', {
	    value: function () {

			return "\"" + this + "\"";

	    },
	    enumerable: false
	});

	Object.defineProperty(Number.prototype, 'stringRepresentation', {
	    value: function () {

			return "" + this;

	    },
	    enumerable: false
	});

	Object.defineProperty(Boolean.prototype, 'stringRepresentation', {
	    value: function () {

			return "" + this;

	    },
	    enumerable: false
	});

	Object.defineProperty(Date.prototype, 'stringRepresentation', {
	    value: function () {

			return "DateTime "+this.getDate() +"/"+ (this.getMonth()+1) +"/"+ this.getFullYear() +" "+ this.getHours() +":"+ this.getMinutes() +":"+ this.getSeconds();

	    },
	    enumerable: false
	});

	Object.defineProperty(RegExp.prototype, 'stringRepresentation', {
	    value: function () {

			return "RegExp "+this.toString();

	    },
	    enumerable: false
	});
}