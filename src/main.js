window.onload = function(){

	document.body.onkeydown = function(e){

		if(e.ctrlKey){
			if(e.which == 83){
				e.preventDefault();
			}
		}
	}

	//Setup the environment
	setup();
};

window.onmouseup = function(){
	
	//A mouse up anywhere will cancel whatever mousemove listeners are inplace
	window.onmousemove = null;
};


window.onresize = function(){

	//Maintain the page height
	EM.adjustCSS.pageContentHeight();
	
	//Maintain the ratio betweent the left and right segments of the window
	EM.adjustCSS.pageSegmentsProportions( (window.innerWidth / EM.adjustCSS.separatorRatio) + 0.5);
};


//Setup the document
setup = function(){

	//Store for application JavaScript
	EM = {};
	
	//Store for context windows
	//EM.windows = {};
	
	//Store for quick functions
	EM.q = {};
	//Reference to quick functions for the console
	q = EM.q;
	
	//Quick function for getElementById
	EM.q.ge = function(id){
		return document.getElementById(id);
	}
	
	//Some prototype methods have been added
	nativeAlterations();

	//Load Infrastructure for the system
	loadInfrastructure();

	//Load the zIndex maintenence functions
	loadZIndexMaintenenceFunctions();
	
	//A maintainer for fixing windows to the left, right, and max;
	EM.fixedWindowsMaintainer = {};
	
	//References for the three fixed positions
	EM.fixedWindowsMaintainer.leftWindow = undefined;
	EM.fixedWindowsMaintainer.rightWindow = undefined;
	EM.fixedWindowsMaintainer.maxWindow = undefined;
	
	//Library for maintaining CSS: calculation and adjustment
	EM.adjustCSS = {};
	
	//Load the CSS Adjustment functions
	loadCSSAdjustmentFunctions();
	
	//Initial Setup for the page
	EM.adjustCSS.pageSegmentsProportions(window.innerWidth/2);
	EM.adjustCSS.setupSideSegments();
	EM.q.ge("pageContent").onmousedown = function(e){
		EM.adjustCSS.shadowAllWindows();
	}
	EM.adjustCSS.pageContentHeight();

	//Load DependecyMap
	loadDependencyMap();
	
	//Load Maintainer
	loadMaintainer();
	EM.primaryContextName = ""
	EM.maintainer = new Symbol("", [], Instruction.returnUndefined, EM.primaryContextName);
	EM.q.m = EM.maintainer;
	EM.q.m.g = EM.q.m.getSymbol;
	EM.changeMade = false;
	window.ss = EM.maintainer.printTree;
	
	//Load Interpreter
	loadInterpreter();
	EM.interpreter = new EM.Interpreter(EM.maintainer);

	//String representation methods
	loadStringRepresentations();
	
	//Quick UI command shortcuts
	EM.q.i = EM.interpreter;
	EM.q.i.l = EM.interpreter.upToLex;
	EM.q.i.v = EM.interpreter.upToValidate;
	EM.q.i.e = EM.interpreter.upToEnscript;
	EM.q.i.p = EM.interpreter.upToParseScript;
	EM.q.i.x = EM.interpreter.upToActivateScript;
	EM.q.i.in = EM.interpreter.Instruction;

	//Load context window libraries
	loadContextBox();
	loadCanvasWindow();
	loadInputWindow();
	loadSymbolListWindow();
	loadAdjustmentWindow();
	
	//Initialise context windows
	cb1 = new EM.contextBox("hello", 430, 70, 400, 400);
	cb3 = new EM.canvasWindow("picture", 750, 100, 400, 400);
		cb3.append();
	cb4 = new EM.inputWindow("input", 350, 300, 420, 250);
		cb4.append();
	cb5 = new EM.symbolListWindow("symbols", 50, 50, 300, 400);
		cb5.append();
		cb1.append();






	//Test functionality
	//EM.maintainer.declareSymbol("x", [], new Instruction(Instruction.returnValue, [1]));
	//EM.maintainer.declareSymbol("x.a", [], new Instruction(Instruction.returnValue, [1]));
	//EM.maintainer.declareSymbol("b.a.c", [], new Instruction(Instruction.returnValue, [1]));


	//Tests for prelim parsing
	q.i.x("a = 1;");
	q.i.x("b = 2;");
	q.i.x("c is b+a;");
	q.i.x("d is b==2 ? \"b == 2\" : \"b != 2\";");
	q.i.x("a.fired = 0;");
	q.i.x("proc a.updateFired(a){a.fired++;t = 1;t = 2;}")

	//cb6 = new EM.adjustmentWindow("a", 400, 75, 300, 100);
		//cb6.append();
	//cb7 = EM.DependencyMapWindow("primary", 600, 100, 500, 500);
		//cb7.append();

/*
	q.m.declareSymbol("log", [], new Instruction(Instruction.formJavascriptFunction, [
		["argument"],
		"console.log(argument);"
	]), new Definition("--Native Function--", "Function"))

*/


	q.m.declareSymbol("System.JSFunction", [], new Instruction(Instruction.formJavascriptFunction, [
		["argumentNames", "functionBodyCode"],
		"return new Instruction(Instruction.formJavascriptFunction, [argumentNames, functionBodyCode]).activate();"
	]), new Definition("--Native Function--", Definition.JavascriptFunction))

	q.i.x("System.log = System.JSFunction([\"arg\"], \"console.log(arg);\");");
	//q.i.x("new.DateTime = new.JSFunction([], \"return new Date();\");");
	//q.i.x("new.RegExp = new.JSFunction([\"arg\", \"modifiers\"], \"return new RegExp(arg, modifiers);\");");
	
	q.i.x("System.typeof = System.JSFunction([\"arg\"], \"return EM.typeof(arg);\");");
	q.i.x("func Array.concat(array1, array2){return array1 + array2;}");
	q.i.x("func Array.isit(arg){return global.System.typeof(arg) == \"array\";}");
	q.i.x("func Array.map(array, function){temp = []; for(i=0; i<#array; i++){temp = temp + [function(array[i])];} return temp;};")
	q.i.x("func Array.filter(array, function){temp = []; for(i=0; i<#array; i++){if(function(array[i])){temp = temp + [array[i]];}} return temp;}")
	//Here
/*
*/	

	//q.i.x("func testFunc(a){return a==1;}")
	//q.i.x("myArray = [1, 2, 3, 4];")
	//q.i.x("mySymbol = symbol a;")
	//q.i.x("myDate = new.DateTime();")
	//q.i.x("myRegExp = new.RegExp(\"hello\", \"g\");")
	//q.i.x("proc heebee(b){if(b==1){if(b==1){x++;}else if(b==2){x++;}else if(b==3){x++;}else{x++;}}}")

}

//Function to make changes to natives
nativeAlterations = function(){

	Object.defineProperty(String.prototype, 'removeWhitespace', {
	 	value: function(){
	 		return this.replace(/\s/g, '')
	 	}
	});

	String.prototype.splice = function( idx, rem, s ) {
		if(s==undefined){
			s = "";
		}
    	return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
	};

	//Function to parse pixel css specifications to integers: eg "50px" -> 50
	Object.defineProperty(Object.prototype, 'length', {
	    value: function () {

	    	var l=0;

			for(var i in this){
				l++;
			}

			return l;
	    },
	    enumerable: false
	});

	//Function to parse pixel css specifications to integers: eg "50px" -> 50
	Object.defineProperty(String.prototype, 'depix', {
	    value: function () {
			return parseInt(this.substring(0, this.length-2));
	    },
	    enumerable: false
	});

	Object.defineProperty(Array.prototype, 'toString', {
	    value: function () {
			return this.join(", ")
	    },
	    enumerable: false
	});

	Object.defineProperty(Array.prototype, 'contains', {
	    value: function (arg) {
			for(var i=0; i<this.length; i++){
				if(this[i]==arg){
					return true;
				}
			}
			return false;
	    },
	    enumerable: false
	});

	
}