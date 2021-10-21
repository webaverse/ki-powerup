import {Vector3,Vector4,TextureLoader,Group,AdditiveBlending,Object3D} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import metaversefile from 'metaversefile';
import {
    Bezier, ColorOverLife, ColorRange,
    ConeEmitter,DonutEmitter, ConstantColor, ConstantValue, FrameOverLife,
    IntervalValue,
    PiecewiseBezier, PointEmitter, RandomColor,
    RenderMode, RotationOverLife,
    SizeOverLife, ParticleSystem, ParticleEmitter, BatchedParticleRenderer
} from "./three.quarks.esm.js";

const {useApp, usePhysics, useCleanup, useFrame, useActivate, useLoaders} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');	





class ParticleDemo {

    batchRenderer = null;
    groups = [];
    totalTime = 0;
    refreshIndex = 0;
    texture = null;
    texture2 = null;
    texture3 = null;
    textureLoadCount = 0;
    isPlaying = false;

    render(delta) {

        this.groups.forEach(group =>
            group.traverse(object => {
                if (object.userData && object.userData.func) {
                    object.userData.func.call(object, delta);
                }
                if (object instanceof ParticleEmitter) {
                    object.system.update(delta);
                }
            })
        );

        while (Math.floor(this.totalTime * 100) > this.refreshIndex) {
            if (this.refreshIndex < this.groups.length) {
                this.groups[this.refreshIndex].traverse(object => {
                    if (object instanceof ParticleEmitter) {
                        if (this.isPlaying)
                        {
                            object.system.restart();
                        }
                    }
                });
            }
            this.refreshIndex++;
        }
        this.totalTime += delta;
        if (this.totalTime > 1) {
            this.totalTime = 0;
            this.refreshIndex = 0;
        }

        if (this.batchRenderer)
            this.batchRenderer.update();
    }
	
	stopPartices()
	{
		this.isPlaying = false;

		this.groups.forEach(group =>
			group.traverse(object => {
				if (object instanceof ParticleEmitter) {
					object.system.endEmit();
				}
			})
		);
	}

    changeVisible()
    {
        if (this.isPlaying)
        {
            this.isPlaying = false;

            this.groups.forEach(group =>
                group.traverse(object => {
                    if (object instanceof ParticleEmitter) {
                        object.system.endEmit();
                    }
                })
            );
        }
        else
        {
            this.isPlaying = true;
        }
    }

    initMuzzleEffect(index) {
        const group = new Group();
		
		const scaleFactor = 0.1;

        

        const flash = new ParticleSystem(this.batchRenderer, {
            duration: 1,
            looping: true,
            startLife: new IntervalValue(0.3, 1),
            startSpeed: new IntervalValue(20*scaleFactor, 30*scaleFactor),
            startSize: new IntervalValue(0.1*scaleFactor, 1*scaleFactor),
            startColor: new ConstantColor(new Vector4(0.7764705882352941, 0.8156862745098039, 0.03137254901960784, 1)),
            worldSpace: false,
            maxParticle: 10,
            emissionOverTime: new ConstantValue(20),
            shape: new ConeEmitter({radius:3*scaleFactor,arc:6.283,thickness:1,angle:0.8}),
            texture: this.texture,
            blending: AdditiveBlending,
            renderMode: RenderMode.BillBoard,
            renderOrder: 2,
        });
        flash.addBehavior(new ColorOverLife(new ColorRange(new Vector4(0.9647058823529412, 0.396078431372549, 0.396078431372549, 1), new Vector4(0.5725490196078431, 0.054901960784313725, 0.054901960784313725, 0))));
        flash.addBehavior(new SizeOverLife(new PiecewiseBezier([[new Bezier(1, 0.95, 0.75, 0), 0]])));
        flash.emitter.name = 'flash';
		flash.emitter.rotation.set(-1.5707963267948966, 0, 0);
		//flash.emitter.position.set(0,0,0);
        group.add(flash.emitter);

        const fire1 = new ParticleSystem(this.batchRenderer, {
            duration: 2,
            looping: true,
            startLife: new IntervalValue(0.1, 0.2),
            startSpeed: new IntervalValue(1*scaleFactor, 2*scaleFactor),
            startSize: new IntervalValue(18*scaleFactor, 20*scaleFactor),
            startColor: new ConstantColor(new Vector4(0.7647058823529411, 0.41568627450980394, 0.12156862745098039, 1)),
            worldSpace: false,
            maxParticle: 5,
            emissionOverTime: new ConstantValue(0.1),
            //shape: new ConeEmitter({radius:0,arc:0,thickness:0,angle:0}),
            shape: new DonutEmitter({radius:0.1*scaleFactor,arc:6.283185307179586,thickness:0,angle:0}),
            texture: this.texture2,
            blending: AdditiveBlending,
            renderMode: RenderMode.BillBoard,
            renderOrder: 2,
        });
        fire1.addBehavior(new ColorOverLife(new ColorRange(new Vector4(0.7058823529411765, 0.4117647058823529, 0.047058823529411764, 1), new Vector4(0.9529411764705882, 0.13725490196078433, 0.050980392156862744, 0))));
        fire1.emitter.name = 'fire1';
		fire1.emitter.rotation.set(-1.5707963267948966, 0, 0);
        fire1.emitter.position.set(0, 12*scaleFactor, 0);
        group.add(fire1.emitter);

        const fire2 = new ParticleSystem(this.batchRenderer, {
            duration: 5,
            looping: true,
            startLife: new IntervalValue(0.05, 0.1),
            startSpeed: new IntervalValue(1*scaleFactor, 2*scaleFactor),
            startSize: new IntervalValue(16*scaleFactor, 18*scaleFactor),
            startColor: new ConstantColor(new Vector4(0.996078431372549, 0.996078431372549, 0.996078431372549, 1)),
            worldSpace: false,
            maxParticle: 5,
            emissionOverTime: new ConstantValue(1),
            //shape: new ConeEmitter({radius:0,arc:0,thickness:0,angle:0}),
            shape: new DonutEmitter({radius:0.05*scaleFactor,arc:6.283185307179586,thickness:0,angle:0}),
            texture: this.texture3,
            blending: AdditiveBlending,
            renderMode: RenderMode.BillBoard,
            renderOrder: 2,
        });
        fire2.addBehavior(new ColorOverLife(new ColorRange(new Vector4(1, 1, 1, 0.3), new Vector4(0.3058823529411765, 0.2980392156862745, 0.2980392156862745, 0.0))));
        fire2.emitter.renderOrder = 0;
        fire2.emitter.name = 'fire1';
		fire2.emitter.rotation.set(-1.5707963267948966, 0, 0);
        fire2.emitter.position.set(0, 10*scaleFactor, 0);
        group.add(fire2.emitter);


        //group.position.set(Math.floor(index / 10) * 2 - 10, 0, (index % 10) * 2 - 10);
		//group.position.set(0,0,0);
        group.visible = false;
		//group.scale.set(0.01,0.01,0.01);
        this.scene.add(group);
        this.groups.push(group);
		
		
		
		
		
    }

    loadingFinished()
    {
        this.batchRenderer = new BatchedParticleRenderer();
        this.scene.add(this.batchRenderer);

        for (let i = 0; i < 100; i++) {
            this.initMuzzleEffect(i);
        }
		
		this.stopPartices();
    }

    initScene(tmpScene) {
        this.scene = tmpScene;
		
		this.opa = new Vector3(0,0,0);

        this.texture = new TextureLoader().load(baseUrl+"textures/smoke.png", (texture) => {
            this.texture.name = baseUrl+"textures/smoke.png";
            this.textureLoadCount++;

            if (this.textureLoadCount > 2)
            {
                this.loadingFinished();
            }
        });

        this.texture2 = new TextureLoader().load(baseUrl+"textures/fire1.png", (texture) => {
            this.texture2.name = baseUrl+"textures/fire1.png";
            this.textureLoadCount++;

            if (this.textureLoadCount > 2)
            {
                this.loadingFinished();
            }
        });
        this.texture3 = new TextureLoader().load(baseUrl+"textures/fire2.png", (texture) => {
            this.texture3.name = baseUrl+"textures/fire2.png";
            this.textureLoadCount++;

            if (this.textureLoadCount > 2)
            {
                this.loadingFinished();
            }
        });        
        return this.scene;
    }
	
	setPosition(pos)
	{
		if (this.batchRenderer)
		{
			this.batchRenderer.position.copy(pos);
		}
	}
	
}






















































export default () => {
	
	let activateCb = null;
	
    const app = useApp();
	const physics = usePhysics();
	const itemPos = new Vector3(app.position.x,app.position.y,app.position.z);
	
    const localPlayer = metaversefile.useLocalPlayer();
	
	var demo = new ParticleDemo();
    demo.initScene(app);
	
	
	let physicsIds = [];
	(async () => {
		const u = baseUrl+"power.glb";
		let o = await new Promise((accept, reject) => {
		  const {gltfLoader} = useLoaders();
		  gltfLoader.load(u, accept, function onprogress() {}, reject);
		});
		o = o.scene;
		o.scale.set(0.1,0.1,0.1);
		app.add(o);
		

		const physicsId = physics.addGeometry(o);
		physicsIds.push(physicsId);
		
	})();	
	
	activateCb = () => {
		demo.changeVisible();
	};

	useActivate(() => {
		activateCb && activateCb();
	});
	
	useCleanup(() => {
		for (const physicsId of physicsIds) {
			physics.removeGeometry(physicsId);
		}
	});

    const startTime = Date.now();
    let lastTimestamp = startTime;

    useFrame(({timestamp}) => {

        const now = Date.now();
        const timeDiff = (now - lastTimestamp) / 1000.0;
        lastTimestamp = now;

        if (localPlayer) {
			demo.setPosition(new Vector3(localPlayer.position.x - itemPos.x * 2, localPlayer.position.y - 1.4, localPlayer.position.z - itemPos.z * 2));
			demo.render(timeDiff);
        }
  });

  return app;
};
