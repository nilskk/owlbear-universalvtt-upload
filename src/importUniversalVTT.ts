import OBR, { buildSceneUpload, buildImageUpload, buildCurve, Item, Metadata, Vector2 } from "@owlbear-rodeo/sdk"
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

export function uploadScene(element: HTMLButtonElement) {
    element.addEventListener('click', async () => {
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
        jsonData.portals.forEach((element :any, index:number) => {
            const item = createDoorFromPoints(element.bounds, index)
            sceneItems.push(item)
        });

        const scene = buildSceneUpload()
            .baseMap(image)
            .name(jsonData.name)
            .items(sceneItems)
            .build()

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
        .fillOpacity(0)
        .layer("DRAWING")
        .name("Vision Line")
        .closed(false)
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
        .fillOpacity(0)
        .layer("DRAWING")
        .name("Door")
        .closed(false)
        .tension(0)
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