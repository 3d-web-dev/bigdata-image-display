import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';

var Utils = function (exports) {

    var inputData;

    exports.getCategory = function (data) {
        inputData = data;
        var category = {};
        var location = {};
        data.forEach((ele, index) => {
            if (!category[ele.class]) {
                category[ele.class] = [];
            }
            if (!location[ele.location]) {
                location[ele.location] = [];
            }
            category[ele.class].push(index);
            location[ele.location].push(index);
        })
        return { category: category, location: location };
    }

    exports.moveCamera = (pos, distance, camera, controls) => {
        gsap.to(camera.position, { duration: 1, x: pos.x, y: pos.y, z: pos.z + distance, });

        const target = pos;
        gsap.to(controls.target, {
            duration: 2, x: target.x, y: target.y, z: target.z,
            onUpdate: () => { controls.update(); }
        });
    }

    exports.moveHome = (meshes, camera, controls) => {
        let min = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
        let max = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY };
        meshes.forEach(m => {
            const box = new THREE.Box3().setFromObject(m);
            if (box.min.x < min.x) min.x = box.min.x;
            if (box.min.y < min.y) min.y = box.min.y;
            if (box.max.x > max.x) max.x = box.max.x;
            if (box.max.y > max.y) max.y = box.max.y;
        });
        const posX = (min.x + max.x) / 2;
        const posY = (min.y + max.y) / 2;

        gsap.to(camera.position, { duration: 2, x: posX, y: posY, z: posX * 2.4, });

        gsap.to(controls.target, {
            duration: 2, x: posX, y: posY, z: 0,
            onUpdate: () => { controls.update(); }
        });
    }

    exports.download = function (filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }


    return exports;
}({});

export default Utils;