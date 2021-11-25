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

    renderer.domElement.style.padding = '3px';

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

    // Load Input Images && Initialize Def.js
    for (var i = 0; i < def.numOfImages; i++) {

        const idx = i;
        def.images.push([]);

        myPromises.push(
            new Promise(resolve => { new THREE.TextureLoader().load('input/images/' + i + '.jpg', resolve) }).then(texture => {

                def.images[idx] = {
                    imageWidth: texture.image.width,
                    imageHeight: texture.image.height,
                    rows: texture.image.height / def.spriteHeight,
                    cols: texture.image.width / def.spriteWidth
                }

                def['borderThickness'] = def.spriteWidth / 20;
                const texture1 = MetaDataMaterial.getTexture([], idx);
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

    // Start App
    Promise.all(myPromises).then(() => {

        let checkedAssignUserTagNames = [];
        let checkedRemoveUserTagNames = [];

        const meshBuilder = new MeshBuilder(jsonData, materials, scene);

        Utils.moveHome(meshBuilder.getMeshes(), camera, controls);

        const analyzedData = Utils.getCategory(jsonData);
        let category = analyzedData.category;
        let location = analyzedData.location;

        let categoryNames = Object.keys(category);
        let locationNames = Object.keys(location);

        const sc = new SelectControl(scene, camera, renderer, controls, meshBuilder, categoryNames);


        // Toggle Switch
        $('#displayMarkerCheckBox').click(() => {

            let checkedUserTagNames = [];
            locationNames.forEach(v => {
                if ($(`#${v.replace(/\s/g, '')}`).prop('checked'))
                    checkedUserTagNames.push(v);
            });

            let checkedAiTagNames = [];
            categoryNames.forEach(v => {
                if ($(`#${v.replace(/\s/g, '')}`).prop('checked'))
                    checkedAiTagNames.push(v);
            });

            sc.selectCategory(checkedAiTagNames, checkedUserTagNames);

        }); //click()


        // AI Tages
        categoryNames.forEach((txt, index) => {
            $('#aiTagDiv').append(`
                <div class="form-check ml-3">
                    <input class="form-check-input mt-3" type="checkbox"
                        id="${txt.replace(/\s/g, '')}" value="${index}" />
                    <label class="form-check-label pt-2 pl-2" for="${txt.replace(/\s/g, '')}">
                        ${txt}
                    </label>
                </div>
            `);

            $(`#${txt.replace(/\s/g, '')}`).click(() => {
                let checkedAiTagNames = [];
                categoryNames.forEach(v => {
                    if ($(`#${v.replace(/\s/g, '')}`).prop('checked'))
                        checkedAiTagNames.push(v);
                });

                let checkedUserTagNames = [];
                locationNames.forEach(v => {
                    if ($(`#${v.replace(/\s/g, '')}`).prop('checked'))
                        checkedUserTagNames.push(v);
                });

                sc.selectCategory(checkedAiTagNames, checkedUserTagNames);
            });
        });


        // User Tags
        locationNames.forEach((txt, index) => {
            const id = txt.replace(/\s/g, '');

            $('#userTagDiv').append(`
                <div class="form-check ml-3">
                    <input class="form-check-input mt-3" type="checkbox"
                        id="${id}" value="${index}" />
                    <label class="form-check-label pt-2 pl-2" for="${id}">
                        ${txt}
                    </label>
                </div>
            `);

            $(`#${id}`).click(() => {
                let checkedUserTagNames = [];
                locationNames.forEach(v => {
                    if ($(`#${v.replace(/\s/g, '')}`).prop('checked'))
                        checkedUserTagNames.push(v);
                });

                let checkedAiTagNames = [];
                categoryNames.forEach(v => {
                    if ($(`#${v}`).prop('checked'))
                        checkedAiTagNames.push(v);
                });
                sc.selectLocation(checkedUserTagNames, checkedAiTagNames);
            });


            // Assign-UserTag-Window Checkboxes
            $('#assignUserTagDiv').append(`
                <div class="form-check ml-3">
                    <input class="form-check-input mt-3" type="checkbox"
                        id="assign_${id}" value="${index}" />
                    <label class="form-check-label pt-2 pl-2" for="assign_${id}">
                        ${txt}
                    </label>
                </div>
            `);

            $(`#assign_${id}`).click(() => {
                checkedAssignUserTagNames = [];
                locationNames.forEach(v => {
                    if ($(`#assign_${v.replace(/\s/g, '')}`).prop('checked'))
                        checkedAssignUserTagNames.push(v);
                });
            });

            // Remove-UserTag-Window Checkboxes
            $('#removeUserTagDiv').append(`
                <div class="form-check ml-3">
                    <input class="form-check-input mt-3" type="checkbox"
                        id="remove_${id}" value="${index}" />
                    <label class="form-check-label pt-2 pl-2" for="remove_${id}">
                        ${txt}
                    </label>
                </div>
            `);

            $(`#remove_${id}`).click(() => {
                checkedRemoveUserTagNames = [];
                locationNames.forEach(v => {
                    if ($(`#remove_${v.replace(/\s/g, '')}`).prop('checked'))
                        checkedRemoveUserTagNames.push(v);
                });
            });
        });


        // Home Button Click
        $('#homeBtn').click(() => {
            Utils.moveHome(meshBuilder.getMeshes(), camera, controls);
        })

        // Create New Tag Button Click
        $('#addBtn').click(() => {
            $('#newCategory').val('')
        });

        $('#addCategoryBtn').click(() => {
            var newLocation = $('#newCategory').val();

            if (newLocation !== '') {
                var index = locationNames.length;
                var id = newLocation.replace(/\s/g, '');

                locationNames.push(newLocation);
                location[newLocation] = [];

                $('#userTagDiv').append(`
                    <div class="form-check ml-3">
                        <input class="form-check-input mt-3" type="checkbox"
                            id="${id}" value="${index}" />
                        <label class="form-check-label pt-1 pl-2" for="${id}">
                            ${newLocation}
                        </label>
                    </div>
                `);
                $(`#${id}`).click(() => {
                    let checkedUserTagNames = [];
                    locationNames.forEach(v => {
                        if ($(`#${v.replace(/\s/g, '')}`).prop('checked'))
                            checkedUserTagNames.push(v);
                    });

                    let checkedAiTagNames = [];
                    categoryNames.forEach(v => {
                        if ($(`#${v}`).prop('checked'))
                            checkedAiTagNames.push(v);
                    });
                    sc.selectLocation(checkedUserTagNames, checkedAiTagNames);
                });

                //Assign Tag Window CheckBoxes
                $('#assignUserTagDiv').append(`
                    <div class="form-check ml-3">
                        <input class="form-check-input mt-3" type="checkbox"
                            id="assign_${id}" value="${index}" />
                        <label class="form-check-label pt-2 pl-2" for="assign_${id}">
                            ${newLocation}
                        </label>
                    </div>
                `);
                $(`#assign_${id}`).click(() => {
                    checkedAssignUserTagNames = [];
                    locationNames.forEach(v => {
                        if ($(`#assign_${v.replace(/\s/g, '')}`).prop('checked'))
                            checkedAssignUserTagNames.push(v);
                    });
                });

                //Remove Tag Window CheckBoxes
                $('#removeUserTagDiv').append(`
                    <div class="form-check ml-3">
                        <input class="form-check-input mt-3" type="checkbox"
                            id="remove_${id}" value="${index}" />
                        <label class="form-check-label pt-2 pl-2" for="remove_${id}">
                            ${newLocation}
                        </label>
                    </div>
                `);
                $(`#remove_${id}`).click(() => {
                    checkedRemoveUserTagNames = [];
                    locationNames.forEach(v => {
                        if ($(`#remove_${v.replace(/\s/g, '')}`).prop('checked'))
                            checkedRemoveUserTagNames.push(v);
                    });
                });

                $('#categoryModal').modal('hide');
                alert('New Tag Successfully Added.');
            } else {
                alert('Please Input New Tag Name.');
            }
        });


        //Asign Tag Button Click
        // Initialize Checkboxes In Assign User Tags Window
        $('#assignBtn').click(() => {
            locationNames.forEach(v => {
                $(`#assign_${v.replace(/\s/g, '')}`).prop('checked', false);
            });
        });

        // Final Assign Tag Button Click Event In AssignUserTag-Window
        $('#assignTagBtn').click(() => {
            const status = sc.assignTags(checkedAssignUserTagNames);
            if (status) {
                locationNames.forEach(v => {
                    $(`#${v.replace(/\s/g, '')}`).prop('checked', false);
                });
            }
        });


        //Remove Tag Button Click
        // Initialize Checkboxes In Remove Tags Window
        $('#removeBtn').click(() => {
            locationNames.forEach(v => {
                $(`#remove_${v.replace(/\s/g, '')}`).prop('checked', false);
            });
        });

        // Final Remove-Tag Button Click Event In remove UserTag-Window
        $('#removeTagBtn').click(() => {
            const status = sc.removeTags(checkedRemoveUserTagNames);
            if (status) {
                locationNames.forEach(v => {
                    $(`#${v.replace(/\s/g, '')}`).prop('checked', false);
                });
            }
        });

    });
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
console.log('started...')
