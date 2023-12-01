import OBR, { buildSceneUpload, buildImageUpload, buildCurve, buildImage, Item, Metadata } from "@owlbear-rodeo/sdk"
import { simplifyPolyline } from "./simplify"
import path from "path-browserify";


let jsonData: any

/**
 * Reads a file from an input element, parses it as JSON, and updates the jsonData variable.
 * @param element - The input element to read the file from.
 */
export function createSceneFromInput(element: HTMLInputElement) {
    // Listen for file selection
    element.addEventListener('change', () => {
        // Return if no files selected
        if (!element.files) return;

        // Get the first selected file
        const file = element.files[0];

        // If a file is selected
        if (file) {
            // Create a new FileReader
            const fileReader = new FileReader();

            // When file is loaded, parse its content and update the name
            fileReader.onload = () => {
                jsonData = JSON.parse(fileReader.result as string);
                jsonData.name = path.basename(file.name, path.extname(file.name));
            };

            // Start reading the file
            fileReader.readAsText(file);
        }
    });
}

/**
 * Uploads a scene based on the provided button and checkbox elements.
 * @param buttonElement - The button element that triggers the upload.
 * @param checkboxElement - The checkbox element that determines whether lights should be included.
 * @param simplificationCheckbox - The checkbox element that determines whether polyline simplification should be applied.
 * @param rangeElement - The range input element that determines the simplification factor.
 */
export function uploadScene(buttonElement: HTMLButtonElement, checkboxElement: HTMLInputElement, simplificationCheckbox: HTMLInputElement, rangeElement: HTMLInputElement) {
    // Listen for button click
    buttonElement.addEventListener('click', async () => {
        // Convert image to JPEG file
        const file = base64ToImageFile(jsonData.image)
        const jpegBlob = await convertPngFileToJpegBlob(file)
        const jpegFile = new File([jpegBlob], 'filename.webp', { type: 'image/webp' });

        // Prepare image upload
        const image = buildImageUpload(jpegFile)
            .dpi(jsonData.resolution.pixels_per_grid)
            .name(jsonData.name)
            .build()

        // Prepare wall items from line of sight data
        const sceneItems: Item[] = jsonData.line_of_sight.map((element: any) => {
            if (simplificationCheckbox.checked) {
                element = simplifyPolyline(element, rangeElement.valueAsNumber)
            }
            return createWallFromPoints(element)
        });

        // Add door items from portal data
        sceneItems.push(...jsonData.portals.map((element: any, index: number) => createDoorFromPoints(element.bounds, index)));

        // If checked, add light items from light data
        if (checkboxElement.checked) {
            sceneItems.push(...jsonData.lights.map((element: any, index: number) => createLightsFromPoints(element.position, index, jsonData.resolution.pixels_per_grid, element.range)));
        }

        // Prepare scene upload
        const scene = buildSceneUpload()
            .baseMap(image)
            .name(jsonData.name)
            .items(sceneItems)
            .build()

        // Upload the scene
        OBR.assets.uploadScenes([scene])
    })
}


/**
 * Creates a wall from an object containing points.
 * @param pointsObject - The object containing the points for the wall.
 * @returns The created wall item.
 */
function createWallFromPoints(pointsObject: any): Item {
    // Define common scale for items
    const itemScale = { x: 150, y: 150 }

    // Define metadata for the item
    const itemMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true
    }

    // Build and return the item
    return buildCurve()
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
}

/**
 * Creates a door from the given points object and door ID.
 * @param pointsObject - The points object defining the shape of the door.
 * @param doorId - The ID of the door.
 * @returns The created door item.
 */
function createDoorFromPoints(pointsObject: any, doorId: number): Item {
    // Define common scale for items
    const itemScale = { x: 150, y: 150 }

    // Define metadata for the item
    const itemMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true,
        'com.battle-system.smoke/isDoor': true,
        'com.battle-system.smoke/doorId': doorId,
    }

    // Build and return the item
    return buildCurve()
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
}

/**
 * Creates a light from the given points object, light ID, DPI, and range.
 * @param pointsObject - The points object defining the position of the light.
 * @param lightId - The ID of the light.
 * @param dpi - The DPI (dots per inch) for the light's image.
 * @param range - The range of the light.
 * @returns The created light item.
 */
function createLightsFromPoints(pointsObject: any, lightId: number, dpi: number, range: number): Item {
    // Scale the points object
    pointsObject.x *= 150
    pointsObject.y *= 150

    // Define metadata for the light
    const itemMetadata: Metadata = {
        'com.battle-system.smoke/visionTorch': true,
        'com.battle-system.smoke/hasVision': true,
        'com.battle-system.smoke/hasAutohide': true,
        'com.battle-system.smoke/visionRange': range,
    }

    // Build and return the light item
    return buildImage(
        {
            height: dpi,
            width: dpi,
            url: "https://nilskk.github.io/owlbear-universalvtt-upload/transparent.png",
            mime: "image/png",
        },
        { dpi: dpi, offset: { x: dpi / 2, y: dpi / 2 } }
    )
        .position(pointsObject)
        .metadata(itemMetadata)
        .layer("CHARACTER")
        .name(`Light ${lightId}`)
        .plainText(`Light ${lightId}`)
        .locked(true)
        .build()
}



/**
 * Converts a base64 string to an image File object.
 * 
 * @param base64 - The base64 string representing the image.
 * @returns The image File object.
 */
function base64ToImageFile(base64: string,): File {
    const bstr = atob(base64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], 'avatar', { type: 'image/png' });
}


/**
 * Converts a PNG file to a JPEG Blob.
 * 
 * @param pngFile - The PNG file to convert.
 * @returns A Promise that resolves to the converted JPEG Blob.
 */
function convertPngFileToJpegBlob(pngFile: File): Promise<Blob> {
    // Show loading symbol
    const loadingSymbol = document.getElementById('loader');
    if (loadingSymbol) {
        loadingSymbol.style.display = 'block';
    }

    // Create a promise to handle the conversion process
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const url = URL.createObjectURL(pngFile);

        // When image is loaded, draw it on a canvas and convert to JPEG
        img.onload = function () {
            if (ctx) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    URL.revokeObjectURL(url);
                    // Hide loading symbol
                    if (loadingSymbol) {
                        loadingSymbol.style.display = 'none';
                    }
                    // Resolve or reject the promise based on blob creation
                    blob ? resolve(blob) : reject(new Error('Failed to convert PNG to WebP'));
                }, 'image/webp', 0.75);
            }
        };

        // On error, hide loading symbol and reject the promise
        img.onerror = function () {
            URL.revokeObjectURL(url);
            if (loadingSymbol) {
                loadingSymbol.style.display = 'none';
            }
            reject(new Error('Failed to load image'));
        };

        // Start loading the image
        img.src = url;
    });
}