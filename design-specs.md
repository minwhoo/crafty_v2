**blockInfo**
properties
 - name
 - type
 - parameters and parameter names
 - library
methods
 - import

**block**
properties
 - blockInfo
 - PIXIcontainer
  - PIXItext
  - PIXIgraphics
 - parent
 - children
 - parameterBlocks
 - lines
methods
 - initialize
 - render: only redraw self
 - update: render self and update children
 - _drawParameterBlocks
 ```
 if (children[i] == null) {
   parameterBlocks[i].visible = true;
 }
 ```



blockGraphics =
 - PIXI container
 - PIXI text
 - PIXI box
 - PIXI lines

**blockLibrary**
methods
 - search(blockName) return blockInfo
