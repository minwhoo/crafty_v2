function CraftyCanvas(xScale=1,xConstant=0,yScale=1,yConstant=0) {
    renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor: 0xCCCCCC, antialias: true });
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.view.id = "crafty-canvas";
    renderer.autoResize = true;
    renderer.resize(xScale*window.innerWidth + xConstant,yScale*window.innerHeight + yConstant);

    var stage = new PIXI.Container();
    stage.id = "stage";
    renderer.render(stage); // remove black flash
    stage.interactive = false;

    let SIDEBAR_STYLE = {width:200, backgroundColor:0xEEEEEE, };

    PIXI.loader
        .add("images/background-tile.png")
        .load(setup);

    function setup() {
        //  create and add background tile pattern
        var backgroundTile = new PIXI.extras.TilingSprite(
            PIXI.loader.resources["images/background-tile.png"].texture,
            17,
            17
        );
        backgroundTile.width = renderer.width;
        backgroundTile.height = renderer.height;
        stage.addChild(backgroundTile);

        //  create and add sidebar
        var sidebar = new PIXI.Container();
        sidebar.id = "sidebar";
        var sidebarBackground = new PIXI.Graphics();
        sidebarBackground.beginFill(SIDEBAR_STYLE.backgroundColor,1);
        sidebarBackground.drawRect(0,0,SIDEBAR_STYLE.width, renderer.height);
        sidebarBackground.endFill();
        sidebar.addChild(sidebarBackground);
        stage.addChild(sidebar);

        initializeBlockLibrary(sidebar);

        //  resize renderer, sidebar, backgroundTile when window is resized
        window.addEventListener('resize', function(event){
            renderer.resize(xScale*window.innerWidth + xConstant,yScale*window.innerHeight + yConstant);
            backgroundTile.width = renderer.width;
            backgroundTile.height = renderer.height;
            sidebarBackground.height = renderer.height;
        });

        //  render animation
        animate();

        function animate() {
            renderer.render(stage);
            requestAnimationFrame( animate );
        }
    }
    return renderer.view;
}
