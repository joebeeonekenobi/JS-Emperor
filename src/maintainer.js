loadMaintainer = function(){

	//Object constructor for symbols
	Symbol = function(name, watches, instruction, context, heighestLevelSymbol, dependencyMap){
	
		//Precheck:
		if(name == undefined){
			throw new Error(this.name + " has an undefined argument");
		}
		if(watches == undefined){
			throw new Error(this.name + " has an undefined argument");
		}
		if(instruction == undefined){	
			throw new Error(this.name + " has an undefined argument");
		}
		if(context == undefined){	
			throw new Error(this.name + " has an undefined argument");
		}
		if(heighestLevelSymbol == undefined){
			heighestLevelSymbol = this;
		}
		if(dependencyMap == undefined){
			dependencyMap = new DependencyMap();
		}

		//Self reference for functions
		var me = this;
	
		//A string representing this symbols name
		this.name = name;
		
		//A store for children symbols within this symbol
		this.children = {};
		
		//An array of strings representing the names of symbols that this symbol watches
		this.watches = watches;
		
		//A Javascript function that when called, will change the state of the system and/or return a value 
		this.instruction = instruction;

		//The context is the name of the parent symbol
		this.context = context;

		//The heighest level symbol
		this.heighestLevelSymbol = heighestLevelSymbol;

		//The windows are now stored in the maintainer, so that functions do not intefere with them
		this.windows = {};
		this.symbolLists = {};
		this.adjustmentWindows = {};

		//A reference to the dependency map used by this symbols heighest level symbol
		this.dependencyMap = dependencyMap;

		//The full name of the symbol is the concatenation of the local name and the context
		this.fullName = this.context == "" ? this.name : this.context + "." + this.name

		//Cached value initialised to undefined;
		this.value = undefined;

		//Function to return a child of this symbol with a given sub name
		this.getSymbol = function(name){

			if(name == ""){
				return this;
			}
		
			if(name == undefined){
				throw new Error("Symbol["+this.name+"].getSymbol has been invoked without argument.");
			}
		
			//Split the name by '.'
			var dotSplitName = name.split(".");
			
			//If there is only one part to the name, ie: it did not contain '.'
			if(dotSplitName.length == 1){
				
				//Return the symbol index by its full name, possibly undefined
				return this.children[name];
			}
			//Else if there is more than one part to the name ie: it contained greater than or equal to one '.'
			else{
				
				//If the next child down the tree is undefined
				if(this.children[dotSplitName[0]] == undefined){

					//It will not exist
					return undefined;
				}
				else{

					return this.children[dotSplitName[0]].getSymbol(dotSplitName.slice(1).join("."))
				}
			}
		};
		
		//Handler for symbol declaration
		this.declareSymbol = function(name, watches, instruction, definition){
			
			//Split the name of the new symbol to check how to add it correctly
			var dotSplitName = name.split(".");
			
			//If there is only one part to the name, ie: it did not contain '.'
			if(dotSplitName.length == 1){

				//Then we have the correct place to introduce the symbol

				var newContext = this.context == "" ? this.name : this.context+"."+this.name;

				//Create a new symbol object
				var newSymbol = new Symbol(name, watches, instruction, newContext, me.heighestLevelSymbol, me.dependencyMap);

				//Record the definition of the new symbol
				newSymbol.definition = definition;

				//Return Error if cyclic check fails here
				if(!newSymbol.cyclicSafe){
					throw new Error("The declaration of "+ name +" would result in a cyclic definition: cannot declare.");
				}

				//With the exception of the root symbol,
				if(newSymbol.fullName != ""){

					//Add the declaration into the dependency maintainer
					//console.log("Adding Association: "+newSymbol.fullName+" -> ["+watches.join(", ")+"]")
					me.dependencyMap.associate(newSymbol.fullName, watches);
				}

				//If this symbol overwrites a symbol
				if(this.children[name] != undefined){

					//Store the old children
					var oldChildren = this.children[name].children;

					//Safely remove the previous symbol
					this.children[name].remove();

					//Restore the old children to their new parent
					newSymbol.children = oldChildren;
				}

				console.log("new Symbol: '"+newSymbol.fullName+"' declared.")

				//Store the new symbol in the correct place
				this.children[name] = newSymbol;

				//Trigger Symbol list updates from declaration
				for(var sl in me.heighestLevelSymbol.symbolLists){
					//console.log("cycling through the symbol lists for declaration of "+newSymbol.fullName)
					me.heighestLevelSymbol.symbolLists[sl].triggerUpdateFromDeclaration(newSymbol);
				}

				//Fire the newly created symbol
				newSymbol.fire(true);

				//Update the adjustment window for this observable if it exists
				if(me.heighestLevelSymbol.adjustmentWindows[newSymbol.fullName] != undefined){

					me.heighestLevelSymbol.adjustmentWindows[newSymbol.fullName].reinitialise(newSymbol)
				}
			}
			//Else if there is more than one part to the name ie: it contained greater than or equal to one '.'
			else{

				//Then we need to declare the symbol in a different location
				
				//If the next child down the tree is undefined
				if(this.children[dotSplitName[0]] == undefined){

					//Define it as a nullary symbol
					this.declareSymbol(dotSplitName[0], [], Instruction.returnUndefined, new Definition("undefined", Definition.Assignment));
				}

				//Recursively call declareSymbol starting with the newly created child
				this.children[dotSplitName[0]].declareSymbol(dotSplitName.slice(1).join("."), watches, instruction, definition)
			}

		};
		
		//Function to get the parent of this symbol if it exists, otherwise returns undefined
		this.getParent = function(){
			
			if(this.context == ""){
				return undefined;
			}

			me.heighestLevelSymbol.getSymbol(this.context);
		}
		
		//Function that returns the names of the symbols that watch this symbol
		this.getObserverNames = function(){
		
			return me.dependencyMap.getObservers(this.fullName)
		}

		//Function that returns whether or not the inclusion of this symbol in the graph of watches/observers imply a cycle
		this.cyclicSafe = function(recursiveStack){
		
			//For the first call, create an empty stack
			if(recursiveStack == undefined){
				var recursiveStack = [];
			}
			
			//Check that this symbols name is not in the stack.
			//If it is, it either means that the symbol refers to itsself, or a cycle has been constructed
			for(var s in recursiveStack){
				if(recursiveStack[s] == this.fullName){
					return false;
				}
			}
			
			//If not, push this symbols name onto the stack, and continue on
			recursiveStack.push(this.fullName);

			//For each symbol that this watches
			for(var w in this.watches){
			
				var symbolInQuestion = me.heighestLevelSymbol.getSymbol(this.watches[w]);

				//If the symbol is defined
				if(symbolInQuestion != undefined){
				
					//Recursively apply this method with a copy of this stack, with this name added (previously)
					if(!symbolInQuestion.cyclicSafe(recursiveStack.slice(0))){
					
						//If any cycle is found, return the result up the recursive tree (safe:false)
						return false;
					}
				}
			}
			
			//If no cycle has been returned to this or discovered, it is safe as of this node. (safe:true)
			return true;
		}

		//Function to update the cached value
		this.update = function(procedureSilent){

			var previousValue = this.getStringValue();

			this.value = this.instruction.activate();

			//If update is called on a procedure which has not just been defined, activate its value Instruction.
			if((this.value instanceof Instruction) && (this.value.f == Instruction.procedureActivation)){

				if(!procedureSilent){
					this.value.activate();
				}
			}

			console.log("Value of '"+this.fullName+"' changed from "+previousValue+" to "+this.getStringValue()+".")

			for(var sl in me.heighestLevelSymbol.symbolLists){
				me.heighestLevelSymbol.symbolLists[sl].triggerUpdateFromFire(this);
			}
		}
		
		//A function that will instruct the symbols that watch this symbol to fire - System state changes may also occur
		this.fire = function(procedureSilent){
			
			console.log("Firing symbol: '"+this.fullName+"'");

			//Execution must take place before updating symbols
			this.update(procedureSilent);

			//Get the symbols to update
			var toUpdate = this.getObserverNames();
			
			//For all symbols that watch this symbol
			for(var s in toUpdate){

				var symbolInQuestion = me.heighestLevelSymbol.getSymbol(toUpdate[s]);
				
				//Given that they are not undefined (which they should always not be)
				if(symbolInQuestion != undefined){
					
					//Fire them
					symbolInQuestion.fire();
				}
				else{

					//Else make sure it is known
					throw new Error("Symbols that watch another should not be undefined.")
				}
			}
		}

		//Function to execute safety remove considerations when the symbol is to be replaced
		this.remove = function(){
		
			//Try to remove this symbol from the parents store
			var parent = this.getParent();

			//If there is no parent node (ie: root)
			if(parent == undefined){
				//Do not worry about removing the parent
				return;
			}
			
			if(parent.children[this.name] == undefined){
				throw new Error("Cannot remove a child which does not exist!")
			}
			
			parent.children[this.name] = undefined;

		}
	
		//Temporary function to print the recursive child tree to the console
	 	this.printTree = function(header){

			if(header == undefined){
				header = "";
			}

			console.log(header + this.name)

			for(var i in this.children){
				this.children[i].printTree(header+"\t");
			}
		}

		//Returns how the value is displayed in the symbol list, it should never be used to identify types of values concretely.
		this.getStringValue = function(){

			if(this.value == undefined){		
				return "undefined";
			}

			try{
				return this.value.stringRepresentation();
			}
			catch(e){

				return "Unknown Object";
			}
		}

		//Returns how the definition is displayed in the symbol list, it should never be used to identify types of values concretely.
		this.getStringDefinition = function(){

			if(this.definition.type == Definition.Assignment){

				return this.definition.definition;
			}
			else if(this.definition.type == Definition.DefinedObservable){

				return this.definition.definition;
			}
			else if(this.definition.type == Definition.DefinedFunction){

				return this.definition.definition;
			}
			else if(this.definition.type == Definition.JavascriptFunction){

				return " -- Defined Using Javascript --";
			}
			else if(this.definition.type == Definition.DefinedProcedure){

				return this.definition.definition;
			}
			else if(this.definition.type == Definition.ScopeIntroduction){

				return this.definition.definition;
			}
			else{

				throw new Error("Definition Type not anticipated: "+this.definition.type);
			}

		}

		return this;
	};
};