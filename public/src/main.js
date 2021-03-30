import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import MeshBuilder from './meshbuilder.js';
import SelectControl from './selectControl.js';
import MetaDataMaterial from './materials/metadata_material.js';
import Utils from './utils.js';
import { def } from './def.js';

const camInitPos = new THREE.Vector3(4000, 3000, 10000);
const container = document.getElementById('canvas');

var scene, camera, renderer, controls;

def.numOfImages = document.getElementById('numOfFiles').value
console.log('Number of Files ', def.numOfImages)

const buildScene = () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('rgb(20,30,40)')
    return scene;
}

const buildCamera = () => {
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 100000);
    camera.position.copy(camInitPos);
    return camera;
}

const buildRenderer = () => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.append(renderer.domElement);
    return renderer;
}

const App = () => {
    scene = buildScene();
    camera = buildCamera();
    renderer = buildRenderer();

    const light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(1, 1, 100);
    scene.add(light)


    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.zoomSpeed = 5;
    controls.target.set(4000, 1000, 0)

    var jsonData = null;
    var materials = [];

    let myPromises = []
    myPromises.push(
        new Promise(resolve => { new THREE.FileLoader().load('src/input/db.json', resolve) }).then(result => {
            jsonData = JSON.parse(result);
        })
    )
    for (var i = 0; i < def.numOfImages; i++) {
        const idx = i;
        const texture1 = MetaDataMaterial.getTexture([]);
        myPromises.push(
            new Promise(resolve => { new THREE.TextureLoader().load('src/input/images/' + i + '.jpg', resolve) }).then(texture => {
                materials[idx] = MetaDataMaterial.getMaterial(texture, texture1);
            })
        );
    }

    window.addEventListener('resize', function () {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        controls.update();
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
    }
    animate();

    /* Start App */
    Promise.all(myPromises).then(() => {
        const meshBuilder = new MeshBuilder(jsonData, materials, scene);

        let category = Utils.getCategory(jsonData);
        let categoryNames = Object.keys(category);
        categoryNames.forEach((txt, index) => {
            $('#tag1').append(`<option value="${index}">${txt}</option>`);
            $('#tag2').append(`<option value="${index}">${txt}</option>`);
        });


        /* Select Images by Categories */
        $('#tag1').change(function () {
            const idx = parseInt($(this).children("option:selected").val());
            if (idx === -1)
                sc.unselectAll()
            else if (idx === -2)
                sc.selectAll();
            else {
                sc.selectCategory(categoryNames[idx]);
            }
        });

        const sc = new SelectControl(scene, camera, renderer, controls, meshBuilder, categoryNames);

        /* Add New Category Name */
        $('#addBtn').click(() => { $('#newCategory').val('') });
        $('#addCategoryBtn').click(() => {
            var newCategoryName = $('#newCategory').val();
            if (newCategoryName !== '') {
                setTimeout(() => { showIndicate('A new category is successfully added.') }, 500)

                var newIndex1 = ($('#tag1 option').length - 3);
                var newIndex2 = ($('#tag2 option').length - 1);

                $('#tag1').append(`<option value="${newIndex1}">${newCategoryName}</option>`);
                $('#tag2').append(`<option value="${newIndex2}">${newCategoryName}</option>`);

                categoryNames.push(newCategoryName);
                category[newCategoryName] = [];
            } else {
                setTimeout(() => { showIndicate('No Category is added') }, 500)
            }

            const showIndicate = (txt) => {
                alert(txt);
            }
        });



        $('#homeBtn').click(() => {
            Utils.moveCamera(new THREE.Vector3(4000, 3000, 0), 10000, camera, controls)
        })
    })
}

App();
