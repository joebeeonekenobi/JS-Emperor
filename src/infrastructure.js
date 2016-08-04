loadInfrastructure = function(){

	EM.typeof = function(arg){

		switch(typeof arg){
			case "boolean" : return "boolean"
			case "string" : return "string"
			case "number" : return "number"
			default : 
				if(arg instanceof Array){
					return "array"
				}
				else if(arg instanceof RegExp){
					return "regexp"
				}
				else if(arg instanceof Date){
					return "datetime"
				}
				else{
					return "undefined"
				}
		}
	}

	//The point of the Definition is to record how the symbol was created.
	Definition = function(definition, type){

		this.definition = definition;
		this.type = type;

		return this;
	}

	Definition.Assignment = "Assignment";
	Definition.DefinedObservable = "Defined Observable";
	Definition.DefinedFunction = "Function";
	Definition.JavascriptFunction = "Javascript Function";
	Definition.DefinedProcedure = "Procedure";
	Definition.ScopeIntroduction = "ScopeIntroduction";

	ControlResponse = function(label, argument){

		this.label = label;
		this.argument = argument;

		return this;
	}

	//An instruction object which stores an instruction to execute with arguments for a later time.
	Instruction = function(functionToCall, argumentsToApply){
		
		this.f = functionToCall;
		this.a = argumentsToApply;
		
		this.activate = function(){
			return this.f.apply(this, this.a);
		}
		
		return this;
	};

	/*

		Generic functions to use with instructions

	*/

	//A static function that returns the value it is given. 
	Instruction.returnValue = function(arg){
		
		return arg;
	}

	//A function to activate another instruction, entirely useless if you think about it.
	Instruction.activateInstruction = function(instruction){

		try{
			return instruction.activate();
		}
		catch(error){
			return undefined;
		}
	}

	/*

		Generic Instructions to use

	*/

	Instruction.returnUndefined = new Instruction(Instruction.returnValue, [undefined]);
}