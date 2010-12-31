
var gServer = "http://anorwell.com/content.py";

function loadGraph(canvasId, gid) {
    var canvas = document.getElementById(canvasId);
    var G = new Graph(canvas);
    $.get(gServer,
          { type: "graph", id: gid },
          function(data) {
              G.fromJSON(data[0]["graph"]);
          });
    return G;
};

var gid = 34;

$(function() {

        //top basic example
        loadGraph("ex1", gid);

        //editable
        var G1 = loadGraph("ex2", gid);
        G1.setOption("isEditable", true);

        var G2 = loadGraph("ex3",gid);

        
        G2.setOption('vertexDrawFunction',
                    function(ctx,v,graph) {
                        ctx.beginPath();
                        ctx.fillStyle= '#0f0';
                        ctx.arc(v.x,v.y, 5,0,10,false);
                        ctx.fill();
                        ctx.closePath();
                    });
        G2.setOption('edgeDrawFunction',
                     function(ctx,e,graph) {
                         ctx.beginPath();
                         ctx.moveTo(e.v1.x, e.v1.y);
                         var ax = (e.v1.x + e.v2.x)/2;
                         var ay = (e.v1.y + e.v2.y)/2;
                        
                         ctx.quadraticCurveTo(ax,ay+20, e.v2.x, e.v2.y);
                         ctx.stroke();
                         ctx.closePath();
                     });

    });

