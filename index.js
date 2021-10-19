import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import metaversefile from 'metaversefile';
const {useApp, usePhysics, useCleanup, useFrame} = metaversefile;







const shaderParticleVert = `

uniform float sizeFactor;

attribute float size;
attribute float angle;
attribute float tValue;
attribute vec4 colorAlpha;

varying vec4 vColorAlpha;
varying float vAngle;
varying float vtValue;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * sizeFactor / gl_Position.w;

  vAngle = angle;
  vColorAlpha = colorAlpha;
  vtValue = tValue;
}

`;

const shaderParticleFrag = `

uniform sampler2D diffuseTexture;
uniform vec3 colorStart;
uniform vec3 colorEnd;

varying vec4 vColorAlpha;
varying float vAngle;
varying float vtValue;

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
}

vec3 lerpColor(vec3 color1,vec3 color2,float alpha)
{
    color1.r = color1.r + ( color2.r - color1.r ) * alpha;
    color1.g = color1.g + ( color2.g - color1.g ) * alpha;
    color1.b = color1.b + ( color2.b - color1.b ) * alpha;

    return color1;
}

void main() {

  vec3 tmpColor = lerpColor(colorStart,colorEnd, vtValue);
  vec2 coords = (gl_PointCoord - 0.5) * rotate2d(vAngle) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vec4(tmpColor.r,tmpColor.g,tmpColor.b,1.0);

}
`;

class ParticleContainer
{

    constructor()
    {
        this.particleSystems = [];
    }

    addParticleSystem(ps)
    {
        this.particleSystems.push(ps);
    }

    count()
    {
        var res = 0;
        for(var i=0;i<this.particleSystems.length;i++)
        {
            res += this.particleSystems[i].count();
        }
        return res;
    }

    setVisible(newVisible)
    {
        this.visible = newVisible;
        for(var i=0;i<this.particleSystems.length;i++)
        {
            this.particleSystems[i].setVisible(this.visible);
        }
    }

    changeVisible()
    {
        if (this.visible)
        {
            this.setVisible(false);
        }
        else
        {
            this.setVisible(true);
        }
    }    

    update(dt)
    {
        for(var i=0;i<this.particleSystems.length;i++)
        {
            this.particleSystems[i].update(dt);
        }
    }
}



class ParticleSystem
{

    constructor(params)
    {
        this.texure = new THREE.TextureLoader().load(params.texture);
        this.particles = [];

        this.geometry = null;
        this.points = null;

        this.scaleFactor = (window.innerHeight * window.devicePixelRatio * 0.05) / (window.innerHeight * window.devicePixelRatio);

        this.emitter = params.emitter;
        this.velocity = params.velocity;
        this.colorStart = params.colorStart;
        this.colorEnd = params.colorEnd;
        this.time = params.time;
        this.position = params.position;
        this.spread = params.spread * this.scaleFactor;
        this.size = params.size;
        this.sizeStep = params.sizeStep;
        this.initVelocity = params.initVelocity;

        this.positions = [];
        this.sizes = [];
        this.colors = [];
        this.angles = [];
        this.tValues = [];

        this.initialize(params);

        //console.log(this.scaleFactor);
    }

    initialize(params)
    {
        this.uniforms = {
            diffuseTexture: {
                value: this.texure
            },
            colorStart: { type: 'vec3',
                value: params.colorStart
            },
            colorEnd: {
                type: 'vec3',
                value: params.colorEnd
            },
            sizeFactor: {
                value: window.innerHeight * window.devicePixelRatio * 0.05
            }
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: shaderParticleVert,
            fragmentShader: shaderParticleFrag,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
        this.geometry.setAttribute('colorAlpha', new THREE.Float32BufferAttribute([], 4));
        this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));
        this.geometry.setAttribute('tValue', new THREE.Float32BufferAttribute([], 1));
    
        this.points = new THREE.Points(this.geometry, this.material);
        //this.points.matrix.identity();
        //this.points.matrixWorld.identity();
        //this.points.modelViewMatrix.identity();

        if (params.scene)
        {
            params.scene.add(this.points);
        }
    }

    addParticle()
    {
        var newParticle = {
            position : new THREE.Vector3((Math.random() * this.spread - this.spread*0.5) + this.position.x,(Math.random() * this.spread - this.spread*0.5) +  + this.position.y,(Math.random() * this.spread - this.spread*0.5)  + this.position.z),
            color : this.colorStart.clone(),
            colorEnd : this.colorEnd.clone(),
            alpha : 1.0,
            time : this.time,
            timeStart : this.time,
            velocity : this.initVelocity(),
            size: (Math.random() * this.size + (this.size * 0.5)),
            rotation: Math.random() * 2.0 * Math.PI
        }

        this.particles.push(newParticle);
    }

    setVisible(newVisible)
    {
        this.points.visible = newVisible;
    }

    count()
    {
        return this.particles.length;
    }

    updateGeometryParams()
    {

        // Resize array only if the buffer is to small
        if (this.geometry.attributes.position.count < this.particles.length)
        {
            this.positions.length = 0;
            this.colors.length = 0;
            this.sizes.length = 0;
            this.angles.length = 0;
            this.tValues.length = 0;
    
            for (let part of this.particles) {
                this.positions.push(part.position.x, part.position.y, part.position.z);
                this.colors.push(part.color.r, part.color.g, part.color.b, part.alpha);
                this.sizes.push(part.size);
                this.angles.push(part.rotation);
                this.tValues.push(part.tValue);
            }
    
            this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
            this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));
            this.geometry.setAttribute('colorAlpha', new THREE.Float32BufferAttribute(this.colors, 4));
            this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute(this.angles, 1));
            this.geometry.setAttribute('tValue', new THREE.Float32BufferAttribute(this.tValues, 1));

            //console.log(this.geometry.attributes);
        }
        else
        {
            var part = null;
            for (var i=0;i<this.particles.length;i++) {
                part = this.particles[i];
                this.geometry.attributes.position.setXYZ(i, part.position.x, part.position.y, part.position.z);
                this.geometry.attributes.size.setX(i, part.size);
                this.geometry.attributes.colorAlpha.setXYZW(i, part.color.r, part.color.g, part.color.b, part.alpha);
                this.geometry.attributes.angle.setX(i, part.rotation);
                this.geometry.attributes.tValue.set(i, part.tValue);
            }

            // Only draw active particles
            this.geometry.setDrawRange(0, this.positions.length);

            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.size.needsUpdate = true;
            this.geometry.attributes.colorAlpha.needsUpdate = true;
            this.geometry.attributes.angle.needsUpdate = true;
            this.geometry.attributes.tValue.needsUpdate = true;
                
        }

    }

    update(dt)
    {
        // Create new particles
        var numPartToAdd = this.emitter * dt * 10;
        for(var i=0;i<numPartToAdd;i++)
        {
            this.addParticle();
        }

        for (let p of this.particles) {

            const tVal = 1.0 - p.time / p.timeStart;
            p.tValue = tVal;
            p.time -= dt;
            //p.color.lerp(p.colorEnd,tVal); // We are now lerping color in shader
            p.alpha = 1.0 * tVal;
            p.size += dt * this.sizeStep;
            p.rotation = 3;

            p.position.add(p.velocity.clone().multiplyScalar(dt));
        }

        this.particles = this.particles.filter(p => {
            return p.time > 0.0;
        });

        this.updateGeometryParams();

    }
}






const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');





export default () => {
    const app = useApp();

    const localPlayer = metaversefile.useLocalPlayer();


    const particleContainer = new ParticleContainer();


    // const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // const material = new THREE.MeshBasicMaterial( {color: 0x999999} );
    // const cube = new THREE.Mesh( geometry, material );
    // cube.position.set(0,0.5,0);

    const texture1 = `${baseUrl}smoke1.png`;
    var particleSpread = new ParticleSystem({
        scene: app, 
        texture: texture1,
        position: new THREE.Vector3(0,0,0),
        emitter: 1.0,
        spread: 3.0,
        initVelocity : () => {return new THREE.Vector3((Math.random() * 50*0.05) - 25*0.05,5*0.05,(Math.random() * 50*0.05) - 25*0.05)},
        colorStart: new THREE.Color(1,0,0),
        colorEnd: new THREE.Color(1,0.9,0),
        size: 1.0,
        sizeStep: 0,
        time: 1.0
    }
    );

    particleContainer.addParticleSystem(particleSpread);



    const texture2 = `${baseUrl}fire1.png`;
    var particleFire1 = new ParticleSystem({
        scene: app, 
        texture: texture2,
        position: new THREE.Vector3(0,20*0.05,0),
        emitter: 0.1,
        spread: 3.0,
        initVelocity : () => {return new THREE.Vector3(0,10*0.05,0);},
        colorStart: new THREE.Color(1,0,0),
        colorEnd: new THREE.Color(1,0.9,0),
        size: 30.0,
        sizeStep: 0,
        time: 0.1
    }
    );

    particleContainer.addParticleSystem(particleFire1);

    const texture3 = `${baseUrl}fire2.png`;
    var particleFire2 = new ParticleSystem({
        scene: app, 
        texture: texture3,
        position: new THREE.Vector3(0,14*0.05,0),
        emitter: 0.01,
        spread: 0.30,
        initVelocity : () => {return new THREE.Vector3(0,20*0.05,0);},
        colorStart: new THREE.Color(1,1,1),
        colorEnd: new THREE.Color(1,0.9,0),
        size: 20.0,
        sizeStep: 100,
        time: 0.06
    }
    );

    particleContainer.addParticleSystem(particleFire2);

    document.addEventListener('keydown', function(event) {
        if (event.code == 'KeyP') {
            particleContainer.changeVisible();
        }
    });


    //app.add(cube);

    const startTime = Date.now();
    let lastTimestamp = startTime;

    useFrame(({timestamp}) => {

        const now = Date.now();
        const timeDiff = (now - lastTimestamp) / 1000.0;
        lastTimestamp = now;


        if (localPlayer) {

            //app.position.copy(localPlayer.position);
            app.position.set(localPlayer.position.x,localPlayer.position.y-1.5,localPlayer.position.z);
            particleContainer.update(timeDiff);

        }
  });

  return app;
};
