import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
import MetaDataMaterial from './materials/metadata_material.js';
import { SelectionBox } from 'https://unpkg.com/three@0.124.0/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'https://unpkg.com/three@0.124.0/examples/jsm/interactive/SelectionHelper.js';
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
            var selectedIndex = this.getIndex();

            /* Press Shift To Select Image Face */
            if (event.shiftKey && selectedIndex) {
                lastSelectedIndex = selectedIndex;

                this.checkIndex(selectedIndex);
                selectImages();
            }

            /* Press Ctrl To Move */
            if (intersectNow && event.ctrlKey) {
                Utils.moveCamera(imageNameLists[this.getIndex().imgIndex][this.getIndex().spriteIndex]['pivot'], 300, camera, controls);
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
            let detected = false;
            let j = 0;
            while (j < intersects.length) {
                if (intersects[j].object.isMesh) {
                    detected = true;
                    break;
                }
                ++j;
            }

            if (detected && !event.altKey) {
                intersectNow = intersects[j];
            }

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (intersectNow) {
                    $('#description').css('display', 'block')
                    $('#description').css('left', event.clientX + 10 + 'px');
                    $('#description').css('top', event.clientY + 10 + 'px');
                    var selectedImage = imageNameLists[this.getIndex().imgIndex][this.getIndex().spriteIndex];
                    $('#description-content').html(
                        'Name: ' + selectedImage.name +
                        '<br/> class: ' + selectedImage.category +
                        '<br/> user_tags: ' + selectedImage.user_tags +
                        '<br/> category classification %: ' + selectedImage["category classification %"] +
                        '<br/> category (2): ' + selectedImage["category (2)"] +
                        '<br/> category (2) classification %: ' + selectedImage["category (2) classification %"] +
                        '<br/> category (3): ' + selectedImage["category (3)"] +
                        '<br/> category (3) classification %: ' + selectedImage["category (3) classification %"] +
                        // '<br/> UV: ' + intersectNow.uv.x.toFixed(2) + ', ' + intersectNow.uv.y.toFixed(2) +
                        // '<br/>Pos: ' + (parseInt(this.getIndex().imgIndex) + 1) + 'th ' + this.getIndex().spriteIndex +
                        '<br/>Press Enter key for blowing up this image.');
                }
            }, 500);
        });


        /* Detect Images Inside SelectionBox */
        $('#canvas').on('pointerup', event => {
            selectionBox.endPoint.set(this.mouse.x, this.mouse.y, 0.5);
            controls.enabled = true;
            helper.element.style.display = 'none';
            if (event.altKey) {
                const s = selectionBox.startPoint;
                const e = selectionBox.endPoint;
                var start = new THREE.Vector2(Math.min(s.x, e.x), Math.max(s.y, e.y));
                var end = new THREE.Vector2(Math.max(s.x, e.x), Math.min(s.y, e.y));

                imageNameLists.forEach((imageNameList, i) => {
                    imageNameList.forEach((e, j) => {
                        var pt = e.pivot.clone().project(camera);
                        if (start.x < pt.x && pt.x < end.x && start.y > pt.y && pt.y > end.y) {
                            if (!chosenImages[i].includes(j))
                                chosenImages[i].push(j);
                        }
                    })
                })
                selectImages();
            }
        });


        /* Enter Key For Blowing Up Image */
        $(document).on('keydown', (event) => {
            if (event.code === 'Enter' && intersectNow) {
                let image = imageNameLists[this.getIndex().imgIndex][this.getIndex().spriteIndex];
                $('#imgModal').modal('toggle');
                $('#imgModal').modal('show');
                $('#modalImageName').html(image.name);
                $('#blowup').attr("src", image.path);
            }
        });


        /* Export as TXT file */
        $('#extractBtn').click(() => {
            const len = def.rows * def.cols;
            var check = false;
            var idxList = [];
            var dataToExtract = '';
            chosenImages.forEach((chImg, index) => {
                if (chImg.length > 0) check = true;
                chImg.forEach(id => { idxList.push({ i: index, j: id }) });
            });

            if (check) {
                dataToExtract += '[\n';
                idxList.forEach(ele => {
                    const i = ele.i
                    const j = ele.j;
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
            const index = Math.floor(intersectNow.faceIndex / 2);
            return { imgIndex: imageNum, spriteIndex: index };

        } else {
            intersectNow = null;
            lastSelectedIndex = null;
            return null;
        }
    }

    this.checkIndex = index => { /* index = {imgIndex:, spriteIndex:} */
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

            var texture1 = MetaDataMaterial.getTexture(chosenImages[i], i);
            meshes[i].material = MetaDataMaterial.getMaterial(texture, texture1);
        }
    }


    this.assignTags = function (tagNames) {
        let updateStatus = false;
        chosenImages.forEach((chImg, id) => {
            chImg.forEach(idx => {
                imageNameLists[id][idx].user_tags = tagNames;
                updateStatus = true;
            });
        });

        if (updateStatus && tagNames.length > 0) {
            alert('Successfully Updated.');
            return true;
        } else if (tagNames.length === 0) {
            alert("You didn't choose any user tags. Please try again.");
            return false;
        } else {
            alert('No Images Selected. Please try again.');
            return false;
        }
    }

    this.removeTags = function (tagNames) {
        imageNameLists.forEach(imgNameList => {
            imgNameList.forEach(img => {
                tagNames.forEach(tagName => {
                    img.user_tags = img.user_tags.filter((value, index, arr) => {
                        return value !== tagName;
                    });
                });
            });
        });
    }



    this.selectCategory = function (categoryNames) {

        for (var i = 0; i < def.numOfImages; ++i) {
            chosenImages[i] = [];
            imageNameLists[i].forEach((imgNameList, index) => {
                if (categoryNames.includes(imgNameList.category)) {
                    if (imgNameList.sprite)
                        imgNameList.sprite.visible = true;
                } else {
                    if (imgNameList.sprite)
                        imgNameList.sprite.visible = false;
                }
            });
        }
    }

    this.selectLocation = function (locationNames) {
        let status = false;
        for (var i = 0; i < def.numOfImages; ++i) {
            chosenImages[i] = [];
            imageNameLists[i].forEach((imgNameList, index) => {

                let isIncluded = false;
                let j = 0;

                while (j < imgNameList.user_tags.length) {

                    const tag = imgNameList.user_tags[j];

                    if (locationNames.includes(tag)) {
                        isIncluded = true;
                        break;
                    }
                    ++j;
                }

                if (isIncluded)
                    chosenImages[i].push(index);
            });
            if (chosenImages[i].length > 0) status = true;
        }

        if (status) {
            selectImages();
            lastSelectedIndex = null;
        }
        else {
            print('There is no images in this location');
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