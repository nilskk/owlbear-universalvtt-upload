// Import styles and functions
import './style.css'
import { createSceneFromInput, uploadScene, fixScene } from './importUniversalVTT.ts'

// Create a scene from the selected file
createSceneFromInput(document.querySelector<HTMLInputElement>('#avatar')!)

// Reference all radio buttons for WebP quality
const webpQualityRadios = document.querySelectorAll<HTMLInputElement>('input[name="webpQuality"]');

// Upload the created scene based on the selected options
uploadScene(
  document.querySelector<HTMLButtonElement>('#uploadButton')!,
  document.querySelector<HTMLInputElement>('#lightCheckbox')!,
  document.querySelector<HTMLInputElement>('#blockWallsCheckbox')!,
  webpQualityRadios
)

fixScene(
  document.querySelector<HTMLButtonElement>('#fixButton')!,
  document.querySelector<HTMLInputElement>('#lightCheckbox')!,
  document.querySelector<HTMLInputElement>('#blockWallsCheckbox')!,
)