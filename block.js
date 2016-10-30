const BLOCK_TEXT_STYLE = {font: "16px Helvetica", fill: "white"};
const BLOCK_TEXT_MARGIN = {top: 10, left: 10, right: 10, bottom: 10};
const BLOCK_STYLE = {color: 0xFFFF0B, opacity: 0.5, cornerRadius: 10};
const LINE_STYLE = {color: 0xFFFFFF, width: 3, spacing: 2, bezierHScale: 0.1, bezierVScale: 0.5};
const BLOCK_MARGIN = {v: 10, h: 100};

function BlockInfo(name, type, parameters = [], docstring = "", library = "") {
    this.name = name;
    this.type = type;
    this.parameters = parameters;
    this.docstring = docstring;
    this.library = library;
}

var blockType = {function: 0, constant: 1, parameter: 2};

function Block(blockInfo, children=[]) {
    this.blockInfo = blockInfo;
    this.children = children;
    this.lines = [];

    this.initialize();

    if (this.children.length > 0) {
        this.render();
    }

    this.enableDragAndDrop();
}

Block.prototype.render = function() {
    var startX = this.container.width;
    var startY = this.container.height/2 - (LINE_STYLE.width + LINE_STYLE.spacing)*this.children.length/2;
    var accumulatedHeight = 0;
    for (i=0;i < this.children.length;i++) {
        if (typeof this.children[i] ==  "string") {
            //  create prototype block
            var childBlock = new Block(this.children[i]);
        }
        else {
            //  use existing block
            var childBlock = this.children[i];
        }

        var sP = new PIXI.Point(startX,startY+i*(LINE_STYLE.width + LINE_STYLE.spacing));
        var eP = new PIXI.Point(startX + BLOCK_MARGIN.h, accumulatedHeight+this.blockGraphics.height/2);
        // for middle point
        // var eP = new PIXI.Point(startX + BLOCK_MARGIN.h, accumulatedHeight+childBlock.container.height/2);
        if (i==0) {
            eP.y = sP.y;
        }
        console.log("(" + sP.x + "," + sP.y + ")");
        console.log("(" + eP.x + "," + eP.y + ")");
        var curve = drawBezierCurve(sP,eP);
        this.container.addChild(curve);

        childBlock.container.position.set(startX + BLOCK_MARGIN.h,accumulatedHeight);
        accumulatedHeight += childBlock.container.height + BLOCK_MARGIN.v;
        this.container.addChild(childBlock.container);
    }

    function drawBezierCurve(startPosition,endPosition) {
        var curve = new PIXI.Graphics().lineStyle(LINE_STYLE.width,LINE_STYLE.color);

        var width = endPosition.x - startPosition.x;
        var height = endPosition.y - startPosition.y;
        var midPosition = new PIXI.Point(startPosition.x + width/2, startPosition.y + height/2);

        curve.moveTo(startPosition.x, startPosition.y);
        curve.bezierCurveTo(
            startPosition.x + LINE_STYLE.bezierHScale*width,
            startPosition.y,
            midPosition.x,
            midPosition.y - LINE_STYLE.bezierVScale*height,
            midPosition.x,
            midPosition.y);
        curve.bezierCurveTo(
            midPosition.x,
            midPosition.y + LINE_STYLE.bezierVScale*height,
            endPosition.x - LINE_STYLE.bezierHScale*width,
            endPosition.y,
            endPosition.x,
            endPosition.y);
        return curve;
    }
}

Block.prototype.initialize = function() {
    //  Set block text style
    this.text = new PIXI.Text(
        this.blockInfo.name,
        BLOCK_TEXT_STYLE
    );
    this.text.position.set(BLOCK_TEXT_MARGIN.top,BLOCK_TEXT_MARGIN.left);

    //  Set block Graphics style
    this.blockGraphics = new PIXI.Graphics();
    //  this.blockGraphics.lineStyle(0);
    this.blockGraphics.beginFill(BLOCK_STYLE.color, BLOCK_STYLE.opacity);
    this.blockGraphics.drawRoundedRect(0,0,this.text.width + BLOCK_TEXT_MARGIN.left + BLOCK_TEXT_MARGIN.right, this.text.height + BLOCK_TEXT_MARGIN.top + BLOCK_TEXT_MARGIN.bottom, BLOCK_STYLE.cornerRadius);
    this.blockGraphics.endFill();

    //  Add PIXI Objects to parent container
    this.container = new PIXI.Container();
    this.container.addChild(this.blockGraphics)
    this.container.addChild(this.text) 
}

function setParentInteractivity(container, bool) {
    var parent = container.parent;
    while (parent !== null) {
        parent.interactive = bool;
        parent = parent.parent;
    }
}

Block.prototype.enableDragAndDrop = function() {
    this.container.interactive = true;
    this.container 
        .on('mousedown', onDragStart)
        .on('touchstart', onDragStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        .on('touchendoutside', onDragEnd)
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove);

    function onDragStart(event)
    {
        setParentInteractivity(this,false);
        let mouseStartPosition = event.data.getLocalPosition(this.parent);

        /*
        this.placeholderBlock = new Block("condition");
        this.placeholderBlock.container.position = this.position;
        this.parent.addChildAt(this.placeholderBlock, this.parent.getChildIndex(this));
        */
        console.log(this.parent.children.length);
        console.log(this.parent.getChildIndex(this));
        console.log("Drag started for (" + this.position.x + "," + this.position.y + ")");
        this.data = event.data;
        this.diff = new PIXI.Point(mouseStartPosition.x - this.position.x, mouseStartPosition.y - this.position.y);
        this.alpha = 0.5;
        this.dragging = true;
    }

    function onDragEnd()
    {
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
        this.placeholderBlock = null;
        setParentInteractivity(this,true);
    }

    function onDragMove()
    {
        if (this.dragging)
        {
            var newPosition = this.data.getLocalPosition(this.parent);
            console.log("newPosition (" + newPosition.x + "," + newPosition.y + ")");
            console.log("blockDimension (" + this.width + "," + this.height + ")");
            console.log("Childrens: " + this.getChildAt(0).width);
            this.position.x = newPosition.x - this.diff.x;
            this.position.y = newPosition.y - this.diff.y;
        }
    }
}
