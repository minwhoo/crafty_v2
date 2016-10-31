const BLOCK_TEXT_STYLE = {font: "16px Helvetica", fill: "white"};
const BLOCK_TEXT_MARGIN = {top: 10, left: 10, right: 10, bottom: 10};
const BLOCK_STYLE = {color: 0x2763c4, opacity: 1, cornerRadius: 10};
const PARAMETER_BLOCK_STYLE = {color: 0x6691d6, opacity: 1, cornerRadius: 10};
const LINE_STYLE = {color: 0xFFFFFF, width: 3, spacing: 2, bezierHScale: 0.1, bezierVScale: 0.5};
const BLOCK_MARGIN = {height: 10, width: 100};

function BlockInfo(name, type, parameters = [], library = "", docstring = "") {
    this.name = name;
    this.type = type;
    this.parameters = parameters;
    this.docstring = docstring;
    this.library = library;
}

var blockType = {function: 0, constant: 1, parameter: 2};

function Block(blockInfo, childBlocks,parentBlock=null) {
    PIXI.Container.call(this);
    this.blockInfo = blockInfo;
    this.childBlocks = childBlocks || [];
    this.parentBlock = parentBlock; // maybe not needed
    this.parameterBlocks = [];
    this.lines = [];

    this.initialize();

    console.log(this.blockInfo.name + " created!");
}
Block.prototype = Object.create(PIXI.Container.prototype);

Block.prototype.initialize = function() {
    //  Crate text and set style
    var text = new PIXI.Text(
        this.blockInfo.name,
        BLOCK_TEXT_STYLE
    );
    text.position.set(BLOCK_TEXT_MARGIN.top,BLOCK_TEXT_MARGIN.left);

    //  Create block graphics and set style
    var blockGraphics = new PIXI.Graphics();
    if (this.blockInfo.type == blockType.parameter) { // if block is parameter, apply different style
        blockGraphics.beginFill(PARAMETER_BLOCK_STYLE.color, PARAMETER_BLOCK_STYLE.opacity);
    } else {
        blockGraphics.beginFill(BLOCK_STYLE.color, BLOCK_STYLE.opacity);
    }
    blockGraphics.drawRoundedRect(0,0,text.width + BLOCK_TEXT_MARGIN.left + BLOCK_TEXT_MARGIN.right, text.height + BLOCK_TEXT_MARGIN.top + BLOCK_TEXT_MARGIN.bottom, BLOCK_STYLE.cornerRadius);
    blockGraphics.endFill();

    //  Add PIXI Objects to parent container
    this.addChild(blockGraphics);
    this.addChild(text);

    //  Create and store parameter blocks with parameterName
    for (var i=0;i<this.blockInfo.parameters.length;i++) {
        var parameterBlockInfo = new BlockInfo(this.blockInfo.parameters[i],blockType.parameter);
        var newBlock = new Block(parameterBlockInfo);
        this.parameterBlocks.push(newBlock);
    }

    //  Make children list of null blocks
    if (this.childBlocks.length == 0) {
        this.childBlocks = new Array(this.parameterBlocks.length);
    }

    //  render self
    this.render();

    //  enable drag and drop for non-parameter blocks
    if (this.blockInfo.type != blockType.parameter) {
        this.enableDragAndDrop();
    }
}

//** render: adds child blocks and draws lines
Block.prototype.render = function() {
    var blockHeight = this.getChildAt(0).height;
    var lineStartPosition = new PIXI.Point(this.width, this.height/2 - (LINE_STYLE.width + LINE_STYLE.spacing)*this.childBlocks.length/2);
    var childBlockPosition = new PIXI.Point(this.width + BLOCK_MARGIN.width, 0);

    //  for each parameter/branch, draw line and place block
    for (var i=0;i < this.parameterBlocks.length; i++) {
        //  set line end position and draw line
        var lineEndPosition = new PIXI.Point(childBlockPosition.x, childBlockPosition.y + blockHeight/2);
        if (i==0) { // for case 0, make line straight
            lineEndPosition.y = lineStartPosition.y;
        }
        var curve = drawBezierCurve(lineStartPosition,lineEndPosition);
        this.addChild(curve);

        //  parameter block: set position and add
        this.parameterBlocks[i].position = childBlockPosition;
        this.addChild(this.parameterBlocks[i]);

        //  child block: set position and add, make parameterBlock invisible
        if (this.childBlocks[i] != null) {
            this.childBlocks[i].position = childBlockPosition;
            this.addChild(this.childBlocks[i]);
            this.parameterBlocks[i].visible = false;
        }

        //  increment lineStartPositon and childBLockPosition
        lineStartPosition.y += LINE_STYLE.width + LINE_STYLE.spacing;
        childBlockPosition.y += BLOCK_MARGIN.height + this.getChildAt(this.children.length-1).height;
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

function setParentInteractivity(block, bool) {
    var parent = block.parent;
    while (parent !== null) {
        parent.interactive = bool;
        parent = parent.parent;
    }
}

Block.prototype.enableDragAndDrop = function() {
    console.log("DragAndDrop: ")
    this.hitArea = new PIXI.Rectangle(0,0,this.getChildAt(0).width,this.getChildAt(0).height);
    this.interactive = true;
    this.buttonMode = true;
    this
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
