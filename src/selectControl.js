import * as THREE from './libs/three.module.js';
import MetaDataMaterial from './materials/metadata_material.js';
import { SelectionBox } from './libs/SelectionBox.js';
import { SelectionHelper } from './libs/SelectionHelper.js';
import Utils from './utils.js';
import { def } from './def.js';

var SelectControl = function (scene, camera, renderer, controls, meshBuilder, categoryNames) {
    this.raycaster = new THREE.Raycaster();
    var imageNameLists = meshBuilder.getImageNameLists(); /* [[{name, category, path, pivot}],[]] */
    var chosenImages = [];
    imageNameLists.forEach(() => {
        chosenImages.push([]);
    });
    var meshes = meshBuilder.getMeshes();

    var intersectNow = null;
    var lastSelectedIndex;
    this.mouse = new THREE.Vector2();

    this.main = function () {
        const canvas = $('#canvas')[0];
        const selectionBox = new SelectionBox(camera, scene);
        const helper = new SelectionHelper(selectionBox, renderer, 'selectBox');
        helper.element.style.display = 'none';

        /* Remove Description When Mouse Moving */
        $(document).on('pointermove', event => {
            $('#description').css('display', 'none');
        });

        $('#canvas').on('pointerdown', event => {
            selectionBox.startPoint.set(this.mouse.x, this.mouse.y, 0.5);
            $('#imgName').val('');
            $('#tag2').val('-1');

            var selectedIndex = this.getIndex();
            /* Press Shift To Select Image Face */
            if (event.shiftKey && selectedIndex) {
                lastSelectedIndex = selectedIndex;
                $('#tag1').val('-3');
                this.checkIndex(selectedIndex);
                selectImages();
                var selectedImage = imageNameLists[selectedIndex.imgIndex][selectedIndex.spriteIndex];
                var indexOfSelected = categoryNames.indexOf(selectedImage.category);
                $('#imgName').val(selectedImage.name);
                $('#tag2').val(`${indexOfSelected}`);
                $('#tag2').prop('disabled', false);
            }

            /* Press Ctrl To Move */
            if (intersectNow && event.ctrlKey) {
                Utils.moveCamera(imageNameLists[this.getIndex().imgIndex][this.getIndex().spriteIndex]['pivot'], 600, camera, controls);
            }
            /* Perss Alt Select Region */
            if (event.altKey) {
                controls.enabled = false;
                helper.element.style.display = 'block';
            }
        });

        var timeout;
        $('#canvas').on('pointermove', event => {
            $('#description').css('display', 'none');

            intersectNow = null;

            this.mouse.x = ((event.clientX - canvas.offsetParent.offsetLeft) / canvas.clientWidth) * 2 - 1;
            this.mouse.y = - ((event.clientY - canvas.offsetParent.offsetTop) / canvas.clientHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, camera);
            const intersects = this.raycaster.intersectObjects(scene.children);

            if (intersects.length > 0 && !event.altKey) {
                intersectNow = intersects[0];
            }

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (intersectNow) {
                    $('#description').css('display', 'block')
                    $('#description').css('left', event.clientX + 20 + 'px');
                    $('#description').css('top', event.clientY + 20 + 'px');
                    var selectedImage = imageNameLists[this.getIndex().imgIndex][this.getIndex().spriteIndex];
                    $('#description-content').html(
                        'Name: ' + selectedImage.name +
                        '<br/> Class: ' + selectedImage.category +
                        // '<br/> UV: ' + intersectNow.uv.x.toFixed(2) + ', ' + intersectNow.uv.y.toFixed(2) +
                        // '<br/>Pos: ' + (parseInt(this.getIndex().imgIndex) + 1) + 'th ' + this.getIndex().spriteIndex +
                        '<br/>Press Space key for blowing up this image.');
                }
            }, 100);
        });

        /* Detect Images Inside SelectionBox */
        $('#canvas').on('pointerup', event => {
            selectionBox.endPoint.set(this.mouse.x, this.mouse.y, 0.5);
            controls.enabled = true;
            helper.element.style.display = 'none';
            if (event.altKey) {
                $('#tag1').val('-3');
                const s = selectionBox.startPoint;
                const e = selectionBox.endPoint;
                var start = new THREE.Vector2(Math.min(s.x, e.x), Math.max(s.y, e.y));
                var end = new THREE.Vector2(Math.max(s.x, e.x), Math.min(s.y, e.y));

                imageNameLists.forEach((imageNameList, i) => {
                    imageNameList.forEach((e, j) => {
                        var pt = e.pivot.clone().project(camera);
                        if (start.x < pt.x && pt.x < end.x && start.y > pt.y && pt.y > end.y) {
                            chosenImages[i].push(j);
                        }
                    })
                })
            }
            selectImages();
        });

        /* Space Key For Blowing Up Image */
        $(document).on('keydown', (event) => {
            if (event.code === 'Space' && intersectNow) {
                let image = imageNameLists[this.getIndex().imgIndex][this.getIndex().spriteIndex];
                $('#imgModal').modal('toggle');
                $('#imgModal').modal('show');
                $('#modalImageName').name = image.name;
                // $('#blowup').attr("src", "src/input/images/0.jpg");
                $('#blowup').attr("src", image.path);
            }

        });

        /* Change ImageName And Category */
        $('#updateBtn').click(() => {
            /* Update Category */
            if (lastSelectedIndex) {
                var categoryIndex = $('#tag2').children("option:selected").val();
                imageNameLists[lastSelectedIndex.imgIndex][lastSelectedIndex.spriteIndex].name = $('#imgName').val();
                imageNameLists[lastSelectedIndex.imgIndex][lastSelectedIndex.spriteIndex].category = categoryNames[categoryIndex];
                alert('Successfully Updated');
            } else {
                alert('There is no active image. Please select only one image to update');
            }
        });

        $('#multipleBtn').click(() => {
            var multipleStatus = false;
            const category = parseInt($('#tag2').val());
            const showInfo = (txt) => {
                setTimeout(() => { alert(txt) }, 500)
            }
            chosenImages.forEach((e) => {
                if (e.length > 1) multipleStatus = true;
            })

            if (multipleStatus) {
                console.log(category)
                if (category > 0) {
                    showInfo('Successfully Updated');
                    chosenImages.forEach((chImg, id) => {
                        chImg.forEach(idx => {
                            imageNameLists[id][idx].category = categoryNames[category];
                        });
                    });
                } else {
                    showInfo('Please select category.')
                }
            } else {
                showInfo('Please select more than 2 images');
            }
        });

        /* Export as TXT file */
        $('#extractBtn').click(() => {
            const len = def.rows * def.cols;
            var check = false;
            var idxList = [];
            var dataToExtract = '';
            chosenImages.forEach(ele => {
                if (ele.length > 0) check = true;
                ele.forEach(id => { idxList.push(id) });
            });
            if (check) {
                dataToExtract += '[\n';
                idxList.forEach(id => {
                    const i = Math.floor(id / len);
                    const j = id % len;
                    dataToExtract +=
                        '\t{\n\t\tname: ' + imageNameLists[i][j].name +
                        ',\n\t\tclass: ' + imageNameLists[i][j].category +
                        ',\n\t\tFile Path: ' + imageNameLists[i][j].path +
                        '\n\t},\n'

                });
                dataToExtract += '\n]';
                Utils.download('info.txt', dataToExtract)
            } else {
                alert("There is no selected images.\nPlease select images")
            }
        });
    }


    this.getIndex = function () {
        if (intersectNow) {
            const imageNum = parseInt(intersectNow.object.name);
            const faceIndex = intersectNow.faceIndex;
            const index = Math.floor(faceIndex / 2);
            return { imgIndex: imageNum, spriteIndex: index };
        } else {
            print('No Image Raycasted.');
            intersectNow = null;
            lastSelectedIndex = null;
            return null;
        }
    }

    this.checkIndex = index => { /* index = [imgIndex, spriteIndex] */
        let existIndex = null;
        chosenImages.forEach((ele, imgIndex) => {
            ele.forEach((spriteIndex) => {
                if (imgIndex === index.imgIndex && spriteIndex === index.spriteIndex) {
                    existIndex = index;
                }
            });
        });

        if (existIndex) {
            chosenImages[existIndex.imgIndex] = chosenImages[existIndex.imgIndex].filter(
                (spriteIndex) => {
                    return spriteIndex !== existIndex.spriteIndex;
                }
            )
        } else {
            chosenImages[index.imgIndex].push(index.spriteIndex);
        }
    }


    /* Select Images By Mouse Left Button */
    var selectImages = () => {
        for (var i = 0; i < meshes.length; ++i) {
            const texture = meshes[i].material.uniforms.map.value;
            meshes[i].material.dispose();

            var texture1 = MetaDataMaterial.getTexture(chosenImages[i]);
            meshes[i].material = MetaDataMaterial.getMaterial(texture, texture1);
        }
    }

    this.selectCategory = function (categoryName) {
        let status = false;
        for (var i = 0; i < def.numOfImages; ++i) {
            chosenImages[i] = [];
            imageNameLists[i].forEach((imgNameList, index) => {
                if (imgNameList.category === categoryName)
                    chosenImages[i].push(index);
            });
            if (chosenImages[i].length > 0) status = true;
        }
        if (status) {
            selectImages();
            lastSelectedIndex = null;
        }
        else {
            print('There is no images in this category');
            this.unselectAll();
        }
    }

    this.selectAll = function () {
        chosenImages.forEach((chImg, index) => {
            imageNameLists[index].forEach((imgNameList, idx) => {
                chImg.push(idx);
            })
        });
        selectImages();
        lastSelectedIndex = null;
    }

    this.unselectAll = function () {
        $('#imgName').val('');
        $('#tag2').val('-1');
        for (var i = 0; i < chosenImages.length; ++i) {
            chosenImages[i] = [];
        }
        selectImages();
        lastSelectedIndex = null;
    }

    this.main();
}

export default SelectControl;