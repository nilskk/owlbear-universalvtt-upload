import './style.css'
// import { setupScene } from './upload.ts'
import { createSceneFromInput } from './upload.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h2>Upload a Dungeondraft Universal VTT File</h2>
    
    <div class="card">
      <input type="file" id="avatar" name="avatar" accept=".dd2vtt" />
    </div>
  </div>
`

// setupScene(document.querySelector<HTMLButtonElement>('#scene')!)
createSceneFromInput(document.querySelector<HTMLInputElement>('#avatar')!)
