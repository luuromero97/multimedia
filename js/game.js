// Declarar todos los objetos de uso comÃºn como variables por conveniencia
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// Solicitud de requestAnimationFrame y cancelAnimationFrame para su uso en el código del juego
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = 
		  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
 
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
 
	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

$(window).load(function() {
	game.init();
});

var game = {
	// Inicialización de objetos, precarga de elementos y pantalla de inicio
	init: function(){
		// Inicialización de objetos   
		levels.init();
		loader.init();
		mouse.init();

		// Cargar todos los efectos de sonido y música de fondo
	
		//"Voxel Revolution" Kevin MacLeod (incompetech.com)
		//Licensed under Creative Commons: By Attribution 4.0 License
		//http://creativecommons.org/licenses/by/4.0/
		game.backgroundMusic = loader.loadSound('new_audio/Voxel Revolution');

		//erkanozan Creative Commons - 0 License
		//https://freesound.org/people/erkanozan/sounds/51755/
		game.slingshotReleasedSound = loader.loadSound("new_audio/whip");

		//HighPixel Creative Commons - 0 License
		//https://freesound.org/people/HighPixel/sounds/505628/
		game.bounceSound = loader.loadSound('new_audio/bounce');
		game.breakSound = {
			//RHumphries Creative Commons - Attribution License
			//https://freesound.org/people/RHumphries/sounds/979/
			"hielo":loader.loadSound('new_audio/glass_break'),
			//kevinkace Creative Commons - 0 License
			//https://freesound.org/people/kevinkace/sounds/66779/
			"madera":loader.loadSound('new_audio/wood_break'),
			//kevinkace Creative Commons - 0 License
			//https://freesound.org/people/kevinkace/sounds/66779/
			"maderanormal":loader.loadSound('new_audio/wood_break'),
			//alegemaate Creative Commons - 0 License
			//https://freesound.org/people/alegemaate/sounds/364711/
			"piedra":loader.loadSound('new_audio/stone_break'),
			//wyronroberth Creative Commons - 0 License
			//https://freesound.org/people/wyronroberth/sounds/516247/
			"arena":loader.loadSound('new_audio/sand_break'),
			//wyronroberth Creative Commons - 0 License
			//https://freesound.org/people/wyronroberth/sounds/516247/
			"tierra":loader.loadSound('new_audio/sand_break'),
			//RHumphries Creative Commons - Attribution License
			//https://freesound.org/people/RHumphries/sounds/979/
			"glass":loader.loadSound('new_audio/glass_break'),
			//kevinkace Creatice Commons - 0 License
			//https://freesound.org/people/kevinkace/sounds/66779/
			"wood":loader.loadSound('new_audio/wood_break'),
			//ProjectsU012 Creative Commons - Attribution License
			//https://freesound.org/people/ProjectsU012/sounds/341695/
			"diamante":loader.loadSound('new_audio/coin')
		};


		// Ocultar todas las capas del juego y mostrar la pantalla de inicio
		$('.gamelayer').hide();
		$('#gamestartscreen').show();

		//Obtener el controlador para el lienzo de juego y el contexto
		game.canvas =  $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},	  
	startBackgroundMusic:function(){
		var toggleImage = $("#togglemusic")[0];	
		game.backgroundMusic.play();
		toggleImage.src="images/new_icons/audio.png";	
	},
	stopBackgroundMusic:function(){
		var toggleImage = $("#togglemusic")[0];	
		toggleImage.src="images/new_icons/mute.png";	
		game.backgroundMusic.pause();
		game.backgroundMusic.currentTime = 0; // Ir al comienzo de la canciÃ³n
	},
	toggleBackgroundMusic:function(){
		var toggleImage = $("#togglemusic")[0];
		if(game.backgroundMusic.paused){
			game.backgroundMusic.play();
			toggleImage.src="images/new_icons/audio.png";
		} else {
			game.backgroundMusic.pause();	
			$("#togglemusic")[0].src="images/new_icons/mute.png";
		}
	},
	showLevelScreen:function(){
		loader.resetCounts();
		$('.gamelayer').hide();
		$('#levelselectscreen').show('slow');

	},
	endGame:function(){
		game.ended = true;
		game.showLevelScreen();
	},
	restartLevel:function(){
		window.cancelAnimationFrame(game.animationFrame);		
		game.lastUpdateTime = undefined;
		loader.resetCounts();
		levels.load(game.currentLevel.number);
	},
	startNextLevel:function(){
		window.cancelAnimationFrame(game.animationFrame);		
		game.lastUpdateTime = undefined;
		loader.resetCounts();
		levels.load(game.currentLevel.number+1);
	},
	// Modo Juego 
	mode:"intro", 
	// Coordenadas X & Y de la honda
	slingshotX:140,
	slingshotY:280,
	start:function(){
		$('.gamelayer').hide();
		// Display the game canvas and score 
		$('#gamecanvas').show();
		$('#scorescreen').show();
	
		game.startBackgroundMusic();
	
		game.mode = "intro";	
		game.offsetLeft = 0;
		game.ended = false;
		game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
	},		

	

	// Velocidad mÃ¡xima de panoramizaciÃ³n por fotograma en pÃ­xeles
	maxSpeed:2,
	// MÃ­nimo y MÃ¡ximo desplazamiento panorÃ¡mico
	minOffset:0,
	maxOffset:300,
	// Desplazamiento de panorÃ¡mica actual
	offsetLeft:0,
	// La puntuaciÃ³n del juego
	score:0,

	//Despliegue la pantalla para centrarse en newCenter
	panTo:function(newCenter){
		if (Math.abs(newCenter-game.offsetLeft-game.canvas.width/4)>0 
			&& game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){
		
			var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
			if (deltaX && Math.abs(deltaX)>game.maxSpeed){
				deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
			}
			game.offsetLeft += deltaX; 
		} else {
			
			return true;
		}
		if (game.offsetLeft <game.minOffset){
			game.offsetLeft = game.minOffset;
			return true;
		} else if (game.offsetLeft > game.maxOffset){
			game.offsetLeft = game.maxOffset;
			return true;
		}		
		return false;
	},
	countHeroesAndVillains:function(){
		game.heroes = [];
		game.villains = [];
		for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
			var entity = body.GetUserData();
			if(entity){
				if(entity.type == "hero"){				
					game.heroes.push(body);			
				} else if (entity.type =="villain"){
					game.villains.push(body);
				}
			}
		}
	},
  	mouseOnCurrentHero:function(){
		if(!game.currentHero){
			return false;
		}
		var position = game.currentHero.GetPosition();
		var distanceSquared = Math.pow(position.x*box2d.scale - mouse.x-game.offsetLeft,2) + Math.pow(position.y*box2d.scale-mouse.y,2);
		var radiusSquared = Math.pow(game.currentHero.GetUserData().radius,2);		
		return (distanceSquared<= radiusSquared);	
	},
	handlePanning:function(){

	   	if(game.mode=="intro"){		
		   if(game.panTo(700)){
			   game.mode = "load-next-hero";
		   }			 
	   	}	   

	   	if (game.mode=="wait-for-firing"){  
			if (mouse.dragging){
				if (game.mouseOnCurrentHero()){
					game.mode = "firing";
				} else {
					game.panTo(mouse.x + game.offsetLeft)
				}
			} else {
				game.panTo(game.slingshotX);
			}
		}

		if (game.mode == "firing"){  
			if(mouse.down){
				game.panTo(game.slingshotX);				
				game.currentHero.SetPosition({x:(mouse.x+game.offsetLeft)/box2d.scale,y:mouse.y/box2d.scale});
			} else {
				game.mode = "fired";
				game.slingshotReleasedSound.play();								
				var impulseScaleFactor = 0.75;
				
				// Coordenadas del centro de la honda (donde la banda estÃ¡ atada a la honda)
				var slingshotCenterX = game.slingshotX + 35;
				var slingshotCenterY = game.slingshotY+25;
				var impulse = new b2Vec2((slingshotCenterX -mouse.x-game.offsetLeft)*impulseScaleFactor,(slingshotCenterY-mouse.y)*impulseScaleFactor);
				game.currentHero.ApplyImpulse(impulse,game.currentHero.GetWorldCenter());

			}
		}

		//Meter espera de 5 segundos para eliminar al héroe usado

		if (game.mode == "fired"){		
			//Vista panorÃ¡mica donde el hÃ©roe se encuentra actualmente...
			var heroX = game.currentHero.GetPosition().x*box2d.scale;
			game.panTo(heroX);

			//Y esperar hasta que deja de moverse o estÃ¡ fuera de los lÃ­mites
			if(!game.currentHero.IsAwake() || heroX<0 || heroX >game.currentLevel.foregroundImage.width){
				// Luego borra el viejo hÃ©roe
				box2d.world.DestroyBody(game.currentHero);
				game.currentHero = undefined;
				// y carga el siguiente hÃ©roe
				game.mode = "load-next-hero";
				//Resetea el timeOut
			}
		}
		

		if (game.mode == "load-next-hero"){
			game.countHeroesAndVillains();

			// Comprobar si algÃºn villano estÃ¡ vivo, si no, termine el nivel (Ã©xito)
			if (game.villains.length == 0){
				game.mode = "level-success";
				return;
			}

			// Comprobar si hay mÃ¡s hÃ©roes para cargar, si no terminar el nivel (fallo)
			if (game.heroes.length == 0){
				game.mode = "level-failure"	
				return;		
			}

			// Cargar el hÃ©roe y establecer el modo de espera para disparar (wait-for-firing)
			if(!game.currentHero){
				game.currentHero = game.heroes[game.heroes.length-1];
				game.currentHero.SetPosition({x:180/box2d.scale,y:200/box2d.scale});
	 			game.currentHero.SetLinearVelocity({x:0,y:0});
	 			game.currentHero.SetAngularVelocity(0);
				game.currentHero.SetAwake(true);				
			} else {
				// Esperar a que el hÃ©roe deje de rebotar y se duerma y luego cambie a espera para disparar (wait-for-firing)
				game.panTo(game.slingshotX);
				if(!game.currentHero.IsAwake()){
					game.mode = "wait-for-firing";
				}
			}
		   }	
   
			if(game.mode=="level-success" || game.mode=="level-failure"){		
				if(game.panTo(0)){
					game.ended = true;					
					game.showEndingScreen();
				}			 
			}
			

	  	},
		showEndingScreen:function(){
			game.stopBackgroundMusic();				
			if (game.mode=="level-success"){			
				if(game.currentLevel.number<levels.data.length-1){
					$('#endingmessage').html('Level Complete. Well Done!!!');
					$("#playnextlevel").show();
				} else {
					$('#endingmessage').html('All Levels Complete. Well Done!!!');
					$("#playnextlevel").hide();
				}
			} else if (game.mode=="level-failure"){			
				$('#endingmessage').html('Failed. Play Again?');
				$("#playnextlevel").hide();
			}		
	
			$('#endingscreen').show();
		},
	
	animate:function(){
		// Animar el fondo
		game.handlePanning();

		// Animar los personajes
			var currentTime = new Date().getTime();
			var timeStep;
			if (game.lastUpdateTime){
				timeStep = (currentTime - game.lastUpdateTime)/1000;
				if(timeStep >2/60){
					timeStep = 2/60
				}
				box2d.step(timeStep);
			} 
			game.lastUpdateTime = currentTime;
	

		// Dibujar el fondo con desplazamiento de paralaje
		game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
		game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);

		// Dibujar la honda
		game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);

		// Dibujar todos los cuerpos
		game.drawAllBodies();
	
		// Dibujar la banda cuando estamos disparando un hÃ©roe
		if(game.mode == "wait-for-firing" || game.mode == "firing"){  
			game.drawSlingshotBand();
		}

		// Dibujar el frente de la honda
		game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);

		if (!game.ended){
			game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
		}	
	},
	drawAllBodies:function(){  
		box2d.world.DrawDebugData();	

		// Iterar a travÃ©s de todos los cuerpos y dibujarlos en el lienzo del juego		  
		for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
			var entity = body.GetUserData();
  
			if(entity){
				var entityX = body.GetPosition().x*box2d.scale;
				if(entityX<0|| entityX>game.currentLevel.foregroundImage.width||(entity.health && entity.health <0)){
					box2d.world.DestroyBody(body);
					if (entity.type=="villain"){
						game.score += entity.calories;
						$('#score').html('Score: '+game.score);
					}
					if (entity.type=="coin"){
						game.score += 1000;
						$('#score').html('Score: '+game.score);
					}
					if (entity.breakSound){
						entity.breakSound.play();
					}
				} else {
					entities.draw(entity,body.GetPosition(),body.GetAngle())				
				}	
			}
		}
	},
	drawSlingshotBand:function(){
		game.context.strokeStyle = "rgb(68,31,11)"; // Color marrÃ³n oscuro
		game.context.lineWidth = 6; // Dibuja una lÃ­nea gruesa

		// Utilizar el Ã¡ngulo y el radio del hÃ©roe para calcular el centro del hÃ©roe
		var radius = game.currentHero.GetUserData().radius;
		var heroX = game.currentHero.GetPosition().x*box2d.scale;
		var heroY = game.currentHero.GetPosition().y*box2d.scale;			
		var angle = Math.atan2(game.slingshotY+25-heroY,game.slingshotX+50-heroX);	
	
		var heroFarEdgeX = heroX - radius * Math.cos(angle);
		var heroFarEdgeY = heroY - radius * Math.sin(angle);
	
	
	
		game.context.beginPath();
		// Iniciar la lÃ­nea desde la parte superior de la honda (la parte trasera)
		game.context.moveTo(game.slingshotX+50-game.offsetLeft, game.slingshotY+25);	

		// Dibuja lÃ­nea al centro del hÃ©roe
		game.context.lineTo(heroX-game.offsetLeft,heroY);
		game.context.stroke();		
	
		// Dibuja el hÃ©roe en la banda posterior
		entities.draw(game.currentHero.GetUserData(),game.currentHero.GetPosition(),game.currentHero.GetAngle());
			
		game.context.beginPath();		
		// Mover al borde del hÃ©roe mÃ¡s alejado de la parte superior de la honda
		game.context.moveTo(heroFarEdgeX-game.offsetLeft,heroFarEdgeY);
	
		// Dibujar lÃ­nea de regreso a la parte superior de la honda (el lado frontal)
		game.context.lineTo(game.slingshotX-game.offsetLeft +10,game.slingshotY+30)
		game.context.stroke();
	},

}

var levels = {
	// Datos de nivel
	data:[
	 {   // Primer nivel 
		foreground:'bosque_3',
		background:'clouds-background',
		entities:[
			{type:"ground", name:"tierra", x:500,y:440,width:1000,height:20,isStatic:true},
			{type:"ground", name:"madera", x:185,y:390,width:30,height:80,isStatic:true},

			{type:"block", name:"madera", x:520,y:380,angle:90,width:100,height:25},
			{type:"block", name:"hielo", x:520,y:280,angle:90,width:100,height:25},								
			{type:"villain", name:"creeper",x:520,y:205,calories:590},

			{type:"coin", name:"diamante",x:570,y:280, isStatic:true},

			{type:"block", name:"madera", x:620,y:380,angle:90,width:100,height:25},
			{type:"block", name:"hielo", x:620,y:280,angle:90,width:100,height:25},								
			{type:"villain", name:"esqueleto", x:620,y:205,calories:420},				

			{type:"hero", name:"gato_de_pie",x:80,y:405},
			{type:"hero", name:"gato_sentado",x:140,y:405},
		]
	 },
		{   // Segundo nivel
			foreground:'desierto_2',
			background:'clouds-background',
			entities:[
				{type:"ground", name:"arena", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"maderanormal", x:185,y:390,width:30,height:80,isStatic:true},	
	
				{type:"block", name:"piedra", x:820,y:380,angle:90,width:100,height:25},
				{type:"block", name:"piedra", x:720,y:380,angle:90,width:100,height:25},
				{type:"block", name:"piedra", x:620,y:380,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:670,y:317.5,width:100,height:25},
				{type:"block", name:"maderanormal", x:770,y:317.5,width:100,height:25},				

				{type:"block", name:"arena", x:670,y:255,angle:90,width:100,height:25},
				{type:"block", name:"arena", x:770,y:255,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:720,y:192.5,width:100,height:25},	

				{type:"villain", name:"enderman",x:715,y:155,calories:590},
				{type:"villain", name:"esqueleto_de_frente",x:670,y:405,calories:420},
				{type:"villain", name:"creeper",x:765,y:400,calories:150},

				{type:"hero", name:"gato_donut",x:30,y:415},
				{type:"hero", name:"gato_galleta",x:80,y:405},
				{type:"hero", name:"gato_tumbado",x:140,y:405},
			]
		},
		{   // Tercer nivel
			foreground:'nieve',
			background:'clouds-background',
			entities:[
				{type:"ground", name:"hielo", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"madera", x:185,y:390,width:30,height:80,isStatic:true},

				{type:"block", name:"piedra", x:520,y:380,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:520,y:280,angle:90,width:100,height:25},	
				{type:"block", name:"madera", x:520,y:180,angle:0,width:100,height:25},	
				{type:"villain", name:"esqueleto",x:520,y:80,calories:420},
	
				{type:"villain", name:"enderman",x:560,y:380,calories:420},

				{type:"block", name:"hielo", x:840,y:380,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:735,y:380,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:715,y:380,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:600,y:380,angle:90,width:100,height:25},
				{type:"block", name:"madera", x:670,y:317.5,width:120,height:25},
				{type:"block", name:"madera", x:770,y:317.5,width:120,height:25},				

				{type:"block", name:"hielo", x:660,y:255,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:780,y:255,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:720,y:192.5,width:120,height:25},	

				{type:"villain", name:"silverfish",x:715,y:155,calories:590},
				{type:"villain", name:"esqueleto_de_frente",x:665,y:405,calories:420},
				{type:"villain", name:"creeper",x:755,y:400,calories:150},
				{type:"villain", name:"baby_zombie",x:720,y:260,calories:150},

				{type:"hero", name:"gato_de_pie",x:30,y:415},
				{type:"hero", name:"gato_galleta",x:80,y:405},
				{type:"hero", name:"gato_sentado",x:140,y:405},
			]
		},
		{   // Cuarto nivel
			foreground:'playa',
			background:'clouds-background',
			entities:[
				{type:"ground", name:"arena", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"maderanormal", x:185,y:390,width:30,height:80,isStatic:true},	
	
				{type:"block", name:"tierra", x:510,y:380,width:100,height:25},

				{type:"block", name:"arena", x:680,y:380,angle:90,width:100,height:25},
				{type:"block", name:"arena", x:580,y:380,angle:90,width:100,height:25},
				{type:"block", name:"piedra", x:630,y:317.5,width:125,height:25},

				{type:"block", name:"arena", x:810,y:380,angle:90,width:100,height:25},
				{type:"block", name:"arena", x:710,y:380,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:760,y:317.5,width:125,height:25},
				
				{type:"block", name:"arena", x:810,y:270,angle:90,width:100,height:25},
				{type:"block", name:"arena", x:710,y:270,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:760,y:200,width:125,height:25},
				
				{type:"villain", name:"baby_zombie",x:510,y:300,calories:590},
				{type:"villain", name:"esqueleto",x:630,y:300,calories:420},
				{type:"villain", name:"enderman",x:760,y:150,calories:150},

				{type:"hero", name:"gato_sentado",x:30,y:415},
				{type:"hero", name:"gato_donut",x:80,y:405},
				{type:"hero", name:"gato_tumbado",x:140,y:405},
			]
		},
		{   // Quinto nivel
			foreground:'bosque_4',
			background:'clouds-background',
			entities:[
				{type:"ground", name:"arena", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"maderanormal", x:185,y:390,width:30,height:80,isStatic:true},	

				{type:"block", name:"madera", x:680,y:380,angle:90,width:100,height:25},
				{type:"block", name:"madera", x:580,y:380,angle:90,width:100,height:25},
				{type:"block", name:"tierra", x:630,y:317.5,width:125,height:25},
				
				{type:"block", name:"hielo", x:680,y:270,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:580,y:270,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:630,y:200,width:125,height:25},

				{type:"block", name:"madera", x:810,y:380,angle:90,width:100,height:25},
				{type:"block", name:"madera", x:710,y:380,angle:90,width:100,height:25},
				{type:"block", name:"tierra", x:760,y:317.5,width:125,height:25},
				
				{type:"block", name:"hielo", x:810,y:270,angle:90,width:100,height:25},
				{type:"block", name:"hielo", x:710,y:270,angle:90,width:100,height:25},
				{type:"block", name:"maderanormal", x:760,y:200,width:125,height:25},
				
				{type:"villain", name:"esqueleto",x:510,y:300,calories:590},
				{type:"villain", name:"baby_zombie",x:630,y:300,calories:420},
				{type:"villain", name:"baby_zombie",x:760,y:300,calories:420},
				{type:"villain", name:"silverfish",x:700,y:150,calories:150},

				{type:"hero", name:"gato_galleta",x:30,y:415},
				{type:"hero", name:"gato_donut",x:80,y:405},
				{type:"hero", name:"gato_de_pie",x:140,y:405},
			]
		}
	],

	// Inicializar pantalla de selecciÃ³n de nivel
	init:function(){
		var html = "";
		for (var i=0; i < levels.data.length; i++) {
			var level = levels.data[i];
			html += '<input type="button" value="'+(i+1)+'">';
		};
		$('#levelselectscreen').html(html);
		
		// Establecer los controladores de eventos de clic de botÃ³n para cargar el nivel
		$('#levelselectscreen input').click(function(){
			levels.load(this.value-1);
			$('#levelselectscreen').hide();
		});
	},

	   // Cargar todos los datos e imÃ¡genes para un nivel especÃ­fico
	load:function(number){
	   //Inicializar box2d world cada vez que se carga un nivel
		box2d.init();
		console.log("Box2d inicializado");
		// Declarar un nuevo objeto de nivel actual
		game.currentLevel = {number:number,hero:[]};
		console.log("Nivel: "+ game.currentLevel);
		game.score=0;
		$('#score').html('Score: '+game.score);
		game.currentHero = undefined;
		var level = levels.data[number];


		//Cargar las imÃ¡genes de fondo, primer plano y honda
		game.currentLevel.backgroundImage = loader.loadImage("images/new_backgrounds/"+level.background+".png");
		game.currentLevel.foregroundImage = loader.loadImage("images/new_backgrounds/"+level.foreground+".png");
		game.slingshotImage = loader.loadImage("images/new_slingshot.png");
		game.slingshotFrontImage = loader.loadImage("images/new_front_slingshot.png");

		console.log("Imágenes del nivel "+number+" cargadas");

		// Cargar todas la entidades
		for (var i = level.entities.length - 1; i >= 0; i--){	
			var entity = level.entities[i];
			entities.create(entity);	
			console.log("Entidad "+ i + " cargada")
		};

		  //Llamar a game.start() una vez que los assets se hayan cargado
	   if(loader.loaded){
	   		console.log("El juego va a empezar porque loader.loaded = true");
		   	game.start()
	   } else {
	   		console.log("loader.loaded = false");
		   	loader.onload = game.start;
	   }
	}
}

var entities = {
	definitions:{
		//Elementos de los niveles:
		"glass":{
			fullHealth:100,
			density:2.4,
			friction:0.4,
			restitution:0.15,
		},
		"wood":{
			fullHealth:500,
			density:0.7,
			friction:0.4,
			restitution:0.4,
		},
		"hielo":{
			fullHealth:100,
			density:2.4,
			friction:0.4,
			restitution:0.15,
		},
		"madera":{
			fullHealth:200,
			density:0.7,
			friction:0.4,
			restitution:0.4,
		},		
		"maderanormal":{
			fullHealth:200,
			density:0.7,
			friction:0.4,
			restitution:0.4,
		},
		"piedra":{
			fullHealth:300,
			density:0.7,
			friction:0.4,
			restitution:0.4,
		},
		"dirt":{
			density:3.0,
			friction:1.5,
			restitution:0.2,	
		},
		"tierra":{
			fullHealth:100,
			density:3.0,
			friction:1.5,
			restitution:0.2,	
		},		
		"arena":{
			fullHealth:100,
			density:3.0,
			friction:1.5,
			restitution:0.2,	
		},
		//Héroes y villanos:
		"creeper":{
			shape:"rectangle",
			fullHealth:40,
			width:40,
			height:50,
			friction:0.5,
			restitution:0.4,	
		},
		"sodacan":{
			shape:"rectangle",
			fullHealth:80,
			width:40,
			height:60,
			density:1,
			friction:0.5,
			restitution:0.7,	
		},
		"esqueleto":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},		
		"esqueleto_de_frente":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},		
		"enderman":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:100,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},
		"silverfish":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},
		"ghast":{
			shape:"rectangle",
			fullHealth:50,
			width:70,
			height:70,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},
		"zombie":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},
		"baby_zombie":{
			shape:"rectangle",
			fullHealth:50,
			width:40,
			height:50,
			density:1,
			friction:0.5,
			restitution:0.6,	
		},
		"gato_de_pie":{
			shape:"circle",
			radius:25,
			density:2.0,
			friction:0.5,
			restitution:0.4,	
		},
		"gato_sentado":{
			shape:"circle",
			radius:25,
			density:2.0,
			friction:0.5,
			restitution:0.4,	
		},
		"gato_galleta":{
			shape:"circle",
			radius:25,
			density:2.0,
			friction:0.5,
			restitution:0.4,	
		},
		"gato_donut":{
			shape:"circle",
			radius:25,
			density:2.0,
			friction:0.5,
			restitution:0.4,	
		},
		"gato_tumbado":{
			shape:"circle",
			radius:25,
			density:2.0,
			friction:0.5,
			restitution:0.4,	
		},
		"diamante":{
			shape:"circle",
			fullHealth:10,
			radius:12,
			density:0.0,
			friction:0.0,
			restitution:0.0,
		}
	},
	// Tomar la entidad, crear un cuerpo box2d y aÃ±adirlo al mundo
	create:function(entity){
		var definition = entities.definitions[entity.name];	
		if(!definition){
			console.log ("Undefined entity name",entity.name);
			return;
		}	
		switch(entity.type){
			case "block": // RectÃ¡ngulos simples
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.shape = "rectangle";	
				entity.sprite = loader.loadImage("images/new_entities/"+entity.name+".png");						
				entity.breakSound = game.breakSound[entity.name];
				box2d.createRectangle(entity,definition);				
				break;
			case "ground": // RectÃ¡ngulos simples
				// No hay necesidad de salud. Estos son indestructibles
				entity.shape = "rectangle";  
				// No hay necesidad de sprites. Ã‰stos no serÃ¡n dibujados en absoluto 
				box2d.createRectangle(entity,definition);			   
				break;	
			case "hero":
			case "villain": // Pueden ser cÃ­rculos o rectÃ¡ngulos
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.sprite = loader.loadImage("images/new_entities/"+entity.name+".png");
				entity.shape = definition.shape;  
				entity.bounceSound = game.bounceSound;
				if(definition.shape == "circle"){
					entity.radius = definition.radius;
					box2d.createCircle(entity,definition);					
				} else if(definition.shape == "rectangle"){
					entity.width = definition.width;
					entity.height = definition.height;
					box2d.createRectangle(entity,definition);					
				}												 
				break;
			case "coin": //Son círculos
				entity.health = definition.fullHealth;
				entity.fullHealth = definition.fullHealth;
				entity.sprite = loader.loadImage("images/new_entities/"+entity.name+".png");
				entity.breakSound = game.breakSound[entity.name];
				entity.shape = definition.shape;  
				entity.bounceSound = game.bounceSound;
				entity.radius = definition.radius;
				box2d.createCircle(entity,definition);											 
				break;						
			default:
				console.log("Undefined entity type",entity.type);
				break;
		}		
	},

	// Tomar la entidad, su posiciÃ³n y Ã¡ngulo y dibujar en el lienzo de juego
	draw:function(entity,position,angle){
		game.context.translate(position.x*box2d.scale-game.offsetLeft,position.y*box2d.scale);
		game.context.rotate(angle);
		switch (entity.type){
			case "block":
				game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
						-entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);	
			break;
			case "coin":
			case "villain":
			case "hero": 
				if (entity.shape=="circle"){
					game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
							-entity.radius-1,-entity.radius-1,entity.radius*2+2,entity.radius*2+2);	
				} else if (entity.shape=="rectangle"){
					game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
							-entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);
				}
				break;				
			case "ground":
				// No hacer nada ... Vamos a dibujar objetos como el suelo y la honda por separado
				break;
		}

		game.context.rotate(-angle);
		game.context.translate(-position.x*box2d.scale+game.offsetLeft,-position.y*box2d.scale);
	}

}

var box2d = {
	scale:30,
	init:function(){
		// Configurar el mundo de box2d que harÃ¡ la mayorÃ­a de los cÃ¡lculos de la fÃ­sica
		var gravity = new b2Vec2(0,9.8); //Declara la gravedad como 9,8 m / s ^ 2 hacia abajo
		var allowSleep = true; //Permita que los objetos que estÃ¡n en reposo se queden dormidos y se excluyan de los cÃ¡lculos
		box2d.world = new b2World(gravity,allowSleep);

		// Configurar depuraciÃ³n de dibujo
		var debugContext = document.getElementById('debugcanvas').getContext('2d');
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(debugContext);
		debugDraw.SetDrawScale(box2d.scale);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);	
		box2d.world.SetDebugDraw(debugDraw);
	
		var listener = new Box2D.Dynamics.b2ContactListener;
		listener.PostSolve = function(contact,impulse){
			var body1 = contact.GetFixtureA().GetBody();
			var body2 = contact.GetFixtureB().GetBody();
			var entity1 = body1.GetUserData();
			var entity2 = body2.GetUserData();

			var impulseAlongNormal = Math.abs(impulse.normalImpulses[0]);
			// Este listener es llamado con mucha frecuencia. Filtra los impulsos muy prqueÃ±os.
			// DespuÃ©s de probar diferentes valores, 5 parece funcionar bien
			if(impulseAlongNormal>5){
				// Si los objetos tienen una salud, reduzca la salud por el valor del impulso			
				if (entity1.health){
					entity1.health -= impulseAlongNormal;
				}	

				if (entity2.health){
					entity2.health -= impulseAlongNormal;
				}	
		
				// Si los objetos tienen un sonido de rebote, reproducirlos				
				if (entity1.bounceSound){
					entity1.bounceSound.play();
				}

				if (entity2.bounceSound){
					entity2.bounceSound.play();
				}
			} 
		};
		box2d.world.SetContactListener(listener);
	},  
	step:function(timeStep){
		// velocidad de las iteraciones = 8
		// posiciÃ³n de las iteraciones = 3
		box2d.world.Step(timeStep,8,3);
	},
	createRectangle:function(entity,definition){
			var bodyDef = new b2BodyDef;
			if(entity.isStatic){
				bodyDef.type = b2Body.b2_staticBody;
			} else {
				bodyDef.type = b2Body.b2_dynamicBody;
			}
			
			bodyDef.position.x = entity.x/box2d.scale;
			bodyDef.position.y = entity.y/box2d.scale;
			if (entity.angle) {
				bodyDef.angle = Math.PI*entity.angle/180;
			}
			
			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = definition.density;
			fixtureDef.friction = definition.friction;
			fixtureDef.restitution = definition.restitution;

			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox(entity.width/2/box2d.scale,entity.height/2/box2d.scale);
			
			var body = box2d.world.CreateBody(bodyDef);	
			body.SetUserData(entity);
			
			var fixture = body.CreateFixture(fixtureDef);
			return body;
	},
	
	createCircle:function(entity,definition){
			var bodyDef = new b2BodyDef;
			if(entity.isStatic){
				bodyDef.type = b2Body.b2_staticBody;
			} else {
				bodyDef.type = b2Body.b2_dynamicBody;
			}
			
			bodyDef.position.x = entity.x/box2d.scale;
			bodyDef.position.y = entity.y/box2d.scale;
			
			if (entity.angle) {
				bodyDef.angle = Math.PI*entity.angle/180;
			}			
			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = definition.density;
			fixtureDef.friction = definition.friction;
			fixtureDef.restitution = definition.restitution;

			fixtureDef.shape = new b2CircleShape(entity.radius/box2d.scale);
			
			var body = box2d.world.CreateBody(bodyDef);	
			body.SetUserData(entity);

			var fixture = body.CreateFixture(fixtureDef);
			return body;
	},  
}


var loader = {
	loaded:true,
	loadedCount:0, // Los assets que se han cargado hasta ahora
	totalCount:0, // NÃºmero total de assets que deben cargarse
	
	init:function(){
		// Comprobar si hay soporte de sonido
		var mp3Support,oggSupport;
		var audio = document.createElement('audio');
		if (audio.canPlayType) {
	   		// Actualmente canPlayType() devuelve: "", "maybe" o "probably" 
	  		mp3Support = "" != audio.canPlayType('audio/mpeg');
	  		oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
		} else {
			// La etiqueta de audio no es soportada
			mp3Support = false;
			oggSupport = false;	
		}

		// Comprobar para ogg, despuÃ©s mp3, y finalmente fijar soundFileExtn a indefinido
		loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;		
	},
	
	loadImage:function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var image = new Image();
		image.src = url;
		image.onload = loader.itemLoaded;
		return image;
	},
	soundFileExtn:".ogg",
	loadSound:function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var audio = new Audio();
		audio.src = url+loader.soundFileExtn;
		audio.addEventListener("canplaythrough", loader.itemLoaded, false);
		return audio;   
	},
	itemLoaded:function(){
		loader.loadedCount++;
		$('#loadingmessage').html('Loaded '+loader.loadedCount+' of '+loader.totalCount);
		if (loader.loadedCount == loader.totalCount){
			// Loader se ha cargado completamente. . .
			loader.loaded = true;
			// Ocultar la pantalla de carga
			$('#loadingscreen').hide();
			//Y llamar al mÃ©todo loader.onload si existe
			if(loader.onload){
				loader.onload();
				loader.onload = undefined;
			}
		}
	},
	resetCounts:function(){
		loader.loadedCount = 0;
		loader.totalCount = 0;
	},
	resetLoadedCount(){
		loader.loadedCount = 0;
	}
}

var mouse = {
	x:0,
	y:0,
	down:false,
	init:function(){
		$('#gamecanvas').mousemove(mouse.mousemovehandler);
		$('#gamecanvas').mousedown(mouse.mousedownhandler);
		$('#gamecanvas').mouseup(mouse.mouseuphandler);
		$('#gamecanvas').mouseout(mouse.mouseuphandler);
	},
	mousemovehandler:function(ev){
		var offset = $('#gamecanvas').offset();
		
		mouse.x = ev.pageX - offset.left;
		mouse.y = ev.pageY - offset.top;
		
		if (mouse.down) {
			mouse.dragging = true;
		}
	},
	mousedownhandler:function(ev){
		mouse.down = true;
		mouse.downX = mouse.x;
		mouse.downY = mouse.y;
		ev.originalEvent.preventDefault();
		
	},
	mouseuphandler:function(ev){
		mouse.down = false;
		mouse.dragging = false;
	}
}

