loadAdjustmentWindow = function(){

	EM.adjustmentWindow = function(name, x, y, width, height){

		this.symbolName = name;
		name = "adjust["+name+"]";

		//Call to extend context box
		var me = EM.contextBox.apply(this, arguments);

		//Elements
		this.head = document.createElement("div");
		this.tail = document.createElement("div");

		//Static variables
		this.minWidth = 290;
		this.minHeight = 80;
		this.windowType = "adjustmentWindow";
		this.title.innerHTML = name + " (" + this.windowType + ")";

		this.typeInspect = function(value){

			if(value == undefined){
				return undefined;
			}

			if(typeof value == "object"){
				if(value instanceof Array){
					return "array"
				}
				else{
					return "object"
				}
			}
			else{
				return typeof value;
			}
		}

		//Each declaration will call this method
		this.reinitialise = function(symbol){

			if(symbol == undefined){

				me.close();
				throw new Error("Cannot launch Adjustment window for :'"+me.symbolName+"' as the symbol does not exist.")
			}

			//Record if the type of the symbol has changed
			var typeChanged = me.symbol == undefined ? true : me.typeInspect(me.symbol.value) != me.typeInspect(symbol.value)

			//If the type has changed, remove the old information before proceeding
			if(typeChanged){

				//Remove the previous listeners
				me.removeListenerConsiderations();

				//Remove the previous HTML
				this.head.remove();
				this.tail.remove();
			}
			//Else simply update the plaque info and return
			else{

				switch(symbol.definition.type){

					case "Assignment" :
						switch(me.typeInspect(symbol.value)){
							case "string" :
								me.plaque.innerHTML = me.symbol.fullName+" = \""+symbol.value+"\"";
								me.adjuster.value = symbol.value;
								return;
							case "boolean" :
								me.plaque.innerHTML = symbol.fullName+" = "+symbol.value;
								if(symbol.value == true){
									me.optionTrue.checked = true;
								}
								else{
									me.optionFalse.checked = true;
								}
								return;
							case "number" :
								me.plaque.innerHTML = symbol.fullName+" = "+symbol.value;
								me.adjuster.value = symbol.value;
								return;
							case "array" :
								return;
							case "object" :
								return;
						}
						break;
					case "Observable" :
						break;
					case "Function" :
						break;
					case "Procedure" : 
						break;
					case "Native" :
						break;
					default :
						return;
				}
				return;
			}

			//Store the symbol locally
			me.symbol = symbol;

			//Overwrite the adjustment window (Wont really do anything aside the first time)
			EM.maintainer.adjustmentWindows[symbol.fullName] = me;

			switch(me.symbol.definition.type){

				case "Assignment" :
					switch(me.typeInspect(me.symbol.value)){
						case "string" :

							me.head = document.createElement("div");
							me.plaque = document.createElement("p")
							me.tail = document.createElement("div");
							me.head.className = "cbxAdjHead"
							me.tail.className = "cbxAdjTail"
							me.plaque.className = "cbxAdjPlq"
							me.plaque.innerHTML = me.symbol.fullName+" = \""+me.symbol.value+"\"";

							//Elements
							me.optionContainer = document.createElement("div")
							me.adjuster = document.createElement("input");

							me.adjuster.value = me.symbol.value;

							//ClassNames
							me.adjuster.className = "cbxAdjInput";
							me.optionContainer.className = "cbxAdjRangeOpCon";

							me.adjuster.onkeyup = function(){

								EM.interpreter.upToActivateScript(me.symbol.fullName+" = \""+this.value+"\";");
							}

							//Append
							me.content.appendChild(me.head);
							me.content.appendChild(me.tail);
							me.head.appendChild(me.plaque);
							me.optionContainer.appendChild(me.adjuster)
							me.tail.appendChild(me.optionContainer);

							return;
						case "boolean" :

							//Preable
							me.head = document.createElement("div");
							me.plaque = document.createElement("p")
							me.tail = document.createElement("div");
							me.head.className = "cbxAdjHead"
							me.tail.className = "cbxAdjTail"
							me.plaque.className = "cbxAdjPlq"
							me.plaque.innerHTML = me.symbol.fullName+" = "+me.symbol.value;

							//Elements
							me.optionContainer = document.createElement("div")
							me.optionTrue = document.createElement("input")
							me.optionTrueP = document.createElement("p")
							me.optionFalse = document.createElement("input")
							me.optionFalseP = document.createElement("p")
							me.adjuster = document.createElement("form");

							//Values
							me.adjuster.type = "radio";
							me.optionTrue.type = "radio";
							me.optionTrue.name = "boolean";
							me.optionTrue.value = true;
							me.optionTrueP.innerHTML = "true";
							me.optionFalseP.innerHTML = "false";
							me.optionFalse.type = "radio";
							me.optionFalse.name = "boolean";
							me.optionFalse.value = false;

							if(me.symbol.value == true){
								me.optionTrue.checked = true;
							}
							else{
								me.optionFalse.checked = true;
							}

							//ClassNames
							me.adjuster.className = "cbxAdjButtons";
							me.optionContainer.className = "cbxAdjRangeOpCon";
							me.optionTrueP.className = "cbxAdjRangeOpP";
							me.optionFalseP.className = "cbxAdjRangeOpP";

							me.optionTrue.onchange = function(){
								EM.interpreter.upToActivateScript(me.symbol.fullName+" = "+this.value+";");
							}
							me.optionFalse.onchange = function(){
								EM.interpreter.upToActivateScript(me.symbol.fullName+" = "+this.value+";");
							}

							//Append
							me.content.appendChild(me.head);
							me.content.appendChild(me.tail);
							me.head.appendChild(me.plaque);

							me.adjuster.appendChild(me.optionTrueP)
							me.adjuster.appendChild(me.optionTrue)
							me.adjuster.appendChild(me.optionFalseP)
							me.plaque.innerHTML = me.symbol.fullName+" = "+me.symbol.value;
							me.adjuster.appendChild(me.optionFalse)
							me.optionContainer.appendChild(me.adjuster)
							me.tail.appendChild(me.optionContainer);
							
							return;

						case "number" :

							//Elements
							me.head = document.createElement("div");
							me.plaque = document.createElement("p")
							me.tail = document.createElement("div");
							me.head.className = "cbxAdjHead"
							me.tail.className = "cbxAdjTail"
							me.plaque.className = "cbxAdjPlq"

							me.plaque.innerHTML = me.symbol.fullName+" = "+me.symbol.value;
														
							me.optionContainer = document.createElement("div")
							me.optionMin = document.createElement("input");
							me.optionMax = document.createElement("input");
							me.optionStep = document.createElement("input");
							me.optionMinP = document.createElement("p")
							me.optionMaxP = document.createElement("p")
							me.optionStepP = document.createElement("p")

							me.adjuster = document.createElement("input");
							me.adjuster.type = "range";
							me.adjuster.value = symbol.value;
							me.adjuster.max = symbol.value + 50;
							me.adjuster.min = symbol.value - 50;
							me.adjuster.step = 1;

							//Listeners
							me.optionMin.onkeyup = function(e){
								
								if(e.which == 13){
									me.adjuster.setAttribute("min", this.value)
								}
							}
							me.optionMax.onkeyup = function(e){
								
								if(e.which == 13){
									me.adjuster.setAttribute("max", this.value)
								}
							}
							me.optionStep.onkeyup = function(e){
								
								if(e.which == 13){
									me.adjuster.setAttribute("step", this.value)
								}
							}
							me.adjuster.oninput = function(){

								EM.interpreter.upToActivateScript(me.symbol.fullName+" = "+this.value+";")
							}

							//InnerHTML
							me.optionMinP.innerHTML = "Min:"
							me.optionMin.value = symbol.value - 50;
							me.optionMaxP.innerHTML = "Max:"
							me.optionMax.value = symbol.value + 50
							me.optionStepP.innerHTML = "Step:"
							me.optionStep.value = "1"

							//Class
							me.optionMinP.className = "cbxAdjRangeOpP";
							me.optionMaxP.className = "cbxAdjRangeOpP";
							me.optionMin.className = "cbxAdjRangeOp"
							me.optionContainer.className = "cbxAdjRangeOpCon"
							me.optionStep.className = "cbxAdjRangeOp"
							me.optionMax.className = "cbxAdjRangeOp"
							me.optionStepP.className = "cbxAdjRangeOpP";
							me.adjuster.className = "cbxAdjRange";

							//Append
							me.content.appendChild(me.head);
							me.content.appendChild(me.tail);
							me.head.appendChild(me.plaque);
							me.optionContainer.appendChild(me.optionMinP)
							me.optionContainer.appendChild(me.optionMin)
							me.optionContainer.appendChild(me.optionMaxP)
							me.optionContainer.appendChild(me.optionMax)
							me.optionContainer.appendChild(me.optionStepP)
							me.optionContainer.appendChild(me.optionStep)
							me.tail.appendChild(me.optionContainer)
							me.tail.appendChild(me.adjuster);

							return;
						default : //case cannot be adjusted
							break;
					}
					break;
				case "Observable" :
					break;
				case "Function" :
					break;
				case "Procedure" : 
					break;
				case "Native" :
					break;

			}
		}

	/*
		Considerations
	*/	
		this.toFixConsiderations = function(){
			//Dummy until extention
		};
		this.toWindowConsiderations = function(){
			//Dummy until extention	
		};
		this.resizeConsiderations = function(){
			//Dummy until extention	
		};
		this.toMinConsiderations = function(){
			//Dummy until extention
		};
		this.closeConsiderations = function(){
			//Dummy until extention
			delete EM.maintainer.adjustmentWindows[me.symbolName];
		};
		this.removeListenerConsiderations = function(){

			if(this.symbol == undefined){
				return;
			}
		
			switch(this.symbol.definition.type){

				case "Assignment" :
					switch(me.typeInspect(this.symbol.value)){
						case "string" :
							me.adjuster.onkeyup = undefined;
							return;
						case "boolean" :
							me.optionTrue.onchange = undefined;
							me.optionFalse.onchange = undefined;
							return;
						case "number" :
							me.optionMin.onkeyup = undefined;
							me.optionMax.onkeyup = undefined;
							me.optionStep.onkeyup = undefined;
							me.adjuster.oninput = undefined;
						case "array" :
							return;
						case "object" :
							return;
					}
					break;
				case "Observable" :
					break;
				case "Function" :
					break;
				case "Procedure" : 
					break;
				case "Native" :
					break;
				default :
					return;
			}
		};


		me.reinitialise(EM.maintainer.getSymbol(this.symbolName));
		return me;
	}

}