import OBR, { buildSceneUpload, buildImageUpload, buildCurve, buildImage, Item, Metadata } from "@owlbear-rodeo/sdk"
import { simplifyPolyline } from "./simplify"
import path from "path-browserify";


var jsonData: any


export function createSceneFromInput(element: HTMLInputElement) {
    element.addEventListener('change', () => {
        if (!element.files) return;
        const file = element.files[0]
        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const fileContent = fileReader.result as string
                jsonData = JSON.parse(fileContent)
                jsonData.name = path.basename(file.name, path.extname(file.name))


            };
            fileReader.readAsText(file)
        }
    });
}

export function uploadScene(buttonElement: HTMLButtonElement, checkboxElement: HTMLInputElement) {
    buttonElement.addEventListener('click', async () => {
        const file = await convertBase64toImageFile(jsonData.image)
        const image = buildImageUpload(file)
            .dpi(jsonData.resolution.pixels_per_grid)
            .name(jsonData.name)
            .build()

        var sceneItems: Item[] = []
        jsonData.line_of_sight.forEach((element: any) => {
            element = simplifyPolyline(element, 0.1)
            const item = createWallFromPoints(element)
            sceneItems.push(item)
        });
        jsonData.portals.forEach((element: any, index: number) => {
            const item = createDoorFromPoints(element.bounds, index)
            sceneItems.push(item)
        });
        if (checkboxElement.checked == true) {
            jsonData.lights.forEach((element: any, index: number) => {
                const item = createLightsFromPoints(element.position, index, jsonData.resolution.pixels_per_grid, element.range)
                sceneItems.push(item)
            });
        }
        

        const scene = buildSceneUpload()
            .baseMap(image)
            .name(jsonData.name)
            .items(sceneItems)
            .build()

        // scene.grid.dpi = jsonData.resolution.pixels_per_grid

        OBR.assets.uploadScenes([scene])

    })

}


function createWallFromPoints(pointsObject: any) {
    const itemScale = {
        x: 150,
        y: 150
    }

    const itemMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true
    }
    const item = buildCurve()
        .points(pointsObject)
        .metadata(itemMetadata)
        .scale(itemScale)
        .layer("DRAWING")
        .name("Vision Line")
        .closed(false)
        .locked(true)
        .visible(false)
        .fillOpacity(0)
        .tension(0)
        .build()
    return item
}

function createDoorFromPoints(pointsObject: any, doorId: number) {
    const itemScale = {
        x: 150,
        y: 150
    }

    const itemMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true,
        'com.battle-system.smoke/isDoor': true,
        'com.battle-system.smoke/doorId': doorId,
    }

    const item = buildCurve()
        .points(pointsObject)
        .metadata(itemMetadata)
        .scale(itemScale)
        .layer("DRAWING")
        .name("Door")
        .closed(false)
        .locked(true)
        .visible(false)
        .fillOpacity(0)
        .tension(0)
        .build()
    return item
}

function createLightsFromPoints(pointsObject: any, lightId: number, dpi: number, range: number) {
    pointsObject.x = pointsObject.x * 150
    pointsObject.y = pointsObject.y * 150

    const itemMetadata: Metadata = {
        'com.battle-system.smoke/visionTorch': true,
        'com.battle-system.smoke/hasVision': true,
        'com.battle-system.smoke/hasAutohide': true,
        'com.battle-system.smoke/visionRange': range,
    }

    const item = buildImage(
        {
            height: dpi,
            width: dpi,
            url: "https://nilskk.github.io/owlbear-universalvtt-upload/transparent.png",
            mime: "image/png",
        },
        { dpi: dpi, offset: { x: dpi/2, y: dpi/2 } }
    )
        .position(pointsObject)
        .metadata(itemMetadata)
        .layer("CHARACTER")
        .name("Light " + lightId)
        .plainText("Light " + lightId)
        .locked(true)
        .build()
    return item
}


async function convertBase64toImageFile(imageString: string) {
    const base64String = "data:image/png;base64," + imageString
    const data = await fetch(base64String);
    const blob = await data.blob();
    const file = await new File([blob], 'avatar', { type: 'image/png' });
    return file
}