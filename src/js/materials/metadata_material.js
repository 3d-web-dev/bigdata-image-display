import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
import { def } from '../def.js';

var MetaDataMaterial = function (exports) {
    var MetadataMaterialVertexShader = `
        precision highp float;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
        }
    `;

    var MetadataMaterialFragmentShader = `
        precision highp float;
        #define borderColor 0.992, 0.553, 0.235
        uniform sampler2D map;
        uniform sampler2D map1;
        varying vec2 vUv;

        void main() {
            vec4 tex = texture2D(map, vUv);
            vec4 tex1 = texture2D(map1, vUv);
            if( tex1.r < 0.5 && tex1.g < 0.5 && tex1.b < 0.5){
                gl_FragColor = vec4(tex.rgb, 0.4);
            }else if(tex1.r >0.5){
                gl_FragColor = vec4(tex.rgb, 1);
            } else if(tex1.g > 0.5){
                gl_FragColor = vec4(borderColor,1);
            }        
        }
    `;

    var drawRect = function (ctx, color, x, y, w, h) {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fill();
    }

    exports.getMaterial = function (texture, texture1) {
        return new THREE.ShaderMaterial({
            uniforms: {
                map: { type: "t", value: texture },
                map1: { type: "t", value: texture1 },
            },
            vertexShader: MetadataMaterialVertexShader,
            fragmentShader: MetadataMaterialFragmentShader,
            depthTest: true,
            depthWrite: true,
            transparent: true,
            side: THREE.DoubleSide
        });

    };

    exports.getTexture = function (chImg, idx) {
        var canvas = document.createElement("CANVAS");
        var ctx = canvas.getContext('2d');
        ctx.canvas.width = def.images[idx].imageWidth;
        ctx.canvas.height = def.images[idx].imageHeight;

        /* Background is Black */
        drawRect(ctx, "#000000", 0, 0, def.images[idx].imageWidth, def.images[idx].imageHeight);

        /* Selected Image Color Settings */
        chImg.forEach((n, i) => {
            var x = (n % def.images[idx].cols) * def.spriteWidth;
            var y = (Math.floor(n / def.images[idx].cols)) * def.spriteHeight;
            /* Draw Main Area */
            drawRect(ctx, '#FF0000', x, y, def.spriteWidth, def.spriteHeight);

            /* Draw Borders */
            drawRect(ctx, '#00FF00', x, y, def.spriteWidth, def.borderThickness);
            drawRect(ctx, '#00FF00', x, y + def.spriteHeight - def.borderThickness, def.spriteWidth, def.borderThickness);
            drawRect(ctx, '#00FF00', x, y, def.borderThickness, def.spriteHeight);
            drawRect(ctx, '#00FF00', x + def.spriteWidth - def.borderThickness, y, def.borderThickness, def.spriteHeight);
        });

        var txt = new THREE.Texture(canvas);
        txt.flipX = false;
        txt.needsUpdate = true;
        return txt;
    }

    return exports;
}({});

export default MetaDataMaterial;