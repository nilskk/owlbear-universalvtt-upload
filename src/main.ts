// Import the CSS styles
import './style.css'

// Import the necessary functions from the 'importUniversalVTT.ts' module
import { createSceneFromInput, uploadScene } from './importUniversalVTT.ts'


// Call the 'createSceneFromInput' function with the file input element
// This function will create a scene from the selected file
createSceneFromInput(document.querySelector<HTMLInputElement>('#avatar')!)

// Call the 'uploadScene' function with the necessary elements
// This function will upload the created scene based on the selected options
uploadScene(
  // The button that triggers the upload
  document.querySelector<HTMLButtonElement>('#uploadButton')!,
  
  // The checkbox that determines whether to include light sources
  document.querySelector<HTMLInputElement>('#lightCheckbox')!,
  
  // The checkbox that determines whether to simplify walls
  document.querySelector<HTMLInputElement>('#simplificationCheckbox')!,
  
  // The slider that sets the simplification ratio
  document.querySelector<HTMLInputElement>('#simplificationSlider')!
)