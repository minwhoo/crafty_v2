function CraftyCanvas(window) {
    var renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor: 0xCCCCCC, antialias: true });
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;
    renderer.resize(window.innerWidth, window.innerHeight);

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
        backgroundTile.width = window.innerWidth;
        backgroundTile.height = window.innerHeight;
        stage.addChild(backgroundTile);


        //  create and add sidebar
        var sidebar = new PIXI.Graphics();
        sidebar.id = "sidebar";
        sidebar.beginFill(SIDEBAR_STYLE.backgroundColor,1);
        sidebar.drawRect(0,0,SIDEBAR_STYLE.width, window.innerHeight);
        sidebar.endFill();
        stage.addChild(sidebar);

        initializeBlockLibrary(sidebar);

        //  resize renderer, sidebar, backgroundTile when window is resized
        window.addEventListener('resize', function(event){
            backgroundTile.width = window.innerWidth;
            backgroundTile.height = window.innerHeight;
            sidebar.height = window.innerHeight;
            renderer.resize(window.innerWidth, window.innerHeight);
        });

        //  render animation
        animate();

        function animate() {
            renderer.render(stage);
            requestAnimationFrame( animate );
        }
    }
    return renderer.view
}
