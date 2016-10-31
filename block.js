const BLOCK_TEXT_STYLE = {font: "16px Helvetica", fill: "white"};
const BLOCK_TEXT_MARGIN = {top: 10, left: 10, right: 10, bottom: 10};
const BLOCK_STYLE = {color: 0x2763c4, opacity: 1, cornerRadius: 10};
const PARAMETER_BLOCK_STYLE = {color: 0x6691d6, opacity: 1, cornerRadius: 10};
const LINE_STYLE = {color: 0xFFFFFF, width: 3, spacing: 2, bezierHScale: 0.1, bezierVScale: 0.5};
const BLOCK_MARGIN = {v: 10, h: 100};

function BlockInfo(name, type, parameters = [], library = "", docstring = "") {
    this.name = name;
    this.type = type;
    this.parameters = parameters;
    this.docstring = docstring;
    this.library = library;
}

var blockType = {function: 0, constant: 1, parameter: 2};

function Block(blockInfo, children=[],parent=null) {
    this.blockInfo = blockInfo;
    this.children = children;
    this.parent = parent;
    this.parameterBlocks = [];
    this.container = new PIXI.Container();
    this.lines = [];

    this.initialize();

    console.log(this.blockInfo.name + " created!");
}

Block.prototype.initialize = function() {
    //  Crate text and set style
    var text = new PIXI.Text(
        this.blockInfo.name,
        BLOCK_TEXT_STYLE
    );
    text.position.set(BLOCK_TEXT_MARGIN.top,BLOCK_TEXT_MARGIN.left);

    //  Set block Graphics style
    var blockGraphics = new PIXI.Graphics();
    //  this.blockGraphics.lineStyle(0);
    if (this.blockInfo.type == blockType.parameter) {
        blockGraphics.beginFill(PARAMETER_BLOCK_STYLE.color, PARAMETER_BLOCK_STYLE.opacity);
    } else {
        blockGraphics.beginFill(BLOCK_STYLE.color, BLOCK_STYLE.opacity);
    }
    
    blockGraphics.drawRoundedRect(0,0,text.width + BLOCK_TEXT_MARGIN.left + BLOCK_TEXT_MARGIN.right, text.height + BLOCK_TEXT_MARGIN.top + BLOCK_TEXT_MARGIN.bottom, BLOCK_STYLE.cornerRadius);
    blockGraphics.endFill();

    //  Add PIXI Objects to parent container
    this.container.addChild(blockGraphics);
    this.container.addChild(text);

    //  Create and store parameter blocks
    for (var i=0;i<this.blockInfo.parameters.length;i++) {
        var parameterBlockInfo = new BlockInfo(this.blockInfo.parameters[i],blockType.parameter);
        var newBlock = new Block(parameterBlockInfo);
        this.parameterBlocks.push(newBlock);
    }

    //  Make children list of null blocks
    if (this.children.length == 0) {
        this.children = new Array(this.parameterBlocks.length);
    }

    //  render self
    this.render();

    //  enable drag and drop for non-parameter blocks
    if (this.blockInfo.type != blockType.parameter) {
        this.enableDragAndDrop();
    }
}

Block.prototype.render = function() {
    var startX = this.container.width;
    var startY = this.container.height/2 - (LINE_STYLE.width + LINE_STYLE.spacing)*this.children.length/2;
    var accumulatedHeight = 0;

    //  for each parameter/branch, place block and draw line
    for (var i=0;i < this.parameterBlocks.length; i++) {
        if (this.children[i] == null) {
            var childBlock = this.parameterBlocks[i];
        } else {
            var parameterBlock = this.parameterBlocks[i];
            var childBlock = this.children[i];
        }

        var sP = new PIXI.Point(startX,startY+i*(LINE_STYLE.width + LINE_STYLE.spacing));
        var eP = new PIXI.Point(startX + BLOCK_MARGIN.h, accumulatedHeight+this.container.getChildAt(0).height/2);
        // for middle point
        // var eP = new PIXI.Point(startX + BLOCK_MARGIN.h, accumulatedHeight+childBlock.container.height/2);
        //  to make first curve a straight line
        if (i==0) {
            eP.y = sP.y;
        }
        var curve = drawBezierCurve(sP,eP);
        this.container.addChild(curve);

        childBlock.container.position.set(startX + BLOCK_MARGIN.h,accumulatedHeight);
        if (this.children[i] != null) {
            parameterBlock.container.position.set(startX + BLOCK_MARGIN.h,accumulatedHeight);
            this.container.addChild(parameterBlock.container);
            parameterBlock.container.visible = false;
        }
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

function setParentInteractivity(container, bool) {
    var parent = container.parent;
    while (parent !== null) {
        parent.interactive = bool;
        parent = parent.parent;
    }
}

Block.prototype.enableDragAndDrop = function() {
    console.log("DragAndDrop: ")
    this.container.hitArea = new PIXI.Rectangle(0,0,this.container.getChildAt(0).width,this.container.getChildAt(0).height);
    this.container.interactive = true;
    this.container.buttonMode = true;
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
        //  turn off drag call to parent containers
        setParentInteractivity(this,false);

        //  turn on visibility for placeholderBlock
        if (this.parent.parent != null) {
            var idx = this.parent.getChildIndex(this);
            this.placeholder = this.parent.getChildAt(idx-1);
            this.placeholder.visible = true;
            console.log("placeholder position: ");
            console.log(this.placeholder.position);
        } else {
            this.placeholder = null;
        }

        this.data = event.data;
        let mouseStartPosition = event.data.getLocalPosition(this.parent);
        this.diff = new PIXI.Point(mouseStartPosition.x - this.position.x, mouseStartPosition.y - this.position.y);
        this.originalPosition = new PIXI.Point(this.position.x,this.position.y);
        console.log("original position: ");
        console.log(this.originalPosition);

        //this.alpha = 0.5;
        this.dragging = true;
    }

    function onDragEnd()
    {
        //  check if block in its original place
        if (this.placeholder !== null) {
            //  check if newPosition is out of bounds of rectangle
            var finalPosition = this.data.getLocalPosition(this.parent);
            var localRect = this.placeholder.getBounds();
            localRect.x = this.placeholder.position.x;
            localRect.y = this.placeholder.position.y;

            //if (this.placeholder.getBounds().contains(finalPosition.x,finalPosition.y)) {
            if (localRect.contains(finalPosition.x,finalPosition.y)) {
                this.placeholder.visible = false;
                this.position = this.originalPosition;
            } else {
                console.log("TODO: child.removeFromParent");
            }
        }

        this.alpha = 1;
        this.dragging = false;
        this.data = null;
        this.placeholderBlock = null;
        setParentInteractivity(this,true);
    }


    function onDragMove(e)
    {
        setParentInteractivity(this,false);
        var newPosition = e.data.getLocalPosition(this.parent);
        if (this.dragging)
        {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x - this.diff.x;
            this.position.y = newPosition.y - this.diff.y;
        }
        if (this.getBounds().contains(newPosition.x,newPosition.y)) {
            console.log("mouse moved with " + this.width);
        }
        setParentInteractivity(this,true);
    }
}

function isIntersecting(r1, r2) {
    return !(r2.x > (r1.x + r1.width) || 
           (r2.x + r2.width) < r1.x || 
           r2.y > (r1.y + r1.height) ||
           (r2.y + r2.height) < r1.y);
}
