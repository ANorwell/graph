
//The controller, initialized by setup();
var controller;

//The parent of the canvas elt, used for finding
//the canvas size
var parent;


//resize function
var onresizeOld = window.onresize;
window.onresize = function() {
    if (onresizeOld) {
        onresizeOld();
    }
    controller.onResize(parent);
};

//given a canvas, sets up the MVC
function setup( canvas ) {
    parent = canvas.parentNode;
    G = new Graph();
    V = new View(G, canvas);
    controller = new Controller(V,G);
    V.setController(controller);
    V.init();

    
    //enable physics
    var physics = new Physics(G);
    physics.setPhysicsMode("default");
    this.controller.physics = physics;

    controller.load();
    
    var step = function() { V.draw()  }
    setInterval(step, 50);

    
}

///////////
// Classes
///////////


/*************************************
 *   Controller
 *************************************/

function Controller(view, graph) {
    this.view = view;
    this.graph = graph;
    this.mouseDown = false;

    this.currVertex = null;

    //Used to indicate whether currVertex has moved yet.
    //Used to tell if the user is moving the vertex, or deslecting it.
    this.currVertexBeginMoving = false;

    //
    
}

//MOUSE DOWN
Controller.prototype.mouseDownHandler = function(evt) {

    this.mouseDown = true;
    canvas = this.view.canvas;
    var mouseX = evt.pageX - canvas.offsetLeft;
    var mouseY = evt.pageY - canvas.offsetTop;

        
    this.clickHandler(mouseX, mouseY);
};

//MOUSE UP
Controller.prototype.mouseUpHandler = function (evt) {
    this.mouseDown = false;
    if (this.currVertexBeginMoving) {
        //the vertex was not moved at all, so user was de-selecting it
        this.currVertexBeginMoving = false;
        this.currVertex = null;
    }
};
    
//MOUSE MOVE
Controller.prototype.mouseMoveHandler = function(evt) {
    if (! this.mouseDown ) {
        return;
    }

    if (this.currVertex !== null) {
        this.currVertexBeginMoving = false;

        var v = this.graph.vertices[this.currVertex];
            
        var mouseX = evt.pageX- canvas.offsetLeft;
        var mouseY = evt.pageY - canvas.offsetTop;
        
        this.graph.moveVertex(v, mouseX, mouseY);
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


//ONRESIZE
Controller.prototype.onResize = function(parent) {

    if (this.view.fullscreen) {
        this.view.canvas.width = $(window).width();
        this.view.canvas.height = $(window).height() - $("#footer").height();

    } else {
        this.view.canvas.width = parent.offsetWidth - 10; //TODO should be style.paddingLeft + style.paddingRight but this doesn't work ?
    }
};

//BUTTON CLICK
Controller.prototype.buttonHandler = function(buttonType) {
    this.mode = buttonType;
    this.currVertex = null;
};

//for the save button (open dialog)
Controller.prototype.saveButton = function() {
    var name = this.view.saveDialog();
};

//for the save button (open dialog)
Controller.prototype.loadButton = function() {
    var name = this.view.loadDialog();
};

Controller.prototype.optionsButton = function() {
    this.view.optionsDialog();
};

//actual save (on form submit)
Controller.prototype.save = function(name) {
    if (name) {
        localStorage[name] = this.graph.toJSON();
    }
};

Controller.prototype.load = function(name) {
    if (localStorage.getItem(name)) {
        this.graph.fromJSON(localStorage.getItem(name));
    }
};

Controller.prototype.setOptions = function(name) {
    switch (name) {
        case 'default':
        this.setPhysicsMode('default');
        break;
        case 'float':
        this.setPhysicsMode('float');
    }
};

Controller.prototype.setPhysicsMode = function (type) {
    this.physics.setPhysicsMode(type);
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
 *     View
 ***********************************/

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

    //Draw the graph
    this.draw = function() {
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0,0, this.canvas.width, this.canvas.height);

        //draw vertices
        for (var i=0; i<this.graph.vertices.length; i++) {
            var v = this.graph.vertices[i];

            ctx.beginPath();

            //color
            if (i == this.controller.currVertex) {
                ctx.strokeStyle = '#f00';
            }

            ctx.arc(v.x, v.y, this.vertexRadius, 0, 10, false);
            ctx.stroke();
            ctx.closePath();

            //reset color
            ctx.strokeStyle = '#000000';
        }

        //draw edges
        for (var i=0; i<this.graph.edges.length; i++) {
            var e = this.graph.edges[i];
            ctx.beginPath();
            ctx.moveTo(e.v1.x, e.v1.y);
            ctx.lineTo(e.v2.x, e.v2.y);
            ctx.stroke();
        }
    }
}

View.prototype.saveDialog = function() {
    $("#savedialog").dialog('open');
};

View.prototype.loadDialog = function() {
    $("#loaddialog").dialog('open');
};

View.prototype.optionsDialog = function() {
    $("#optionsdialog").dialog('open');
};

//run js to init the view, which depends on the
//html page (jqueryui)
View.prototype.init = function() {
    $("button", ".footer").button();
    $("#drawtype").buttonset();
    $("#usedialog").dialog({
        hide: "puff",
                close: function() {
                $("#graph").unbind('click');
            }
                });
    $("#graph").click(function() {
            $("#usedialog").dialog("close");
            $("#graph").unbind('click');
        }
        );
    
    $("#savedialog").dialog({
        autoOpen: false,
                modal: true,
                buttons: {
                'Save': function() {
                    var name = $("#savename").val();
                    if (name) {
                        controller.save(name);
                    }
                    $(this).dialog('close');
                },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
            }
        });

    //    var allfields = new Array();
    $("#loaddialog").dialog({
        autoOpen: false,
                modal: true,
                width: 350,
                open: function() {
                $("#load_buttonset").empty();
                
                if (localStorage) {
                    for (var i=0; i<localStorage.length; i++) {
                            var name = localStorage.key(i);
                        $("#load_buttonset").append(
                            '<input type="radio" id="load' + name + '" value="' + name + '" name="load_button" /><label for="' + name + '">' + name +'</label><br/>' );
                    }
                }
            },
                
                buttons: {
                'Load': function() {
                    var name = $('input:checked', '#loadform').val();
                        controller.load(name);
                        $(this).dialog('close');
                },
                'Cancel': function() {
                    $(this).dialog('close');
                },
                'Clear All': function() {
                    localStorage.clear();
                    $(this).dialog('close');
                },
                    

            }
        });

        $("#optionsdialog").dialog({
        autoOpen: false,
                modal: true,
                buttons: {
                'OK': function() {
                    var name = $('input:checked', '#optionsform').val();
                    if (name) {
                        controller.setOptions(name);
                    }
                    $(this).dialog('close');
                },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
                }
            });

}

/**************************
 *    Graph
 ***************************/

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

function Graph() {
    this.vertices = new Array();
    this.edges = new Array();
}

Graph.prototype.addVertex = function(x,y) {
    var v = new Vertex(x,y);
    this.vertices.push(v);
};

Graph.prototype.addEdge = function(v1,v2) {
    var e = new Edge(v1,v2);
    this.edges.push(e);
    v1.edges.push(e);
    v2.edges.push(e);
};

Graph.prototype.clear = function() {
    this.vertices = new Array();
    this.edges = new Array();
};

//Serialize to a simple vertex-list and edge-list,
//which has no loops in it, and so can be json.
Graph.prototype.toJSON = function() {

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
Graph.prototype.fromJSON = function(json) {
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
Graph.prototype.getVertexNear = function(x,y, dist) {
    for (var i=0; i<this.vertices.length; i++) {
        var v = this.vertices[i];
        if ( (v.x - x) < dist && (x - v.x) < dist && (v.y - y) < dist && (y - v.y) < dist ) {
            return i;
        }
    }
    return null;
};

//returns true iff there is an edge between va and vb 
Graph.prototype.hasEdge = function(va, vb) {
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
Graph.prototype.startDepthFirst = function (v) {
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
Graph.prototype.__iterator__ = function() {
    return new GraphIterator(this);
};

//GraphIterator for depthfirst iteration from a given vertex,
//as set by graph.startDepthFirst(vertex);
function GraphIterator(graph) {
    this.g = graph;
}

GraphIterator.prototype.next = function() {
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

/*
  Function that defines what happens when a vertex is moved.
  This function is controlled by the Physics class, which modifies this callback
  for the Graph object provided to physics:
  var p = new Physics(graph);
  p.setPhysicsMode("float");
 */    
Graph.prototype.moveVertex = function(vertex, x, y) {
    vertex.x = x;
    vertex.y = y;
};

/*********************
 *    Physics
 *********************/
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
    this.startDepthFirst(vertex);

    var itr = this.__iterator__();
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
