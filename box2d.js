//Declarar objetos utilizados como variables
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

var world;
var scale = 30; //30 píxeles en el canvas equivalen a 1 metro en el mundo Box2d
function init(){
	//Configuración del mundo Box2d que realizará la mayor parte del cálculo de la física
	var gravity = new b2Vec2(0, 9.8); //Declara la gravedad como 9.8 m/s^2
	var allowSleep = true; //Permite que los objetos que están en reposo se queden dormidos y se excluyan de los cálculos

	world = new b2World(gravity, allowSleep);

	createFloor();

	//Crear algunos cuerpos con formas simples
	createRectangularBody();
	createCircularBody();
	createSimplePolygonBody();
	//Crear un cuerpo combinando dos formas
	createComplexBody();
	//Unir dos cuerpos mediante una articulación (revolute joint)
	createRevoluteJoint();

	setupDebugDraw();
	animate();
}

var timeStep = 1/60;

//La iteración sugerida para Box2D es 8 para velocidad y 3 para posición.
var velocityIterations = 8;
var positionIterations = 3;

function animate(){
	world.Step(timeStep, velocityIterations, positionIterations);
	world.ClearForces();

	world.DrawDebugData();

	setTimeout(animate, timeStep);
}

function createFloor(){
	//Un definición Body que tiene todos los datos necesarios para contruir un cuerpo rígido.
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_staticBody;
	bodyDef.position.x = 640/2/scale;
	bodyDef.position.y = 450/scale;

	//Un accesorio se utiliza para unir una forma a un cuerpo para la detección de colisiones.
	//La definición de un accesorio se utiliza para crear un fixture.
	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.5;
	fixtureDef.restitution = 0.2;

	fixtureDef.shape = new b2PolygonShape;
	fixtureDef.shape.SetAsBox(320/scale, 10/scale); //640 píxeles de ancho por 20 píxeles de alto

	var body = world.CreateBody(bodyDef);
	var fixture = body.CreateFixture(fixtureDef);

}

var context;
function setupDebugDraw(){
	context = document.getElementById('canvas').getContext('2d');

	var debugDraw = new b2DebugDraw();

	//Utilizar este contexto para dibujar la pantalla de depuración
	debugDraw.SetSprite(context);
	//Fijar la escala
	debugDraw.SetDrawScale(scale);
	//Rellenar las cajas con transparencia de 0.3
	debugDraw.SetFillAlpha(0.3);
	//Dibujar líneas con espesor de 1
	debugDraw.SetLineThickness(1.0);
	//Mostrar todas las formas y uniones
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

	//Empezar a utilizar el dibujo de depuración en el mundo
	world.SetDebugDraw(debugDraw);
}

function createRectangularBody(){
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.x = 40/scale;
	bodyDef.position.y = 100/scale;

	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.5;
	fixtureDef.restitution = 0.3;

	fixtureDef.shape = new b2PolygonShape;
	fixtureDef.shape.SetAsBox(30/scale, 50/scale);

	var body = world.CreateBody(bodyDef);
	var fixture = body.CreateFixture(fixtureDef);
}

function createCircularBody(){
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.x = 130/scale;
	bodyDef.position.y = 100/scale;

	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.5;
	fixtureDef.restitution = 0.7;

	fixtureDef.shape = new b2CircleShape(30/scale);

	var body = world.CreateBody(bodyDef);
	var fixture = body.CreateFixture(fixtureDef);
}

function createSimplePolygonBody(){
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.x = 230/scale;
	bodyDef.position.y = 50/scale;

	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.5;
	fixtureDef.restitution = 0.2;

	fixtureDef.shape = new b2PolygonShape;

	//Crear array de puntos b2vec2 en la dirección de las agujas del reloj
	var points = [
		new b2Vec2(0,0),
		new b2Vec2(40/scale, 50/scale),
		new b2Vec2(50/scale, 100/scale),
		new b2Vec2(-50/scale, 100/scale),
		new b2Vec2(-40/scale, 50/scale),
	];

	//Usar SetAsArray para definir la forma utilizando el array de puntos
	fixtureDef.shape.SetAsArray(points, points.length);

	var body = world.CreateBody(bodyDef);

	var fixture = body.CreateFixture(fixtureDef);
}

function createComplexBody(){
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.x = 350/scale;
	bodyDef.position.y = 50/scale;
	var body = world.CreateBody(bodyDef);

	//Crear el primer accesorio y añadir una forma circular al cuerpo
	var fixtureDef = new b2FixtureDef;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.5;
	fixtureDef.restitution = 0.7;
	fixtureDef.shape = new b2CircleShape(40/scale);
	body.CreateFixture(fixtureDef);

	//Crear el segundo accesotio y añadir una forma poligonal al cuerpo
	fixtureDef.shape = new b2PolygonShape;
	var points = [
		new b2Vec2(0,0),
		new b2Vec2(40/scale, 50/scale),
		new b2Vec2(50/scale, 100/scale),
		new b2Vec2(-50/scale, 100/scale),
		new b2Vec2(-40/scale, 50/scale),
	];
	fixtureDef.shape.SetAsArray(points, points.length);
	body.CreateFixture(fixtureDef);
}

function createRevoluteJoint(){
	//Definir el primer cuerpo
	var bodyDef1 = new b2BodyDef;
	bodyDef1.type = b2Body.b2_dynamicBody;
	bodyDef1.position.x = 480/scale;
	bodyDef1.position.y = 50/scale;
	var body1 = world.CreateBody(bodyDef1);

	//Crear el primer accesorio y añadir la forma rectangular al cuerpo
	var fixtureDef1 =  new b2FixtureDef;
	fixtureDef1.density = 1.0;
	fixtureDef1.friction = 0.5;
	fixtureDef1.restitution = 0.5;
	fixtureDef1.shape = new b2PolygonShape;
	fixtureDef1.shape.SetAsBox(50/scale, 10/scale);

	body1.CreateFixture(fixtureDef1);

	//Definir el segundo cuerpo
	var bodyDef2 = new b2BodyDef;
	bodyDef2.type = b2Body.b2_dynamicBody;
	bodyDef2.position.x = 470/scale;
	bodyDef2.position.y = 50/scale;
	var body2 = world.CreateBody(bodyDef2);

	//Crear el segundo accesorio y añadir un polígono al cuerpo
	var fixtureDef2 = new b2FixtureDef;
	fixtureDef2.density = 1.0;
	fixtureDef2.friction = 0.5;
	fixtureDef2.restitution = 0.5;
	fixtureDef2.shape = new b2PolygonShape;
	var points = [
		new b2Vec2(0,0),
		new b2Vec2(40/scale, 50/scale),
		new b2Vec2(50/scale, 100/scale),
		new b2Vec2(-50/scale, 100/scale),
		new b2Vec2(-40/scale, 50/scale),
	];
	fixtureDef2.shape.SetAsArray(points, points.length);
	body2.CreateFixture(fixtureDef2);

	//Crear una articulación ente el body1 y el body2
	var jointDef = new b2RevoluteJointDef;
	var jointCenter = new b2Vec2(470/scale, 50/scale);

	jointDef.Initialize(body1, body2, jointCenter);
	world.CreateJoint(jointDef);


}