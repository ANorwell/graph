
//the actual canvas object
var gCanvas;

//server URI where graphs are saved.
var gServer = "http://anorwell.com/content.py";

var gCurrentUrl;

function setup(canvas) {
    G = new Graph(canvas);
    G.setOption('isEditable', true);
    gCanvas = canvas;
    init(G);
    
    //if there is a gid param, load that graph.

    var urlParts = parseURL();
    gCurrentUrl = urlParts[0];
    var params = urlParts[1];
    if ("gid" in params) {
        //if we're loading a graph, don't show instructions.
        $("#usedialog").dialog("destroy");
        $("#graph").unbind('click');
        
        $.get(gServer,
              {type:"graph", id: params["gid"]},
              function(data) {
                  G.fromJSON(data[0]["graph"]);
              });
    }

    onResize();
};

//resize function
var onresizeOld = window.onresize;
window.onresize = function() {
    if (onresizeOld) {
        onresizeOld();
    }
    onResize();
};


//run js to init the view, which depends on the
//html page (jqueryui)
function init(graph) {
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
                        graph.save(name);
                    }
                    $(this).dialog('close');
                },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
            }
        });

    $("#loaddialog").dialog({
        autoOpen: false,
                modal: true,
                width: 350,
                open: function() {
                $("#load_buttonset").empty();

                var graphs = graph.getSavedGraphsList();

                for (var i=0; i<graphs.length; i++) {
                    var name = graphs[i];
                    $("#load_buttonset").append(
                        '<input type="radio" id="load' + name + '" value="' + name + '" name="load_button" /><label for="' + name + '">' + name +'</label><br/>' );
                }
            },
                
                buttons: {
                'Load': function() {
                    var name = $('input:checked', '#loadform').val();
                        graph.load(name);
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
                        setOption(graph,name);
                    }
                    $(this).dialog('close');
                },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
                }
            });

        $("#sharedialog").dialog({
            autoOpen: false,
                    modal: true,
                    width: 450,
                    buttons: {
                    'OK': function() {
                        $(this).dialog('close');
                    }
                }
            });


};

function saveButton() {
    $("#savedialog").dialog('open');
};

function loadButton() {
    $("#loaddialog").dialog('open');
};

function optionsButton() {
    $("#optionsdialog").dialog('open');
};

function shareButton(graph) {
    var json = graph.toJSON();
    $.post(gServer, {graph: json}, function(gid) {
            gid = gid.replace(/\r?\n$/, "");
            var shareUrl = "http://anorwell.com/graph/?gid=" + gid;
            $("#shareUrl").text(shareUrl);
            $("#sharedialog").dialog('open');
        });
}


function setOption(graph,name) {
    //currently only physics option
    graph.setOption('physics',name);
};

function onResize() {
    gCanvas.width = $(window).width();
    gCanvas.height = $(window).height() - $("#footer").height();
};




//helper to get param pairs from query string
function parseURL() {
    var params = {};
    var url = window.location.href;

    if (url.match(/\?/)) {
        var base = url.match(/^(.*)\?/)[1];
        var pairs = url.replace(/#.*$/, '').replace(/^.*\?/, '').split(/[&;]/);
        for (var p in pairs) {
            var keyPair = pairs[p].split(/=/);
            params[keyPair[0]] = keyPair[1];
        }
    }
    return [base, params];
}

