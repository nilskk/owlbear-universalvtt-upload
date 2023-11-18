import OBR, { buildSceneUpload, buildImageUpload, buildCurve, Item, Vector2, Metadata } from "@owlbear-rodeo/sdk";
import { simplifyPolyline } from "./simplify";

// export function setupScene(element: HTMLButtonElement) {
//     const scene = buildSceneUpload()
//         .gridType("HEX_HORIZONTAL")
//         .name("Hex Scene")
//         .build();
//     const setScene = () => {
//         OBR.assets.uploadScenes([scene]);
//     }
//     element.addEventListener('click', () => setScene())
// }

export function createSceneFromInput(element: HTMLInputElement) {
    element.addEventListener('change', () => {

        if (!element.files) return;

        const file = element.files[0];
        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                const fileContent = fileReader.result as string;
                const jsonData = JSON.parse(fileContent);
                console.log(jsonData);
                console.log(jsonData.name);

                const file = await convertBase64toImageFile(jsonData.image)
                const image = buildImageUpload(file)
                    .dpi(jsonData.resolution.pixels_per_grid)
                    .build()

                var wallItems: Item[] = []
                const itemScale: Vector2 = {
                    x: jsonData.resolution.pixels_per_grid,
                    y: jsonData.resolution.pixels_per_grid
                }
                jsonData.line_of_sight.forEach((element: any) => {
                    element = simplifyPolyline(element, 0.1)
                    const item = createItemfromPath(element, itemScale)
                    wallItems.push(item)
                });

                const scene = buildSceneUpload()
                    .baseMap(image)
                    .name("Image Scene")
                    .items(wallItems)
                    .build()

                OBR.assets.uploadScenes([scene]);
            };
            fileReader.readAsText(file);
        }
    });
}


function createItemfromPath(pathObject: any, itemScale: Vector2) {

    const pathMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true
    }

    const item = buildCurve()
        .points(pathObject)
        .metadata(pathMetadata)
        .scale(itemScale)
        .fillOpacity(0)
        .layer("DRAWING")
        .name("Vision Line")
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