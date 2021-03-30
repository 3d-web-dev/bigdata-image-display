import * as THREE from './libs/three.module.js';
import { def } from './def.js';
var MeshBuilder = function (jsonData, materials, scene) {
    const sprite = { width: def.spriteWidth, height: def.spriteHeight }; //{ width: 150, height: 150 };
    const img = { cols: def.cols, rows: def.rows }; // { width: 1500, height: 40 * 150, cols: 7, rows: 10 };
    var meshes = [];
    var imageNameLists = [];

    var main = function () {
        for (var i = 0; i < def.numOfImages; i++) {
            var geometry = new THREE.Geometry();
            const imageNameList = [];
            for (var j = 0; j < img.cols * img.rows; j++) {
                var coords = getCoords(i, j);
                if (coords) {
                    imageNameList.push({
                        name: coords.img,
                        pivot: coords.pivot,
                        category: coords.class,
                        path: coords.filepath
                    });
                    geometry = updateVertices(geometry, coords);
                    geometry = updateFaces(geometry);
                    geometry = updateFaceVertexUvs(geometry, j);
                }
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
        mesh.position.set(0, 0, 0)
        scene.add(mesh);
        return mesh;
    }

    var getCoords = function (i, j) {
        var idx = (i * img.rows * img.cols) + j;
        var coords = jsonData[idx];
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

    var updateFaceVertexUvs = function (geometry, j) {
        var xOffset = (j % img.cols) * (1 / img.cols);
        var yOffset = 1 - (Math.floor(j / img.cols) * (1 / img.rows)) - (1 / img.rows);
        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(xOffset, yOffset),
            new THREE.Vector2(xOffset + (1 / img.cols), yOffset),
            new THREE.Vector2(xOffset + (1 / img.cols), yOffset + (1 / img.rows))
        ]);

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(xOffset, yOffset),
            new THREE.Vector2(xOffset + (1 / img.cols), yOffset + (1 / img.rows)),
            new THREE.Vector2(xOffset, yOffset + (1 / img.rows))
        ]);

        return geometry;
    }

    main();
}

export default MeshBuilder;

