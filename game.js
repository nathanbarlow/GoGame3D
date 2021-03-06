
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var INTERSECTED;
var elapsedFrames = 900;
var inPlay = false //variable that switches from menu to play
var frameCount = 0;
var lineSpacingGlobal;
var controls = null;
var boardSize = 13;
var lockScreen = false;
var transitionCamera = false;
var transitionLocation = new THREE.Vector3();
var transitionSpeed = 0.03;
var transitionCameraTarget = new THREE.Vector3( 0, -200, -500 );
var materialOption = 1;

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
var lineWidth = 1; //ADJUST
var lineLengthLong = 450; //ADJUST
var lineStart = new THREE.Vector3(-225, -199, -725);

//lines material
var materialLine = new THREE.MeshStandardMaterial({
  color: 0x000000,
  roughness: 0.8,
  metalness: 0.01
});

// (lineCount, material, lineWidth, startPositionVector, length, group)
adjustBoardSize(13, materialLine, lineWidth, lineStart, lineLengthLong, goLines);

//Add GROUPS TO SCENE
scene.add(goBoard);
scene.add(selectorGroup);
scene.add(goPiecesGroup);
scene.add(goLines);

//SHADOWS
/*
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

var light3 = new THREE.SpotLight(0xFFFFFF, 4.0, 3000);
light3.position.y = 200;
light.target = mesh;
*/

//ADD EVENT LISTENERs
//gameboard interaction
window.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'mousedown', onDocumentMouseDown, false );

//menu interactions
document.getElementById("playButton").addEventListener( 'mousedown', playButtonPressed, false );
document.getElementById("ViewTopBtn").addEventListener( 'mousedown', viewTop, false );
document.getElementById("ResetGameBtn").addEventListener( 'mousedown', resetGame, false );
document.getElementById("ResetCameraBtn").addEventListener( 'mousedown', resetCamera, false );
document.getElementById("lockScreenBtn").addEventListener( 'mousedown', toggleLockScreen, false );
document.getElementById("MaterialBtn").addEventListener( 'mousedown', boardStyle, false );

//board size selection
document.getElementById("board9").addEventListener(
   'mousedown',
   btnAdjustBoardSize9,
   false
 );
document.getElementById("board13").addEventListener(
  'mousedown',
  btnAdjustBoardSize13,
  false
);
document.getElementById("board19").addEventListener(
  'mousedown',
  btnAdjustBoardSize19,
  false
);

//RENDER LOOP
requestAnimationFrame(render);

function render() {

  //Rotate arround the board when not in play
  if(inPlay == false) {
    var rotationSpeed = 0.002;
    camera.lookAt( 0, -200, -500 );
    camera.position.x = 0+ 1200 * Math.cos( rotationSpeed * elapsedFrames );
    camera.position.z = -500 + 1200 * Math.sin( rotationSpeed * elapsedFrames );
    elapsedFrames += 1;
  };

  //Transition Camera OR Allow movement controls
  if(transitionCamera == true) {
    //call function to move camera in to position
    graduallyMoveCamera(
      camera,
      transitionLocation,
      transitionCameraTarget,
      transitionSpeed);
  };

  //write the cameras position to the console every 30 frames
  // frameCount += 1
  // if (frameCount == 30) {
  //   console.log(camera.position);
  //   frameCount = 0;
  // }

  //Render scene
	renderer.render(scene, camera);
  requestAnimationFrame(render);

}
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
	meshPiece.position.set(x, -198 + zScale * (lineSpacingGlobal / 2), z);
	group.add(meshPiece);
}

function addSelectionSpot (x, y, z, group, radius){
	var geometryHighlight = new THREE.CircleGeometry(lineSpacingGlobal / 2, 20);
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
  		addSelectionSpot(INTERSECTED.position.x, -198, INTERSECTED.position.z, selectorGroup, lineSpacingGlobal / 2);
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
          lineSpacingGlobal / 2.3,
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

  //HIDE MENU
  document.getElementById("menu").style.visibility = "hidden";
  document.getElementById("inGameMenuContainer").style.visibility = "visible";

  //MOVE CAMERA
  transitionLocation.set( -700 , 200, -500 );
  transitionCamera = true;
}

function graduallyMoveCamera (camera, location, target, percentDistPerFrame) {
  //decrease or increase each vector by percentDistPerFrame until the
  //cameras position = the location specified.

  //turn off movement controls
  if (controls != null){
    controls.enabled = false;
    controls = null;
  };

  //write distance as percentage of total

  var topSpeed = 15;
  var minSpeed = 3;
  var cutoff = 3;
  var movementX = Math.max(Math.min(topSpeed, (Math.abs(camera.position.x - location.x)) * percentDistPerFrame), minSpeed);
  if (Math.abs(camera.position.x - location.x) <= cutoff){
    //if the distance to the location is less or equal to the percentDistPerFrame than
    //set the camera position to the location's position
    camera.position.x = location.x;
  } else if (camera.position.x < location.x) {
    camera.position.x += movementX;
  } else if (camera.position.x > location.x) {
    camera.position.x -= movementX;
  };

  var movementY = Math.max(Math.min(topSpeed, (Math.abs(camera.position.y - location.y)) * percentDistPerFrame), minSpeed);
  if (Math.abs(camera.position.y - location.y) <= cutoff){
    //if the distance to the location is less or equal to the percentDistPerFrame than
    //set the camera position to the location's position
    camera.position.y = location.y;
  } else if (camera.position.y < location.y) {
    camera.position.y += movementY;
  } else if (camera.position.y > location.y) {
    camera.position.y -= movementY;
  };

  var movementZ = Math.max(Math.min(topSpeed, (Math.abs(camera.position.z - location.z)) * percentDistPerFrame), minSpeed);
  if (Math.abs(camera.position.z - location.z) <= cutoff){
    //if the distance to the location is less or equal to the percentDistPerFrame than
    //set the camera position to the location's position
    camera.position.z = location.z;
  } else if (camera.position.z < location.z) {
    camera.position.z += movementZ;
  } else if (camera.position.z > location.z) {
    camera.position.z -= movementZ;
  };


  //SET CAMERA FACING
  camera.lookAt( target );

  //ONCE CAMERA POSITION = LOCATION POSITION FLIP transitionCamera VARIABLE
  if (camera.position.x == location.x && camera.position.y == location.y && camera.position.z == location.z) {
    transitionCamera = false;

    //ADD MOVEMENT CONTROLS
    //check if lockscreen is false
    if(lockScreen == false) {
      controls = new THREE.OrbitControls( camera );
      controls.target.set( 0, -200, -500 );
      controls.update();
      controls.enabled = true;
    };
  };
}

function viewTop () {
  if(lockScreen == true){
    toggleLockScreen();
  };

  //MOVE CAMERA
  controls.target.set( 0, -200, -500 );
  transitionLocation.set( -92 , 600, -500 );
  transitionCamera = true;
}

function resetGame () {
  window.location.reload();
}

function resetCamera () {
  if(lockScreen == true){
    toggleLockScreen();
  };

  //Move Camera to starting position
  controls.target.set( 0, -200, -500 );
  transitionLocation.set( -700 , 200, -500 );
  transitionCamera = true;
}

function toggleLockScreen () {

  //turn off movement controls
  if(lockScreen == false){
    if (controls != null){
      controls.enabled = false;
      controls = null;
    };
    //modify global variable
    lockScreen = true;

    document.getElementById('lockScreenBtn').innerHTML = "UnLock Screen";
  } else {
    if(controls == null) {
      controls = new THREE.OrbitControls( camera );
      controls.target.set( 0, -200, -500 );
      controls.update();
      controls.enabled = true;
    };
    //modify global variable
    lockScreen = false;

    document.getElementById('lockScreenBtn').innerHTML = "Lock Screen";
  };
}

function btnAdjustBoardSize9 (element) {
  //preventDefault
  element.preventDefault();

  //Remove Class "selected" from all buttons then add to this one
  var elem = document.getElementsByClassName("boardSizeBtn");
  for (var i = 0; i < elem.length; i++) {
    elem[i].classList.remove('selected');
  }

  document.getElementById("board9").classList.toggle('selected');

  //call adjust board function
  adjustBoardSize (9, materialLine, lineWidth, lineStart, lineLengthLong, goLines);
}

function btnAdjustBoardSize13 (element) {
  // //preventDefault
  element.preventDefault();

  //Remove Class "selected" from all buttons then add to this one
  var elem = document.getElementsByClassName("boardSizeBtn");
  for (var i = 0; i < elem.length; i++) {
    elem[i].classList.remove('selected');
  }
  document.getElementById("board13").classList.toggle('selected');

  //call adjust board function
  adjustBoardSize (13, materialLine, lineWidth, lineStart, lineLengthLong, goLines);
}

function btnAdjustBoardSize19 (element) {
  // //preventDefault
  element.preventDefault();

  //Remove Class "selected" from all buttons then add to this one
  var elem = document.getElementsByClassName("boardSizeBtn");
  for (var i = 0; i < elem.length; i++) {
    elem[i].classList.remove('selected');
  }
  document.getElementById("board19").classList.toggle('selected');

  //call adjust board function
  adjustBoardSize (19, materialLine, lineWidth, lineStart, lineLengthLong, goLines);
}

function adjustBoardSize (lineCount, material, lineWidth, startPositionVector, length, group) {
  var rows = lineCount;
  var columns = rows;
  var lineSpacingLoc = (length - lineWidth) / (rows - 1);
  lineSpacingGlobal = lineSpacingLoc;
  var lineLengthShort = lineSpacingLoc - lineWidth;
  var lineX;
  var lineY;
  var lineZ;
  var selectionSpotX;
  var selectionSpotZ;

  //DELETE CURRENT GRID
  var deleteLine = group.children;
  while (deleteLine.length > 0) {
    group.remove(deleteLine[0]);
  }

  //REMOVE SELECTION SPOTS
  var deleteSpot = selectorGroup.children;
  while (deleteSpot.length > 0) {
    selectorGroup.remove(deleteSpot[0]);
  }

  //ADD NEW GRID
  //create lines
  for ( var c = 0; c < columns; c++ ) {
  	//add long lines
  	//add geometry
  	var geometryLine = new THREE.PlaneGeometry(lineWidth, length);

  	//add mesh
  	var meshLine = new THREE.Mesh(geometryLine, material);

  	//rotate plan flat
  	meshLine.rotation.x = degToRad(-90);

  	//position mesh
  	lineX = startPositionVector.x + lineWidth / 2 + lineSpacingLoc * c;
  	lineY = startPositionVector.y;
  	lineZ = startPositionVector.z + length / 2;
  	meshLine.position.set(lineX, lineY, lineZ);

  	//add mesh to goLines group
  	group.add(meshLine);

  	//ADD SELECTION POINTS
  	for ( var r = 0; r < rows; r++ ) {
  		//r and c
  		selectionSpotX = startPositionVector.x + lineWidth / 2 + lineSpacingLoc * c;
  		selectionSpotZ = startPositionVector.z + lineWidth / 2 + lineSpacingLoc * r;
  		addSelectionSpot(selectionSpotX, -198, selectionSpotZ, selectorGroup, lineSpacingLoc / 2);
  	}

  	//ADD SHORT LINES
  	//only short lines if this is not the last line
  	if (c < columns - 1) {
  		for ( var r = 0; r < rows; r++ ) {
  			//add geometry
  			var geometryLine = new THREE.PlaneGeometry(lineLengthShort, lineWidth);

  			//add mesh
  			var meshLine = new THREE.Mesh(geometryLine, material);

  			//rotate plan flat
  			meshLine.rotation.x = degToRad(-90);

  			//position mesh
  			lineX = startPositionVector.x + lineLengthShort / 2 + lineWidth + lineSpacingLoc * c;
  			lineY = startPositionVector.y;
  			lineZ = startPositionVector.z + lineWidth / 2 + lineSpacingLoc * r;
  			meshLine.position.set(lineX, lineY, lineZ);

  			//add mesh to goLines group
  			group.add(meshLine);
  		}
  	};
  }

}

function boardStyle () {



  if(materialOption == 1){
    var boardWoodMaterial = new THREE.MeshLambertMaterial({
    	color: 0xffffff,
    	envMap: textureCube,
    	combine: THREE.MixOperation,
    	reflectivity: 0.1,
    	map: new THREE.TextureLoader().load('wood.jpg'),
    });
    boardMesh.material = boardWoodMaterial;
    materialOption += 1;

  } else if (materialOption == 2) {
    var boardDarkWoodMaterial = new THREE.MeshLambertMaterial({
    	color: 0xffffff,
    	envMap: textureCube,
    	combine: THREE.MixOperation,
    	reflectivity: 0.1,
    	map: new THREE.TextureLoader().load('darkWood.jpg'),
    });
    boardMesh.material = boardDarkWoodMaterial;
    materialOption += 1;

  } else if (materialOption == 3) {
    var boardSlateMaterial = new THREE.MeshLambertMaterial({
    	color: 0xffffff,
    	map: new THREE.TextureLoader().load('slate.jpg'),
      bumpMap: new THREE.TextureLoader().load('slate.jpg'),
    });
    boardMesh.material = boardSlateMaterial;
    materialOption += 1;

  } else if (materialOption == 4) {
    boardMesh.material = boardMaterial;
    materialOption = 1;
  }


}
