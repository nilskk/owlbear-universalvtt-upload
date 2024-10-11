import OBR, { buildSceneUpload, buildImageUpload, buildCurve, buildImage, Item, Metadata } from "@owlbear-rodeo/sdk"
import simplify  from "simplify-js"
import path from "path-browserify";


let jsonData: any

interface Point {
    x: number;
    y: number;
}

const SIMPLIFICATION_FACTOR = 0.05;
const BATCH_SIZE = 5;


function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function slicePoints(points: Point[], sliceLength: number = 100): Point[][] {
    const result: Point[][] = [];
    for (let i = 0; i < points.length; i += (sliceLength - 1)) {
        const slice = points.slice(i, i + sliceLength);
        result.push(slice);
    }
    return result;
}

async function addItemsWithRateLimitHandling(sceneItems: Item[], batchSize: number) {
    // Show loading symbol
    const loadingSymbol = document.getElementById('loader2');
    if (loadingSymbol) {
        loadingSymbol.style.display = 'block';
    }

    for (let i = 0; i < sceneItems.length; i += batchSize) {
        const batch = sceneItems.slice(i, i + batchSize);
        try {
            await OBR.scene.items.addItems(batch);
        } catch (error) {
            console.error("An error occurred:", error);
            if ((error as any).error.name === "RateLimitHit") {
                console.error("Rate limit exceeded. Retrying after delay...");
                await sleep(100); // Wait for 1 s before retrying
                i -= batchSize; // Retry the same batch
            } else {
                console.error("An error occurred:", error);
                throw error; // Re-throw the error if it's not a RateLimitError
            }
        }
        await sleep(10); // Sleep for 10ms between batches
    }

    if (loadingSymbol) {
        loadingSymbol.style.display = 'none';
    }
}

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
export function uploadScene(buttonElement: HTMLButtonElement, checkboxElement: HTMLInputElement) {
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

        let sceneItems: Item[] = [];

        jsonData.line_of_sight.forEach((element: any) => {
            let elements: Point[][];
            elements = slicePoints(element, 100);
            elements.forEach((element) => {
                element = simplify(element, SIMPLIFICATION_FACTOR, true);
                sceneItems.push(createWallFromPoints(element));
            });
        });

        // Add door items from portal data
        sceneItems.push(...jsonData.portals.map((element: any) => createDoorFromPoints(element.bounds)));

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


export function fixScene(buttonElement: HTMLButtonElement, checkboxElement: HTMLInputElement) {
    buttonElement.addEventListener('click', async () => {
        const itemsToDelete = await OBR.scene.items.getItems(
            (item) => item.metadata['com.battle-system.smoke/isVisionLine'] == true
        );
        const itemIdsToDelete = itemsToDelete.map((item) => item.id);
        OBR.scene.items.deleteItems(itemIdsToDelete)
        
        let sceneItems: Item[] = [];

        jsonData.line_of_sight.forEach((element: any) => {
            let elements: Point[][];
            elements = slicePoints(element, 100);
            elements.forEach((element) => {
                element = simplify(element, SIMPLIFICATION_FACTOR, true);
                sceneItems.push(createWallFromPoints(element));
            });
        });

        // Add door items from portal data
        sceneItems.push(...jsonData.portals.map((element: any) => createDoorFromPoints(element.bounds)));

        // If checked, add light items from light data
        if (checkboxElement.checked) {
            const lightsToDelete = await OBR.scene.items.getItems(
                (item) => item.metadata['com.battle-system.smoke/visionTorch'] == true
            );
            const lightIdsToDelete = lightsToDelete.map((item) => item.id);
            OBR.scene.items.deleteItems(lightIdsToDelete)
            sceneItems.push(...jsonData.lights.map((element: any, index: number) => createLightsFromPoints(element.position, index, jsonData.resolution.pixels_per_grid, element.range)));
        }


        addItemsWithRateLimitHandling(sceneItems, BATCH_SIZE);

    });
}


/**
 * Creates a wall from an object containing points.
 * @param pointsObject - The object containing the points for the wall.
 * @returns The created wall item.
 */
function createWallFromPoints(pointsObject: any): Item {


    const newItemPaths = [];
    for (const point of pointsObject) {
        newItemPaths.push({ x: point.x * 150, y: point.y * 150 });
    }

    // Define metadata for the item
    const itemMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true,
        'com.battle-system.smoke/doubleSided': true,
    }

    // Build and return the item
    return buildCurve()
        .points(newItemPaths)
        .metadata(itemMetadata)
        .layer("POINTER")
        .name("Vision Line (Line)")
        .closed(false)
        .locked(true)
        .visible(false)
        .fillOpacity(0)
        .tension(0)
        .fillColor("#000000")
        .strokeColor("#000000")
        .strokeWidth(8)
        .build()
}

/**
 * Creates a door from the given points object and door ID.
 * @param pointsObject - The points object defining the shape of the door.
 * @param doorId - The ID of the door.
 * @returns The created door item.
 */
function createDoorFromPoints(pointsObject: any): Item {

    const newItemPaths = [];
    for (const point of pointsObject) {
        newItemPaths.push({ x: point.x * 150, y: point.y * 150 });
    }

    // Define metadata for the item
    const itemMetadata: Metadata = {
        'com.battle-system.smoke/isVisionLine': true,
        'com.battle-system.smoke/isDoor': true,
        'com.battle-system.smoke/doubleSided': true,
    }

    // Build and return the item
    return buildCurve()
        .points(newItemPaths)
        .metadata(itemMetadata)
        .layer("POINTER")
        .name("Door")
        .closed(false)
        .locked(true)
        .visible(false)
        .fillOpacity(0)
        .tension(0)
        .fillColor("#000000")
        .strokeColor("#4000ff")
        .strokeWidth(8)
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
        'com.battle-system.smoke/isTorch': true,
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
        .layer("PROP")
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
                }, 'image/webp', 0.9);
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