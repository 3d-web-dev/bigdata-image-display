import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js';
import MeshBuilder from './meshbuilder.js';
import SelectControl from './selectControl.js';
import MetaDataMaterial from './materials/metadata_material.js';
import Utils from './utils.js';
import { def } from './def.js';

const camInitPos = new THREE.Vector3(0, 0, 100000);
const container = document.getElementById('canvas');

var scene, camera, renderer, controls;

def.numOfImages = document.getElementById('numOfFiles').value


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

    renderer.domElement.style.padding = '5px';

    const light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(1, 1, 100);
    scene.add(light)


    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.zoomSpeed = 2;
    controls.target.set(4000, 1000, 0)

    var jsonData = null;
    var materials = [];

    let myPromises = [];

    myPromises.push(
        new Promise(resolve => { new THREE.FileLoader().load('input/db.json', resolve) }).then(result => {
            jsonData = JSON.parse(result);
        })
    )

    for (var i = 0; i < def.numOfImages; i++) {
        const idx = i;
        const texture1 = MetaDataMaterial.getTexture([]);
        myPromises.push(
            new Promise(resolve => { new THREE.TextureLoader().load('input/images/' + i + '.jpg', resolve) }).then(texture => {
                def.imageHeight = texture.image.height;
                def.imageWidth = texture.image.width;
                def['rows'] = def.imageHeight / def.spriteHeight;
                def['cols'] = def.imageWidth / def.spriteWidth;
                def['borderThickness'] = def.spriteWidth / 25;
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

        // Utils.moveHome(meshBuilder.getMeshes(), camera, controls);


        let category = Utils.getCategory(jsonData).category;
        let location = Utils.getCategory(jsonData).location;

        let categoryNames = Object.keys(category);
        let locationNames = Object.keys(location);

        const sc = new SelectControl(scene, camera, renderer, controls, meshBuilder, categoryNames);

        /* AI Tages */
        categoryNames.forEach((txt, index) => {
            $('#aiTagDiv').append(`
                <div class="form-check ml-3">
                    <input class="form-check-input mt-3" type="checkbox"
                        id="${txt}" value="${index}" />
                    <label class="form-check-label pt-2 pl-2" for="${txt}">
                        ${txt}
                    </label>
                </div>
            `);

            $(`#${txt}`).click(() => {
                let checkedAiTagNames = [];
                categoryNames.forEach(v => {
                    if ($(`#${v}`).prop('checked'))
                        checkedAiTagNames.push(v);
                });
                sc.selectCategory(checkedAiTagNames);
            });
        });


        /* User Tags */
        locationNames.forEach((txt, index) => {
            $('#userTagDiv').append(`
                <div class="form-check ml-3">
                    <input class="form-check-input mt-3" type="checkbox"
                        id="${txt}" value="${index}" />
                    <label class="form-check-label pt-2 pl-2" for="${txt}">
                        ${txt}
                    </label>
                </div>
            `);

            $(`#${txt}`).click(() => {
                let checkedUserTagNames = [];
                locationNames.forEach(v => {
                    if ($(`#${v}`).prop('checked'))
                        checkedUserTagNames.push(v);
                });
                sc.selectLocation(checkedUserTagNames);
            });
        });



        /* Add New Category Name */
        $('#addBtn').click(() => { $('#newCategory').val('') });

        $('#addCategoryBtn').click(() => {
            var newLocation = $('#newCategory').val();

            if (newLocation !== '') {
                var index = locationNames.length;

                $('#userTagDiv').append(`
                    <div class="form-check ml-3">
                        <input class="form-check-input mt-3" type="checkbox"
                            id="${newLocation}" value="${index}" />
                        <label class="form-check-label pt-1 pl-2" for="${newLocation}">
                            ${newLocation}
                        </label>
                    </div>
                `);

                locationNames.push(newLocation);
                location[newLocation] = [];
            } else {
                setTimeout(() => { alert('No Category is added') }, 500)
            }
        });



        $('#homeBtn').click(() => {

            Utils.moveHome(meshBuilder.getMeshes(), camera, controls);
        })
    })
}

$('#mouseGuideCollapse').on('shown.bs.collapse', function () {
    $('#collapseIcon').removeClass("fa fa-plus-square-o")
    $('#collapseIcon').addClass("fa fa-minus-square-o")
})
$('#mouseGuideCollapse').on('hidden.bs.collapse', function () {
    $('#collapseIcon').removeClass("fa fa-minus-square-o")
    $('#collapseIcon').addClass("fa fa-plus-square-o")
})


App();
