loadZIndexMaintenenceFunctions = function(){

	//Store for functionality to maintain the z-index of windows
	EM.windowsZmaintainer = {};
	
	EM.windowsZmaintainer.topPlusOne = 6;
	
	//Function for windows to obtain a new top zIndex
	EM.windowsZmaintainer.getTopZ = function(){
	
		//Re float the z indicies
		EM.windowsZmaintainer.reFloat();
	
		//Increment the heighest zIndex
		EM.windowsZmaintainer.topPlusOne++;
		
		//Return what the heighest zIndex was
		return EM.windowsZmaintainer.topPlusOne - 1;
	};
	
	EM.windowsZmaintainer.reFloat = function(){
	
		//Create a store for the lowest existing zIndex value
		var bottomZ = undefined;
		
		//Calculate the lowest window
		for(var w in EM.maintainer.windows){
			if((bottomZ==undefined)||(parseInt(EM.maintainer.windows[w].element.style.zIndex) < bottomZ)){
				bottomZ = parseInt(EM.maintainer.windows[w].element.style.zIndex);
			}
		}
		
		//Decrease the value of the zIndices by the lowest existing
		if(bottomZ!=undefined){
			//Only if the lowest index is greater than 5
			if(bottomZ > 5){
				for(var w in EM.maintainer.windows){
					//Decrease them to a minimum of 5
					EM.maintainer.windows[w].element.style.zIndex = parseInt(EM.maintainer.windows[w].element.style.zIndex) - (bottomZ - 5);
				}
			}
		}
		
		//Create a store for the heighest existing zIndex value
		var topZ = undefined;
	
		for(var w in EM.maintainer.windows){
			if((topZ==undefined)||(parseInt(EM.maintainer.windows[w].element.style.zIndex) > topZ)){
				topZ = parseInt(EM.maintainer.windows[w].element.style.zIndex);
			}
		}
		//Re calculate the maintained top + 1 zIndex value
		if(topZ!=undefined){
			EM.windowsZmaintainer.topPlusOne = topZ + 1;
		}
	};
};