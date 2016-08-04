loadCSSAdjustmentFunctions = function(){

	//Function to shadow all windows
	EM.adjustCSS.shadowAllWindows = function(){
		for(var w in EM.maintainer.windows){
			EM.maintainer.windows[w].shadow();
		}
	};

	//Function for maintaining the height of the pageContent Div
	EM.adjustCSS.pageContentHeight = function(){
	
		//Alter the height of the pageContent
		EM.q.ge("pageContent").style.height = window.innerHeight - EM.q.ge("pageTopBar").clientHeight - EM.q.ge("pageBottomBar").clientHeight;
		
		//Calculate the content height for each of the fixed context windows
		try{
			EM.fixedWindowsMaintainer.leftWindow.maintainProportions();
		}catch(e){}
		try{
			EM.fixedWindowsMaintainer.rightWindow.maintainProportions();
		}catch(e){}
		try{
			EM.fixedWindowsMaintainer.maxWindow.maintainProportions();
		}catch(e){}
	};

	//Function for maintaining the width proportions of the pageSegments and separator
	EM.adjustCSS.pageSegmentsProportions = function(centerPoint){
	
		if((centerPoint > 300)&&(centerPoint < window.innerWidth - 300)){
		
			//Set the width of the left segment
			EM.q.ge("pageLeftSegment").style.width = centerPoint - EM.q.ge("pageSeparator").clientWidth;
			
			//Set the width of the right segment
			EM.q.ge("pageRightSegment").style.width = window.innerWidth - centerPoint;

			//Set the position of the separator
			EM.q.ge("pageSeparator").style.left = EM.q.ge("pageLeftSegment").style.width;
			
			//Store the ratio
			EM.adjustCSS.separatorRatio = (window.innerWidth / (EM.q.ge("pageSeparator").style.left.depix() + EM.q.ge("pageSeparator").clientWidth) );
			
		}
	}
	
	//Function to initialise the positions of the segments
	EM.adjustCSS.setupSideSegments = function(){
		
		//Initialise the left segement
		EM.q.ge("pageLeftSegment").style.top = EM.q.ge("pageTopBar").clientHeight;
		
		//Initialise the right segement
		EM.q.ge("pageRightSegment").style.top = EM.q.ge("pageTopBar").clientHeight;
		
		//Function for adding a listener to the separator
		EM.q.ge("pageSeparator").onmousedown = function(e){

			//Supress Default behaviour of mouse event handling
			e.preventDefault();
			
			//Move the seperator bar horizontally as the mouse moves
			window.onmousemove = function(e){
				EM.adjustCSS.pageSegmentsProportions(e.x);
			}
		}


		
	}

}