import './style.css'
// import { setupScene } from './upload.ts'
import { createSceneFromInput, uploadScene } from './importUniversalVTT.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h2>Upload a Dungeondraft Universal VTT File</h2>
    <input type="file" id="avatar" accept=".dd2vtt" /><br><br>
    <input type="checkbox" id="lightCheckbox">
    <label for="lightCheckbox">Include Lightsources?</label><br><br>
    <div id="simplification">
      <input type="checkbox" id="simplificationCheckbox" checked>
      <label for="simplificationCheckbox">Simplify walls?</label><br>
      <label for="simplificationSlider">Simplification Ratio</label><br>
      <input type="range" id="simplificationSlider" min="0.05" max="0.25" step="0.05" list="values" />
      <datalist id="values">
        <option value="0.05" label="0.05"></option>
        <option value="0.1" label="0.1"></option>
        <option value="0.15" label="0.15"></option>
        <option value="0.2" label="0.2"></option>
        <option value="0.25" label="0.25"></option>
      </datalist><br>
    </div>
    
    <button type="button" id="uploadButton">Create Scene</button>
  
  </div>
  
`

// setupScene(document.querySelector<HTMLButtonElement>('#scene')!)
createSceneFromInput(document.querySelector<HTMLInputElement>('#avatar')!)
uploadScene(
  document.querySelector<HTMLButtonElement>('#uploadButton')!, 
  document.querySelector<HTMLInputElement>('#lightCheckbox')!,
  document.querySelector<HTMLInputElement>('#simplificationCheckbox')!,
  document.querySelector<HTMLInputElement>('#simplificationSlider')!
)
