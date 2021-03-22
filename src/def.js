var def = {
    imageWidth: 1500,
    imageHeight: 5850,
    spriteWidth: 150,
    spriteHeight: 150,
    numOfImages: 1,
}

def['rows'] = def.imageHeight / def.spriteHeight;
def['cols'] = def.imageWidth / def.spriteWidth;
def['borderThickness'] = def.spriteWidth / 25;
export { def };