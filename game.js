
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var INTERSECTED;
var elapsedFrames = 900;
var inPlay = false //variable that switches from menue to play

//RENDERER
var renderer = new THREE.WebGLRenderer({canvas: document.getElementById('myCanvas'), antialias: true});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor('black');

//SCENE
scene = new THREE.Scene();

//GROUP CREATION
var goBoard = new THREE.Group();
var selectorGroup = new THREE.Group();
var goPiecesGroup = new THREE.Group();

//COLOR TRACKER
var colorTracker = 0x000000;

//DEFINE TEXTURES
var marbelTex = new THREE.TextureLoader().load('marbel.jpg');

//LIGHTING
var light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

var light1 = new THREE.PointLight(0xffffff, 0.8);
scene.add(light1);
light1.position.set(500, 200, -500);

var light2 = new THREE.PointLight(0xffffff, 0.5);
scene.add(light2);
light2.position.set(-500, 200, -500);

//SKYBOX
var textureCube = new THREE.CubeTextureLoader()
		.setPath( 'skybox/')
		.load( [ 'morning_ft.jpg', 'morning_bk.jpg', 'morning_up.jpg', 'morning_dn.jpg', 'morning_rt.jpg', 'morning_lf.jpg' ] );
scene.background = textureCube;

//CAMERA
camera = new THREE.PerspectiveCamera( 45.0, window.innerWidth / window.innerHeight, 0.1, 10000 );
camera.position.set( -100, 0, 500 );

/*
//MOVEMENT CONTROLS
var controls = new THREE.OrbitControls( camera );
controls.target.set( 0, -200, -500 );
controls.update();
*/

//GO BOARD BASE
var boardZ = 500;
var boardX = boardZ;
var boardY = 100;
var boardGeometry = new THREE.BoxGeometry(boardX, boardY, boardZ);
var boardMaterial = new THREE.MeshLambertMaterial({
	color: 0xffffff,
	envMap: textureCube,
	combine: THREE.MixOperation,
	reflectivity: 0.4,
	map: new THREE.TextureLoader().load('marbel.jpg'),
	//bumpMap: new THREE.TextureLoader().load('marbel.jpg'),
	//bumpScale: 1,
});
var boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
boardMesh.position.set(0, -200 - boardY / 2, -500);
goBoard.add( boardMesh );


//GO BOARD LINES
var goLines = new THREE.Group();
var rows = 9; //ADJUST
var columns = rows;
var lineWidth = 1; //ADJUST
var lineLengthLong = 450; //ADJUST
var lineSpacing = (lineLengthLong - lineWidth) / (rows - 1);
var lineLengthShort = lineSpacing - lineWidth;
var lineStartX = -225; //ADJUST
var lineStartY = -199; //ADJUST
var lineStartZ = -725; //ADJUST
var lineX;
var lineY;
var lineZ;
var selectionSpotX;
var selectionSpotZ;

//lines material
var materialLine = new THREE.MeshStandardMaterial({
	color: 0x000000,
	roughness: 0.8,
	metalness: 0.01
});

//create lines
for ( var c = 0; c < columns; c++ ) {
	//add long lines
	//add geometry
	var geometryLine = new THREE.PlaneGeometry(lineWidth, lineLengthLong);

	//add mesh
	var meshLine = new THREE.Mesh(geometryLine, materialLine);

	//rotate plan flat
	meshLine.rotation.x = degToRad(-90);

	//position mesh
	lineX = lineStartX + lineWidth / 2 + lineSpacing * c;
	lineY = lineStartY;
	lineZ = lineStartZ + lineLengthLong / 2;
	meshLine.position.set(lineX, lineY, lineZ);

	//add mesh to goLines group
	goLines.add(meshLine);

	//ADD SELECTION POINTS
	for ( var r = 0; r < rows; r++ ) {
		//r and c
		selectionSpotX = lineStartX + lineWidth / 2 + lineSpacing * c;
		selectionSpotZ = lineStartZ + lineWidth / 2 + lineSpacing * r;
		addSelectionSpot(selectionSpotX, -198, selectionSpotZ, selectorGroup, lineSpacing / 2);
	}

	//ADD SHORT LINES
	//only short lines if this is not the last line
	if (c < columns - 1) {
		for ( var r = 0; r < rows; r++ ) {
			//add geometry
			var geometryLine = new THREE.PlaneGeometry(lineLengthShort, lineWidth);

			//add mesh
			var meshLine = new THREE.Mesh(geometryLine, materialLine);

			//rotate plan flat
			meshLine.rotation.x = degToRad(-90);

			//position mesh
			lineX = lineStartX + lineLengthShort / 2 + lineWidth + lineSpacing * c;
			lineY = lineStartY;
			lineZ = lineStartZ + lineWidth / 2 + lineSpacing * r;
			meshLine.position.set(lineX, lineY, lineZ);

			//add mesh to goLines group
			goLines.add(meshLine);
		}
	};
}

//add goLines to scene
scene.add(goLines);

//Add GROUPS TO SCENE
scene.add(goBoard);
scene.add(selectorGroup);
scene.add(goPiecesGroup);

//SHADOWS
/*
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

var light3 = new THREE.SpotLight(0xFFFFFF, 4.0, 3000);
light3.position.y = 200;
light.target = mesh;
*/


//ADD EVENT LISTENERs
window.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'mousedown', onDocumentMouseDown, false );
document.getElementById("playButton").addEventListener( 'mousedown', playButtonPressed, false )

//RENDER LOOP
requestAnimationFrame(render);

function addPiece (x, z, radius, colorHex, group) {
  //DEFINE GAME PIECE
	var geometryPiece = new THREE.SphereGeometry(radius, 20, 20);
	var zScale = 0.2;
	geometryPiece.scale(1, zScale, 1);
	var materialPiece = new THREE.MeshStandardMaterial({
		color: colorHex,
		map: marbelTex,
		roughness: 0.3,
		metalness: 0.01
	});
	var meshPiece = new THREE.Mesh(geometryPiece, materialPiece);
	meshPiece.position.set(x, -198 + zScale * (lineSpacing / 2), z);
	group.add(meshPiece);
}

function addSelectionSpot (x, y, z, group, radius){
	var geometryHighlight = new THREE.CircleGeometry(lineSpacing / 2, 20);
  var materialHighlight = new THREE.MeshLambertMaterial({
		color: 0xb3e6ff,
		side: THREE.FrontSide,
		transparent: true,
		opacity: 0.0,
		emissive: 0.5

	});
  var meshHighlight = new THREE.Mesh(geometryHighlight, materialHighlight);
  meshHighlight.position.set(x, y, z);
	meshHighlight.rotation.x = degToRad(-90);
	group.add( meshHighlight );
}

function onDocumentMouseDown (element) {
	//on click send out ray from camera and check to see if it hits one of the
	//items in group selectorGroup
	element.preventDefault();
  if(inPlay == true) {
    // update the picking ray with the camera and mouse position
  	raycaster.setFromCamera( mouse, camera );

  	//FOR REMOVING PIECE FROM BOARD
  	var intersects = raycaster.intersectObjects( goPiecesGroup.children );
  	if ( intersects.length > 0 ) {
  		INTERSECTED = intersects[ 0 ].object;
  		goPiecesGroup.remove(INTERSECTED);

  		//Add selection Spot in place of Tile
  		addSelectionSpot(INTERSECTED.position.x, -198, INTERSECTED.position.z, selectorGroup, lineSpacing / 2);
  	};

  	//FOR ADDING PIECE TO BOARD
  	var intersects = raycaster.intersectObjects( selectorGroup.children );
  	if ( intersects.length > 0 ) {
  	//Do this on click of object within selectorGroup
  		INTERSECTED = intersects[ 0 ].object;

  		//add piece to board
  		addPiece(
          INTERSECTED.position.x,
          INTERSECTED.position.z,
          lineSpacing / 2.3,
          colorTracker,
          goPiecesGroup
      );

  		//Togle between white and black color
  		if (colorTracker == 0x000000){
  			colorTracker = 0xffffff;
  		} else {
  			colorTracker = 0x000000;
  		};

  		//Remove selector spot from board
  		selectorGroup.remove(INTERSECTED);
  	};
  };
}

function render() {

  if(inPlay == false) {
    var rotationSpeed = 0.002;
    camera.lookAt( 0, -200, -500 );
    camera.position.x = 0+ 1200 * Math.cos( rotationSpeed * elapsedFrames );
    camera.position.z = -500 + 1200 * Math.sin( rotationSpeed * elapsedFrames );
    elapsedFrames += 1;
  };



	renderer.render(scene, camera);
  requestAnimationFrame(render);

}

function degToRad (numb) {
  return numb * Math.PI / 180
}

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  if(inPlay == true) {
    //UPDATE SELECTION
  	// update the picking ray with the camera and mouse position
  	raycaster.setFromCamera( mouse, camera );

  	// calculate objects intersecting the picking ray
  	var intersects = raycaster.intersectObjects( selectorGroup.children );

  	if ( intersects.length > 0 ) { //if objects are hovered over then do this

  		if ( INTERSECTED != intersects[ 0 ].object ) { //make INTERSECTED isn't already asigned to this object

  			if ( INTERSECTED ) INTERSECTED.material.opacity = INTERSECTED.currentOpacity ; //Do if intersected not equal to null

  			INTERSECTED = intersects[ 0 ].object; //set INTERSECTED to first object pointed at
  			INTERSECTED.currentOpacity = INTERSECTED.material.opacity; //used to hold value of moused over object
  			INTERSECTED.material.opacity = 0.7; //temporairily set value to this.

  		}

  	} else { //if nothing hovered over set INTERSECTED to null

  		if ( INTERSECTED ) INTERSECTED.material.opacity = INTERSECTED.currentOpacity; //used to reassign previous value

  		INTERSECTED = null;

  	}
  };
}

function playButtonPressed () {
  //UPDATE VARIABLE
  inPlay = true;

  //ADD MOVEMENT CONTROLS
  var controls = new THREE.OrbitControls( camera );
  controls.target.set( 0, -200, -500 );
  controls.update();

  //HIDE MENUE
  
}
