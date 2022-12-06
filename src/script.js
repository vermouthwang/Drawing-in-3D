import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry';
import { BoxGeometry, Material, Object3D, Scene } from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import gsap from 'gsap'

const container = document.getElementById( 'container' );
const container1 = document.getElementById( 'container1' );
const container2 = document.getElementById( 'container2' );


/**
 * palace
 */
if (container !== null){
	let renderer, scene, camera, stats;
	let mesh;
	let mesh1;
	let raycaster;
	let line;
	const gui = new dat.GUI()

	const intersection = {
		intersects: false,
		point: new THREE.Vector3(),
		normal: new THREE.Vector3()
	};
	const mouse = new THREE.Vector2();
	const intersects = [];
	//texture
	const textureLoader = new THREE.TextureLoader();
	const decalDiffuse = textureLoader.load( './textures/decal-diffuse.png' )
	const decalNormal = textureLoader.load( './textures/decal-normal.jpeg' )

	const cubetextureloader = new THREE.CubeTextureLoader()

	const decalMaterial = new THREE.MeshPhongMaterial( {
		specular: 0x444444,
		map: decalDiffuse,
		normalMap: decalNormal,
		normalScale: new THREE.Vector2( 1, 1 ),
		shininess: 30,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: - 4,
		wireframe: false
	} );

	const decals = [];

	let mouseHelper;
	const position = new THREE.Vector3();
	const orientation = new THREE.Euler();
	const size = new THREE.Vector3( 10, 10, 10 );

	const params = {
		minScale: 10,
		maxScale: 20,
		rotate: true,
		color: 0xff0000,
		clear: function () {
			removeDecals();
		}
	};

	//render
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	stats = new Stats();
	container.appendChild( stats.dom );
	//scene
	scene = new THREE.Scene();
	scene.add( new THREE.AmbientLight( 0x443380, 0.2 ) );
	const cubeTextureLoader = new THREE.CubeTextureLoader()
	const environmentMap = cubeTextureLoader.load([
		'/textures/environ/dark-s_px.jpg',
		'/textures/environ/dark-s_nx.jpg',
		'/textures/environ/dark-s_py.jpg',
		'/textures/environ/dark-s_ny.jpg',
		'/textures/environ/dark-s_pz.jpg',
		'/textures/environ/dark-s_nz.jpg'
	])
	scene.background = environmentMap

	//load models
	const loader1 = new GLTFLoader();

	loader1.load( './models/diantang3.gltf', function ( gltf ) {
		mesh1 = gltf.scene.children[ 0 ]
		mesh1.material = new THREE.MeshToonMaterial()
		mesh1.material.roughnesss = 0.02
		mesh1.material.metalness = 0.2
		scene.add( mesh1 )
	
		mesh1.position.y -= 120
	
		mesh1.position.x += 5
		mesh1.position.z -= 50
		mesh1.rotation.y -= 0.75
		mesh1.scale.set(12,12,12)
		mesh1.visible = true
	} );

	const loader2 = new GLTFLoader()

	loader2.load( './models/humanstatus.gltf', function ( gltf ) {
		mesh = gltf.scene.children[ 0 ]
		mesh.material = new THREE.MeshPhongMaterial()

		scene.add( mesh )
		mesh.position.y -=10

		mesh.position.x += 5
		mesh.position.z -=50
		mesh.rotation.y -= 0.75
		mesh.scale.set(15,15,15)
		mesh.receiveShadow = true

		mesh.visible = false
	} );
	

	//camera
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 )
	camera.position.z = 120;

	//controls
	const controls = new OrbitControls( camera, renderer.domElement  ); //renderer.domElement
	controls.enabled = false
	controls.enableDamping = true
	gui.add( controls,'enabled' )

	//light
	const fog = new THREE.Fog('#221844', 1, 600)
	scene.fog = fog	

	const dirLight1 = new THREE.DirectionalLight( 0xffddcc, 1 )
	dirLight1.position.set( 1, 0.75, 0.5 );
	scene.add( dirLight1 )
	const targetObject = new THREE.Object3D()
	targetObject.position.set(0,0,0)
	scene.add(targetObject)
	dirLight1.target = targetObject

	const dirLight2 = new THREE.DirectionalLight( 0xccccff, 0.6 );
	dirLight2.position.set( - 1, 0.75, - 0.5 );
	//scene.add( dirLight2 );
	const dirlighthelper = new THREE.DirectionalLightHelper(dirLight1,10)
	//scene.add(dirlighthelper)

	const spotlight = new THREE.SpotLight(0xffffff,1,200,Math.PI*0.2)
	spotlight.position.set(0,150,7)
	//spotlight.castShadow = true
	spotlight.shadow.mapSize.width = 1024;
	spotlight.shadow.mapSize.height = 1024;
	spotlight.shadow.camera.near = 500;
	spotlight.shadow.camera.far = 4000;
	spotlight.shadow.camera.fov = 30;
	spotlight.map = new THREE.TextureLoader().load('./textures/benlai.png')
	scene.add(spotlight)
	console.log(spotlight)
	const spothelper = new THREE.SpotLightHelper(spotlight)
	//scene.add(spothelper)


	//raycaster
	const geometry = new THREE.BufferGeometry()
	geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] )
	line = new THREE.Line( geometry, new THREE.LineBasicMaterial() )
	scene.add( line )
	raycaster = new THREE.Raycaster()
	mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() )
	mouseHelper.visible = false;
	scene.add( mouseHelper )


	//window events
	window.addEventListener( 'resize', onWindowResize );
	let moved = false;
	let paint
	controls.addEventListener( 'change', function () {
	 	paint = false
	})

	window.addEventListener( 'pointerdown', function () {
		paint = true
		//moved = false;
	} )

	window.addEventListener( 'pointerup', function ( event ){
		paint = false
	})

	window.addEventListener( 'pointermove', function(event){
		if ( paint ){
			checkIntersection( event.clientX, event.clientY )
			if ( intersection.intersects ) shoot();
		}
	} )


	//intersection
	function checkIntersection( x, y ) {
		mouse.x = ( x / window.innerWidth ) * 2 - 1
		mouse.y = - ( y / window.innerHeight ) * 2 + 1

		raycaster.setFromCamera( mouse, camera )
		raycaster.intersectObject( scene.children[6], true, intersects )

		if ( intersects.length > 0 ) {
			const p = intersects[ 0 ].point;
			mouseHelper.position.copy( p );
			intersection.point.copy( p );

			const n = intersects[ 0 ].face.normal.clone();
			n.transformDirection( mesh.matrixWorld );
			n.multiplyScalar( 10 );
			n.add( intersects[ 0 ].point );
			intersection.normal.copy( intersects[ 0 ].face.normal );
			mouseHelper.lookAt( n );

			const positions = line.geometry.attributes.position;
			positions.setXYZ( 0, p.x, p.y, p.z );
			positions.setXYZ( 1, n.x, n.y, n.z );
			positions.needsUpdate = true;

			// console.log(intersects)

			intersection.intersects = true;
			intersects.length = 0;
		} 
		else {
			intersection.intersects = false;
		}
	}

	//gui
	gui.add( params, 'minScale', 1, 30 )
	gui.add( params, 'maxScale', 1, 30 )
	gui.add( params, 'rotate' )
	gui.add( params, 'clear' )
	gui.open()

	//paint
	function shoot() {

		position.copy( intersection.point )
		orientation.copy( mouseHelper.rotation )

		if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI

		const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale )
		size.set( scale, scale, scale )


		const dmaterial = decalMaterial.clone()
		dmaterial.color.setHex(  params.color )
		gui.onChange(()=>
			{
				dmaterial.color.set(params.color)
			})

		const mg = new DecalGeometry(mesh,position,orientation,size)		
	    const m = new THREE.Mesh(mg,dmaterial)

		decals.push( m )
		scene.add( m )

		console.log(intersection)

	}
	gui.addColor(params,'color')

	function removeDecals() {

		decals.forEach( function ( d ) {

			scene.remove( d );

		} );

		decals.length = 0;

	}

	//window fit
	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()

		renderer.setSize( window.innerWidth, window.innerHeight )

	}

	//animation
	const clock = new THREE.Clock()

	function animate() {

		const elapsedTime = clock.getElapsedTime()

		requestAnimationFrame( animate );

		renderer.render( scene, camera );

		stats.update();

		controls.update();

		dirlighthelper.update()

		mesh1.rotation.y = elapsedTime * 0.3
		targetObject.position.z = Math.sin(elapsedTime * 0.4)
		targetObject.position.x = Math.cos(elapsedTime * 0.4)
	}

	animate()
	}
/**
 * fustic
 */
else if(container1 !== null){
	let renderer, scene, camera, stats;
	let mesh;
	let raycaster;
	let line;
	const gui = new dat.GUI()

	const intersection = {
		intersects: false,
		point: new THREE.Vector3(),
		normal: new THREE.Vector3()
	};
	const mouse = new THREE.Vector2();
	const intersects = [];
	const intersects2 = []

	const textureLoader = new THREE.TextureLoader();
	const decalDiffuse = textureLoader.load( './textures/decal-diffuse.png' )
	const decalNormal = textureLoader.load( './textures/decal-normal.jpeg' )
	const matcaptexture = textureLoader.load('./textures/catmap2.png')
	const matcapdecaltexture = textureLoader.load('./textures/lanlv.png')
	const matcapdecaltexture2 = textureLoader.load('./textures/lianglv.png')

	const decalMaterial = new THREE.MeshPhongMaterial( {
		specular: 0x444444,
		map: decalDiffuse,
		normalMap: decalNormal,
		normalScale: new THREE.Vector2( 1, 1 ),
		shininess: 30,
		transparent: true,
		depthTest: true,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: - 4,
		wireframe: false
	} );

	const decals = [];

	let mouseHelper;
	const position = new THREE.Vector3();
	const orientation = new THREE.Euler();
	const size = new THREE.Vector3( 10, 10, 10 );

	const params = {
		minScale: 10,
		maxScale: 20,
		rotate: true,
		clear: function () {

			removeDecals();

		}
	};

	//render
	renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight )
	container1.appendChild( renderer.domElement )

	stats = new Stats()
	container1.appendChild( stats.dom )
	scene = new THREE.Scene()

	//load models
	const loader1 = new GLTFLoader();
	loader1.load( './models/fotang2.gltf', function ( gltf ) {
	
		mesh = gltf.scene.children[ 0 ];
		mesh.material = new THREE.MeshMatcapMaterial()
		mesh.material.matcap = matcaptexture
		scene.add( mesh );
	
		mesh.scale.set( 1, 1, 1)
		mesh.position.y -= 60
		mesh.position.x -= 50
		mesh.position.z -= 10
		mesh.rotation.y += 1.55
		mesh.visible = true
	} );
	
	const loader2 = new GLTFLoader();
	loader2.load( './models/fo.gltf', function ( gltf ) {
		mesh = gltf.scene.children[ 0 ];
		scene.add( mesh )
		mesh.position.y -= 60
		mesh.position.x -= 50
		mesh.position.z -= 10
		mesh.rotation.y += 1.55
		mesh.visible = false
	} );

	//camera
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 120;

	//controls
	const controls = new OrbitControls( camera, renderer.domElement );
	controls.minDistance = 20;
	controls.maxDistance = 130;
	controls.enabled = false
	controls.enableDamping = true
	controls.minAzimuthAngle = -0.8
	controls.maxAzimuthAngle = 0.8
	controls.minPolarAngle = -0.3
	controls.maxPolarAngle = 2
	gui.add( controls,'enabled' );

	//light
	const fog = new THREE.Fog('#262820', 1, 790)
	scene.fog = fog	

	scene.add( new THREE.AmbientLight( 0x443380 ) )

	const dirLight1 = new THREE.DirectionalLight( 0xffddcc, 1 )
	dirLight1.position.set( 1, 0.75, 0.5 )
	scene.add( dirLight1 )

	const dirLight2 = new THREE.DirectionalLight( 0xccccff, 1 )
	dirLight2.position.set( - 1, 0.75, - 0.5 );
	scene.add( dirLight2 );


	//raycaster
	const geometry = new THREE.BufferGeometry();
	geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );
	line = new THREE.Line( geometry, new THREE.LineBasicMaterial() );
	scene.add( line );

	raycaster = new THREE.Raycaster();

	mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
	mouseHelper.visible = false;
	scene.add( mouseHelper );

	//window event
	window.addEventListener( 'resize', onWindowResize );
	let moved = false;
	let paint

	controls.addEventListener( 'change', function () {
	 	paint = false
	});

	window.addEventListener( 'pointerdown', function () {
		paint = true
		//moved = false;
	} );

	window.addEventListener( 'pointerup', function ( event ){
		paint = false
	})

	window.addEventListener( 'pointermove', function(event){
		if ( paint ){
			checkIntersection( event.clientX, event.clientY )
			if ( intersection.intersects ) shoot();
		}
	} )

	//intersection
	function checkIntersection( x, y ) {
		if ( mesh === undefined ) return;
		mouse.x = ( x / window.innerWidth ) * 2 - 1;
		mouse.y = - ( y / window.innerHeight ) * 2 + 1;
		
		let array = []
		array[0] = scene.children[5]
		array[1] = scene.children[6]
		raycaster.setFromCamera( mouse, camera );
		
		raycaster.intersectObject( array[0], true, intersects );
		raycaster.intersectObject( array[1], true, intersects2 );
		
		if ( intersects.length > 0 ) {
			const p = intersects[ 0 ].point;
			mouseHelper.position.copy( p );
			intersection.point.copy( p );

			const n = intersects[ 0 ].face.normal.clone();
			n.transformDirection( mesh.matrixWorld );
			n.multiplyScalar( 10 );
			n.add( intersects[ 0 ].point );
			intersection.normal.copy( intersects[ 0 ].face.normal );
			mouseHelper.lookAt( n );

			const positions = line.geometry.attributes.position;
			positions.setXYZ( 0, p.x, p.y, p.z );
			positions.setXYZ( 1, n.x, n.y, n.z );
			positions.needsUpdate = true;

			intersection.intersects = true;
			intersects.length = 0;
		} 
		else if ( intersects2.length > 0 ) {
			const p2 = intersects2[ 0 ].point;
			mouseHelper.position.copy( p2 );
			intersection.point.copy( p2 );

			const n2 = intersects2[ 0 ].face.normal.clone();
			n2.transformDirection( mesh.matrixWorld );
			n2.multiplyScalar( 10 );
			n2.add( intersects2[ 0 ].point );
			intersection.normal.copy( intersects2[ 0 ].face.normal );
			mouseHelper.lookAt( n2 );

			const positions2 = line.geometry.attributes.position;
			positions2.setXYZ( 0, p2.x, p2.y, p2.z );
			positions2.setXYZ( 1, n2.x, n2.y, n2.z );
			positions2.needsUpdate = true;
			
			intersection.intersects = true;
			intersects2.length = 0;
		} 
		else {
			intersection.intersects = false;
		}
	}
	
	//gui
	gui.add( params, 'minScale', 1, 30 )
	gui.add( params, 'maxScale', 1, 30 )
	gui.add( params, 'rotate' )
	gui.add( params, 'clear' )
	gui.open()

	//paint
	function shoot() {
		if(intersects2.length == 0 ){
			position.copy( intersection.point );
			orientation.copy( mouseHelper.rotation );

			if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;

			const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale );
			size.set( scale, scale, scale );


			const mg = new THREE.BoxGeometry(1.5,1.5,1.5)
			const decalmaterial = new THREE.MeshMatcapMaterial()
			decalmaterial.matcap = matcapdecaltexture2

	    	const m = new THREE.Mesh(mg,decalmaterial)
	    	m.position.set(position.x,position.y,position.z)
			decals.push( m )
			scene.add( m )
		}
		else if(intersects2 !== 0 ){
			position.copy( intersection.point )
			orientation.copy( mouseHelper.rotation )

			if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;

			const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale );
			size.set( scale, scale, scale );

			const mg2 = new THREE.BoxGeometry(0.7,0.7,0.7)
			const decalmaterial2 = new THREE.MeshMatcapMaterial()
			decalmaterial2.matcap = matcapdecaltexture

	    	const m = new THREE.Mesh(mg2,decalmaterial2)
	    	m.position.set(position.x,position.y,position.z)
			decals.push( m )
			scene.add( m )
			}
	}

	function removeDecals() {
		decals.forEach( function ( d ) {
			scene.remove( d )
		} );
		decals.length = 0;
	}

	//window fit
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	//animation
	function animate() {
		requestAnimationFrame( animate )
		renderer.render( scene, camera )
		stats.update()
		controls.update()
	}
	animate();
	}
/**
 * room
 */
else if(container2 !== null){
	let renderer, scene, camera, stats;
	let mesh;
	let mesh1;
	let raycaster;
	let line;
	const gui = new dat.GUI()
	
	const intersection = {
		intersects: false,
		point: new THREE.Vector3(),
		normal: new THREE.Vector3()
	};
	const mouse = new THREE.Vector2();
	const intersects = [];

	//texture
	const textureLoader = new THREE.TextureLoader();
	const decalDiffuse = textureLoader.load( './textures/decal-diffuse.png' );
	const decalNormal = textureLoader.load( './textures/decal-normal.jpeg' );
	
	const cubetextureloader = new THREE.CubeTextureLoader()
	
	const decals = [];
	
	let mouseHelper;
	const position = new THREE.Vector3();
	const orientation = new THREE.Euler();
	const size = new THREE.Vector3( 10, 10, 10 );
	
	const params = {
		minScale: 10,
		maxScale: 20,
		rotate: true,
		color: 0xff0000,
		clear: function () {
			removeDecals();	
		}
	};

	//render
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container2.appendChild( renderer.domElement );

	stats = new Stats();
	container2.appendChild( stats.dom );

	//scene
	scene = new THREE.Scene();
	scene.add( new THREE.AmbientLight( 0x443380, 0.2 ) );

	//load model
	const loader1 = new GLTFLoader();
	
	loader1.load( './models/room.glb', function ( gltf ) {

		mesh1 = gltf.scene.children[ 0 ];
		mesh1.material = new THREE.MeshToonMaterial()
		mesh1.material.roughnesss = 0.02
		mesh1.material.metalness = 0.2
		scene.add( mesh1 );
		 
		mesh1.position.y -= 120	
		mesh1.position.x += 5
		mesh1.position.z -= 50
		mesh1.rotation.y -= 0.75
		mesh1.scale.set(1,1,1)
		mesh1.name = 'room'
		mesh1.visible = false		
	} );

	//camera
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 120;
	//controls
	const controls = new OrbitControls( camera, renderer.domElement  ); //renderer.domElement
	controls.enabled = false
	controls.enableDamping = true
	gui.add( controls,'enabled' );

	//light
	const fog = new THREE.Fog('#221844', 1, 600)
	scene.fog = fog	
		
	const dirLight1 = new THREE.DirectionalLight( 0xffddcc, 1 );
	dirLight1.position.set( 1, 0.75, 0.5 );
	scene.add( dirLight1 );
	const targetObject = new THREE.Object3D()
	targetObject.position.set(0,0,0)
	scene.add(targetObject)
	dirLight1.target = targetObject
	
	const dirLight2 = new THREE.DirectionalLight( 0xccccff, 0.6 );
	dirLight2.position.set( - 1, 0.75, - 0.5 );
	scene.add( dirLight2 );
	
	//raycaster
	const geometry = new THREE.BufferGeometry();
	geometry.setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] );

	line = new THREE.Line( geometry, new THREE.LineBasicMaterial() );
	scene.add( line );

	raycaster = new THREE.Raycaster();

	mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
	mouseHelper.visible = false;
	scene.add( mouseHelper );

	//window event
	window.addEventListener( 'resize', onWindowResize );
	let moved = false;
	let paint

	controls.addEventListener( 'change', function () {
		 paint = false
	});
	
	window.addEventListener( 'pointerdown', function () {
		paint = true
		//moved = false;
	} );

	window.addEventListener( 'pointerup', function ( event ){
		paint = false
	})
	
	window.addEventListener( 'pointermove', function(event){
		if ( paint ){
			checkIntersection( event.clientX, event.clientY )
			if ( intersection.intersects ) shoot();
			
		}
	} )

	//intersection
	function checkIntersection( x, y ) {

		mouse.x = ( x / window.innerWidth ) * 2 - 1;
		mouse.y = - ( y / window.innerHeight ) * 2 + 1;
		
		raycaster.setFromCamera( mouse, camera );
		raycaster.intersectObject( scene.children[6], true, intersects )


		if ( intersects.length > 0 ) {

			const p = intersects[ 0 ].point;
			mouseHelper.position.copy( p );
			intersection.point.copy( p );

			const n = intersects[ 0 ].face.normal.clone();
			n.transformDirection( mesh1.matrixWorld );
			n.multiplyScalar( 10 );
			n.add( intersects[ 0 ].point );

			intersection.normal.copy( intersects[ 0 ].face.normal );
			mouseHelper.lookAt( n );

			const positions = line.geometry.attributes.position;
			positions.setXYZ( 0, p.x, p.y, p.z );
			positions.setXYZ( 1, n.x, n.y, n.z );
			positions.needsUpdate = true;
			console.log(intersects)
			intersection.intersects = true;
			
			intersects.length = 0;

		} 
		else {

			intersection.intersects = false;

		}

	}

	//gui
	gui.add( params, 'minScale', 1, 30 );
	gui.add( params, 'maxScale', 1, 30 );
	gui.add( params, 'rotate' );
	gui.add( params, 'clear' );
	
	gui.open();

	function shoot() {
		
		position.copy( intersection.point );
		orientation.copy( mouseHelper.rotation );
	
		if ( params.rotate ) orientation.z = Math.random() * 2 * Math.PI;
	
		const scale = params.minScale + Math.random() * ( params.maxScale - params.minScale );
		size.set( scale, scale, scale );
	

		const mg = new THREE.BoxGeometry(1.5,1.5,1.5)
		const material = new THREE.MeshBasicMaterial()
		material.color.set(params.color)
		gui.onChange(()=>
			{
				material.color.set(params.color)
			})

		const m = new THREE.Mesh(mg,material)

		m.position.set(position.x,position.y,position.z)
		decals.push( m );
		scene.add( m );
	
		console.log(intersection)
	
	}
	gui.addColor(params,'color')
			
	function removeDecals() {
	
		decals.forEach( function ( d ) {
	
			scene.remove( d );
	
		} );
	
		decals.length = 0;
	
	}
	
	function onWindowResize() {
	
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	
	}

	//animation
	const clock = new THREE.Clock()
	function animate() {
		
		const elapsedTime = clock.getElapsedTime()	
		requestAnimationFrame( animate )	
		renderer.render( scene, camera )	
		stats.update()
		controls.update()
			
		targetObject.position.z = Math.sin(elapsedTime * 0.4)
		targetObject.position.x = Math.cos(elapsedTime * 0.4)
	
	}
	animate();
}
/**
 * index
 */
else{

// Canvas
const canvas = document.querySelector('canvas.webgl')
const objectsDistance = 4

// Scene
const scene = new THREE.Scene()

//loading bar
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
	transparent: true,
	uniforms:
    {
        uAlpha: { value: 1 }
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
	uniform float uAlpha;

	void main()
	{
		gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
	}
    `
})

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

const loadingBarElement = document.querySelector('.loading-bar')
const loadingmanager = new THREE.LoadingManager(
    ()=>
    {
        window.setTimeout(() =>
        {
            gsap.to(overlayMaterial.uniforms.uAlpha,{ duration:3, value: 0})
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        }, 500)   
    },

    (itemUrl, itemsLoaded, itemsTotal)=>
    {
        const progressratio = itemsLoaded/itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressratio})`
    }
)

//load model
let mesh0 = null
const loader1 = new GLTFLoader(loadingmanager);
	
	loader1.load( './models/diantang3.gltf', function ( gltf ) {

		mesh0 = gltf.scene.children[ 0 ];
		mesh0.material = new THREE.MeshToonMaterial()
		mesh0.material.roughnesss = 0.02
		mesh0.material.metalness = 0.2
		scene.add( mesh0 );
		mesh0.position.y = - objectsDistance * 1 +3.5		
		mesh0.position.x = 2
		mesh0.position.z =0
		mesh0.scale.set(0.07,0.07,0.07)
		//mesh.name = 'archi'
		mesh0.visible = true
		
	} );

		let mesh00 = null
		const loader2 = new GLTFLoader();
	
		loader2.load( './models/deng.glb', function ( gltf ) {
	
			mesh00 = gltf.scene.children[ 0 ];
			mesh00.material = new THREE.MeshToonMaterial()
			mesh00.material.roughnesss = 0.02
			mesh00.material.metalness = 0.2

			scene.add( mesh00 );

			mesh00.position.y = - objectsDistance * 1 -0.5		
			mesh00.position.x = -1.8
			mesh00.position.z =0

			mesh00.scale.set(0.03,0.03,0.03)
			//mesh.name = 'archi'
			mesh00.visible = true
			
		} );

		let mesh000 = null
		const loader3 = new GLTFLoader();
	
		loader3.load( './models/sofa.glb', function ( gltf ) {
	
			mesh000 = gltf.scene.children[ 0 ];
			mesh000.material = new THREE.MeshToonMaterial()
			mesh000.material.roughnesss = 0.02
			mesh000.material.metalness = 0.2

			scene.add( mesh000 );

			mesh000.position.y = - objectsDistance * 2 -0.5		
			mesh000.position.x = 2
			mesh000.position.z =0

			mesh000.scale.set(0.025,0.025,0.025)
			//mesh.name = 'archi'
			mesh000.visible = true
			
		} );



// Texture
const textureLoader = new THREE.TextureLoader()

const parameters = {
    materialColor: '#ffeded'
}

var i
a()
function a(){
	console.log('a')
	i = setTimeout(function()
	{		
		const sectionMeshes = [ mesh0, mesh00, mesh000 ]

		//light
		const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
		directionalLight.position.set(1, 1, 0)
		scene.add(directionalLight)

		//particles
		const particlesCount = 200
		const positions = new Float32Array(particlesCount * 3)

		for(let i = 0; i < particlesCount; i++)
		{
		    positions[i * 3 + 0] = (Math.random() - 0.5) * 10
		    positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length
		    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
		}

		const particlesGeometry = new THREE.BufferGeometry()
		particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

		// Material
		const particlesMaterial = new THREE.PointsMaterial({
		    color: parameters.materialColor,
		    sizeAttenuation: textureLoader,
		    size: 0.03
		})

		// Points
		const particles = new THREE.Points(particlesGeometry, particlesMaterial)
		scene.add(particles)

		//window
		const sizes = {
		    width: window.innerWidth,
		    height: window.innerHeight
		}

		window.addEventListener('resize', () =>
		{
		    // Update sizes
		    sizes.width = window.innerWidth
		    sizes.height = window.innerHeight
		
		    // Update camera
		    camera.aspect = sizes.width / sizes.height
		    camera.updateProjectionMatrix()
		
		    // Update renderer
		    renderer.setSize(sizes.width, sizes.height)
		    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		})

		//camera
		const cameraGroup = new THREE.Group()
		scene.add(cameraGroup)

		// Base camera
		const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
		camera.position.z = 6
		cameraGroup.add(camera)

		//render
		const renderer = new THREE.WebGLRenderer({
		    canvas: canvas,
		    alpha: true
		})
		renderer.setClearAlpha(0)
		renderer.setSize(sizes.width, sizes.height)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

		//scroll
		let scrollY = window.scrollY
		let currentSection = 0

		//cusor
		const cursor = {}
		cursor.x = 0
		cursor.y = 0

		window.addEventListener('mousemove', (event) =>
		{
		    cursor.x = event.clientX / sizes.width - 0.5
		    cursor.y = event.clientY / sizes.height - 0.5
		})

		//animation
		const clock = new THREE.Clock()
		let previousTime = 0

		const tick = () =>
		{
		    const elapsedTime = clock.getElapsedTime()
		    const deltaTime = elapsedTime - previousTime
		    previousTime = elapsedTime
		
		    // Animate camera
		    camera.position.y = - scrollY / sizes.height * objectsDistance
		
		    const parallaxX = cursor.x * 0.5
		    const parallaxY = - cursor.y * 0.5
		    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
		    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime
		
		    // Animate meshes
		    for(const mesh of sectionMeshes)
		    {
		        mesh.rotation.x += deltaTime * 0.1
		        mesh.rotation.y += deltaTime * 0.12
		    }
		
		    // Render
		    renderer.render(scene, camera)
		
		    // Call tick again on the next frame
		    window.requestAnimationFrame(tick)
		
		}

		tick()

		window.addEventListener('scroll', () =>
		{
		    console.log('scroll')
		    scrollY = window.scrollY
		    const newSection = Math.round(scrollY / sizes.height)
		
		    if(newSection != currentSection)
		    {
		        currentSection = newSection
			
		        gsap.to(
		            sectionMeshes[currentSection].rotation,
		            {
		                duration: 1.5,
		                ease: 'power2.inOut',
		                x: '+=6',
		                y: '+=3',
		                z: '+=1.5'
		            }
		        )
		    }
		})
		clearTimeout(i)

			},2000)
		}
}
