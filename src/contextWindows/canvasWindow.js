loadCanvasWindow = function(){

	EM.canvasWindow = function(name, x, y, width, height){
	
		//Call to extend context box
		var me = EM.contextBox.apply(this, arguments);
		
	/*
		Additions and Re-calculations
	*/	
		this.canvas = document.createElement('canvas');
		this.canvas.className = 'cbxCanvas';
		this.windowType = "canvasWindow";
		this.title.innerHTML = name + " (" + this.windowType + ")";
		this.content.appendChild(this.canvas);
		this.canvasContext = this.canvas.getContext("2d");
		this.background.style.backgroundColor = "#FFFFFF";
		
	/*
		Functionality
	*/
	
		//Render Function
		this.render = function(){
					
			//Set the style to white for every refresh
			//me.canvasContext.fillStyle = "rgb(255,255,255)";
			
			//Refresh the canvas
			//me.canvasContext.clearRect (0,0, me.canvas.width, me.canvas.height);
			
			try{
/*		
				var toDraw = Eden.maintainer.symbols[me.name].getValue();

				for(var i in toDraw){
					try{
						toDraw[i].draw(me.canvasContext);
					}catch(f){}
				}
*/		
			}catch(e){
				
			}
			
			//Call to re-render
			//window.requestAnimationFrame(me.render);
		}
		
	/*
		Listeners
	*/
	
		this.canvas.onfocus = function(e){
		
		};
		this.canvas.onblur = function(e){
		
		};
		this.canvas.onmouseup = function(e){
		
		};
		this.canvas.onmousedown = function(e){
		
		};
		this.canvas.onmouseover = function(e){
		
		};
		this.canvas.onmouseout = function(e){
		
		};
		this.canvas.onclick = function(e){
		
		};
		this.canvas.onmousemove = function(e){
		
		};
		this.canvas.onkeydown = function(e){
		
		};
		this.canvas.onkeyup = function(e){
		
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
			
			me.canvas.width = me.canvas.offsetWidth;
			me.canvas.height = me.canvas.offsetHeight;
		};
		this.toMinConsiderations = function(){
			//Dummy until extention
		};
		this.closeConsiderations = function(){
			//Dummy until extention
		};
		this.removeListenerConsiderations = function(){
			
			me.canvas.onfocus = null;
			me.canvas.onblur = null;
			me.canvas.onmouseup = null;
			me.canvas.onmousedown = null;
			me.canvas.onmouseover = null;
			me.canvas.onmouseout = null;
			me.canvas.onclick = null;
			me.canvas.onkeydown = null;
			me.canvas.onkeyup = null;
			me.canvas.onmousemove = null;
		};

		//Set render in motion
		this.render();
		
		//Return this
		return this;
	};
};	