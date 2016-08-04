loadSymbolListWindow = function(){

	EM.symbolListSymbol = function(symbol, symbolWindow){

		var me = this;

		this.symbol = symbol
		this.symbolWindow = symbolWindow;

		//Elements
		this.container = document.createElement("div");
		this.LHS = document.createElement("p");
		this.RHS = document.createElement("p");

		//ClassNames
		this.container.className = "cbxSymbEQ";
		this.LHS.className = "cbxSymbLHS";
		this.RHS.className = "cbxSymbRHS";

		//Mouseover Listeners for Definition
		this.container.onmouseenter = function(){

			me.RHS.innerHTML = "&nbsp" + (me.symbol.definition.type == Definition.Assignment ? "= " : ": ") + me.symbol.getStringDefinition().replace(/\n/g, "<br>&nbsp&nbsp&nbsp").replace(/\s/g , "&nbsp");
		}
		this.container.onmouseleave = function(){

			me.update();
		}
		this.container.ondblclick = function(e){

			me.changeExpansionState();
		}

		//Inner HTML
		this.LHS.innerHTML = this.symbol.fullName.split(".").length != 1 ? "."+this.symbol.name : this.symbol.name;

		//Other
		this.container.symbol = symbol;
		this.expanded = false;

		//Style
		this.LHS.style.paddingLeft = ((this.symbol.fullName.split(".").length - 1) * 15 );

		//Append
		this.container.appendChild(this.LHS)
		this.container.appendChild(this.RHS)

		//Returns whether or not this symbol currently has children in the symbol list
		this.hasChildren = function(){

			var search = new RegExp("^"+this.symbol.fullName+"\.");

			for(var i in this.symbolWindow.symbolLibrary){
				if((search.test(i)) && (i!=this.symbol.fullName)){
					return true;
				}
			}

			return false;
		}

		this.changeExpansionState = function(){

			if(this.hasChildren()){

				this.expanded = !this.expanded;

				if(this.expanded){
					this.container.style.fontWeight = "bold";
					this.symbolWindow.contractedSymbols[this.symbol.fullName] = "true";
					this.symbolWindow.updateAllShownState();
				}
				else{
					this.container.style.fontWeight = "";
					delete this.symbolWindow.contractedSymbols[this.symbol.fullName];
					this.symbolWindow.updateAllShownState();
				}

			}
		}

		//Returns whether or not this symbol should be displayed given the state of the restrictions
		this.shouldBeShown = function(regex, userB, nativeB){


			if((EM.symbolListWindow.systemSymbols[this.symbol.fullName]) && (!nativeB)){

				//console.log("updating shown "+this.symbol.fullName+": false due to system.")
				return false;
			}
			else if((!EM.symbolListWindow.systemSymbols[this.symbol.fullName]) && (!userB)){

				//console.log("updating shown "+this.symbol.fullName+": false due to user.")
				return false;
			}

			if(!regex.test(this.symbol.fullName)){

				//console.log("updating shown "+this.symbol.fullName+": false due to regex:"+regex+" :: "+regex.test(this.symbol.fullName)+" !-> "+( ! regex.test(this.symbol.fullName) ))
				return false;
			}

			var split = this.symbol.fullName.split(".");
			var build = "";

			for(var i=0; i<split.length-1; i++){

				if(i==0){
					build = split[0];
				}else{
					build = build + "." + split[i];
				}
				if(this.symbolWindow.contractedSymbols[build]){
					//console.log("updating shown "+this.symbol.fullName+": false due to parentHidden.")
					return false;
				}
			}

			//console.log("updating shown "+this.symbol.fullName+": true.")
			return true;
		}

		//Function to update the HTML representation of the symbol in the list with the up-to-date values within the system
		this.update = function(){

			//Update the value on the LHS
			var value = this.symbol.getStringValue();

			if(value == "undefined"){
				
				this.RHS.innerHTML = "";
			}
			else{

				this.RHS.innerHTML = "&nbsp"+(this.symbol.watches.length == 0 ? "= " : ": ")+this.symbol.getStringValue();
			}
		}

		//Function to append this HTML representation to a containing div
		this.append = function(container){

			container.appendChild(this.container);
		}

		//Insertion sort for newly created node (Inserts alphabetically)
		this.appendInPlace = function(container){

			if(container.children.length == 0){
				
				container.appendChild(this.container);
			}
			else{

				for(var j = container.children.length-1; j>=0; j--){

					//If the comparison means we need to move further down
					if(this.container.symbol.fullName < container.children[j].symbol.fullName){
					//console.log(this.container.symbol.fullName+"<"+container.children[j].symbol.fullName)

						//If were at the end, insert and break
						if(j==0){

							container.insertBefore(this.container, container.children[j]);
							return;
						}
						//Otherwise move further down
						continue;
					}
					//Else if we are in the same place that we started, insert there and return
					else if(j == container.children.length-1){

						container.appendChild(this.container);
						return;
					}
					//Otherwise if we have moved down some, insert where we are now
					else{

						container.insertBefore(this.container, container.children[j+1]);
						return;
					}
				}
			}
		}

		this.remove = function(){

			this.container.remove();
		}

		return this;
	}











	EM.symbolListWindow = function(name, x, y, width, height){
	
		//Call to extend context box
		var me = EM.contextBox.apply(this, arguments);

	/*
		Additions and Re-calculations
	*/	

		//Elements
		this.regexContainer = document.createElement("div");
		this.regexContainer.className = "cbxRegexContainer";

		this.regexElement = document.createElement("input");
		this.regexElement.className = "cbxRegexElement";

		this.inclusionChecks = document.createElement("form");
		this.checkNative = document.createElement("input")
		this.checkNativeP = document.createElement("p")
		this.checkUser = document.createElement("input")
		this.checkUserP = document.createElement("p")
		this.checkNative.className = "cbxSymbCheckItem";
		this.checkNativeP.className = "cbxSymbCheckItem";
		this.checkUser.className = "cbxSymbCheckItem";
		this.checkUserP.className = "cbxSymbCheckItem";
		//this.hr = document.createElement("hr");

		this.symbolHTMLContainer = document.createElement('div');
		this.symbolHTMLContainer.className = 'cbxSymbContainer';

		//Properties
		me.checkUserB = true;
		me.checkNativeB = false;
		me.regexElementB = new RegExp("", "mi");
		me.contractedSymbols = {};

		this.checkNative.type = "checkbox"
		this.checkNative.checked = false;
		this.checkUser.type = "checkbox"
		this.checkUser.checked = true;
		this.checkNativeP.innerHTML = "System Symbols &emsp;"
		this.checkUserP.innerHTML = "User Symbols"
		this.inclusionChecks.style.marginBottom = "0px";
		this.inclusionChecks.style.paddingBottom = "3px";
		this.symbolHTMLContainer.style.overflow = "auto";
		this.windowType = "symbolListWindow";
		this.title.innerHTML = name + " (" + this.windowType + ")";

		this.regexElement.onkeyup = function(e){

			if(e.which == 13){
				
				me.regexElementB = new RegExp(e.target.value, "mi");
				me.updateAllShownState();
			}
		}

		this.checkNativeP.onclick = function(e){

			me.checkNative.checked = !me.checkNative.checked;
			me.checkNativeB = me.checkNative.checked;
			me.updateAllShownState();
		}
		this.checkUserP.onclick = function(e){

			me.checkUser.checked = !me.checkUser.checked;
			me.checkUserB = me.checkUser.checked;
			me.updateAllShownState();
		}
		this.checkNative.onchange = function(e){

			me.checkNativeB = e.target.checked;
			me.updateAllShownState();
		}
		this.checkUser.onchange = function(e){

			me.checkUserB = e.target.checked;
			me.updateAllShownState();
		}

		//Updates the display state for all symbols based on whether or not they should be displayed
		this.updateAllShownState = function(){

			//For all symbols
			for(var i in me.symbolLibrary){

				//Check whether the symbol should be shown given the state of the restriction applications in effect
				if(me.symbolLibrary[i].shouldBeShown(me.regexElementB, me.checkUserB, me.checkNativeB)){

					//And make it so.
					me.symbolLibrary[i].container.style.display = "";
				}
				else{

					//And make it so.
					me.symbolLibrary[i].container.style.display = "none";
				}
			}
		}

		//Append
		this.regexContainer.appendChild(this.regexElement)
		this.inclusionChecks.appendChild(this.checkNative)
		this.inclusionChecks.appendChild(this.checkNativeP)
		this.inclusionChecks.appendChild(this.checkUser)
		this.inclusionChecks.appendChild(this.checkUserP)
		this.regexContainer.appendChild(this.inclusionChecks);
		//this.regexContainer.appendChild(this.hr);
		this.content.appendChild(this.regexContainer);
		this.content.appendChild(this.symbolHTMLContainer);

		//Add this symbol list to the global store
		EM.maintainer.symbolLists[name] = this;

		//Store for the HTML symbols
		this.symbolLibrary = {};
		
	/*
		Functionality
	*/

		//Function to trigger an update to the HTML representation of the symbol from a redeclaration of symbol
		this.triggerUpdateFromDeclaration = function(symbol){

			if(EM.symbolListWindow.doNotDisplayListy[symbol.fullName]){
				return;
			}

			//console.log("trigger from decl: "+symbol.fullName)

			//In the case that the symbol is not completely new
			if(this.symbolLibrary[symbol.fullName] != undefined){

				//Remove the previous representation
				this.symbolLibrary[symbol.fullName].remove();
			}
			
			//Create the new representation
			this.symbolLibrary[symbol.fullName] = new EM.symbolListSymbol(symbol, this);

			//Append the new representation in place alphabetically
			this.symbolLibrary[symbol.fullName].appendInPlace(this.symbolHTMLContainer);

			//Update shown state
			if(!this.symbolLibrary[symbol.fullName].shouldBeShown(me.regexElementB, me.checkUserB, me.checkNativeB)){
				this.symbolLibrary[symbol.fullName].container.style.display = "none";
			}

			//Keep the list sorted alphabetically
			//this.sortAlphabetically();
		}

		//Function to trigger an update to the HTML representation of the symbol from a fired symbol
		this.triggerUpdateFromFire = function(symbol){

			if(EM.symbolListWindow.doNotDisplayListy[symbol.fullName]){
				return;
			}

			//console.log("trigger from fire: "+symbol.fullName)

			//Fire updates to the ready placed symbol representation
			this.symbolLibrary[symbol.fullName].update();
		}


		this.sortAlphabetically = function(){

			//console.log("Full sort Alphabetically")

			var elements = this.symbolHTMLContainer.children;

			for(var i=0; i<elements.length; i++){

				var name = elements[i].symbol.fullName;

				for(var j=i-1; j>=0; j--){

					//console.log("Comparison :"+name+" <-> "+elements[j].symbol.fullName+"")
					//If the comparison means we need to move further down
					if(name < elements[j].symbol.fullName){
						//If were at the end, insert and break
						if(j==0){
							elements[i].parentNode.insertBefore(elements[i], elements[j]);
							break;
						}
						//Otherwise move further down
						continue;
					}
					//If we dont need to move futher down, and we havent moved down any, break
					else if(j==i-1){
						break;
					}
					//Otherwise if we have moved down some, insert where we are now
					else{
						elements[i].parentNode.insertBefore(elements[i], elements[j+1]);
						break;
					}
				}
			}
		}

	/*
		Considerations
	*/	
		this.toFixConsiderations = function(){
			//Dummy until extention
console.log("fixCOn")
		};
		this.toWindowConsiderations = function(){
console.log("windCOn")
			//Dummy until extention	
		};
		this.resizeConsiderations = function(){
console.log("resizeCOn")
			//Dummy until extention	
			//me.regexContainer.style.width = me.content.offsetWidth;
			me.regexElement.style.width = me.regexContainer.offsetWidth - 10;
			me.symbolHTMLContainer.style.height = me.content.offsetHeight - me.regexContainer.offsetHeight;
		};
		this.toMinConsiderations = function(){
console.log("minCOn")
			//Dummy until extention
		};
		this.closeConsiderations = function(){
console.log("closeCOn")
			//Dummy until extention
		};
		this.removeListenerConsiderations = function(){
			//Dummy until extention

			me.checkUserP.onclick = undefined;
			me.regexElement.onkeyup = undefined;
			me.checkNativeP.onclick = undefined;

			for(var i in me.symbolLibrary){

				me.symbolLibrary[i].container.onmouseenter = undefined;
				me.symbolLibrary[i].containeronmouseleave = undefined;
				me.symbolLibrary[i].containerondblclick = undefined;
			}
		};

		return this;
	}

	EM.symbolListWindow.doNotDisplayListy = {
		"" : true,
	};
	EM.symbolListWindow.systemSymbols = {
		"Array" : true,
		"Array.concat" : true,
		"Array.filter" : true,
		"Array.isit" : true,
		"Array.map" : true,
		"System" : true,
		"System.typeof" : true,
		"System.log" : true,
		"System.JSFunction" : true,
	};

}