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

        //Animar los personajes
            var currentTime = new Date().getTime();
            var timeStep;
            if(game.lastUpdateTime){
                timeStep = (currentTime - game.lastUpdateTime)/1000;
                box2d.step(timeStep);
            }
            game.lastUpdateTime = currentTime;

        // Dibuja el fondo con desplazamiento (parallax scrolling)
        game.context.drawImage(game.currentLevel.backgroundImage, game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage, game.offsetLeft,0,640,480,0,0,640,480);

        // Dibuja la honda
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        //Dibuja todos los cuerpos
        game.drawAllBodies();

        //Dibuja el fente de la onda
        game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        if (!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    },

    drawAllBodies:function(){
        box2d.world.DrawDebugData();
        // Iterar a través de todos los cuerpos y dibujarlos sobre el canvas del juego
        for(var body = box2d.world.GetBodyList(); body; body = body.GetNext()){
            var entity = body.GetUserData();

            if(entity){
                var entityX = body.GetPosition().x*box2d.scale;
                if(entityX<0|| entityX>game.currentLevel.foregroundImage.width||(entity.health && entity.health<0)){
                    box2d.world.DestroyBody(body);
                    if(entity.type=="villain"){
                        game.score += entity.calories;
                        $('#score').html('Score: '+game.score);
                    }
                    if (entity.breakSound){
                        entity.breakSound.play();
                    } else {
                        entities.draw(entity,body.GetPosition(),body.GetAngle())
                    }
                }
            }
        }
    },

    countHeroesAndVillains:function(){
        game.heroes = [];
        game.villains = [];
        for(var body = box2d.world.GetBodyList(); body; body = body.GetNext()){
            var entity = body.GetUserData();
            if (entity){
                if(entity.type == "hero"){
                    game.heroes.push(body);
                } else if (entity.type == "villain"){
                    game.villains.push(body);
                }
            }
        }
    },

    handlePanning:function(){
        if(game.mode=="intro"){
            if(game.panTo(700)){
                game.mode = "load-next-hero";
            }
        }

        if(game.mode=="wait-for-firing"){
            game.panTo(game.slingshotX);
        }

        if(game.mode == "firing"){
            game.panTo(game.slingshotX);
        }

        if(game.mode =="fired"){
            // TODO:
            //Vista panorámica donde el héroe se encuentra actualmente es...
        }

        if(game.mode =="load-next-hero"){
            game.countHeroesAndVillains();
        }

        //Comprobar si algún villano está vivo, si no, termine el nivel (éxito)
        if(game.villains.length==0){
            game.mode="level-success";
            return;
        }

        //Comprobar si hay más héroes para cargar, si no terminar el nivel (fallo)
        if(game.heroes.length==0){
            game.mode ="level-failure"
            return;
        }

        //Cargar el héroe y establecer el modo de espera para disparar (wait-for-firing)
        if(!game.currentHero){
            game.currentHero = game.heroes[game.heroes.length-1];
            game.currentHero.SetPosition({x:180/box2d.scale,y:200/box2d.scale});
            game.currentHero.SetLinearVelocity({x:0,y:0});
            game.currentHero.SetAngularVelocity(0);
            game.currentHero.SetAwake(true);
        } else {
            //Espere a que el héroe deje de rebotar y se duerma y luego cambie a espera para disparar (wait-for-firing)
            game.panTo(game.slingshotX);
            if(!game.currentHero.IsAwake()){
                game.mode = "wait-for-firing";
            }
        }
    }
}


var levels = {
    // Nivel de datos
    data:[
        { // Primer nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities:[
                {type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
                {type:"ground", name:"wood", x:185,y:390,width:30,height:80,isStatic:true},

                {type:"block", name:"wood", x:520,y:380,angle:90,width:100,height:25},
                {type:"block", name:"glass", x:520,y:280,angle:90,width:100,height:25},
                {type:"villain", name:"burger", x:520,y:205,calories:590},

                {type:"block", name:"wood", x:620,y:380,angle:90,width:100,height:25},
                {type:"block", name:"glass", x:620,y:280,angle:90,width:100,height:25},
                {type:"villain", name:"wood", x:620,y:205,calories:420},

                {type:"hero", name:"orange", x:80,y:405},
                {type:"hero", name:"apple", x:140,y:405},
            ]
        },
        { // Segundo nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities:[
                {type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
                {type:"ground", name:"wood", x:185,y:390,width:30,height:80,isStatic:true},

                {type:"block", name:"wood", x:820,y:380,angle:90,width:100,height:25},
                {type:"block", name:"wood", x:720,y:380,angle:90,width:100,height:25},
                {type:"block", name:"wood", x:620,y:380,angle:90,width:100,height:25},
                {type:"block", name:"glass", x:670,y:317.5,width:100,height:25},
                {type:"block", name:"glass", x:770,y:317.5,width:100,height:25},

                {type:"block", name:"glass", x:670,y:255,angle:90,width:100,height:25},
                {type:"block", name:"glass", x:770,y:255,angle:90,width:100,height:25},
                {type:"block", name:"wood", x:720,y:192.5,width:100,height:25},

                {type:"villain", name:"burger", x:715,y:155,calories:590},
                {type:"villain", name:"fries", x:670,y:405,calories:420},
                {type:"villain", name:"sodacan", x:765,y:400,calories:150},

                {type:"hero", name:"strawberry", x:30,y:415},
                {type:"hero", name:"orange", x:80,y:405},
                {type:"hero", name:"apple", x:140,y:405},
            ]
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
        
        //Inicializar box2d world cada vez que se carga un nivel
        box2d.init();

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

        //Cargar todas las entidades
        for(var i = level.entities.length - 1; i>=0; i--){
            var entity = level.entities[i];
            entities.create(entity);
        }

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
    game.context.translate(position.x*box2d.scale-game.offsetLeft,position.y*box2d.scale);
    game.context.rotate(angle);
    switch(entity.type){
        case "block":
            game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
                -entity.width/2-1,-entity.height/2-1,entityl.width+2,entity.height+2);
        break;
        case "villain":
        case "hero":
            if(entity.shape=="circle"){
                game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
                    -entity.radius-1,-entity.radius-1,entity.radius*2+2,entity.radius*2+2);
            } else if (entity.shape=="rectangle"){
                game.context.drawImage(entity.sprite,0,0,entity.sprite.width,entity.sprite.height,
                    -entity.width/2-1,-entity.height/2-1,entity.width+2,entity.height+2);
            }
            break;
        case "ground":
            //No hacer nada... Vamos a dibujar objetos como el suelo y la honda por separado
            break;
    }

    game.context.rotate(-angle);
    game.context.translate(-position.x*box2d.scale+game.offsetLeft,-position.y*box2d.scale);
}
}

var box2d = {
    scale:30,
    init:function(){
        //Configurar el mundo de box2d que hará la mayoría de ellos cálculo de física
        var gravity = new b2Vec2(0,9.8); //Declara la gravedad como 9.8 m / s ^ 2 hacia abajo
        var allowSleep = true; //Permitir que los objetos que están en reposo se queden dormidos y se excluyan de los cálculos
        box2d.world = new b2World(gravity, allowSleep);

        //Configurar la depuración del dibujo
        var debugContext = document.getElementById('debugcanvas').getContext('2d');
        var debugDraw = new b2DebugDraw();
        debugDraw.SetSprite(debugContext);
        debugDraw.SetDrawScale(box2d.scale);
        debugDraw.SetFillAlpha(0.3);
        debugDraw.SetFillAlpha(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        box2d.world.setupDebugDraw(debugDraw);
    },

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
        },

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
        },

        step:function(timeStep){
            //velocidad de las iteraciones = 8
            //posición de las iteraciones = 3
            if(timeStep > 2/60){
                timeStep = 2/60
            }
            box2d.world.Step(timeStep,8,3);
        }
    }
