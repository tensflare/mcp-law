import * as fs from 'node:fs'
import * as path from 'node:path'
import { TEMPLATES, getTemplate } from './templates.js'
import { getFileList } from './files.js'
import type { ScaffoldConfig } from './files.js'

export { TEMPLATES, getTemplate }
export type { ScaffoldConfig }

export interface ScaffoldResult {
  projectPath: string
  filesCreated: string[]
  config: ScaffoldConfig
}

export function scaffoldProject(config: ScaffoldConfig): ScaffoldResult {
  const template = getTemplate(config.templateId)
  if (!template) {
    throw new Error(`Unknown template: ${config.templateId}`)
  }

  const projectPath = path.resolve(config.projectName)
  const filesCreated: string[] = []

  const srcDir = path.join(projectPath, 'src')
  fs.mkdirSync(srcDir, { recursive: true })

  const fileDefs = getFileList(config)
  for (const fileDef of fileDefs) {
    const filePath = path.join(projectPath, fileDef.path)
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, fileDef.content, 'utf-8')
    filesCreated.push(fileDef.path)
  }

  return { projectPath, filesCreated, config }
}

export function scaffoldProjectDryRun(config: ScaffoldConfig): ScaffoldResult {
  return {
    projectPath: path.resolve(config.projectName),
    filesCreated: getFileList(config).map(f => f.path),
    config,
  }
}
