loadInputWindow = function(){

	EM.inputHistoryWindow = function(name, x, y, width, height){

		//Call to extend context box
		var me = EM.contextBox.apply(this, arguments);

		me.windowType = "inputHistoryWindow";
		me.title.innerHTML = name + " (" + me.windowType + ")";
		me.hLength = 0;

		me.createEntry = function(str){

			var ele = document.createElement("p");
			ele.innerHTML = str.replace(/\n/g, "<br>").replace(/\s/g , "&nbsp")
			ele.className = "cbxInpHisEnt";
			return ele;
		}

		me.update = function(historyEntry){

			if(me.hLength != 0){

				//If this is not the first history entry to be populated, add a seperator
				me.content.appendChild(document.createElement("hr"))
			}

			//Add the item
			me.content.appendChild(me.createEntry(historyEntry));

			//Increment the store
			me.hLength++;
		}


		return me;
	}

	EM.inputWindow = function(name, x, y, width, height){
	
		//Call to extend context box
		var me = EM.contextBox.apply(this, arguments);
		
	/*
		Additions and Re-calculations
	*/	
		//Elements
		this.textarea = document.createElement('textarea');
		this.buttonarea = document.createElement('div');
		this.submitButton = document.createElement('div');
		this.submitButtonText = document.createElement('p');
		this.historyButton = document.createElement('div');
		this.historyButtonText = document.createElement('p');
		this.previousButton = document.createElement('div');
		this.previousButtonText = document.createElement('p');
		this.nextButton = document.createElement('div');
		this.nextButtonText = document.createElement('p');

		//Class Names
		this.textarea.className = 'cbxTextArea';
		this.buttonarea.className = 'cbxInputBar';
		this.submitButton.className = 'cbxRegularButton';
		this.historyButton.className = 'cbxRegularButton';
		this.previousButton.className = 'cbxRegularButton';
		this.nextButton.className = 'cbxRegularButton';
		this.submitButtonText.className = 'cbxRegularButtonText';
		this.historyButtonText.className = 'cbxRegularButtonText';
		this.previousButtonText.className = 'cbxRegularButtonText';
		this.nextButtonText.className = 'cbxRegularButtonText';
		
		//Inner HTML
		this.submitButtonText.innerHTML = "Submit";
		this.historyButtonText.innerHTML = "History";
		this.previousButtonText.innerHTML = "Previous";
		this.nextButtonText.innerHTML = "Next";
		
		//Individual element CSS additions
		this.textarea.tabIndex = -1;
		this.textarea.style.tabSize = 4;
		this.textarea.wrap = "off";
		this.textarea.spellcheck = false;
		this.buttonarea.style.height = "35px"
		this.background.style.backgroundColor = "#454545";
		this.submitButton.style.left = "10px";
		this.historyButton.style.left = "10px";
		this.previousButton.style.right = "10px";
		this.previousButton.style.float = "right";
		this.nextButton.style.right = "10px";
		this.nextButton.style.float = "right";
		
		//Static variables
		this.minWidth = 400;
		this.windowType = "inputWindow";
		this.title.innerHTML = name + " (" + this.windowType + ")";
		this.history = [];
		this.currentHistoryIndex = 0;
		this.currentWorkingScript = "";

		//Append
		this.submitButton.appendChild(this.submitButtonText);
		this.previousButton.appendChild(this.previousButtonText);
		this.nextButton.appendChild(this.nextButtonText);
		this.buttonarea.appendChild(this.submitButton);
		this.historyButton.appendChild(this.historyButtonText);
		this.buttonarea.appendChild(this.historyButton);
		this.buttonarea.appendChild(this.nextButton);
		this.buttonarea.appendChild(this.previousButton);
		this.content.appendChild(this.textarea);
		this.content.appendChild(this.buttonarea);
	
	/*
		Functionality
	*/	
		//Functionality for submitting code in the textarea
		this.submitCode = function(){
		
			//Attempt to activate the script
			var script = EM.interpreter.upToEnscript("{"+this.textarea.value+"}");

			var response = EM.interpreter.upToActivateScript("{"+this.textarea.value+"}");

			if(script.value[0].value.length == 2){
				throw new Error("There is nothing to interpret.")
			}

			//Push the submission onto the history stack
			this.history.push(script.value[0].value[1].beautify());
			
			//Update the index of the current working script
			this.currentHistoryIndex = this.history.length;
			
			//Clear the textarea
			this.textarea.value = "";

			//Update the corresponding history window
			this.updateHistory();
		};
		//Function to update the corresponding history window if it is open
		this.updateHistory = function(){

			try{
				//Try to update the corresponding history window with the new history
				EM.maintainer.windows[me.name + "(inputHistoryWindow)"].update(this.history[this.history.length-1]);
				
			}catch(error){
				//If the window is not open, dont do anything
			}

		}
		//Functionality for replacing the textarea entry with previous recorded entry
		this.previousHistoryEntry = function(){
		
			//As long as we can go back further through the history
			if(this.currentHistoryIndex > 0){
			
				//Decrement the current history index
				this.currentHistoryIndex--;
				
				//Replace the entry in the textarea with the corresponding history entry
				this.textarea.value = this.history[me.currentHistoryIndex];
			}
		};
		//Functionality for replacing the textarea entry with next recorded entry (assuming the user is cycling through previous entries)
		this.nextHistoryEntry = function(){
		
			//As long as there is a later submission to view
			if(this.currentHistoryIndex < this.history.length){
			
				//Increment the current history index
				this.currentHistoryIndex++;
				
				//If we hit the index of the current working script
				if(this.currentHistoryIndex == this.history.length){
				
					//Display it
					this.textarea.value = this.currentWorkingScript;
				}
				else{
				
					//Else display the corresponding history entry
					this.textarea.value = this.history[this.currentHistoryIndex];	
				}
			}
		};
	
	
	/*
		Listeners
	*/
		this.textarea.onkeydown = function(e){
		
			//If the tab key was pressed
			if(e.keyCode==9){
			
				//Prevent original tab functionality
				e.cancelBubble = true;
				e.preventDefault();
			
				var tab = "\t";
				var tempLocation = me.textarea.selectionStart;
				
				//Insert a tab into the textarea entry where the cursor is
				me.textarea.value = (me.textarea.value.substring(0, me.textarea.selectionStart))+ tab + me.textarea.value.substring(me.textarea.selectionStart, me.textarea.value.length);

				//Clean up the side effects
				me.textarea.selectionStart = tempLocation + tab.length;
				me.textarea.selectionEnd = me.textarea.selectionStart;
			}
			//If the enter key was pressed
			else if(e.keyCode==13){
				//And the ctrl key was depressed
				if(e.ctrlKey){
					//Prevent original enter functionality
					e.preventDefault();
					//Call the function to submit code
					me.submitCode();
				}
				else{
					//Prevent original enter functionality
					e.preventDefault();

					var place = this.selectionStart;

					//one new line
					this.value = this.value.splice(place, 0, "\n"); place++; this.setSelectionRange(place, place);

					var opens = this.value.substring(0, place).split("{").length-1;
					var closes = this.value.substring(0, place).split("}").length-1;

					var level = opens - closes;

					//level amount of tabs
					for(var i=0; i<level; i++){
						this.value = this.value.splice(place, 0, "\t"); place++; this.setSelectionRange(place, place);
					}

					//optionally, if there is a "}" next character, add another new line with level-1 tabs
					if(this.value.substring(place, place+1) == "}"){

						var record = place;

						//one new line
						this.value = this.value.splice(place, 0, "\n"); place++; this.setSelectionRange(place, place);

						//level-1 amount of tabs
						for(var i=0; i<level-1; i++){
							this.value = this.value.splice(place, 0, "\t"); place++; this.setSelectionRange(place, place);
						}

						//reset to new line position
						this.setSelectionRange(record, record);
					}
				}
			}
			//If the up arrow key was pressed
			else if(e.keyCode==38){
				//And the ctrl key was depressed
				if(e.ctrlKey){
					//And the shift key was not depressed
					if(!e.shiftKey){

						//Prevent original up functionality
						e.preventDefault();
						//Call the function to replace the textarea entry with the previous in the history store
						me.previousHistoryEntry();
					}
				}
			}
			//If the up down key was pressed
			else if(e.keyCode==40){
				//And the ctrl key was depressed
				if(e.ctrlKey){
					//And the shift key was not depressed
					if(!e.shiftKey){

						//Prevent original down functionality
						e.preventDefault();
						//Call the function to replace the textarea entry with the next in the history store
						me.nextHistoryEntry();
					}
				}
			}
		
		};
		this.textarea.onkeyup = function(e){
		
			//If the user types in entries which are not previous to the current
			if(me.currentHistoryIndex == me.history.length){
			
				//Update the state of the current working script to recall after checking previous entries
				me.currentWorkingScript = me.textarea.value;
				
			}
		};
		this.submitButton.onclick = function(e){
			
			//Call the corresponding function
			me.submitCode();
		}
		this.previousButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();

			//Call the corresponding function			
			me.previousHistoryEntry();
		};
		this.nextButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();
			
			//Call the corresponding function
			me.nextHistoryEntry();
		};
		this.historyButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();
		
			//Create a flag
			var check = false;
			
			//Check to see if the corresponding history window is already open
			for(var w in EM.maintainer.windows){

				//If it is, do nothing
				if(EM.maintainer.windows[w].name+"("+EM.maintainer.windows[w].windowType+")" == me.name+"(inputHistoryWindow)"){
					return;
				}
			}

			//Create and open the window
			var historyWindow = new EM.inputHistoryWindow(me.name, 300, 150, 600, 300);
			historyWindow.append();
			historyWindow.toTop();

			for(var i=0; i<me.history.length; i++){
				//Update the window with each history item
				historyWindow.update(me.history[i]);
			}
		};

		
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
			this.textarea.style.height = this.content.offsetHeight - this.buttonarea.offsetHeight
		};
		this.toMinConsiderations = function(){
			//Dummy until extention
		};
		this.closeConsiderations = function(){
			//Dummy until extention
		};
		this.removeListenerConsiderations = function(){
		
			me.submitButton.onclick = null;
			me.textarea.onkeyup = null;
			me.textarea.onkeydown = null;
			me.nextButton.onclick = null;
			me.previousButton.onclick = null;
		};
		
		//Return this
		return this;
	};
};	