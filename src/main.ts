import './style.css'
// import { setupScene } from './upload.ts'
import { createSceneFromInput, uploadScene } from './importUniversalVTT.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h2>Upload a Dungeondraft Universal VTT File</h2>
    <input type="file" id="avatar" name="avatar" accept=".dd2vtt" /><br><br>
    <input type="checkbox" id="lightCheckbox">
    <label for="lightCheckbox"> Include Lightsources?</label><br><br>
    <button type="button" id="uploadButton">Create Scene</button>
  </div>
`

// setupScene(document.querySelector<HTMLButtonElement>('#scene')!)
createSceneFromInput(document.querySelector<HTMLInputElement>('#avatar')!)
uploadScene(document.querySelector<HTMLButtonElement>('#uploadButton')!, document.querySelector<HTMLInputElement>('#lightCheckbox')!)
