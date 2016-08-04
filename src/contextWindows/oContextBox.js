/*
	Todo:
		In two window snapped mode, the min width for each side should be taken into account.
*/

loadContextBox = function(){

	EM.oContextBox = function(name, x, y, width, height){

		//Local reference to this for listeners
		var me = this;

		/*
			Static Values
		*/

		this.name = name;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.minWidth = 300;
		this.minHeight = 200;
		this.windowType = "contextBox";
		this.visible = true;
		this.state = "window";

		/*
			OHTML
		*/

		this.element = new ODIV(name + "_element")
			.class("cbxElement")
			.width(width)
			.height(height)
			.style("left", x)
			.style("top", y)
			.style("zIndex", EM.windowsZmaintainer.getTopZ())
		this.bar = new ODIV(name + "_bar")
			.class("cbxBar")
			.appendTo(this.element)
		this.background = new ODIV(name + "_background")
			.class("cbxBackground")
			.appendTo(this.element)
		this.content = new ODIV(name + "_content")
			.class("cbxContent")
			.appendTo(this.element)

		this.closeButton = new EM.oContextBoxButton(name, "close")
			.style("borderTopRightRadius", "7px")
			.appendTo(this.bar)
		this.toLeftButton = new EM.oContextBoxButton(name, "left")
			.appendTo(this.bar)
		this.toMaxButton = new EM.oContextBoxButton(name, "max")
			.appendTo(this.bar)
		this.toRightButton = new EM.oContextBoxButton(name, "right")
			.appendTo(this.bar)
		this.toMinButton = new EM.oContextBoxButton(name, "min")
			.appendTo(this.bar)

		this.title = new OTEXT(name + "_title")
			.class("cbxTitle")
			.innerHTML(name + " (" + this.windowType + ")")
			.appendTo(this.bar)

		this.bottomRightResizer = new ODIV(name+"_bottomRightResizer");
			.class("cbxBottomRightResizer")
			.appendTo(this.element)
		this.bottomLeftResizer = new ODIV(name+"_bottomLeftResizer");
			.class("cbxBottomLeftResizer")
			.appendTo(this.element)
		this.topLeftResizer = new ODIV(name+"_topLeftResizer");
			.class("cbxTopLeftResizer")
			.appendTo(this.element)

		this.bottomBorder = new ODIV(name+"_bottomBorder")
			.class("cbxHorizontalBorderBar")
			.style("bottom", "0px")
			.appendTo(this.element)
		this.leftBorder = new ODIV(name+"_leftBorder")
			.class("cbxVerticalBorderBar")
			.style("left", "0px")
			.appendTo(this.element)
		this.rightBorder = new ODIV(name+"_rightBorder")
			.class("cbxVerticalBorderBar")
			.style("right", "0px")
			.appendTo(this.element)

		this.systemTrayButton = new EM.oSystemTrayButton(name)

		/*
			Functionality
		*/

		//Append to HTML
		this.append = function(){
		
			/*
				Actual append
			*/
		
			//Append the element to the page
			me.element.appendTo(EM.q.ge("pageContent"))
			
			//Append the system tray button to the bottom bar
			me.systemTrayButton.appendTo(EM.q.ge("pageBottomBar"))
			
			//Add this object to the windows store
			EM.maintainer.windows[this.name + "(" + this.windowType + ")"] = this;
			
			/*
				Initial setup
			*/
			
			me.maintainProportions();
			
			me.shadow();
			
			me.resizeConsiderations();
		}

		this.highlight = function(){
			
			me.content.style.boxShadow = "10px 10px 10px #000000";
		}

		this.shadow = function(){
		
			me.background.style("opacity",  "");
			me.content.style("boxShadow", "0px 0px 0px #000000");
		}

		this.removeEventListeners = function(){
			
			console.log("remove this method: removeEventListeners in oContextBox")
		}

		this.toFixConsiderations = function(){
			//Dummy until extention
		}

		this.toWindowConsiderations = function(){
			//Dummy until extention	
		}

		this.resizeConsiderations = function(){
			//Dummy until extention	
		}
		
		this.toMinConsiderations = function(){
			//Dummy until extention
		}

		this.closeConsiderations = function(){
			//Dummy until extention
		}

		this.removeListenerConsiderations = function(){
			//Dummy until extention
		}

	}

	EM.oContextBoxButton = function(name, type){
		//type (string) : left, right, max, min, close

		this.button = new ODIV(name+"_"+type+"Button")
			.class("cbxBarButton")
		this.buttonTitle = new OTEXT(type+"_p")
			.class("cbxBarButtonText")
			.innerHTML(type=="left" ? "[" : type=="right" ? "]" : type=="max" ? "&#x25a1;" :  type=="min" ? "_" : "X")
			.appendTo(this.button)

		return this.button;
	}

	EM.oSystemTrayButton = function(name){

		this.button = new ODIV(name+"_systemTrayButton");
			.class("cbxSystemButtonOff")
		this.buttonTitle = new OTEXT(name+"_systemTrayButtonTitle");
			.class("cbxSystemButtonText")
			.innerHTML(name)
			.appendTo(this.button)

		return this.button;
	}











	EM.contextBox = function(name, x, y, width, height){

		//Local reference to this for listeners
		var me = this;
		
		//Elements

		this.element = document.createElement('div');
		this.bar = document.createElement('div');
		this.content = document.createElement('div');
		this.background = document.createElement('div');
		
		this.title = document.createElement('p');
		this.toLeftButton = document.createElement('div');
		this.toLeftButtonTitle = document.createElement('p');
		this.toRightButton = document.createElement('div');
		this.toRightButtonTitle = document.createElement('p');
		this.toMaxButton = document.createElement('div');
		this.toMaxButtonTitle = document.createElement('p');
		this.toMinButton = document.createElement('div');
		this.toMinButtonTitle = document.createElement('p');
		this.closeButton = document.createElement('div');
		this.closeButtonTitle = document.createElement('p');
		
		this.bottomBorder = document.createElement('div');
		this.leftBorder = document.createElement('div');
		this.rightBorder = document.createElement('div');
		
		this.bottomRightResizer = document.createElement('div');
		this.bottomLeftResizer = document.createElement('div');
		this.topLeftResizer = document.createElement('div');
		
		this.systemButton = document.createElement('div');
		this.systemButtonTitle = document.createElement('p');

		//Class Names
		
		this.element.className = "cbxElement";
		this.content.className = "cbxContent";
		this.background.className = "cbxBackground"
		
		this.bar.className = "cbxBar";
		this.title.className = "cbxTitle";
		
		this.toLeftButton.className = "cbxBarButton";
		this.toRightButton.className = "cbxBarButton";
		this.toMaxButton.className = "cbxBarButton";
		this.toMinButton.className = "cbxBarButton";
		this.closeButton.className = "cbxBarButton";
		this.toLeftButtonTitle.className = "cbxBarButtonText";
		this.toRightButtonTitle.className = "cbxBarButtonText";
		this.toMaxButtonTitle.className = "cbxBarButtonText";
		this.toMinButtonTitle.className = "cbxBarButtonText";
		this.closeButtonTitle.className = "cbxBarButtonText";
		
		this.bottomBorder.className = "cbxHorizontalBorderBar";
		this.leftBorder.className = "cbxVerticalBorderBar";
		this.rightBorder.className = "cbxVerticalBorderBar";
		
		this.bottomRightResizer.className = "cbxBottomRightResizer";
		this.bottomLeftResizer.className = "cbxBottomLeftResizer";
		this.topLeftResizer.className = "cbxTopLeftResizer";
		
		this.systemButton.className = "cbxSystemButtonOff";
		this.systemButtonTitle.className = "cbxSystemButtonText";
		
		//Element-Specific Styling
		this.closeButton.style.borderTopRightRadius = "7px";
		this.bottomBorder.style.bottom = "0px";
		this.leftBorder.style.left = "0px";
		this.rightBorder.style.right = "0px";
		
		//Static Values
		
		this.name = name;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.minWidth = 300;
		this.minHeight = 200;
		this.windowType = "contextBox";
		this.visible = true;
		this.state = "window";
		
		//Computed Styles
		
		this.element.style.width = width;
		this.element.style.height = height;
		this.element.style.left = x;
		this.element.style.top = y;
		this.element.style.zIndex = EM.windowsZmaintainer.getTopZ();
		
		//Inner HTML
		
		this.title.innerHTML = name + " (" + this.windowType + ")";
		this.systemButtonTitle.innerHTML = name;
		this.toLeftButtonTitle.innerHTML = "[";
		this.toRightButtonTitle.innerHTML = "]";
		this.toMaxButtonTitle.innerHTML = "&#x25a1;";
		this.toMinButtonTitle.innerHTML = "_";
		this.closeButtonTitle.innerHTML = "X";
		
		//Append
		
		this.systemButton.appendChild(this.systemButtonTitle);	
		this.closeButton.appendChild(this.closeButtonTitle);
		this.toMinButton.appendChild(this.toMinButtonTitle);
		this.toMaxButton.appendChild(this.toMaxButtonTitle);
		this.toRightButton.appendChild(this.toRightButtonTitle);
		this.toLeftButton.appendChild(this.toLeftButtonTitle);
		
		this.bar.appendChild(this.closeButton);
		this.bar.appendChild(this.toRightButton);
		this.bar.appendChild(this.toMaxButton);
		this.bar.appendChild(this.toLeftButton);
		this.bar.appendChild(this.toMinButton);
		this.bar.appendChild(this.title);
		
		this.element.appendChild(this.bar);
		this.element.appendChild(this.background);
		this.element.appendChild(this.content);
		this.element.appendChild(this.bottomRightResizer);
		this.element.appendChild(this.bottomLeftResizer);
		this.element.appendChild(this.topLeftResizer);
		
		this.element.appendChild(this.bottomBorder);
		this.element.appendChild(this.leftBorder);
		this.element.appendChild(this.rightBorder);
		
		//Functionality
		
		//Append to HTML
		this.append = function(){
		
			/*
				Actual append
			*/
		
			//Append the element to the page
			EM.q.ge("pageContent").appendChild(this.element);
			
			//Append the system tray button to the bottom bar
			EM.q.ge("pageBottomBar").appendChild(this.systemButton);
			
			//Add this object to the windows store
			EM.maintainer.windows[this.name + "(" + this.windowType + ")"] = this;
			
			/*
				Initial setup
			*/
			
			//Give the content initial height
			//me.content.style.height = me.element.style.height.depix() - me.bar.clientHeight;
			me.maintainProportions();
			
			this.shadow();
			
			//Fire the resize considerations to jog CSS into place
			me.resizeConsiderations();
		};
		
		//Hilight the outer window
		this.highlight = function(){
			
			//this.background.style.opacity = "0.9";
			this.content.style.boxShadow = "10px 10px 10px #000000";
		};
		//Shadow the outer window
		this.shadow = function(){
		
			this.background.style.opacity = "";
			this.content.style.boxShadow = "0px 0px 0px #000000";
		};
		
		//Function to remove the event listeners of the window
		this.removeEventListeners = function(){
			
			//Event listeners should be removed to prevent memory leaks in some browsers
			this.toLeftButton.onclick = null;
			this.toRightButton.onclick = null;
			this.toMaxButton.onclick = null;
			this.toMinButton.onclick = null;
			this.closeButton.onclick = null;
			this.toLeftButton.onmousedown = null;
			this.toRightButton.onmousedown = null;
			this.toMaxButton.onmousedown = null;
			this.toMinButton.onmousedown = null;
			this.closeButton.onmousedown = null;
			this.systemButton.onclick = null;
			this.bottomRightResizer.onmousedown = null;
			this.bottomLeftResizer.onmousedown = null;
			this.topLeftResizer.onmousedown = null;
			this.bar.onmousedown = null;
			this.rightBorder.onmousedown = null;
			this.leftBorder.onmousedown = null;
			this.bottomBorder.onmousedown = null;
			this.element.onmousedown = null;
		}
		
		/*
			Consideration functions to be filled in by extentions of this object.
			eg: A textarea in an input window may need to be resized when the parent window does.
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
		};
		this.removeListenerConsiderations = function(){
			//Dummy until extention
		};
		
		/*
			CSS for fixed windows
		*/
		this.toFixedCSS = function(){
		
			//Change the CSS class of the children
			this.bar.className = "cbxFixedBar";
			this.element.className = "cbxFixedElement";
			this.content.className = "cbxFixedContent";
			this.background.className = "cbxFixedBackground";
			this.bottomBorder.className = "cbxFixedBorderBar";
			this.leftBorder.className = "cbxFixedBorderBar";
			this.rightBorder.className = "cbxFixedBorderBar";
			this.bottomRightResizer.className = "cbxFixedResizer";
			this.bottomLeftResizer.className = "cbxFixedResizer";
			this.topLeftResizer.className = "cbxFixedResizer";
			
			this.closeButton.style.borderTopRightRadius = "0px";
			this.element.style.width = "";
			this.element.style.height = "";
			
			//Maintain proportions of content and background
			this.maintainProportions();
			
			//Shadow fixed windows
			this.shadow();
			
			//Fire extended considerations
			this.toFixConsiderations();
		};
		
		//Function to calculate the height of the content and background
		this.maintainProportions = function(){
		
			this.content.style.height = this.element.clientHeight - this.bar.clientHeight;
		}
		
		this.toWindowedCSS = function(){
		
			//Change the CSS class of the children
			this.bar.className = "cbxBar";
			this.element.className = "cbxElement";
			this.content.className = "cbxContent";
			this.background.className = "cbxBackground";
			this.bottomBorder.className = "cbxHorizontalBorderBar";
			this.leftBorder.className = "cbxVerticalBorderBar";
			this.rightBorder.className = "cbxVerticalBorderBar";
			this.bottomRightResizer.className = "cbxBottomRightResizer";
			this.bottomLeftResizer.className = "cbxBottomLeftResizer";
			this.topLeftResizer.className = "cbxTopLeftResizer";
			
			//Alter some CSS independently
			this.closeButton.style.borderTopRightRadius = "10px";
			this.element.style.width = this.width;
			this.element.style.height = this.height;
			
			//Maintain proportions of content and background
			this.maintainProportions();
			
			//Fire extended considerations
			this.toWindowConsiderations();
		};
		
		/*
			Window Positioning Functionality
		*/
		this.toLeft = function(){
		
			//Windowise maximised windows
			try{
				EM.fixedWindowsMaintainer.maxWindow.windowise();
			}catch(e){}
			
			//If there is a window already fixed left, windowise it
			try{
				EM.fixedWindowsMaintainer.leftWindow.windowise();
			}catch(e){}
			
			//Move the element to the appropriate parent
			EM.q.ge("pageLeftSegment").appendChild(this.element);
			
			//Alter the CSS of the window
			this.toFixedCSS();
			
			//Store this window in the fixed windows maintainer
			EM.fixedWindowsMaintainer.leftWindow = this;
			
			//Update the internal state
			this.state = "left";
			
			//Move the zIndex of the Left and Right segments infront of the Max
			EM.q.ge("pageLeftSegment").style.zIndex = 4;
			EM.q.ge("pageRightSegment").style.zIndex = 4;
			EM.q.ge("pageMaxSegment").style.zIndex = 3;
			
			//Show the separator
			EM.q.ge("pageSeparator").style.cursor = "ew-resize";
		};
		
		this.toRight = function(){
			
			//Windowise maximised windows
			try{
				EM.fixedWindowsMaintainer.maxWindow.windowise();
			}catch(e){}
			
			//If there is a window already fixed right, windowise it
			try{
				EM.fixedWindowsMaintainer.rightWindow.windowise();
			}catch(e){}
			
			//Move the element to the appropriate parent
			EM.q.ge("pageRightSegment").appendChild(this.element);

			//Store this window in the fixed windows maintainer
			EM.fixedWindowsMaintainer.rightWindow = this;
			
			//Update the internal state
			this.state = "right";
			
			//Move the zIndex of the Left and Right segments infront of the Max
			EM.q.ge("pageLeftSegment").style.zIndex = 4;
			EM.q.ge("pageRightSegment").style.zIndex = 4;
			EM.q.ge("pageMaxSegment").style.zIndex = 3;
			
			//Show the separator
			EM.q.ge("pageSeparator").style.cursor = "ew-resize";
			
			//Alter the CSS of the window
			this.toFixedCSS();
		};
		
		this.maximise = function(){
			
			//If there is a window already maximised, windowise it
			try{
				EM.fixedWindowsMaintainer.maxWindow.windowise();
			}catch(e){}
			
			//Windowise fixed left and right windows also
			try{
				EM.fixedWindowsMaintainer.leftWindow.windowise();
			}catch(e){}
			
			try{
				EM.fixedWindowsMaintainer.rightWindow.windowise();
			}catch(e){}
			
			//Move the element to the appropriate parent
			EM.q.ge("pageMaxSegment").appendChild(this.element);
			

			//Store this window in the fixed windows maintainer
			EM.fixedWindowsMaintainer.maxWindow = this;
			
			//Update the internal state
			this.state = "maximum";
			
			//Move the zIndex of the  Max infront of the Left and Right segments
			EM.q.ge("pageLeftSegment").style.zIndex = 3;
			EM.q.ge("pageRightSegment").style.zIndex = 3;
			EM.q.ge("pageMaxSegment").style.zIndex = 4;
			
			//Hide the separator
			EM.q.ge("pageSeparator").style.cursor = "default";
			
			//Alter the CSS of the window
			this.toFixedCSS();
		};
		
		this.windowise = function(){
		
			//Restore the display of the window
			this.element.style.display = "";
			
			//Move the element to the appropriate parent
			EM.q.ge("pageContent").appendChild(this.element);
			
			//Change the style of the button when the corresponding window is restored
			this.systemButton.className = "cbxSystemButtonOff";
			
			//Remove this from the fixed window maintainer if it was previously fixed
			if(this.state == "left"){
				EM.fixedWindowsMaintainer.leftWindow = undefined;
			}
			else if(this.state == "right"){
				EM.fixedWindowsMaintainer.rightWindow = undefined;
			}
			else if(this.state == "maximum"){
				EM.fixedWindowsMaintainer.maxWindow = undefined;
			}
			
			//Maintain internal state
			this.visible = true;
			
			//Update the internal state
			this.state = "window";
			
			//Alter the CSS of the window
			this.toWindowedCSS();
			
			//Hide the separator
			if((EM.fixedWindowsMaintainer.leftWindow == undefined)&&(EM.fixedWindowsMaintainer.rightWindow == undefined)&&(EM.fixedWindowsMaintainer.maxWindow == undefined)){
				EM.q.ge("pageSeparator").style.cursor = "default";
			}
		};
		
		this.minimise = function(){
		
			//Removed window fixing first
			this.windowise();

			//Do not display the window
			this.element.style.display = "none";
		
			//Change the style of the button when the corresponding window is minimised
			this.systemButton.className = "cbxSystemButtonOn";
			
			//Fire window independent considerations
			this.toMinConsiderations();
			
			//Maintain internal state
			this.visible = false;
			
			//Update the internal state
			this.state = "minimum";
		};
		
		this.close = function(){
		
			//Remove listeners associated with the context box
			this.removeEventListeners();
			
			//Remove listeners associated with extentions of this
			this.removeListenerConsiderations()
			
			//Fire window independent considerations
			this.closeConsiderations();
			
			//Remove the reference to this in the windows store
			delete EM.maintainer.windows[me.name + "("+me.windowType+")"];
			
			//De-append the system button
			me.systemButton.remove();
			
			//De-append the HTML
			me.element.remove();
		};
		
		//Function to put this window on top of the others
		this.toTop = function(){
		
			//Shadow all other windows
			for(var w in EM.maintainer.windows){
				EM.maintainer.windows[w].shadow();
			}
			
			//Move the zIndex of this window to the heighest of all windows
			this.element.style.zIndex = EM.windowsZmaintainer.getTopZ();
			
			//Highlight this window to signify it on top
			if(this.state == "window"){
				this.highlight();
			}
		};
		
		/*
			Button Listeners
				cancelBubble will prevent the event from traversing the element tree, containing it to a single element.
				preventDefault will supress all default functionality for the event.
		*/
		this.toLeftButton.onmousedown = function(e){
			e.cancelBubble = true;
			e.preventDefault();
		}
		this.toRightButton.onmousedown = function(e){
			e.cancelBubble = true;
			e.preventDefault();
		}
		this.toMaxButton.onmousedown = function(e){
			e.cancelBubble = true;
			e.preventDefault();
		}
		this.closeButton.onmousedown = function(e){
			e.cancelBubble = true;
			e.preventDefault();
		}
		this.toMinButton.onmousedown = function(e){
			e.cancelBubble = true;
			e.preventDefault();
		}
		
		this.toLeftButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();

			//Fire appropriate corresponding function
			if(me.state == "left"){
				me.windowise();
			}
			else{
				me.toLeft();
			}
		};
		this.toRightButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();

			//Fire appropriate corresponding function
			if(me.state == "right"){
				me.windowise();
			}
			else{
				me.toRight();
			}
		};
		this.toMaxButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();

			//Fire appropriate corresponding function
			if(me.state == "maximum"){
				me.windowise();
			}
			else{
				me.maximise();
			}
		};
		this.closeButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();

			//Fire corresponding function
			me.close();
		};
		this.toMinButton.onclick = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();
			
			//Fire appropriate corresponding function
			if(me.visible){
				me.minimise();
			}
			else{
				me.windowise();
			}
		};
		this.systemButton.onclick = function(e){

			e.cancelBubble = true;
			e.preventDefault();

			//Fire appropriate corresponding function
			if(me.visible){
				me.minimise();
			}
			else{
				me.windowise();
			}
		}
		
		/*
			Resizer Functionality
		*/
		this.bottomRightResizer.onmousedown = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();

			window.onmousemove = function(e){
			
				//Calculate the new height and width
				var newWidth = e.x - me.element.style.left.depix() + 10;
				var newHeight = e.y - me.element.style.top.depix() - 5;
				
				//Alter the width of the window based on mouse position
				if(newWidth >= me.minWidth){
					me.element.style.width = newWidth;
				}
				
				//Alter the height of the window based on mouse position
				if(newHeight >= me.minHeight){
					me.element.style.height = e.y - me.element.style.top.depix() + 10;
				}
				
				//Update the internal state
				me.width = me.element.style.width.depix();
				me.height = me.element.style.height.depix();
				
				//Maintain the height of the content
				me.maintainProportions();
				
				//Fire resize considerations
				me.resizeConsiderations();
			};
			
		};
		this.bottomLeftResizer.onmousedown = function(e){
			
			e.cancelBubble = true;
			e.preventDefault();
			
			window.onmousemove = function(e){
			
				//Calculate the new height and width
				var newWidth = me.element.style.width.depix() + me.element.style.left.depix() - e.x;
				var newHeight = e.y - me.element.style.top.depix() -5;
				
				//Alter the width of the window based on mouse position
				if(newWidth >= me.minWidth){
					me.element.style.left = e.x - 10;
					me.element.style.width = newWidth +10;
				}
				
				//Alter the height of the window based on mouse position
				if(newHeight >= me.minHeight){
					me.element.style.height = e.y - me.element.style.top.depix() + 10;
				}
				
				//Update the internal state
				me.x = me.element.style.left.depix();
				me.y = me.element.style.top.depix();
				me.width = me.element.style.width.depix();
				me.height = me.element.style.height.depix();
				
				//Maintain the height of the content
				me.maintainProportions();
				
				//Fire resize considerations
				me.resizeConsiderations();
			};
		};
		this.topLeftResizer.onmousedown = function(e){
			
			e.cancelBubble = true;
			e.preventDefault();
			
			window.onmousemove = function(e){
			
				//Calculate the new height and width
				var newWidth = me.element.style.width.depix() + me.element.style.left.depix() - e.x + 10;
				var newHeight = me.element.style.height.depix() + me.element.style.top.depix() - e.y + 10;
				
				//Alter the width of the window based on mouse position
				if(newWidth >= me.minWidth){
					me.element.style.left = e.x - 10;
					me.element.style.width = newWidth;
				}
				
				//Alter the height of the window based on mouse position
				if(newHeight >= me.minHeight){
					me.element.style.top = e.y - 10;
					me.element.style.height = newHeight;
				}
				
				//Update the internal state
				me.x = me.element.style.left.depix();
				me.y = me.element.style.top.depix();
				me.width = me.element.style.width.depix();
				me.height = me.element.style.height.depix();
				
				//Maintain the height of the content
				me.maintainProportions();
				
				//Fire resize considerations
				me.resizeConsiderations();
				
			};
		};
		this.bar.onmousedown = function(e){
		
			//This event should bubble to the element
			e.cancelBubble = false;
			e.preventDefault();
			
			//Store the previous position to use in calculations
			var x = e.x - me.element.style.left.depix();
			var y = e.y - me.element.style.top.depix();
			
			window.onmousemove = function(e){
			
				//Move the window
				me.element.style.left = e.x - x;
				me.element.style.top = Math.max(e.y - y, EM.q.ge("pageTopBar").clientHeight);
				
				//Update the internal state
				me.x = me.element.style.left.depix();
				me.y = me.element.style.top.depix();	

				//Maintain the height of the content
				me.maintainProportions();				
			}
		};
		this.rightBorder.onmousedown = function(e){
			
			e.cancelBubble = true;
			e.preventDefault();
			
			window.onmousemove = function(e){
			
				//Calculate the new height and width
				var newWidth = e.x - me.element.style.left.depix() + 3;
				
				//Alter the width of the window based on mouse position
				if(newWidth >= me.minWidth){
					me.element.style.width = newWidth;
				}
				
				//Update the internal state
				me.width = me.element.style.width.depix();
				
				//Maintain the height of the content
				me.maintainProportions();

				//Fire resize considerations
				me.resizeConsiderations();
			};
		};
		this.leftBorder.onmousedown = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();
			
			window.onmousemove = function(e){
			
				//Calculate the new height and width
				var newWidth = me.element.style.width.depix() + me.element.style.left.depix() - e.x;
				
				//Alter the width of the window based on mouse position
				if(newWidth >= me.minWidth){
					me.element.style.left = e.x - 2;
					me.element.style.width = newWidth + 2;
				}
				
				//Update the internal state
				me.x = me.element.style.left.depix();
				me.width = me.element.style.width.depix();

				//Maintain the height of the content
				me.maintainProportions();
				
				//Fire resize considerations
				me.resizeConsiderations();
				
			};
		};
		this.bottomBorder.onmousedown = function(e){
		
			e.cancelBubble = true;
			e.preventDefault();
			
			window.onmousemove = function(e){
			
				//Calculate the new height and width
				var newHeight = e.y - me.element.style.top.depix() - 4;
				
				//Alter the height of the window based on mouse position
				if(newHeight >= me.minHeight){
					me.element.style.height = e.y - me.element.style.top.depix() + 4;
				}
				
				//Update the internal state
				me.height = me.element.style.height.depix();			

				//Maintain the height of the content
				me.maintainProportions();
				
				//Fire resize considerations
				me.resizeConsiderations();
				
			};
		};
		
		/*
			Other Element Listeners
		*/
		this.element.onmousedown = function(e){
		
			e.cancelBubble = true;
			me.toTop();
		};
		
		//Return the context box object
		return this;
		
	}
}