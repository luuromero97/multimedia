// Preparar requestAnimationFrame y cancelAnimationFrame para su uso en el código del juego
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
            window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if(!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    
    if(!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

$(window).load(function() {
    game.init();
});

var game = {
    // Comenzar inicialización de objetos, precarga de elementos y pantalla de inicio
    init: function(){

    	//Incializar objetos
    	levels.init();
        loader.init(); //NO SALE PANTALLA DE CARGA? DIAPO 28 MUNDOBASICO
        mouse.init();

        // Ocultar todas las capas del juego y mostrar la pantalla de inicio
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        //Obtener manejador para el canvas del juego y el contexto
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    },

    showLevelScreen:function(){
    	$('.gamelayer').hide();
    	$('#levelselectscreen').show('slow');
    },

    // Modo Game
    mode:"intro",
    // Coordenadas X & Y de la honda
    slingshotX:140,
    slingshotY:280,

    start:function(){
        $('.gamelayer').hide();
        // Mostrar el canvas del juego y la puntuación
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    //Velocidad máxima de panoramización por fotograma en píxeles
    maxSpeed: 3,
    //Mínimo y Máximo desplazamiento panorámico
    minOffset: 0,
    maxOffset: 300,
    //Desplazamiento de panorámica actual
    offsetLeft: 0,
    //La puntuación del juego
    score: 0,

    //Desplegar la pantalla para centrarse en newCenter
    panTo:function(newCenter){
    	if(Math.abs(newCenter-game.offsetLeft-game.canvas.width/4) > 0 
    		&& game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){

    		var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
    		if(deltaX && Math.abs(deltaX)>game.maxSpeed){
    			deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
    		}
    		game.offsetLeft += deltaX;
    	}else{
    		return true;
    	}
    	if(game.offsetLeft < game.minOffset){
    		game.offsetLeft = game.minOffset;
    		return true;
    	}else if (game.offsetLeft > game.maxOffset){
    		game.offsetLeft = game.maxOffset;
    		return true;
    	}
    	return false;
    },

    handlePanning: function(){
        if(game.mode=="intro"){
        	if(game.panTo(700)){
        		game.mode = "load-next-hero";
        	}
        }

        if(game.mode == "wait-for-firing"){
        	if(mouse.dragging){
        		game.panTo(mouse.x + game.offsetLeft)
        	}else{
        		game.panTo(game.slingshotX);
        	}
        }

        if(game.mode == "load-next-hero"){
        	//TODO:
        	//Comprobar si algún villano está vivo, si no, terminar el nivel (éxito)
        	//Comproobar si quedan más heroes para cargar, si no, terminar el nivel (fallo)
        	//Cargar el héroe y fijar a modo de espera para disparar
        	game.mode="wait-for-fairing";
        }

        if(game.mode == "firing"){
        	game.panTo(game.slingshotX);
        }

        if(game.mode == "fired"){
        	//TODO:
        	//Hacer una panorámica donde quiera que el héroe se encuentre actualmente
        }

    },
    
    animate: function(){
        // Anima el fondo
        game.handlePanning();

        // Anima los personajes

        // Dibuja el fondo con desplazamiento (parallax scrolling)
        game.context.drawImage(game.currentLevel.backgroundImage, game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage, game.offsetLeft,0,640,480,0,0,640,480);

        // Dibuja la honda
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        if (!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    }
}


var levels = {
    // Nivel de datos
    data:[
        { // Primer nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities:[]
        },
        { // Segundo nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities:[]
        }
    ],
    // Inicializa la pantalla de selección de nivel
    init:function(){
        var html = "";

        //POr cada nivel agrega un botón para ir al nivel
        for (var i=0; i < levels.data.length; i++){
            var level = levels.data[i];
            html += '<input type="button" value="'+(i+1)+'">';
        };
        $('#levelselectscreen').html(html);
        
        // Establece los controladores de eventos de clic de botón para cargar el nivel
        $('#levelselectscreen input').click(function(){
            levels.load(this.value-1);
            $('#levelselectscreen').hide();
        });
    },

    // Cargar todos los datos e imágenes para un nivel específico
    load:function(number){
        
        // declarar un nuevo objeto de nivel actual
        game.currentLevel = {number:number,hero:[]};
        game.score=0;
        $('#score').html('Score: '+game.score);
        var level = levels.data[number];

        //Cargar el fondo, el primer plano y las imágenes de la honda
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/"+level.background+".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/"+level.foreground+".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");

        //Llamar a game.start() cuando los assets se hayan cargado
        if(loader.loaded){
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
}

var loader = {
    loaded:true,
    loadedCount:0, // Assets que han sido cargados antes
    totalCount:0, // Número total de assets que es necesario cargar

    init:function(){
        // Comprueba el soporte para sonido
        var mp3Support,oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            // Actualmente canPlayType() devuelve: "", "maybe" o "probably"
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
        } else {
            //La etiqueta de audio no es soportada
            mp3Support = false;
            oggSupport = false;
        }

        // Comprueba para ogg, mp3 y finalmente fija soundFileExtn como undefined
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
        if (loader.loadedCount === loader.totalCount){
            // El loader ha cargado completamente...
            loader.loaded = true;
            // Oculta la pantalla de carga
            $('#loadingscreen').hide();
            //Y llama al método loader.onload si este existe
            if(loader.onload){
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}

var mouse = {
	x: 0,
	y: 0,
	down: false,
	init: function(){
		$('#gamecanvas').mousemove(mouse.mousemovehandler);
		$('#gamecanvas').mousedown(mouse.mousedownhandler);
		$('#gamecanvas').mouseup(mouse.mouseuphandler);
		$('#gamecanvas').mouseout(mouse.mouseuphandler);
	},
	mousemovehandler:function(ev){
		var offset = $('#gamecanvas').offset();

		mouse.x = ev.pageX - offset.left;
		mouse.y = ev.PageY - offset.top;

		if(mouse.down){
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

var entities = {
    definitions:{
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
        "dirt":{
            density:3.0,
            friction:1.5,
            restitution:0.2,
        },
        "burger":{
            shape:"circle",
            fullHealth:40,
            radius:25,
            density:1,
            friction:0.5,
            restitution:0.4,
        },
        "sodacan":{
            fullHealth:500,
            density:0.7,
            friction:0.4,
            restitution:0.4,
        },
        "fries":{
            shape:"rectangle",
            fullHealth:50,
            width:40,
            height:50,
            density:1,
            friction:0.5,
            restitution:0.6,
        },
        "apple":{
            shape:"circle",
            radius:25,
            density:1.5,
            friction:0.5,
            restitution:0.4,
        },
        "orange":{
            shape:"circle",
            radius:25,
            density:1.5,
            friction:0.5,
            restitution:0.4,
        },
        "strawberry":{
            shape:"circle",
            radius:15,
            density:2.0,
            friction:0.5,
            restitution:0.4,
        }
    },
//Tomar la entidad, crear un cuerpo Box2D y añadirlo al mundo
create:function(entity){
	var definition = entities.definitions[entity.name];
	if(!definitions){
		console.log("Undefined entity name", entity.name);
		return;
	}
	switch(entity.type){
		case "block": //Rectángulos simples
			entity.health = definition.fullHealth;
			entity.fullHealth = definition.fullHealth;
			entity.shape = "rectangle";
			entity.sprite = loader.loadImage("iimages/entities/"+entity.name+".png");
			entity.breakSound = game.breakSound[entity.name];
			box2d.createRectangle(entity.definition);
			break;
		case "ground": //Rectángulos simples
			//No necesitan salud, son indestructibles
			entity.shape = "rectangle";
			//No hay necesidad de sprites. Estos no serán dibujados en absoluto.
			box2d.createRectangle(entity.definition);
			break;
		case "hero": //Círculos simples
		case "villain": //Pueden ser círculos o rectángulos
			entity.health = definition.fullHealth;
			entity.fullHealth = definition.fullHealth;
			entity.sprite = loader.loadImage("images/entities/"+entity.name+".png");
			entity.shape = definition.shape;
			entity.bounceSound = game.bounceSound;
			if(definition.shape == "circle"){
				entity.radius = definition.radius;
				box2d.createCircle(entity.definition);
			} else if (definition.shape == "rectangle"){
				entity.width = definition.width;
				entity.height = definition.height;
				box2d.createRectangle(entity.definition);
			}
			break;
		default:
			console.log("Undefined entity type", entity.type);
			break;
	}
},

//Tomar la entidad, su posición y su ángulo y dibujarlo en el canvas del juego
draw:function(entity, position, angle){

}
}

var box2d = {
    scale:30,
    init:function(){
        //Configurar el mundo de box2d que hará la mayoría de ellos cálculo de física
        var gravity = new b2Vec2(0,9.8); //Declara la gravedad como 9.8 m / s ^ 2 hacia abajo
        var allowSleep = true; //Permitir que los objetos que están en reposo se queden dormidos y se excluyan de los cálculos
        box2d.world = new b2World(gravity, allowSleep);

        createRectangle:function(entity,definition){
            var bodyDef = new b2BodyDef;
            if(entity.isStatic){
                bodyDef.type = b2Body.b2_staticBody;
            } else {
                bodyDef.type = b2Body.b2_dinamicBody;
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
        };

        createCircle: function(entity,definition){
            var bodyDef = new b2BodyDef;
            if(entity.isStatic){
                bodyDef.type = b2Body.b2_staticBody;
            } else {
                bodyDef.type = b2Body.b2_dinamicBody;
            }

            bodyDef.position.x = entity.x/box2d.scale;
            bodyDef.position.y = entity.y/box2d.scale;

            if(entity.angle){
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
        }
    }
}