loadInterpreter = function(){

	//Store for containing interpreter related properties
	EM.Interpreter = function(maintainer){

		//Reference for convenience
		var me = this;

		//Store reference to the maintainer
		me.maintainer = maintainer;
		
		//Indent
		me.indent = "    ";

		me.globalTest = new RegExp("^global\.");
		
		//Store for primitive token type objects
		me.primitiveTokenTypes = {};
		//Store for reduction token type objects
		me.reductionTokenTypes = {};
		//Store for all token type objects
		me.allTokenTypes = {};
		//Store for validation functions
		me.validationFunctions = {};

		//Interpreter specific instruction functions

		//A static function that returns the value of the symbol name given.
		me.evaluateSymbol = function(name){

			//console.log("activating instruction: 'evaluateSymbol' with name: '"+name+"'")

			try{

				return me.maintainer.getSymbol(name).value;
			}
			catch(error){
				return undefined;
			}
		}


		//A static function that returns the value of the symbol name given. (specifically recalculates and fires)
		me.hardEvaluateSymbol = function(name){

			//console.log("activating instruction: 'evaluateSymbol' with name: '"+name+"'")

			try{

				return me.maintainer.getSymbol(name).instruction.activate();
			}
			catch(error){
				return undefined;
			}
		}

		me.symbolAccess = function(name, index){

			try{
				return me.evaluateSymbol(name)[index];
			}
			catch(error){
				return undefined;
			}
		}

		//A reference to the local interpreter & maintainer is required for these 3 instructions.
		me.evaluateSymbol.interpreter = me.maintainer.name;
		me.hardEvaluateSymbol.interpreter = me.maintainer.name;
		me.symbolAccess.interpreter = me.maintainer.name;
		
		//Reduction order
		
		/*	!	The reduction order is important in lexing. Some reductions must preceed others.
		
			SwitchConstruct < BraceBody
			CommaSeparatedNames < CommaSeparatedExpression
		*/
		
		me.reductionOrder = [
		
			"ObsDeclaration",
			"FuncDeclaration",
			"ProcDeclaration",
			"CompoundName",
			"CompoundConstant",
			"LengthReplace",
			//"GetSymbol",
			"Array",
			"ArrayAccessor",
			"APICall",
			"ReturnStatement",
			"ContinueStatement",
			"BreakStatement",
			"FunctionDefCall",
			"FunctionExpCall",
			"SwitchConstruct",
			"BraceBody",
			"BinaryOperation",
			"UnaryOperation",
			"IncompleteConDef",
			"CompleteConDef",
			"ElseIf",
			"IfBranch",
			"ElseIfBranch",
			"ElseBranch",
			"StartIfConstruct",
			"CompleteIfConstruct",
			"ForLoop",
			"WhileLoop",
			"CaseStatement",
			"DefaultStatement",
			"MultipleCaseStatement",
			"CompletedCaseStatement",
			"CommaSeparatedNames",
			"CommaSeparatedExpression",
			"BrCommaSeparatedNames",
			"BrCommaSeparatedExpression",
			"BrName",
			"BrExpression",
			"BrEmpty",
			"MultipleScriptItems",
			"RedundantSemicolon",
		];
		
		/*
			Object Constructors
		*/
		
		//Constructor for Primitive Token Types: An object which contains the instructions for how to deal with particular tokens
		EM.Interpreter.PrimitiveTokenType = function(name, regexString, beautifyFunction, parsingFunction, reductionProperties){
		
			//Store the name of the token internally
			this.name = name;
			
			//Store the regex to capture values with locally
			this.regex = new RegExp(regexString);
			
			//Store the beautifying function locally
			this.beautify = beautifyFunction;
			
			//Store the parsing function locally
			this.parse = parsingFunction;
			
			//Store for properties of the reduced type
			this.reductionProperties = reductionProperties;
		};
		
		//A Token type which groups of tokens can be reduced to: An object which contains the instructions for how to deal with particular tokens
		EM.Interpreter.ReductionTokenType = function(type, reductionRules, beautifyFunction, parsingFunction, reductionProperties){
			
			//Store the type of the token internally
			this.type = type;
			
			//Store the beautifying function locally
			this.beautify = beautifyFunction;
			
			//Store the parsing function locally
			this.parse = parsingFunction;

			/*
				Store for a linear array of rules to reduce tokens to this
				Rules are of the form:
					[validationFunction1, ..., validationFunctionN]
				Where the array of validation functions apply to the tokens on the top of the stack
				
				If all validation returns true, the tokens over the array of validation functions will be condensed to a single token of type name
			*/		
			this.reductionRules = reductionRules;
			
			//Store for properties of the reduced type
			this.reductionProperties = reductionProperties;
		};

		
		/*
			Basic functions for token types
		*/
		
		//More often than not, the parse function for a token type will look the same:
		me.genericParse = function(token){
		
			return new Instruction(
				function(token){
					throw new Error(token.type + " should not be parsed.")
				},
				[token]
			);
		};
		
		//More often than not, the beautify function for a token type will look the same:
		me.genericBeautify = function(token, indent, joinArg){

			if(indent == undefined){
				indent = "";
			}
			if(joinArg == undefined){
				joinArg = " ";
			}
		
			//If a token is made up of many constituent parts
			if(token.value instanceof Array){

				//Keep an array of the string parts to join on return
				var returnStringBuild = [];
				
				//Beautify each part of the token
				for(var v = 0; v < token.value.length; v++){

					returnStringBuild.push( token.value[v].beautify(indent, joinArg) );
				}
			
				//Return the join of the strings generated, joining with the given argument
				return returnStringBuild.join(joinArg);
			}
			//Else simply return the tokens value
			else{

				return token.value;
			}
		};
		
		//A function to test whether or not a string constitutes a word
		me.isAWord = function(inputWord){
			
			for(var i in me.primitiveTokenTypes){
			
				if(me.primitiveTokenTypes[i].regex.test(inputWord)){
					return true;
				}
			}
			
			return false;
		}
		
		//A function to return the type of the argument word
		me.getTokenType = function(inputWord){
		
			for(var i in me.primitiveTokenTypes){
			
				if(me.primitiveTokenTypes[i].regex.test(inputWord)){
					return i;
				}
			}
			
			throw new Error("EM.interpreter.getTokenType cannot find the type of the token for: '"+inputWord+"'");
		}
		
		//Function to take a string of code and produce an array of tokens
		me.tokenise = function(inputString){

			//Remove all newline marks
			//inputString = inputString.replace(/(\r\n|\n|\r)/gm,"");

			//Replace all tab marks
			inputString = inputString.replace(/\t/g, " ");
			var split = inputString.split(/\/\/.*(\r\n|\n|\r)/g);
			var comments = /\/\/.*(\r\n|\n|\r)/.exec(inputString);

			//If a comment is found
			if(comments != null){

				var exit = inputString.splice(comments.index, comments[0].length)
				return me.tokenise(split[0]).concat([new me.Token(comments[0], "Comment")]).concat(me.tokenise(inputString.slice(comments.index+comments[0].length)))
			}
			else{
				//Else we need to make sure there are no newline marks before continuing	
				inputString = inputString.replace(/(\r\n|\n|\r)/gm,"");
			}

			//A store for the tokens that have been completed
			var tokens = [];
			//A store for string building and testing words against regex
			var buildString = [];
			//Initialise a string for intermediate translation
			var currentWord = "";
			//Flag for whether a word has been found
			var wordFound = false;
			
			//Turn the input string into an array
			inputString = inputString.split("");
			
			//For each character in the input string
			while(inputString.length != 0){

				//Push the next character into the store
				buildString.push(inputString.shift());
				
				//Generate the current word
				currentWord = buildString.join("");
				
				//Test if the word exists
				//If this string constitues a word,
				if(me.isAWord(currentWord)){
					
					//Set the flag to true,
					wordFound = true;

					//and go round again.
					continue;
				}
				//If this string does not constitue a word
				else{
				
					//And the previous string did,
					if(wordFound){
					
						//Reverse the previous move
						inputString.unshift(buildString.pop())
						
						//Recreate the current word
						currentWord = buildString.join("");

						//Make the token
						var newToken = new me.Token(currentWord, me.getTokenType(currentWord));
						
						if(newToken.type != "NewLine"){

							//Push the token into the store
							tokens.push(newToken);
						}

						//Empty the buildString
						buildString = [];
						
						wordFound = false;
					}
					//And the previous did not constitute a word either,
					else{
					
						//Continue with the loop
						continue;
					}
				}
			}
			
			//If the loop is finished, and there is still characters in the buildString, attempt to tokenise the remaining string
			if(buildString.length != 0){
				
				//Generate the current word
				currentWord = buildString.join("");
				
				//If this string constitues a word,
				if(me.isAWord(currentWord)){
					
					//Make the token
					var newToken = new me.Token(currentWord, me.getTokenType(currentWord));
					
					//Push the token into the store
					tokens.push(newToken);
				}
				//Else
				else{
				
					//The method will fail.
					throw new Error("Tokenise has failed. The following tail of the input string could not be tokenised: '"+buildString.join("")+"'")
				}
			}
			
			//Remove Whitespace Tokens
			for(var t=0; t<tokens.length; t++){
				if(tokens[t].type == "Whitespace"){
					tokens.splice(t, 1);
					t--;
				}
			}
			
			//Return the tokens
			return tokens;
		}
		
		//Function to take an array of tokens and return an array of reduced tokens
		me.lex = function(tokens){
		
			//Stack for working and complete tokens
			var stack = [];
			
			//Flag for reduction
			var reduced = false;
			
			//Start the reduction loop
			while((tokens.length != 0) || (reduced)){

				//If no reduction was made during the last cycle,
				if(!reduced){
				
					//Shift the next token onto the stack
					stack.push(tokens.shift());
				}
				
				//Reset the flag
				reduced = false;
				
				//Check for unique lookahead 1 conditions
				if(tokens.length >= 1){

					//Compound Anything: X | Dot
					if(tokens[0].type == "Dot"){

						//console.log("Skipping due to lookahead special rule for Compound Anything.")
						continue;
					}
				
					//Check for unique stacksize 1 conditions
					if(stack.length >= 1){
					
						//Infix Operations : EXPRESSION | OPERATOR
						if(me.validationFunctions["isExpression"](tokens[0].type)){
							if(me.validationFunctions["isOperator"](stack[stack.length-1].type)){
							
								//console.log("Skipping due to lookahead special rule for Infix Operations.")
								continue;
							}
						}
						
						//If If Else Problem: isStartIf | ELSE
						if(tokens[0].type == "Else"){
							if(me.validationFunctions["isStartIf"](stack[stack.length-1].type)){
							
								//console.log("Skipping due to lookahead special rule for If If Else.")
								continue;
							}
						}
					}
					
					//Check for unique stacksize 2 conditions
					if(stack.length >= 2){
					
						//API & Function Calls : not(Dot) qualifiesAsName | OPENBRACKET
						if(tokens[0].type == "OpenBracket"){
							if(me.validationFunctions["qualifiesAsName"](stack[stack.length-1].type)){
								if(stack[stack.length-2].type != "Dot"){

									//console.log("Skipping due to lookahead special rule for API & Function Calls.")
									continue;
								}
							}
						}

						//Array Accessor : qualifiesAsName | OPENARRAY
						if(tokens[0].type == "OpenArray"){
							if(me.validationFunctions["qualifiesAsName"](stack[stack.length-1].type)){
								if(stack[stack.length-2].type != "Dot"){

									//console.log("Skipping due to lookahead special rule for Array Accessor.")
									continue;
								}
							}
						}
						
						//Conditional Issue: COMMA X | QUESTIONMARK or COLON
						if(me.validationFunctions["qmarkOrColon"](tokens[0].type)){
							if(stack[stack.length-2].type == "Comma"){
								
								//console.log("Skipping due to lookahead special rule for Conditional Issues.")
								continue;
							}
						}
					}
					
					//Check for unique stacksize 3 conditions
					if(stack.length >= 3){
						
						//Switch Issue: DEFAULT COLON isAllowedInScript | not(CLOSEBRACE)
						if((tokens[0].type != "CloseBrace")){
							if(stack[stack.length-3].type == "Default"){
								if(stack[stack.length-2].type == "Colon"){
									if(me.validationFunctions["isAllowedInScript"](stack[stack.length-1].type)){

										//console.log("Skipping due to lookahead special rule for Default Statements.")
										continue;
									}								
								}
							}
						}
					}
					
					//Check for unique stacksize 4 conditions
					if(stack.length >= 4){
					
						//IF / ELSE IF lookahead brackets
						if((stack[stack.length-4].type == "If")||(stack[stack.length-4].type == "ElseIf")){
							if(stack[stack.length-1].type == "CloseBracket"){

								//console.log("Skipping due to (not really)lookahead special rule for If/ElseIf Statements.")
								continue;
							}
						}
							
							
						//Switch Issue: CASE X COLON isAllowedInScript | not(CASE or DEFAULT or CLOSEBRACE)
						if(!((tokens[0].type == "Case") || (tokens[0].type == "Default") || (tokens[0].type == "CloseBrace"))){
							if(stack[stack.length-4].type == "Case"){
								if(stack[stack.length-2].type == "Colon"){
									if(me.validationFunctions["isAllowedInScript"](stack[stack.length-1].type)){

										//console.log("Skipping due to lookahead special rule for Case Statements.")
										continue;
									}								
								}
							}
						}
					}
				}
				
				/*
					Token Reduction
				*/
				//console.log("Attempting to reduce loop: "+stack)			
				//Iterate through the keys in the given order
				for(var i in me.reductionOrder){
				
					//Store the token type temporarilly
					var tokenType = me.reductionTokenTypes[me.reductionOrder[i]];
				
					//Iterate through the rules in the given order
					for(var j in tokenType.reductionRules){
					
						var rule = tokenType.reductionRules[j];
						var ruleMatches = false;
						
						//As long as the stack is longer than or equal to the rule
						if(stack.length >= rule.length){
						
							//Store a backward count for matching up with the conditions 'k'
							var backCount = stack.length;
						
							//Go through each condition in the rule backwards to see if it matches
							for(var k = rule.length-1; k>=0; k--){
							
								//Decrement the backCount
								backCount--;
							
								var condition = rule[k];
								
								//For function conditions
								if(typeof(condition) == "function"){
									if(! (condition(stack[backCount].type))){
									
										//A single condition has been broken
										break;
									}
									else if(k == 0){
										//The entire rule matches.
										ruleMatches = true;
									}
									else{
										//Check the next condition
										continue;
									}
								}
								//For type conditions
								else{
									if(! (condition == stack[backCount].type)){
									
										//A single condition has been broken
										break;
									}
									else if(k == 0){
										//The entire rule matches.
										ruleMatches = true;
									}
									else{
										//Check the next condition
										continue;
									}
								}
								
							}
							
							//Check the flag to see if the entire rule has matched
							if(ruleMatches){
								
								//Reduce the tokens into a new
								var reducedToken = new me.Token(stack.splice(stack.length-rule.length), tokenType.type);
								
								//Push the reduced token onto the stack
								stack.push(reducedToken);
								
								//Set the flag to true
								reduced = true;
								
								break;
							}
						}
						
					}
					
					//If we have reduced, go round from the beginning
					if(reduced){
						break;
					}
				}
				if(!reduced){
					//console.log("No Reduction rules match.")
				}
			}
			
			//Return the stack of reduced tokens
			return stack;
		}
		
		//Function to return true or false depending on if the tokens provided are executable in a script
		me.validate = function(tokens){
			
			for(var t in tokens){
				
				if(me.allTokenTypes[tokens[t].type].reductionProperties["isAllowedInScript"] == undefined){
					
					return false;
				}
			}
			
			return true;
		}
		
		//Takes tokens and wraps them in a single script token to make it easier to manage and call functions on
		me.enscript = function(tokens, valid){
		
			//If the tokens are not an array, the method is probably mistaken for upToEnscript
			if(!(tokens instanceof Array)){
				throw new Error("The method is not being called properly, perhaps you meant to upToEnscript instead?")
			}
			if(valid == undefined){
				valid = false;
			}
			
			if(valid){
				return new me.Token(tokens, "ValidScript");
			}
			else{
				return new me.Token(tokens, "InvalidScript");
			}
			
		}

		me.parseScript = function(scriptToken){

			if(scriptToken.type == "InvalidScript"){
				throw new Error(scriptToken.beautify()+" cannot be activated as it is invalid.");
			}
			else{
				return [].concat(scriptToken.parse()[0]);
			}
		}

		me.activateScript = function(programInstructions){

			for(var i=0; i<programInstructions.length; i++){

				//Check to see if the individual instructions return anything
				var response = programInstructions[i].activate();

				//If bracebodies recieve a control signal, they should return it to their calling instruction's function ie:forloopControlStructure
				if(response instanceof ControlResponse){

					return response;
				}
			}
		}
		
		//Function to lex raw input
		me.upToLex = function(inputString){
		
			return me.lex(me.tokenise(inputString));

		}
		
		//Function to validate raw input
		me.upToValidate = function(inputString){
		
			return me.validate(me.lex(me.tokenise(inputString)));

		}
		
		//Function to wrap raw input in a script token
		me.upToEnscript = function(inputString){
		
			var tokens = me.lex(me.tokenise(inputString));
			var valid = me.validate(tokens);

			return me.enscript(tokens, valid);

		}

		//Function to parse raw input into instructions to execute
		me.upToParseScript = function(inputString){

			var scriptToken = me.upToEnscript(inputString);

			return me.parseScript(scriptToken);

		}

		//Function to parse and execute raw input
		me.upToActivateScript = function(inputString){

			var programInstructions = me.upToParseScript(inputString);

			return me.activateScript(programInstructions);
		}
		
		/*

			Tokens

		*/

		this.Token = function(value, type){

			this.value = value;
			this.type = type;
			this.properties = me.allTokenTypes[this.type].reductionProperties;
		
			//Function to return beautified code
			this.beautify = function(indent, joinArg){
			
				if(indent == undefined){
					indent = "";
				}
				if(joinArg == undefined){
					joinArg = "";
				}
				
				return me.allTokenTypes[this.type].beautify(this, indent, joinArg)

			};
			
			//Function to parse into executable code
			this.parse = function(){

				return me.allTokenTypes[this.type].parse(this);

			}

			this.stringRepresentation = function(){

				return this.beautify();
			}

			this.toString = function(){
			
				if(this.value instanceof Array){
				
					var build = this.type + "[ ";
					for(var i in this.value){
						build = build + this.value[i].toString() + " ";
					}
					build = build + "]";
					
					return build;
				}
				else{
					return this.value+"("+this.type+")";
				}
			
			}

			this.getChildrenWhichQualifyAs = function(rule, terminateWhenTrue, recursiveStack){

				//Recursive stack to pass down the tree
				if(recursiveStack == undefined){
					var recursiveStack = [];
				}
				if(terminateWhenTrue == undefined){
					var terminateWhenTrue = false;
				}

				//Check if this token qualifies, push into recursive stack if true
				if(typeof(rule) == "function"){
					if(rule(this.type)){

						recursiveStack.push(this);

						if(terminateWhenTrue){
							return recursiveStack;
						}
					}
				}
				else{
					if(rule == this.type){

						recursiveStack.push(this);

						if(terminateWhenTrue){
							return recursiveStack;
						}
					}
				}

				//Cease recursive search if terminateWhenTrue is set

				//Else keep searching if possible
				if(this.value instanceof Array){

					var merge = [];
					var mergeIds = [];

					for(var c in this.value){

						var searchResult = this.value[c].getChildrenWhichQualifyAs(rule, terminateWhenTrue, recursiveStack);

						for(var r in searchResult){

							var key = searchResult[r].toString();

							if(!mergeIds.contains(key)){

								mergeIds.push(key);
								merge.push(searchResult[r]);
							}
						}
					}

					return merge;
				}
				//If not possible, return recursive stack
				else{
					return recursiveStack;
				}

			}

			this.printTree = function(indent){
				
				if(indent == undefined){
					indent = "";
				}
				
				if(typeof this.value == "string"){
				
					console.log(indent + "[" + this.type + "]");
					console.log(indent + me.indent + this.value);
				}
				else{
				
					console.log(indent + "[" + this.type + "]");
					for(var i in this.value){
						this.value[i].printTree(indent + me.indent);
					}			
				}

			}
			
			return this;
		};
		
		
		
		/*
			Validation Functions for token types
			
			Each return true or false depending on whether the condition is set.
		*/
		me.validationFunctions["isAllowedInScript"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isAllowedInScript"];
		};
		me.validationFunctions["isExpression"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isExpression"];
		};
		me.validationFunctions["isBracketedNameS"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isBracketedNameS"];
		};
		me.validationFunctions["isBracketedExpressionS"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isBracketedExpressionS"];
		};
		me.validationFunctions["qualifiesAsName"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["qualifiesAsName"];
		};
		me.validationFunctions["qualifiesAsInnerSwitch"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["qualifiesAsInnerSwitch"];
		};
		me.validationFunctions["isOperator"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isOperator"];
		};
		me.validationFunctions["isStartIf"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isStartIf"];
		};
		me.validationFunctions["qmarkOrColon"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["qmarkOrColon"];
		};
		me.validationFunctions["isCommaSeparated"] = function(tokenType){
			return me.allTokenTypes[tokenType].reductionProperties["isCommaSeparated"];
		};
		
		//To String Antics (Temporary)
		me.validationFunctions["isAllowedInScript"].toString = function(){
			return "isAllowedInScript";
		}
		me.validationFunctions["isExpression"].toString = function(){
			return "isExpression";
		};
		me.validationFunctions["isBracketedNameS"].toString = function(){
			return "isBracketedNameS";
		};
		me.validationFunctions["isBracketedExpressionS"].toString = function(){
			return "isBracketedExpressionS";
		};
		me.validationFunctions["qualifiesAsName"].toString = function(){
			return "qualifiesAsName";
		};
		me.validationFunctions["qualifiesAsInnerSwitch"].toString = function(){
			return "qualifiesAsInnerSwitch";
		};
		me.validationFunctions["isOperator"].toString = function(){
			return "isOperator";
		};
		me.validationFunctions["isStartIf"].toString = function(){
			return "isStartIf";
		};
		me.validationFunctions["qmarkOrColon"].toString = function(){
			return "qmarkOrColon";
		};
		me.validationFunctions["isCommaSeparated"].toString = function(){
			return "isCommaSeparated";
		};

		/*
			Primitive Tokens
		*/

		me.primitiveTokenTypes["Whitespace"] = me.allTokenTypes["Whitespace"] = new EM.Interpreter.PrimitiveTokenType(
			"Whitespace", "^( )*$", me.genericBeautify, me.genericParse, {
				
			}
		);
		me.primitiveTokenTypes["Plus"] = me.allTokenTypes["Plus"] = new EM.Interpreter.PrimitiveTokenType(
			"Plus", "^(\\+)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Minus"] = me.allTokenTypes["Minus"] = new EM.Interpreter.PrimitiveTokenType(
			"Minus", "^(\\-)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Multiply"] = me.allTokenTypes["Multiply"] = new EM.Interpreter.PrimitiveTokenType(
			"Multiply", "^(\\*)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Divide"] = me.allTokenTypes["Divide"] = new EM.Interpreter.PrimitiveTokenType(
			"Divide", "^(\\/)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Modulas"] = me.allTokenTypes["Modulas"] = new EM.Interpreter.PrimitiveTokenType(
			"Modulas", "^(\\%)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["And"] = me.allTokenTypes["And"] = new EM.Interpreter.PrimitiveTokenType(
			"And", "^((\\&\\&)|(\\&))$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Or"] = me.allTokenTypes["Or"] = new EM.Interpreter.PrimitiveTokenType(
			"Or", "^((\\|\\|)|(\\|))$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Equals"] = me.allTokenTypes["Equals"] = new EM.Interpreter.PrimitiveTokenType(
			"Equals", "^(==)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["NotEquals"] = me.allTokenTypes["NotEquals"] = new EM.Interpreter.PrimitiveTokenType(
			"NotEquals", "^(\!=)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Not"] = me.allTokenTypes["Not"] = new EM.Interpreter.PrimitiveTokenType(
			"Not", "^(\!)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["LessThanEquals"] = me.allTokenTypes["LessThanEquals"] = new EM.Interpreter.PrimitiveTokenType(
			"LessThanEquals", "^(<=)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["LessThan"] = me.allTokenTypes["LessThan"] = new EM.Interpreter.PrimitiveTokenType(
			"LessThan", "^(<)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["MoreThanEquals"] = me.allTokenTypes["MoreThanEquals"] = new EM.Interpreter.PrimitiveTokenType(
			"MoreThanEquals", "^(>=)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["MoreThan"] = me.allTokenTypes["MoreThan"] = new EM.Interpreter.PrimitiveTokenType(
			"MoreThan", "^(>)$", me.genericBeautify, me.genericParse, {
				isOperator:		true
			}
		);
		me.primitiveTokenTypes["Is"] = me.allTokenTypes["Is"] = new EM.Interpreter.PrimitiveTokenType(
			"Is", "^(is)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Assign"] = me.allTokenTypes["Assign"] = new EM.Interpreter.PrimitiveTokenType(
			"Assign", "^(=)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Increment"] = me.allTokenTypes["Increment"] = new EM.Interpreter.PrimitiveTokenType(
			"Increment", "^(\\+\\+)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Decrement"] = me.allTokenTypes["Decrement"] = new EM.Interpreter.PrimitiveTokenType(
			"Decrement", "^(\\-\\-)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Comma"] = me.allTokenTypes["Comma"] = new EM.Interpreter.PrimitiveTokenType(
			"Comma", "^(,)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Dot"] = me.allTokenTypes["Dot"] = new EM.Interpreter.PrimitiveTokenType(
			"Dot", "^(\\.)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Semicolon"] = me.allTokenTypes["Semicolon"] = new EM.Interpreter.PrimitiveTokenType(
			"Semicolon", "^(;)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Colon"] = me.allTokenTypes["Colon"] = new EM.Interpreter.PrimitiveTokenType(
			"Colon", "^(:)$", me.genericBeautify, me.genericParse, {
				qmarkOrColon:	true,
			}
		);
		me.primitiveTokenTypes["QuestionMark"] = me.allTokenTypes["QuestionMark"] = new EM.Interpreter.PrimitiveTokenType(
			"QuestionMark", "^(\\?)$", me.genericBeautify, me.genericParse, {
				qmarkOrColon:	true,
			}
		);
		me.primitiveTokenTypes["OpenBracket"] = me.allTokenTypes["OpenBracket"] = new EM.Interpreter.PrimitiveTokenType(
			"OpenBracket", "^(\\()$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["CloseBracket"] = me.allTokenTypes["CloseBracket"] = new EM.Interpreter.PrimitiveTokenType(
			"CloseBracket", "^(\\))$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["OpenBrace"] = me.allTokenTypes["OpenBrace"] = new EM.Interpreter.PrimitiveTokenType(
			"OpenBrace", "^({)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["CloseBrace"] = me.allTokenTypes["CloseBrace"] = new EM.Interpreter.PrimitiveTokenType(
			"CloseBrace", "^(})$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["OpenArray"] = me.allTokenTypes["OpenArray"] = new EM.Interpreter.PrimitiveTokenType(
			"OpenArray", "^(\\[)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["CloseArray"] = me.allTokenTypes["CloseArray"] = new EM.Interpreter.PrimitiveTokenType(
			"CloseArray", "^(\\])$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["If"] = me.allTokenTypes["If"] = new EM.Interpreter.PrimitiveTokenType(
			"If", "^(if)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Else"] = me.allTokenTypes["Else"] = new EM.Interpreter.PrimitiveTokenType(
			"Else", "^(else)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["For"] = me.allTokenTypes["For"] =new EM.Interpreter.PrimitiveTokenType(
			"For", "^(for)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["While"] = me.allTokenTypes["While"] =new EM.Interpreter.PrimitiveTokenType(
			"While", "^(while)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["In"] = me.allTokenTypes["In"] = new EM.Interpreter.PrimitiveTokenType(
			"In", "^(in)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Break"] = me.allTokenTypes["Break"] = new EM.Interpreter.PrimitiveTokenType(
			"Break", "^(break)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Switch"] = me.allTokenTypes["Switch"] = new EM.Interpreter.PrimitiveTokenType(
			"Switch", "^(switch)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Case"] = me.allTokenTypes["Case"] = new EM.Interpreter.PrimitiveTokenType(
			"Case", "^(case)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Default"] = me.allTokenTypes["Default"] = new EM.Interpreter.PrimitiveTokenType(
			"Default", "^(default)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Continue"] = me.allTokenTypes["Continue"] = new EM.Interpreter.PrimitiveTokenType(
			"Continue", "^(continue)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Return"] = me.allTokenTypes["Return"] = new EM.Interpreter.PrimitiveTokenType(
			"Return", "^(return)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Proc"] = me.allTokenTypes["Proc"] = new EM.Interpreter.PrimitiveTokenType(
			"Proc", "^(proc)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Func"] = me.allTokenTypes["Func"] = new EM.Interpreter.PrimitiveTokenType(
			"Func", "^(func)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Symbol"] = me.allTokenTypes["Symbol"] = new EM.Interpreter.PrimitiveTokenType(
			"Symbol", "^(symbol)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["True"] = me.allTokenTypes["True"] = new EM.Interpreter.PrimitiveTokenType(
			"True", "^(true)$", 
			me.genericBeautify, 
			function(token){
				return new Instruction(Instruction.returnValue, [true]);
			},
			{
				isExpression:			true,
			}
		);
		me.primitiveTokenTypes["False"] = me.allTokenTypes["False"] = new EM.Interpreter.PrimitiveTokenType(
			"False", "^(false)$", 
			me.genericBeautify,
			function(token){
				return new Instruction(Instruction.returnValue, [false]);
			},
			{
				isExpression:			true,
			}
		);
		me.primitiveTokenTypes["Hash"] = me.allTokenTypes["Hash"] = new EM.Interpreter.PrimitiveTokenType(
			"Hash", "^(#)$", me.genericBeautify, me.genericParse, {
			
			}
		);
		me.primitiveTokenTypes["Comment"] = me.allTokenTypes["Comment"] = new EM.Interpreter.PrimitiveTokenType(
			"Comment", "(?!x)x"//Regex will match nothing - detecting comments is done differently
			, 
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return indent + token.value.replace(/(\r\n|\n|\r)/gm,"")

			},
			function(token){

				return Instruction.returnUndefined;
			}, 
			{
				isAllowedInScript: 		true,
			}
		);
		me.primitiveTokenTypes["Constant"] = me.allTokenTypes["Constant"] = new EM.Interpreter.PrimitiveTokenType(
			"Constant", "^(([0-9])+)$", 
			me.genericBeautify,
			function(token){

				return new Instruction(Instruction.returnValue, [parseFloat(token.value)]);

			},
			{
				isExpression:			true,
			}
		);
		me.primitiveTokenTypes["String"] = me.allTokenTypes["String"] = new EM.Interpreter.PrimitiveTokenType(
			"String", "^((\"(.*)(([^\\\\]))\")||(\"\"))$", 
			me.genericBeautify, 
			function(token){

				try{

					return new Instruction(Instruction.returnValue, [eval(token.value)]);
				}
				catch(e){

					console.log(token);
					throw new Error("Fatal error evaluating string.")
				}

			},
			{
				isExpression:			true,
			}
		);
		me.primitiveTokenTypes["Name"] = me.allTokenTypes["Name"] = new EM.Interpreter.PrimitiveTokenType(
			"Name", "^((([a-z])|([A-Z])|(_))+((([a-z])|([A-Z])|(_)|([0-9])))*)$", me.genericBeautify,
			function(token){

				return new Instruction(me.evaluateSymbol, [token.value]);

			},
			{
				isExpression:			true,
				qualifiesAsName:		true,
			}
		);
			

			
			
			
			
		/*
			Reduction Tokens
		*/
		
		//Declarations
		
		me.reductionTokenTypes["ObsDeclaration"] = me.allTokenTypes["ObsDeclaration"] = new EM.Interpreter.ReductionTokenType(
			"ObsDeclaration", 
			[
				[me.validationFunctions["qualifiesAsName"], "Increment", "Semicolon"],
				[me.validationFunctions["qualifiesAsName"], "Decrement", "Semicolon"],
				[me.validationFunctions["qualifiesAsName"], "Is", me.validationFunctions["isExpression"], "Semicolon"],
				[me.validationFunctions["qualifiesAsName"], "Assign", me.validationFunctions["isExpression"], "Semicolon"],
			],
			//Beautify Function
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				if(token.value.length == 3){
					return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent) + token.value[2].beautify(indent);
				}
				else{
					return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent) + token.value[3].beautify(indent);
				}
			},
			//Parsing function
			function(token){
			
				if(token.value.length == 3){
				
					//Parsing instruction for Incrementing
					if(token.value[1].type == "Increment"){
					
						//Returns an instruction that when activated, declares a symbol.
						return new Instruction(
						
							//Argument 1: Function to call when activated
							function(name, watches, getValueInstruction, definition){

								//Declare the symbol assigned, with evaluation function that returns the value one higher than it was.
								me.maintainer.declareSymbol(name, watches, new Instruction(Instruction.returnValue, [getValueInstruction.activate() + 1]), definition);
							},
							//Argument 2: arguments to call function with when activated.
							[
								token.value[0].beautify(), 
								[], 
								token.value[0].parse(),
								new Definition(token.value[0].beautify()+" + 1", Definition.Assignment)
							]
						);
					}
					//Parsing instruction for Decrementing
					else if(token.value[1].type == "Decrement"){

						//Returns an instruction that when activated, declares a symbol.
						return new Instruction(
						
							//Argument 1: Function to call when activated
							function(name, watches, getValueInstruction, definition){

								//Declare the symbol assigned, with evaluation function that returns the value one higher than it was.
								me.maintainer.declareSymbol(name, watches, new Instruction(Instruction.returnValue, [getValueInstruction.activate() - 1]), definition);
							},
							//Argument 2: arguments to call function with when activated.
							[
								token.value[0].beautify(), 
								[], 
								token.value[0].parse(),
								new Definition(token.value[0].beautify()+" - 1", Definition.Assignment)
							]
						);
					}
				}
				else{
					
					//Define case
					if(token.value[1].type == "Is"){

						//Returns an instruction that when activated, declares a symbol.
						return new Instruction(
						
							//Argument 1: Function to call when activated
							function(name, watches, getValueInstruction, definition){
									
								//Declare the symbol defined, with evaluation function that returns the value of the instruction as it is activated.
								me.maintainer.declareSymbol(name, watches, getValueInstruction, definition);
							},
							//Argument 2: arguments to call function with when activated.
							[
								token.value[0].beautify(), 
								token.value[2].getChildrenWhichQualifyAs(
										me.validationFunctions["qualifiesAsName"],
										true
									).map( 
										function(arg){
											return arg.beautify();
										} 
								), 
								token.value[2].parse(),
								new Definition(token.value[2].beautify(), Definition.DefinedObservable)
							]
						);
					}

					//Assign case
					if(token.value[1].type == "Assign"){

						//Returns an instruction that when activated, declares a symbol.
						var toReturn = new Instruction(
						
							//Argument 1: Function to call when activated
							function(name, watches, getValueInstruction, definition){

								//Calculate the value here
								var valueAssigned = getValueInstruction.activate()

								//If the value happens to be a procedure:
								if(valueAssigned instanceof Instruction){
									if(valueAssigned.f == Instruction.procedureActivation){

										//Make sure the watches are carried over
										me.maintainer.declareSymbol(name, valueAssigned.a[1], new Instruction(Instruction.returnValue, [valueAssigned]), definition);
										return;
									}
								}

								//Declare the symbol assigned, with evaluation function that returns the calculated value at the time of declaration
								me.maintainer.declareSymbol(name, watches, new Instruction(Instruction.returnValue, [valueAssigned]), definition);
							},
							//Argument 2: arguments to call function with when activated.
							[
								token.value[0].beautify(), 
								[], 
								token.value[2].parse(),
								new Definition(token.value[2].beautify(), Definition.Assignment)
							]
						);

						return toReturn;
					}
				}
			}, 
			{
				isAllowedInScript:		true,
			}
		);
		me.reductionTokenTypes["FuncDeclaration"] = me.allTokenTypes["FuncDeclaration"] = new EM.Interpreter.ReductionTokenType(
			"FuncDeclaration", 
			[
				["Func", "FunctionDefCall", "BraceBody"]
			], 
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent);
			},
			function(token){

				//Return an instruction which declares a function symbol when activated
				return new Instruction(

					//Argument 1: Function to call when activated
					function(name, watches, activationInstruction, definition){
							
						//Declare the symbol defined, with evaluation function that returns the value of the instruction as it is activated.
						me.maintainer.declareSymbol(name, watches, activationInstruction, definition);
					},
					//Argument 2: arguments to call function with when activated.
					[
						token.value[1].value[0].beautify(),
						token.value[2].getChildrenWhichQualifyAs(
							"CompoundName",
							true
						).map( 
							function(arg){
								return arg.beautify();
							} 
						).filter(function(element){
							return me.globalTest.test(element)
						}).map(function(element){
							return element.replace(/^global\./, "");
						}),
						new Instruction(
							Instruction.formFunction,
							[
								token.value[1].value[1].getChildrenWhichQualifyAs(
									me.validationFunctions["qualifiesAsName"],
									true
								).map( 
									function(arg){
										return arg.beautify();
									} 
								),
								token.value[2].beautify()
							]
						),
						new Definition(token.beautify(), Definition.DefinedFunction)
					]
				)

			},
			{
				isAllowedInScript:		true,
			}
		);
		me.reductionTokenTypes["ProcDeclaration"] = me.allTokenTypes["ProcDeclaration"] = new EM.Interpreter.ReductionTokenType(
			"ProcDeclaration", 
			[
				["Proc", "FunctionDefCall", "BraceBody"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent);
			}, 
			function(token){

				var calculateWatches = token.value[1].value[1].getChildrenWhichQualifyAs(
					me.validationFunctions["qualifiesAsName"],
					true
				).map( 
					function(arg){
						return arg.beautify();
					} 
				)

				//Return an instruction which declares a procedural symbol when activated
				return new Instruction(

					//Argument 1: Function to call when activated
					function(name, watches, activationInstruction, definition){
							
						//Declare the symbol defined, with evaluation function that returns the value of the instruction as it is activated.
						me.maintainer.declareSymbol(name, watches, activationInstruction, definition);
					},
					//Argument 2: arguments to call function with when activated.
					[
						token.value[1].value[0].beautify(),
						calculateWatches,
						new Instruction(
							Instruction.formProcedure,
							[
								token.value[2].parse(),
								calculateWatches
							]
						),
						new Definition(token.beautify(), Definition.DefinedProcedure)
					]
				)
			},
			{
				isAllowedInScript:		true,
			}
		);
		
		//Compounds
		me.reductionTokenTypes["CompoundName"] = me.allTokenTypes["CompoundName"] = new EM.Interpreter.ReductionTokenType(
			"CompoundName", 
			[
				[me.validationFunctions["qualifiesAsName"], "Dot", me.validationFunctions["qualifiesAsName"]]
			],
			me.genericBeautify,
			function(token){

				var beautiful = token.beautify()

				if(me.globalTest.test(beautiful)){
					return EM.interpreter.upToLex(beautiful.replace(/^global\./, ""))[0].parse();
				}
				else{
					
					return new Instruction(

						me.evaluateSymbol, 
						[token.beautify()]
					);
				}

			},
			{
				isExpression:			true,
				qualifiesAsName:		true,
			}
		);
		me.reductionTokenTypes["CompoundConstant"] = me.allTokenTypes["CompoundConstant"] = new EM.Interpreter.ReductionTokenType(
			"CompoundConstant", 
			[
				["Constant", "Dot", "Constant"]
			],
			me.genericBeautify,
			function(token){

				return new Instruction(
					Instruction.returnValue,
					[parseFloat(token.value[0].value + "." + token.value[2].value)]
				);
			},
			{
				isExpression:			true,
			}
		);
		
		//Array
		me.reductionTokenTypes["Array"] = me.allTokenTypes["Array"] = new EM.Interpreter.ReductionTokenType(
			"Array",
			[
				["OpenArray", "CloseArray"],
				["OpenArray", me.validationFunctions["isExpression"], "CloseArray"],
				["OpenArray", me.validationFunctions["isCommaSeparated"], "CloseArray"],
			],
			me.genericBeautify, 
			function(token){

				if(token.value.length == 2){
					return new Instruction(
						Instruction.returnValue,
						[
							[]
						]
					);
				}
				else if(me.validationFunctions["isExpression"](token.value[1].type)){
					return new Instruction(
						Instruction.formArray,
						[
							[token.value[1].parse()]
						]
					);
				}
				else{
					return new Instruction(
						Instruction.formArray,
						[
							[].concat(token.value[1].parse())
						]
					);
				}
			},
			{
				isExpression:			true,
			}
		);
		me.reductionTokenTypes["ArrayAccessor"] = me.allTokenTypes["ArrayAccessor"] = new EM.Interpreter.ReductionTokenType(
			"ArrayAccessor", 
			[
				[me.validationFunctions["qualifiesAsName"], "Array"]
			],
			me.genericBeautify, 
			function(token){

				if(token.value[1].value.length != 3){
					//console.log(token.value[1].value)
					throw new Error("Array access syntax incorrect.")
				}

				return new Instruction(
					function(evaluateSymbolInstruction, evaluateIndexInstruction){
						try{

							return evaluateSymbolInstruction.activate()[evaluateIndexInstruction.activate()];
						}
						catch(e){
							return undefined;
						}
					}, 
					[
						new Instruction(me.evaluateSymbol, [token.value[0].value]), 
						token.value[1].value[1].parse()
					]
				);

			},
			{
				isExpression:			true,
			}
		);
		
		//Statements

		me.reductionTokenTypes["APICall"] = me.allTokenTypes["APICall"] = new EM.Interpreter.ReductionTokenType(
			"APICall", 
			[
				["FunctionDefCall", "Semicolon"],
				["FunctionExpCall", "Semicolon"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
				
				return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent);
			}, 
			function(tokens){

				return tokens.value[0].parse();
			},
			{
				isAllowedInScript:		true,
				isExpression: 			true,
			}
		);

		me.reductionTokenTypes["ReturnStatement"] = me.allTokenTypes["ReturnStatement"] = new EM.Interpreter.ReductionTokenType(
			"ReturnStatement", 
			[
				["Return", me.validationFunctions["isExpression"], "Semicolon"],
				["Return", "Semicolon"],
				["Return", "APICall"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
				
				if(token.value.length == 2){
					return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent);
				}
				else{
					return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + token.value[2].beautify(indent);
				}
			}, 
			function(token){

				if(token.value[1].type == "Semicolon"){

					return new Instruction(
						Instruction.returnValue,
						[
							new ControlResponse(
								"return",
								Instruction.returnUndefined
							)
						]
					)
				}
				else{
					return new Instruction(
						Instruction.returnValue,
						[
							new ControlResponse(
								"return",
								token.value[1].parse()
							)
						]
					)
				}
			},
			{
				isAllowedInScript:		true,
			}
		);
		me.reductionTokenTypes["ContinueStatement"] = me.allTokenTypes["ContinueStatement"] = new EM.Interpreter.ReductionTokenType(
			"ContinueStatement", 
			[
				["Continue", "Semicolon"],
			],
			me.genericBeautify, 
			function(token){

				return new Instruction(
					Instruction.returnValue,
					[
						new ControlResponse(
							"continue"
						)
					]
				)
			},
			{
				isAllowedInScript:		true,
			}
		);
		me.reductionTokenTypes["BreakStatement"] = me.allTokenTypes["BreakStatement"] = new EM.Interpreter.ReductionTokenType(
			"BreakStatement", 
			[
				["Break", "Semicolon"]
			],
			me.genericBeautify, 
			function(token){

				return new Instruction(
					Instruction.returnValue,
					[
						new ControlResponse(
							"break"
						)
					]
				)
			},
			{
				isAllowedInScript:		true,
			}
		);
		
		//Function Calls
		
		me.reductionTokenTypes["FunctionDefCall"] = me.allTokenTypes["FunctionDefCall"] = new EM.Interpreter.ReductionTokenType(
			"FunctionDefCall", 
			[
				[me.validationFunctions["qualifiesAsName"], me.validationFunctions["isBracketedNameS"]]
			],
			me.genericBeautify,
			function(token){

				return new Instruction(
					Instruction.functionApplication,
					[
						token.value[0].parse(),
						[].concat(token.value[1].parse()),
						me
					]
				)
			},
			{
				isExpression:			true,
			}
		);
		me.reductionTokenTypes["FunctionExpCall"] = me.allTokenTypes["FunctionExpCall"] = new EM.Interpreter.ReductionTokenType(
			"FunctionExpCall", 
			[
				[me.validationFunctions["qualifiesAsName"], me.validationFunctions["isBracketedExpressionS"]]
			],
			me.genericBeautify, 
			function(token){

				return new Instruction(
					Instruction.functionApplication,
					[
						token.value[0].parse(),
						[].concat(token.value[1].parse()),
						me
					]
				)
			},
			{
				isExpression:			true,
			}
		);
		
		me.reductionTokenTypes["BraceBody"] = me.allTokenTypes["BraceBody"] = new EM.Interpreter.ReductionTokenType(
			"BraceBody", 
			[
				["OpenBrace", "CloseBrace"],
				["OpenBrace", me.validationFunctions["isAllowedInScript"], "CloseBrace"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				if(token.value.length == 3){
					return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent + me.indent) + "\n" + indent + token.value[2].beautify(indent);
				}
				else{
					return token.value[0].beautify(indent) + token.value[1].beautify(indent);
				}
			}, 
			//This is a semi-parsing function, it will return an array of instructions.
			//^This is no longer the case, it will return a special script handling instruction
			function(token){

				if(token.value.length == 2){

					//return [];

					return new Instruction(

						Instruction.braceBodyHandler,
						[
							[]
						]
					);
				}
				else{

					//return [].concat(token.value[1].parse());

					return new Instruction(

						Instruction.braceBodyHandler,
						[
							[].concat(token.value[1].parse())
						]
					);
				}
			},
			{
				isAllowedInScript:		true,
			}
		);
		
		//Operations
		me.reductionTokenTypes["BinaryOperation"] = me.allTokenTypes["BinaryOperation"] = new EM.Interpreter.ReductionTokenType(
			"BinaryOperation", 
			[
				[me.validationFunctions["isExpression"], me.validationFunctions["isOperator"], me.validationFunctions["isExpression"]]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent);
			}, 
			function(token){

				switch(token.value[1].type){
					case "Plus":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((a instanceof Array)&&(b instanceof Array)){
										return a.concat(b);
									}
									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									else{

										return a + b;
									}
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "Minus":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a - b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "Multiply":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a * b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "Divide":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a / b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "Modulas":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a % b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "And":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a && b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "Or":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a || b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "Equals":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a == b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "NotEquals":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}
									
									return a != b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "LessThan":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}

									return a < b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "LessThanEquals":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}

									return a <= b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "MoreThan":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}

									return a > b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					case "MoreThanEquals":
						return new Instruction(
							function(instructionA, instructionB){
								try{

									var a = instructionA.activate();
									var b = instructionB.activate();

									if((typeof a == "object")||(typeof b == "object")){

										return undefined
									}

									return a >= b;
								}
								catch(error){
									return undefined;
								}
							},
							[
								token.value[0].parse(),
								token.value[2].parse(),
							]
						);
					default : 
						throw new Error("Unanticipated Binary Operation Type.")
				}

			},
			{
				isExpression:			true,
			}
		);
		me.reductionTokenTypes["UnaryOperation"] = me.allTokenTypes["UnaryOperation"] = new EM.Interpreter.ReductionTokenType(
			"UnaryOperation", 
			[
				["Minus", me.validationFunctions["isExpression"]],
				["Not", me.validationFunctions["isExpression"]]
			],
			me.genericBeautify, 
			function(token){

				if(token.value[0].type == "Minus"){
					return new Instruction(
						function(instruction){
							try{
								return - instruction.activate();
							}
							catch(error){
								return undefined;
							}
						},
						[
							token.value[1].parse(),
						]
					);
				}
				else if(token.value[0].type == "Not"){
					return new Instruction(
						function(instruction){
							try{
								return ! instruction.activate();
							}
							catch(error){
								return undefined;
							}
						},
						[
							token.value[1].parse(),
						]
					);
				}
			},
			{
				isExpression:			true,
			}
		);
		
		//Conditional Definitions
		me.reductionTokenTypes["IncompleteConDef"] = me.allTokenTypes["IncompleteConDef"] = new EM.Interpreter.ReductionTokenType(
			"IncompleteConDef", 
			[
				[me.validationFunctions["isExpression"], "QuestionMark", me.validationFunctions["isExpression"]]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent);
			},
			me.genericParse,
			{}
		);
		me.reductionTokenTypes["CompleteConDef"] = me.allTokenTypes["CompleteConDef"] = new EM.Interpreter.ReductionTokenType(
			"CompleteConDef", 
			[
				["IncompleteConDef", "Colon", "CompleteConDef"],
				["IncompleteConDef", "Colon", me.validationFunctions["isExpression"]]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " \n " + token.value[2].beautify(indent + me.indent);
			},
			function(token){

				return 	new Instruction(
					function(testInstruction, trueInstruction, otherwiseInstruction){
						try{

							return testInstruction.activate() ? trueInstruction.activate() : otherwiseInstruction.activate();
						}
						catch(e){
							return undefined;
						}
					},
					[
						token.value[0].value[0].parse(),
						token.value[0].value[2].parse(),
						token.value[2].parse()
					]
				)
			},
			{
				isExpression:			true,
			}
		);
		
		//If Constructs
		me.reductionTokenTypes["ElseIf"] = me.allTokenTypes["ElseIf"] = new EM.Interpreter.ReductionTokenType(
			"ElseIf", 
			[
				["Else", "If"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return token.value[0].beautify(indent) + " " + token.value[1].beautify(indent);
			},
			me.genericParse,
			{}
		);
		me.reductionTokenTypes["IfBranch"] = me.allTokenTypes["IfBranch"] = new EM.Interpreter.ReductionTokenType(
			"IfBranch", 
			[
				["If", "OpenBracket", me.validationFunctions["isExpression"], "CloseBracket", "BraceBody"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + token.value[2].beautify(indent) + token.value[3].beautify(indent) + token.value[4].beautify(indent);
			},
			function(token){

				return new Instruction(
					Instruction.conditionalControlStructure,
					[
						token.value[2].parse(),
						token.value[4].parse(),
						Instruction.returnUndefined
					]
				);
			},
			{
				isAllowedInScript:		true,
				isStartIf:				true,
			}
		);
		me.reductionTokenTypes["ElseIfBranch"] = me.allTokenTypes["ElseIfBranch"] = new EM.Interpreter.ReductionTokenType(
			"ElseIfBranch", 
			[
				["ElseIf", "OpenBracket", me.validationFunctions["isExpression"], "CloseBracket", "BraceBody"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + token.value[2].beautify(indent) + token.value[3].beautify(indent) + token.value[4].beautify(indent);
			},
			function(token){

				return new Instruction(
					Instruction.conditionalControlStructure,
					[
						token.value[2].parse(),
						token.value[4].parse(),
						Instruction.returnUndefined
					]
				);
			},
			{}
		);
		me.reductionTokenTypes["ElseBranch"] = me.allTokenTypes["ElseBranch"] = new EM.Interpreter.ReductionTokenType(
			"ElseBranch", 
			[
				["Else", "BraceBody"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent);
			},
			function(token){

				return token.value[1].parse();
			},
			{}
		);
		me.reductionTokenTypes["StartIfConstruct"] = me.allTokenTypes["StartIfConstruct"] = new EM.Interpreter.ReductionTokenType(
			"StartIfConstruct", 
			[
				[me.validationFunctions["isStartIf"], "ElseIfBranch"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent);
			},
			function(token){

				var startIfInstructions = token.value[0].parse();

				var otherwiseInstruction = startIfInstructions;

				//Depth search the tree for the final elseif condition instruction
				while(otherwiseInstruction.a[2].f != Instruction.returnValue){
					otherwiseInstruction = otherwiseInstruction.a[2];
				}

				//when otherwiseInstruction's final argument is not a conditionalControlStructure Instruction
				//replace the null instruction with the latest elseif branch's parse instruction
				otherwiseInstruction.a[2] = token.value[1].parse();

				//Return the augmented conditionalControlStructure instruction
				return startIfInstructions;
			},
			{
				isAllowedInScript:		true,
				isStartIf:				true,
			}
		);
		me.reductionTokenTypes["CompleteIfConstruct"] = me.allTokenTypes["CompleteIfConstruct"] = new EM.Interpreter.ReductionTokenType(
			"CompleteIfConstruct",
			[
				[me.validationFunctions["isStartIf"], "ElseBranch"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent);
			},
			function(token){

				var startIfInstructions = token.value[0].parse();

				var otherwiseInstruction = startIfInstructions;

				//Depth search the tree for the final elseif condition instruction
				while(otherwiseInstruction.a[2].f != Instruction.returnValue){
					otherwiseInstruction = otherwiseInstruction.a[2];
				}

				//when otherwiseInstruction's final argument is not a conditionalControlStructure Instruction
				//replace the null instruction with the latest elseif branch's parse instruction
				otherwiseInstruction.a[2] = token.value[1].parse();

				//Return the augmented conditionalControlStructure instruction
				return startIfInstructions;
			},
			{
				isAllowedInScript:		true,
			}
		);	
		
		//For Loops
		me.reductionTokenTypes["ForLoop"] = me.allTokenTypes["ForLoop"] = new EM.Interpreter.ReductionTokenType(
			"ForLoop", 
			[
				["For", "OpenBracket", me.validationFunctions["qualifiesAsName"], "In", me.validationFunctions["qualifiesAsName"], "CloseBracket", "BraceBody"],
				["For", "OpenBracket", "ObsDeclaration", me.validationFunctions["isExpression"], "Semicolon", me.validationFunctions["qualifiesAsName"], "Increment", "CloseBracket", "BraceBody"],
				["For", "OpenBracket", "ObsDeclaration", me.validationFunctions["isExpression"], "Semicolon", me.validationFunctions["qualifiesAsName"], "Decrement", "CloseBracket", "BraceBody"],
				["For", "OpenBracket", "ObsDeclaration", me.validationFunctions["isExpression"], "Semicolon", me.validationFunctions["qualifiesAsName"], "Assign", me.validationFunctions["isExpression"], "CloseBracket", "BraceBody"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}

				if(token.value.length == 10){
					//4
					return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent) + " " + token.value[2].beautify() + " " + token.value[3].beautify(indent) + token.value[4].beautify(indent) + " " + token.value[5].beautify(indent) + token.value[6].beautify(indent) + token.value[7].beautify(indent) + token.value[8].beautify(indent) + token.value[8].beautify(indent);
				}
				else if(token.value.length == 9){
					//2, 3
					return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent) + " " + token.value[2].beautify() + " " + token.value[3].beautify(indent) + token.value[4].beautify(indent) + " " + token.value[5].beautify(indent) + token.value[6].beautify(indent)+ " " + token.value[7].beautify(indent) + token.value[8].beautify(indent);
				}
				else if(token.value.length == 7){
					//1
					return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent) + " " + token.value[2].beautify() + " " + token.value[3].beautify(indent) + " " + token.value[4].beautify(indent) + " " + token.value[5].beautify(indent) + " " + token.value[6].beautify(indent);
				}
				else{
					throw new Error("Unknown token length for for loop: "+token.value.length);
				}
			},
			function(token){

				if(token.value[3].type == "In"){
					//In branch
					throw new Error("For loop with \"in\" has not been implemented.")
				}
				else if(token.value[6].type == "Increment"){

					//Increment branch

					return new Instruction(
						Instruction.forloopControlStructure,
						[
							token.value[2].parse(),
							token.value[3].parse(),
							me.upToParseScript(token.value[5].beautify() + "++;")[0],
							token.value[8].parse()
						]
					);
				}
				else if(token.value[6].type == "Decrement"){

					//Decrement branch

					return new Instruction(
						Instruction.forloopControlStructure,
						[
							token.value[2].parse(),
							token.value[3].parse(),
							me.upToParseScript(token.value[5].beautify() + "--;")[0],
							token.value[8].parse()
						]
					);
				}
				else{

					//Assign branch

					return new Instruction(
						Instruction.forloopControlStructure,
						[
							token.value[2].parse(),
							token.value[3].parse(),
							me.upToParseScript(token.value[5].beautify() + "=" + token.value[7].beautify() + ";")[0],
							token.value[9].parse()
						]
					);
				}
			},
			{
				isAllowedInScript:		true,
			}
		);

		//While Loops
		me.reductionTokenTypes["WhileLoop"] = me.allTokenTypes["WhileLoop"] = new EM.Interpreter.ReductionTokenType(
			"WhileLoop", 
			[
				["While", "BrExpression", "BraceBody"],
			],
			me.genericBeautify,
			function(token){

				return new Instruction(
					Instruction.whileloopControlStructure,
					[
						token.value[1].value[1].parse(),
						token.value[2].parse(),
					]
				);
			},
			{
				isAllowedInScript:		true,
			}
		);

		//Switch Constructs
		me.reductionTokenTypes["CaseStatement"] = me.allTokenTypes["CaseStatement"] = new EM.Interpreter.ReductionTokenType(
			"CaseStatement", 
			[
				["Case", me.validationFunctions["isExpression"], "Colon", me.validationFunctions["isAllowedInScript"]],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				if(token.value.length==2){
					return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent + me.indent)
				}
				else if(token.value.length==4){
					return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent + me.indent) + "\n" + token.value[3].beautify(indent + me.indent);
				}
			}, 
			me.genericParse,
			{
				qualifiesAsInnerSwitch:	true,
			}
		);
		me.reductionTokenTypes["DefaultStatement"] = me.allTokenTypes["DefaultStatement"] = new EM.Interpreter.ReductionTokenType(
			"DefaultStatement", 
			[
				["Default", "Colon", me.validationFunctions["isAllowedInScript"]],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
				
				if(token.value.length==3){
					return indent + token.value[0].beautify(indent) + " " + token.value[1].beautify(indent) + "\n" + token.value[2].beautify(indent + me.indent);
				}
				else if(token.value.length==2){
					return token.value[0].beautify(indent) + " " + token.value[1].beautify(indent);
				}
			}, 
			me.genericParse,
			{
				qualifiesAsInnerSwitch:	true,
			}
		);
		me.reductionTokenTypes["MultipleCaseStatement"] = me.allTokenTypes["MultipleCaseStatement"] = new EM.Interpreter.ReductionTokenType(
			"MultipleCaseStatement", 
			[
				["CaseStatement", "CaseStatement"],
				["MultipleCaseStatement", "CaseStatement"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent);
			}, 
			me.genericParse,
			{
				isAllowedInScript:		true,
				qualifiesAsInnerSwitch:	true,
			}
		);
		me.reductionTokenTypes["CompletedCaseStatement"] = me.allTokenTypes["CompletedCaseStatement"] = new EM.Interpreter.ReductionTokenType(
			"CompletedCaseStatement", 
			[
				["CaseStatement", "DefaultStatement"],
				["MultipleCaseStatement", "DefaultStatement"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
				
				if(token.value[0].type == "CompletedCaseStatement"){
					return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent + me.indent);
				}
				else{
					return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent);
				}
			},
			me.genericParse,
			{
				isAllowedInScript:		true,
				qualifiesAsInnerSwitch:	true,
			}
		);
		me.reductionTokenTypes["SwitchConstruct"] = me.allTokenTypes["SwitchConstruct"] = new EM.Interpreter.ReductionTokenType(
			"SwitchConstruct", 
			[
				["Switch", "BrName", "OpenBrace", me.validationFunctions["qualifiesAsInnerSwitch"], "CloseBrace"]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				return indent + token.value[0].beautify(indent) + token.value[1].beautify(indent) + token.value[2].beautify(indent) + "\n" + token.value[3].beautify(indent + me.indent) + "\n" + indent + token.value[4].beautify(indent);
			}, 
			me.genericParse,
			{
				isAllowedInScript:		true,
			}
		);
		
		//Comma Separated
		me.reductionTokenTypes["CommaSeparatedNames"] = me.allTokenTypes["CommaSeparatedNames"] = new EM.Interpreter.ReductionTokenType(
			"CommaSeparatedNames", 
			[
				[me.validationFunctions["qualifiesAsName"], "Comma", me.validationFunctions["qualifiesAsName"]],
				["CommaSeparatedNames", "Comma", me.validationFunctions["qualifiesAsName"]],
				[me.validationFunctions["qualifiesAsName"], "Comma", "CommaSeparatedNames"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				return token.value[0].beautify(indent) + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent);
			},
			function(token){

				if(token.value[0].type == "CommaSeparatedNames"){
					return token.value[0].parse().concat(token.value[2].parse());
				}
				else if(token.value[2].type == "CommaSeparatedNames"){
					return [token.value[0].parse()].concat(token.value[2].parse());
				}
				else{
					return [token.value[0].parse(), token.value[2].parse()]
				}
			},
			{
				isCommaSeparated	:	true,
			}
		);
		me.reductionTokenTypes["CommaSeparatedExpression"] = me.allTokenTypes["CommaSeparatedExpression"] = new EM.Interpreter.ReductionTokenType(
			"CommaSeparatedExpression", 
			[
				[me.validationFunctions["isExpression"], "Comma", me.validationFunctions["isExpression"]],
				["CommaSeparatedExpression", "Comma", me.validationFunctions["isExpression"]],
				[me.validationFunctions["isExpression"], "Comma", "CommaSeparatedExpression"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				return token.value[0].beautify(indent) + token.value[1].beautify(indent) + " " + token.value[2].beautify(indent);
			},
			function(token){

				if(token.value[0].type == "CommaSeparatedExpression"){
					return token.value[0].parse().concat(token.value[2].parse());
				}
				else if(token.value[2].type == "CommaSeparatedExpression"){
					return [token.value[0].parse()].concat(token.value[2].parse());
				}
				else{
					return [token.value[0].parse(), token.value[2].parse()]
				}
			},
			{
				isCommaSeparated	:	true,
			}
		);
		me.reductionTokenTypes["BrCommaSeparatedNames"] = me.allTokenTypes["BrCommaSeparatedNames"] = new EM.Interpreter.ReductionTokenType(
			"BrCommaSeparatedNames", 
			[
				["OpenBracket", "CommaSeparatedNames", "CloseBracket"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				return token.value[0].beautify(indent) + token.value[1].beautify(indent) + token.value[2].beautify(indent);
			}, 
			function(token){

				return token.value[1].parse();
			},
			{
				isBracketedNameS:		true,
				isBracketedExpressionS:	true,
			}
		);
		me.reductionTokenTypes["BrCommaSeparatedExpression"] = me.allTokenTypes["BrCommaSeparatedExpression"] = new EM.Interpreter.ReductionTokenType(
			"BrCommaSeparatedExpression", 
			[
				["OpenBracket", "CommaSeparatedExpression", "CloseBracket"]
			],
			me.genericBeautify,
			function(token){

				return token.value[1].parse();
			},
			{
				isBracketedExpressionS:	true,
			}
		);
		me.reductionTokenTypes["BrName"] = me.allTokenTypes["BrName"] = new EM.Interpreter.ReductionTokenType(
			"BrName",
			[
				["OpenBracket", me.validationFunctions["qualifiesAsName"], "CloseBracket"]
			],
			me.genericBeautify,
			function(token){
				
				return token.value[1].parse();
			},
			{
				isExpression:			true,
				isBracketedNameS:		true,
				isBracketedExpressionS:	true,
			}
		);
		me.reductionTokenTypes["BrExpression"] = me.allTokenTypes["BrExpression"] = new EM.Interpreter.ReductionTokenType(
			"BrExpression", 
			[
				["OpenBracket", me.validationFunctions["isExpression"], "CloseBracket"]
			],
			me.genericBeautify,
			function(token){
				
				return token.value[1].parse();
			},
			{
				isExpression:			true,
				isBracketedExpressionS:	true,
			}
		);
		me.reductionTokenTypes["BrEmpty"] = me.allTokenTypes["BrEmpty"] = new EM.Interpreter.ReductionTokenType(
			"BrEmpty", 
			[
				["OpenBracket", "CloseBracket"]
			],
			me.genericBeautify,
			function(token){
				
				return [];
			},
			{
				isBracketedNameS:		true,
			}
		);
		
		//Multiple Script Items
		me.reductionTokenTypes["MultipleScriptItems"] = me.allTokenTypes["MultipleScriptItems"] = new EM.Interpreter.ReductionTokenType(
			"MultipleScriptItems", 
			[
				[me.validationFunctions["isAllowedInScript"], me.validationFunctions["isAllowedInScript"]]
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				return token.value[0].beautify(indent) + "\n" + token.value[1].beautify(indent);
			},
			//Semi-parsing function, retuns an array of instructions
			function(token){

				return [].concat(token.value[0].parse()).concat(token.value[1].parse())

			},
			{
				isAllowedInScript:		true,
			}
		);
		
		//Legnth Replace
		me.reductionTokenTypes["LengthReplace"] = me.allTokenTypes["LengthReplace"] = new EM.Interpreter.ReductionTokenType(
			"LengthReplace", 
			[
				["Hash", me.validationFunctions["isExpression"]],
			],
			me.genericBeautify,
			function(token){

				return new Instruction(
					function(expressionInstruction){

						try{

							return expressionInstruction.activate().length;
						}
						catch(e){
							return undefined;
						}
					},
					[
						token.value[1].parse()
					]
				);
			},
			{
				isExpression:			true,
			}
		);
/*
		//Symbol Get
		me.reductionTokenTypes["GetSymbol"] = me.allTokenTypes["GetSymbol"] = new EM.Interpreter.ReductionTokenType(
			"GetSymbol", 
			[
				["Symbol", me.validationFunctions["qualifiesAsName"]],
			],
			function(token, indent){

				if(indent == undefined){
					indent = "";
				}
					
				return token.value[0].beautify(indent) + " " + token.value[1].beautify(indent);
			},
			function(token){

				try{

					var target = token.value[1].beautify()

					if(me.globalTest.test(target)){

						return new Instruction(Instruction.returnValue, [
							EM.maintainer.getSymbol(target.replace(/^global\./, ""))
						])
					}
					else{
						return new Instruction(Instruction.returnValue, [
							me.maintainer.getSymbol(target)
						])
					}

				}
				catch(e){
					return Instruction.returnUndefined;
				}
			},
			{
				isExpression:			true,
			}
		);
*/
		
		me.reductionTokenTypes["ValidScript"] = me.allTokenTypes["ValidScript"] = new EM.Interpreter.ReductionTokenType(
			"ValidScript",
			[
				//No automatic reduction rules, this token is constructed manually by checking that all children have the property "isAllowedInScript"
			],
			me.genericBeautify,
			function(token){

				var instructions = [];

				for(var t in token.value){
					instructions.push(token.value[t].parse());
				}

				return instructions;
			},
			{
				isAllowedInScript:			true,
			}
		);
		
		me.reductionTokenTypes["InvalidScript"] = me.allTokenTypes["InvalidScript"] = new EM.Interpreter.ReductionTokenType(
			"InvalidScript", 
			[
				//No automatic reduction rules, this token is constructed manually by checking that all children have the property "isAllowedInScript"
			],
			me.genericBeautify,
			me.genericParse,
			{
			}
		);
		
		me.reductionTokenTypes["RedundantSemicolon"] = me.allTokenTypes["RedundantSemicolon"] = new EM.Interpreter.ReductionTokenType(
			"RedundantSemicolon", 
			[
				[me.validationFunctions["isAllowedInScript"], "Semicolon"],
			],
			function(token, indent){
			
				if(indent == undefined){indent = "";}
			
				//Parse the part before the semicolon
				return token.value[0].beautify(indent);
			},
			function(token){

				return token.value[0].parse();
			},
			{
				isAllowedInScript:			true,
			}
		);
		
		me.testSyntax = {
		
			IF1: "if((x>5)&&(x<10)){x++;continue;}else if(x<5){x++;continue;}else if(x==10){x++;}else{console.log(x);}",
			IF2: "if((x>5)&&(x<10)){x++;continue;}else{console.log(x);}",
			IF3: "if((x>5)&&(x<10)){x++;continue;}else if(x<5){x++;continue;}else if(x==10){x++;}",
			CASE1: "switch(n){case 5+5 : continue; break; case 1+1 : break; case 6 : continue; default : continue; return !true;}",
			CASE2: "switch(n){default : continue;}",
			ARRAY1: "b = [];",
			ARRAY2: "b = [a];",
			ARRAY3: "b = [a, 5, true, false, (a), (5), (true), (false), fun(), (fun())];",
			ARRAY4: "b = [a, 4, 2];",
			FOR1: "for(x in array){return 5;}",
			FOR2: "for(x=0; x<5; x++){return 5;}",
			OBS1: "a is b + c;",
			OBS2: "a++;",
			OBS3: "a = max(b,c);",
			INDENT: "if(a){continue; break; continue; x = 5; proc x(a, b, c){continue; break; if(a){return 8;}};}",
			DEFAULT: "default : continue; return !true;",
			PROC1: "proc agent(name1, name2, name3){if(name1==5){console.log(\"5\");}else{continue;}}",
			PROC2: "proc agent(name1, name2, name3){if(name1==5){console.log(5);}else{console.log(\"notfive\");}}",
			FUNC1: "func max(name1, name2, name3, name4){if(name1>name2){return name1;}else{return name2;}}",
			FUNC2: "func soddy(name1, name2){if(name1>name2){return x;}else{return y;}}",
			OBS4: "tech is max(arg1, arg2);",
			COND1: "tech is a.b == 3 ? 1 : 4;",
			DOTORDER1: "z = x.y()*5;",
			DOTORDER2: "z = x.y(y.z[3]);",
			DOTORDER3P5: "z = a.b.c;",
			DOTORDER3: "z = x.y[a.b.c(5.4)];",
			DOTORDER4: "z = z[1]+z[2]*a.b(z[3]);",
			DOTORDER5: "z = a.b.c[a*4.5+d.e(5.7)];",
		}
		
		me.test = function(){
		
			var tests = {
				IF1 : me.upToEnscript(me.testSyntax["IF1"]),
				IF2 : me.upToEnscript(me.testSyntax["IF2"]),
				IF3 : me.upToEnscript(me.testSyntax["IF3"]),
				CASE1 : me.upToEnscript(me.testSyntax["CASE1"]),
				CASE2: me.upToEnscript(me.testSyntax["CASE2"]),
				ARRAY1: me.upToEnscript(me.testSyntax["ARRAY1"]),
				ARRAY2: me.upToEnscript(me.testSyntax["ARRAY2"]),
				ARRAY3: me.upToEnscript(me.testSyntax["ARRAY3"]),
				ARRAY4: me.upToEnscript(me.testSyntax["ARRAY4"]),
				FOR1: me.upToEnscript(me.testSyntax["FOR1"]),
				FOR2: me.upToEnscript(me.testSyntax["FOR2"]),
				OBS1: me.upToEnscript(me.testSyntax["OBS1"]),
				OBS2: me.upToEnscript(me.testSyntax["OBS2"]),
				OBS3: me.upToEnscript(me.testSyntax["OBS3"]),
				OBS4: me.upToEnscript(me.testSyntax["OBS4"]),
				INDENT: me.upToEnscript(me.testSyntax["INDENT"]),
				PROC1: me.upToEnscript(me.testSyntax["PROC1"]),
				PROC2: me.upToEnscript(me.testSyntax["PROC2"]),
				FUNC1: me.upToEnscript(me.testSyntax["FUNC1"]),
				FUNC2: me.upToEnscript(me.testSyntax["FUNC2"]),
				COND1: me.upToEnscript(me.testSyntax["COND1"]),
				DOTORDER1: me.upToEnscript(me.testSyntax["DOTORDER1"]),
				DOTORDER2: me.upToEnscript(me.testSyntax["DOTORDER2"]),
				DOTORDER3P5: me.upToEnscript(me.testSyntax["DOTORDER3P5"]),
				DOTORDER3: me.upToEnscript(me.testSyntax["DOTORDER3"]),
				DOTORDER4: me.upToEnscript(me.testSyntax["DOTORDER4"]),
				DOTORDER5: me.upToEnscript(me.testSyntax["DOTORDER5"]),
			};
			
			for(var i in tests){
				if(tests[i].type=="InvalidScript"){
					tests[i].printTree();
					throw new Error("Test "+i+" Failed");
				}
			}
			
			return "All tests passed :)"
		}

	};

	/*
		Instruction Functions relating to the interpreter
	*/

	/*
	
		Form Functions

	*/

	Instruction.formArray = function(instructionArray){

		return instructionArray.map(function(instruction){return instruction.activate()})
	}

	//Static function which takes argument names and emperor function body and returns an instruction that returns a value
	Instruction.formFunction = function(argumentNames, bracebodyBeautified){

		//This instruction will be a substitute for the function, functionCalls will have to take account of this
		//liveArguments will not be pushed into the array of instruction arguments until runtime
		return new Instruction(
			Instruction.functionIncursion,
			[
				argumentNames,
				bracebodyBeautified
			]
		)
	}

	Instruction.formJavascriptFunction = function(argumentNames, javascriptFunctionBodyString){

		//This instruction will be a substitute for the function, functionCalls will have to take account of this
		//liveArguments will not be pushed into the array of instruction arguments until runtime
		return new Instruction(
			Instruction.javascriptFunctionIncursion,
			[
				javascriptFunctionBodyString,
				argumentNames
			]
		)
	}

	Instruction.formProcedure = function(bracebodyParsed, watches){

		//This instruction will be a substitute for the procedure
		return new Instruction(
			Instruction.procedureActivation,
			[
				bracebodyParsed,
				watches
			]
		)
	}

	/*

		Incursions

	*/

	//An Instruction that activates a Procedure, it is identical to activateInstruction.
	Instruction.procedureActivation = function(bracebodyParsed){

		try{

			bracebodyParsed.activate();
		}
		catch(error){

			return;
		}
	}

	Instruction.functionIncursion = function(argumentNames, bracebodyBeautified, liveArguments){

		if(liveArguments == undefined){
			liveArguments = [];
		}

		var localMaintainer = new Symbol("local", [], Instruction.returnUndefined, EM.primaryContextName, undefined);
		var localInterpreter = new EM.Interpreter(localMaintainer);

		for(var i=0; i<argumentNames.length; i++){

			localMaintainer.declareSymbol(argumentNames[i], [], new Instruction(Instruction.returnValue, [liveArguments[i].activate()]), new Definition("Defined by argument", Definition.ScopeIntroduction))
		}

		var res = localInterpreter.upToActivateScript(bracebodyBeautified);

		if(res instanceof ControlResponse){
			return res.argument.activate();
		}

		return res;

	}

	Instruction.javascriptFunctionIncursion = function(javascriptFunctionBodyString, argumentNames, argumentInstructions, symbol){

		try{

			var jsf = eval("(function("+argumentNames.join(", ")+"){"+javascriptFunctionBodyString+"})");
			return jsf.apply(symbol, argumentInstructions.map(function(instruction){return instruction.activate()}));
		}
		catch(e){
			//console.log(e)
			//throw new Error("Error in Javascript Function: "+javascriptFunctionBodyString);
			return undefined;
		}
	}

	/*

		Application of Function Syntax

	*/

	//Function/Procedure calling instruction
	Instruction.functionApplication = function(evaluateNameInstruction, argumentInstructions, interpreter){

		try{

			var incursionFunctionOrProcedureActivationInstruction = evaluateNameInstruction.activate();
			var functionType = incursionFunctionOrProcedureActivationInstruction.f;
		}
		catch(e){
			
			throw new Error("Cannot call a function which does not exist: '"+evaluateNameInstruction.a[0]+"'")
		}

		if(functionType == Instruction.procedureActivation){
		//Procedure
			//If the getFunctionInstruction returns a procedure instruction instead of a function...
			//simply activate it and return the result :)

			return incursionFunctionOrProcedureActivationInstruction.activate();
		}
		//Else it must be a functionIncursion Instruction
		else if(functionType == Instruction.javascriptFunctionIncursion){
		//Function

			incursionFunctionOrProcedureActivationInstruction.a.push(argumentInstructions)
			incursionFunctionOrProcedureActivationInstruction.a.push(interpreter.maintainer.getSymbol(evaluateNameInstruction.a[0]))

			var response = incursionFunctionOrProcedureActivationInstruction.activate();

			incursionFunctionOrProcedureActivationInstruction.a.pop();
			incursionFunctionOrProcedureActivationInstruction.a.pop();

			return response;
		}
		//Else it must be a functionIncursion Instruction
		else if(functionType == Instruction.functionIncursion){
		//Function

			incursionFunctionOrProcedureActivationInstruction.a.push(argumentInstructions)

			var response = incursionFunctionOrProcedureActivationInstruction.activate();

			incursionFunctionOrProcedureActivationInstruction.a.pop();

			return response;
		}
		else{

			throw new Error("Expected Incursion Instruction, but did not find.")
		}
	}


	/*

		Computational Control Structure Simulation

	*/

	//Instruction to manage script control structure
	Instruction.braceBodyHandler = function(arrayOfInstructionsToHandle){

		for(var i=0; i<arrayOfInstructionsToHandle.length; i++){

			//Check to see if the individual instructions return anything
			var response = arrayOfInstructionsToHandle[i].activate();

			//If any of the allowed in script instructions return a value, that value is dealt with appropriately.
			if(response != undefined){

				//If bracebodies recieve a control signal, they should return it to their calling instruction's function ie:forloopControlStructure
				if(response instanceof ControlResponse){
					switch(response.label){
						//bracebodies should return when told, but ignore continue and break responces
						case "return" :
							return response;
						default : 
							continue;
					}
				}
			}
		}
	}

	Instruction.whileloopControlStructure = function(conditionToLoop, bracebody){

		while(conditionToLoop.activate()){

			var response = bracebody.activate();

			//If any of the allowed in script instructions return a value, that value is dealt with appropriately.
			if(response != undefined){

				if(response instanceof ControlResponse){
					switch(response.label){
						//forloops need to deal with returns, continues, and breaks
						case "return" :
							return response;
						case "continue" :
							afterLoopDeclaration.activate();
							continue;
						case "break" :
							return undefined;
						default : 
							continue;
					}
				}
			}
		}

		return undefined;
	}

	Instruction.forloopControlStructure = function(preambleObsDec, conditionToLoop, afterLoopDeclaration, bracebody){

		//Activate the preamble declaration
		preambleObsDec.activate();

		while(conditionToLoop.activate()){

			var response = bracebody.activate();

			//If any of the allowed in script instructions return a value, that value is dealt with appropriately.
			if(response != undefined){

				if(response instanceof ControlResponse){
					switch(response.label){
						//forloops need to deal with returns, continues, and breaks
						case "return" :
							return response;
						case "continue" :
							afterLoopDeclaration.activate();
							continue;
						case "break" :
							return undefined;
						default : 
							continue;
					}
				}
			}

			afterLoopDeclaration.activate();
		}

		return undefined;
	}


	//Instruction to manage conditional script structure
	Instruction.conditionalControlStructure = function(condition, positiveScriptInstruction, otherwiseScriptInstruction){

		//Evaluate the condition using the argument instruction
		if(condition.activate()){

			//run the bracebody if the condition is true, 
			return positiveScriptInstruction.activate();

		//If the condition is not true, do the same with the alternative script instruction
		}else{

			return otherwiseScriptInstruction.activate();
		}
	}

}