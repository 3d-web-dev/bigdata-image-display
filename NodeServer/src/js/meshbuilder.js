import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
import { def } from './def.js';
var MeshBuilder = function (jsonData, materials, scene) {
    const sprite = { width: def.spriteWidth, height: def.spriteHeight }; //{ width: 150, height: 150 };
    var meshes = [];
    var imageNameLists = [];

    var main = function () {
        for (var i = 0; i < def.numOfImages; i++) {
            var geometry = new THREE.Geometry();
            const imageNameList = [];

            let j = 0;
            while (j < def.images[i].cols * def.images[i].rows) {
                var coords = getCoords(i, j);

                if (coords) {
                    let _sprite = null;
                    if (!coords.class.includes(' ')) {
                        _sprite = makeSprite(coords.class[0], coords.pivot);
                        _sprite.name = i + '_' + j;
                        _sprite.visible = false;
                    }

                    imageNameList.push({
                        name: coords.img,
                        pivot: coords.pivot,
                        category: coords.class,
                        path: coords.filepath,
                        sprite: _sprite,
                        user_tags: coords.user_tags,
                        "category classification %": coords["category classification %"],
                        "category (2)": coords["category (2)"],
                        "category (2) classification %": coords["category (2) classification %"],
                        "category (3)": coords["category (3)"],
                        "category (3) classification %": coords["category (3) classification %"]
                    });
                    geometry = updateVertices(geometry, coords);
                    geometry = updateFaces(geometry);
                    geometry = updateFaceVertexUvs(geometry, i, j);
                } else {
                    break;
                }
                ++j;
            }
            meshes.push(buildMesh(geometry, materials[i], i));
            imageNameLists.push(imageNameList);
        }
    }

    this.getMeshes = function () {
        return meshes;
    }

    this.getImageNameLists = function () {
        return imageNameLists;
    }

    var buildMesh = function (geometry, material, index) {
        var geometry = new THREE.BufferGeometry().fromGeometry(geometry);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.name = '' + index;
        mesh.position.set(0, 0, 0);
        scene.add(mesh);
        return mesh;
    }

    var getCoords = function (i, j) {
        var total = 0;
        for (var k = 0; k < i; ++k) {
            total += def.images[k].rows * def.images[k].cols;
        }

        var coords = jsonData[total + j];

        if (coords) {
            coords.x *= 10000;
            coords.y *= 5000;
            coords.z *= 2000;
            coords['pivot'] = new THREE.Vector3(coords.x + sprite.width / 2, coords.y + sprite.height / 2, coords.z);
            return coords;
        } else {
            print('there is no json data for ' + i + 'th image, ' + j + 'th sprite image');
            return null;
        }
    }

    var updateVertices = function (geometry, coords) {
        const points = [
            new THREE.Vector3(
                coords.x,
                coords.y,
                coords.z
            ),
            new THREE.Vector3(
                coords.x + sprite.width,
                coords.y,
                coords.z
            ),
            new THREE.Vector3(
                coords.x + sprite.width,
                coords.y + sprite.height,
                coords.z
            ),
            new THREE.Vector3(
                coords.x,
                coords.y + sprite.height,
                coords.z
            )
        ];
        points.forEach(pt => geometry.vertices.push(pt))
        return geometry;
    }


    var updateFaces = function (geometry) {
        var faceOne = new THREE.Face3(
            geometry.vertices.length - 4,
            geometry.vertices.length - 3,
            geometry.vertices.length - 2
        )
        var faceTwo = new THREE.Face3(
            geometry.vertices.length - 4,
            geometry.vertices.length - 2,
            geometry.vertices.length - 1
        )
        geometry.faces.push(faceOne, faceTwo);
        return geometry;
    }

    var updateFaceVertexUvs = function (geometry, i, j) {
        var xOffset = (j % def.images[i].cols) * (1 / def.images[i].cols);
        var yOffset = 1 - (Math.floor(j / def.images[i].cols) * (1 / def.images[i].rows)) - (1 / def.images[i].rows);

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(xOffset, yOffset),
            new THREE.Vector2(xOffset + (1 / def.images[i].cols), yOffset),
            new THREE.Vector2(xOffset + (1 / def.images[i].cols), yOffset + (1 / def.images[i].rows))
        ]);

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(xOffset, yOffset),
            new THREE.Vector2(xOffset + (1 / def.images[i].cols), yOffset + (1 / def.images[i].rows)),
            new THREE.Vector2(xOffset, yOffset + (1 / def.images[i].rows))
        ]);

        return geometry;
    }

    var makeSprite = function (text, position) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        const x = 64;
        const y = 64;
        const radius = 30;
        const startAngle = 0;
        const endAngle = Math.PI * 2;

        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.fill();

        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.stroke();

        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = "35px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y);

        const numberTexture = new THREE.CanvasTexture(canvas);


        const spriteMaterial = new THREE.SpriteMaterial({
            map: numberTexture,
            alphaTest: 0.5,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: false
        });

        var _sprite = new THREE.Sprite(spriteMaterial);
        _sprite.renderOrder = 1;
        _sprite.position.copy(position);
        _sprite.scale.set(0.06, 0.06, 1);

        scene.add(_sprite);
        return _sprite;
    }


    main();
    document.getElementById('loader').style.display = 'none';
}

export default MeshBuilder;

