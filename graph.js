/*************************************
/*   Graph - the API for Graph.js
/*************************************/

function Graph(canvas) {

    //build MVC
    this.graph = new GraphInt();
    this.view = new View(this.graph, canvas);

    this.controller = new Controller(this.view,this.graph);
    //enable physics
    var physics = new Physics(this.graph);
    this.controller.physics = physics;

    this.view.init(this.controller);
    
    //closures for the handlers to access
    var view = this.view;
    var controller = this.controller;

    canvas.onmousedown = function(event) {
        controller.mouseDownHandler(event)
    };
    canvas.onmouseup = function(event) {
        controller.mouseUpHandler(event)
    };
    canvas.onmousemove = function(event) {
        controller.mouseMoveHandler(event)
    };

    //draw every 50 ms.
    var step = function() { view.draw()  }
    setInterval(step, 50);
}

Graph.prototype.save = function(name) {
    if (name) {
        localStorage[name] = this.graph.toJSON();
    }
};

Graph.prototype.load = function(name) {
    if (localStorage.getItem(name)) {
        this.graph.fromJSON(localStorage.getItem(name));
    }
};

Graph.prototype.getSavedGraphsList = function() {
    var names = new Array();
    
    if (localStorage) {
        for (var i=0; i<localStorage.length; i++) {
            names.push(localStorage.key(i));
        }
    }
    return names;
};
        
Graph.prototype.clear = function() {
    this.graph.clear();
};

Graph.prototype.setOption = function(name, value) {
    this.controller.options[name] = value;
};

Graph.prototype.toJSON = function() {
    return this.graph.toJSON();
};

Graph.prototype.fromJSON = function(json) {
    this.graph.fromJSON(json);
};
    

/*************************************
/*   Controller
/*************************************/

function Controller(view, graph) {
    this.view = view;
    this.graph = graph;
    this.mouseDown = false;

    //the currently selected vertex
    this.currVertex = null;

    //Used to indicate whether currVertex has moved yet.
    //Used to tell if the user is moving the vertex, or deslecting it.
    this.currVertexBeginMoving = false;

    //config options
    this.options = new Array();
    this.options['physics'] = 'default';
    
}

//MOUSE DOWN
Controller.prototype.mouseDownHandler = function(evt) {
    if (! this.options['isEditable']) {
        return;
    }
        
    this.mouseDown = true;
    canvas = this.view.canvas;
    var mouseX = evt.pageX - canvas.offsetLeft;
    var mouseY = evt.pageY - canvas.offsetTop;

    
    this.clickHandler(mouseX, mouseY);
};

//MOUSE UP
Controller.prototype.mouseUpHandler = function (evt) {
    if (! this.options['isEditable']) {
        return;
    }

    this.mouseDown = false;
    if (this.currVertexBeginMoving) {
        //the vertex was not moved at all, so user was de-selecting it
        this.currVertexBeginMoving = false;
        this.currVertex = null;
    }
};
    
//MOUSE MOVE
Controller.prototype.mouseMoveHandler = function(evt) {
    if (! this.options['isEditable']) {
        return;
    }

    if (! this.mouseDown ) {
        return;
    }

    if (this.currVertex !== null) {
        this.currVertexBeginMoving = false;

        var v = this.graph.vertices[this.currVertex];
            
        var mouseX = evt.pageX- canvas.offsetLeft;
        var mouseY = evt.pageY - canvas.offsetTop;
        
        this.moveVertex(v, mouseX, mouseY);
    }
};


//The mouse click handler.
Controller.prototype.clickHandler = function(mouseX, mouseY) {

    if ( mouseX > 0 && mouseY > 0 && mouseX < canvas.width && mouseY < canvas.height ) {
            
        //check to see if a vertex is selected
        var i = this.graph.getVertexNear(mouseX, mouseY, 2*this.view.vertexRadius);
        if (i !== null ) {

            var v = this.graph.vertices[i];

            //check to see if an edge should be drawn
            if (this.currVertex !== null &&
                this.currVertex !== i  &&
                !this.graph.hasEdge(this.graph.vertices[this.currVertex], this.graph.vertices[i]) ) {
                this.graph.addEdge(this.graph.vertices[this.currVertex], v);
            }

            //update currVertex
            if (this.currVertex == i) {
                //We don't want to deselect the vertex
                //Unless they've actually let go -- maybe its being moved.
                this.currVertexBeginMoving = true;
            } else {
                this.currVertex = i;
            }

        } else { //a vertex is not selected -- add a new one.
            this.graph.addVertex(mouseX, mouseY);
            this.currVertex = this.graph.vertices.length -1;
        }
    }
};


//BUTTON CLICK
Controller.prototype.buttonHandler = function(buttonType) {
    this.mode = buttonType;
    this.currVertex = null;
};

/*
  Function that defines what happens when a vertex is moved.
  This function is controlled by the Physics class, which modifies this callback
  for the GraphInt object provided to physics:
  var p = new Physics(graph);
  p.setPhysicsMode("float");
 */    
Controller.prototype.moveVertex = function(vertex, x, y) {
    this.physics.modes[this.options['physics']].apply(this.physics, [vertex,x,y]);
    
};

///test functions
Controller.prototype.itrCurrentVertex = function() {
    this.graph.startDepthFirst(this.graph.vertices[this.currVertex]);
    var itr = this.graph.__iterator__();
    var v = itr.next();
    while (v != null) {
        v = itr.next();
    }
};

Controller.prototype.testHasEdge = function() {
    if (this.graph.hasEdge(this.graph.vertices[0], this.graph.vertices[1]) ) {
    } else {
    }
};

   
/***********************************
/*     View
/***********************************/

function View(graph, canvas) {
    this.graph = graph;
    this.canvas = canvas;
    this.controller = null;

    this.fullscreen = true;
    this.vertexRadius = 5;
    this.border = 5;

    this.setController = function(cont) {
        this.controller = cont;
    }

}

//Inits the view, and associates it with a controller.
//Because the vertex and edge drawing methods are customizeable,
//They are stored in the (controller) option array.
//The defaults are set here.
View.prototype.init = function(cont) {
    this.controller = cont;

    this.controller.options['vertexDrawFunction'] = function(ctx,v,graph) {
        ctx.beginPath();
        
        //color
        if (v == this.graph.vertices[this.controller.currVertex]) {
            ctx.strokeStyle = '#f00';
        }

        ctx.arc(v.x, v.y, this.vertexRadius, 0, 10, false);
        ctx.stroke();
        ctx.closePath();

        //reset color
        ctx.strokeStyle = '#000000';
    };

    this.controller.options['edgeDrawFunction'] = function(ctx,e,graph) {
        ctx.beginPath();
        ctx.moveTo(e.v1.x, e.v1.y);
        ctx.lineTo(e.v2.x, e.v2.y);
        ctx.stroke();
    };
}

//Draw the graph
View.prototype.draw = function() {
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0,0, this.canvas.width, this.canvas.height);

    //draw vertices
    for (var i=0; i<this.graph.vertices.length; i++) {
        var v = this.graph.vertices[i];
        this.drawVertex(ctx,v);
    }

    //draw edges
    for (var i=0; i<this.graph.edges.length; i++) {
        var e = this.graph.edges[i];
        this.drawEdge(ctx,e);
    }
};

View.prototype.drawVertex = function(ctx, vertex) {
    var drawFunction = this.controller.options['vertexDrawFunction'];
    drawFunction.apply(this,[ctx, vertex, this.graph]);
};

View.prototype.drawEdge = function(ctx, edge) {
    var drawFunction = this.controller.options['edgeDrawFunction'];
    drawFunction.apply(this,[ctx, edge, this.graph]);
}

    



/**************************
/*    GraphInt - the internal Graph class
/***************************/

function Vertex(x,y) {
    this.x = x;
    this.y = y;
    this.marked = false;   //for iteration.
    this.edges = new Array();
    this.toString = function() { return "(" + this.x + "," + this.y + ")" };
}

//Only works properly in firefox, so should be called as follows:
//OR: var itr = vertex.__iterator__()
// for (var v = itr.next(); v; v = itr.next())
Vertex.prototype.__iterator__ = function() {
    return new VertexIterator(this);
};

//marks this vertex and iterates over unmarked neighbours
function VertexIterator(v) {
    this.v = v;
};

VertexIterator.prototype.next = function() {

    //return first unmarked neighbour
    for (edgeIndex in this.v.edges) {
        var e = this.v.edges[edgeIndex];
        var other;
        if (e.v1 != this.v) {
            other = e.v1;
        } else {
            other = e.v2;
        }
        if (!other.marked) {
            other.marked = true;
            return other;
        }
    }
    return null;
}

function Edge(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
}

function GraphInt() {
    this.vertices = new Array();
    this.edges = new Array();
}

GraphInt.prototype.addVertex = function(x,y) {
    var v = new Vertex(x,y);
    this.vertices.push(v);
};

GraphInt.prototype.addEdge = function(v1,v2) {
    var e = new Edge(v1,v2);
    this.edges.push(e);
    v1.edges.push(e);
    v2.edges.push(e);
};

GraphInt.prototype.clear = function() {
    this.vertices = new Array();
    this.edges = new Array();
};

//Serialize to a simple vertex-list and edge-list,
//which has no loops in it, and so can be json.
GraphInt.prototype.toJSON = function() {

    //create a image of the graph with no loops
    //which we will JSON.stringify
    var g = new Object();
    g.vertices = new Array();
    g.edges = new Array();

    for (var i in this.vertices) {
        var v = new Object();
        v.x = this.vertices[i].x;
        v.y = this.vertices[i].y;
        g.vertices.push(v);
    }

    for (var i in this.edges) {
        var edge = this.edges[i];
        var newE = new Object();

        for (var j in this.vertices) {
            if (edge.v1 == this.vertices[j]) {
                newE.v1 = j;
            }
            if (edge.v2 == this.vertices[j]) {
                newE.v2 = j;
            }
        }

        g.edges.push(newE);
    }

    return JSON.stringify(g);
};

//recover the full graph format from the vertex and
//edge list
GraphInt.prototype.fromJSON = function(json) {
    var simpleG = JSON.parse(json);
    this.clear();

    for (var i in simpleG.vertices) {
        this.addVertex(simpleG.vertices[i].x,
                       simpleG.vertices[i].y);
    }

    for (var i in simpleG.edges) {
        this.addEdge(this.vertices[simpleG.edges[i].v1],
                     this.vertices[simpleG.edges[i].v2] );
    }
};

//Get vertex near a point
GraphInt.prototype.getVertexNear = function(x,y, dist) {
    for (var i=0; i<this.vertices.length; i++) {
        var v = this.vertices[i];
        if ( (v.x - x) < dist && (x - v.x) < dist && (v.y - y) < dist && (y - v.y) < dist ) {
            return i;
        }
    }
    return null;
};

//returns true iff there is an edge between va and vb 
GraphInt.prototype.hasEdge = function(va, vb) {
    for (var i in va.edges) {
        var e = va.edges[i];
        //since e is in va.edges, either v1 or v2 is va
        if (e.v1 == vb || e.v2 == vb) {
            return true;
        }
    }
    return false;
};

//start a depth-first search at vertex v.
//after calling this, the iterator should be used.
GraphInt.prototype.startDepthFirst = function (v) {
    for (var i in this.vertices) {
        this.vertices[i].marked = false;
    }

    //items of itrStack should be marked.
    this.itrStack = new Array();
    this.itrStack.push(v);
    v.marked = true;
};


// Only works properly in firefox, so should be called as follows:
// var itr = g.__iterator__()
// for(var v = itr.next(); v; v = itr.next() {
GraphInt.prototype.__iterator__ = function() {
    return new GraphIntIterator(this);
};

//GraphIntIterator for depthfirst iteration from a given vertex,
//as set by graph.startDepthFirst(vertex);
function GraphIntIterator(graph) {
    this.g = graph;
}

GraphIntIterator.prototype.next = function() {
    var currVertex = this.g.itrStack.pop();
    if (!currVertex) {
        return null;
    }

    var itr = currVertex.__iterator__();
    var neighbour = itr.next();
    while(neighbour) {
        this.g.itrStack.push(neighbour);
        neighbour = itr.next();
    }
    return currVertex;
};


/*********************
/*    Physics
/*********************/
function Physics(graph) {
    this.graph = graph;

    //Map physics mode names to their callbacks
    this.modes = {
        "default" : this.defaultMove,
        "float" : this.floatMove
    };
}

Physics.prototype.defaultMove = function(vertex, x, y) {
    vertex.x = x;
    vertex.y = y;
};

Physics.prototype.floatMove = function(vertex, x, y) {
    var dx = x - vertex.x;
    var dy = y - vertex.y;
    
    //move this vertex
    vertex.x += dx;
    vertex.y += dy;

    //move other vertices in this component
    this.graph.startDepthFirst(vertex);

    var itr = this.graph.__iterator__();
    for(var v = itr.next(); v; v=itr.next()) {
        if (v != vertex) {
            v.x = v.x + dx;
            v.y = v.y + dy;
        }
    }
    
};

Physics.prototype.setPhysicsMode = function(aMode) {

    var match = false;
    for (var mode in this.modes) {
        if (aMode == mode) {
            this.graph.moveVertex = this.modes[mode];
            match = true;
        }

    }

};
