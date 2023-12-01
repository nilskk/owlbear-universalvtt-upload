// Import styles and functions
import './style.css'
import { createSceneFromInput, uploadScene } from './importUniversalVTT.ts'

// Create a scene from the selected file
createSceneFromInput(document.querySelector<HTMLInputElement>('#avatar')!)

// Upload the created scene based on the selected options
uploadScene(
  document.querySelector<HTMLButtonElement>('#uploadButton')!,
  document.querySelector<HTMLInputElement>('#lightCheckbox')!,
  document.querySelector<HTMLInputElement>('#simplificationCheckbox')!,
  document.querySelector<HTMLInputElement>('#simplificationSlider')!
)
