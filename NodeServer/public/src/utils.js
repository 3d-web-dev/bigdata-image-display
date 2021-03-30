import * as THREE from './libs/three.module.js';

var Utils = function (exports) {
    var inputData;
    exports.getCategory = function (data) {
        inputData = data;
        var category = {};
        data.forEach((ele, index) => {
            if (!category[ele.class]) {
                category[ele.class] = [];
            }
            category[ele.class].push(index);
        })
        return category;
    }

    exports.moveCamera = (pos, distance, camera, controls) => {
        gsap.to(camera.position, { duration: 1, x: pos.x, y: (distance === 10000) ? 3000 : pos.y, z: pos.z + distance, });

        const target = (distance === 10000) ? new THREE.Vector3(4000, 1000, 0) : pos;
        gsap.to(controls.target, {
            duration: 1, x: target.x, y: target.y, z: target.z,
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