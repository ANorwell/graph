
//The parent of the canvas elt, used for finding
//the canvas size
var gParent;

//should the canvas be resized to fit the window?
var gFullscreen = true;

var gCanvas;

function setup(canvas) {
    G = new Graph(canvas);
    gCanvas = canvas;
    init(G);
}

//resize function
var onresizeOld = window.onresize;
window.onresize = function() {
    if (onresizeOld) {
        onresizeOld();
    }
    onResize(gParent);
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

function setOption(graph,name) {
    //currently only physics option
    graph.setOption('physics',name);
};

//ONRESIZE
function onResize(parent) {

    if (gFullscreen) {
        gCanvas.width = $(window).width();
        gCanvas.height = $(window).height() - $("#footer").height();

    } else {
        gCanvas.width = parent.offsetWidth;
    }
};
