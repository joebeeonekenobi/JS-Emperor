loadDependencyMap = function(){

	EM.DependencyMapWindow = function(name, x, y, width, height){

		//Call to extend context box
		var me = EM.canvasWindow.apply(this, arguments);
		
	/*
		Additions and Re-calculations
	*/	
		me.windowType = "dependencyMapWindow";
		me.title.innerHTML = name + " (" + this.windowType + ")";

		jQuery(me.canvas).springy({ 
			graph: EM.maintainer.dependencyMap.graph,
			minEnergyThreshold: -1,
			stiffness: 600,
			repulsion: 1000,
			damping: 0.5,
		});

		return me;
	}


	/*

		The Dependency Map is a leightweight datastore for maintaining the directed graph of symbol watch/observer association.

		This could be done by the maintainer, however if a symbol is removed, the list of symbols which watch said symbol, is lost. 
		Unless the symbol is directly replaced by another, it would require manual and complete tree search to restore the list.

		eg: 
			b = 1;
			a is b; // (a watches b) and (b isObservedBy a) is stored as b is already created

			x is y; // y is not created so it does not store that x is watching it
					// subsequent creation and update of y will not fire x.


		This map can keep the inward associations maintained without compromising the node tree.

		All Scenarios

			x is y + z

			Step 1:
				for each outward x association
					remove its inward x
			Step 2:
				reset x outward to nothing
			Step 3:
				add association x outward y
				add association y inward x
				add association x outward z
				add association z inward x
			Step 4:
				leave x inward alone
	
	*/

	DependencyMap = function(){

		this.directory = {};
		this.graph = new Springy.Graph();

		var me = this;

		//Function to say that a symbol with name 'subjectName' watches symbols with names 'targetNames'.
		this.associate = function(subjectName, targetNames){

			//console.log("Associating : "+subjectName+" -> ["+targetNames.join(", ")+"]")

			var subject = this.ensure(subjectName)

			//Step 1 : 
			for(var oldTargets in subject.watches){
				this.ensure(oldTargets).removeInward(subjectName);
			}

			//Step 2 :
				//subject.watches = {};
			for(var oldWatches in subject.watches){
				subject.removeOutward(oldWatches);
			}

			//Step 3:
			for(var t in targetNames){

				this.ensure(targetNames[t]).addInward(subjectName);
				subject.addOutward(targetNames[t])
			}
		}

		this.getWatches = function(name){

			return Object.keys(this.ensure(name).watches);
		}

		this.getObservers = function(name){
			return Object.keys(this.ensure(name).isObservedBy);
		}

		//Function to ensure a map node exists for a given name
		this.ensure = function(name){

			if(this.directory[name] == undefined){
				this.directory[name] = new DependencyMapNode(name, me.graph, me.directory);
			}

			return this.directory[name];
		}

		return this;
	}

	DependencyMapNode = function(name, graph, directory){

		this.name = name;
		this.watches = {};
		this.isObservedBy = {};
		this.graph = graph;
		this.graphNode = undefined;
		this.directory = directory;
		this.graphEdges = {};

		var me = this;

		this.addOutward = function(name){
		//console.log("Add Outward: "+this.name+" -> "+name)

			//Internal Rep
			this.watches[name] = true;

			//Ensure that graph nodes exist to be manipulated
			this.ensureGraphNode();
			this.directory[name].ensureGraphNode();

			//Add the arrow edge to the springy graph
			this.graphEdges[name] = this.graph.newEdge(this.graphNode, this.directory[name].graphNode);
		}
		this.removeOutward = function(name){
		//console.log("Remove Outward: "+this.name+" -> "+name)
			
			//Remove from springy graph
			this.graph.removeEdge(this.graphEdges[name]);

			//Remove reference to springy graph
			delete this.graphEdges[name];

			//Remove internal Rep
			delete this.watches[name];

			//If there are no incoming or outgoing connections, remove the node from the graph
			this.directory[name].resolveGraph();
			this.resolveGraph();
		}

		this.addInward = function(name){
		//console.log("Add Inward: "+this.name+" <- "+name)

			//Ensure that graph nodes exist to be manipulated
			this.ensureGraphNode();
			this.directory[name].ensureGraphNode();

			//Internal Rep
			this.isObservedBy[name] = true;
		}

		this.removeInward = function(name){
		//console.log("Remove Inward: "+this.name+" <- "+name)

			//Remove Internal Rep
			delete this.isObservedBy[name];

			//If there are no incoming or outgoing connections, remove the node from the graph
			this.resolveGraph();
			this.directory[name].resolveGraph();
		}

		//Function to ensure that a graph node exists to be manupulated
		this.ensureGraphNode = function(){
		//console.log("Ensuring...: "+this.name)

			if(this.graphNode == undefined){

				//console.log("...Creating...: "+this.name)
				//Create the node if it does not exist
				this.graphNode = this.graph.newNode({label: this.name});
			}

		}

		//Function to maintain misc features of the graph
		this.resolveGraph = function(){
		//console.log("Resolving...: "+this.name)

			//If there are no incoming or outgoing connections, remove the node from the graph
			if((this.watches.length() == 0) && (this.isObservedBy.length() == 0)){
				if(this.graphNode != undefined){
					
					//console.log("Deleting...: "+this.name)
					this.graph.removeNode(this.graphNode)
					this.graphNode = undefined;
				}
			}
		}

		return this;
	}

}