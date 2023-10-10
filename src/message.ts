import { LcovFile } from 'lcov-parse'
import {
  CoveredProject,
  getLcovPercentage,
  getProjectPercentage,
  getTotalPercentage,
  getTotalPercentageBefore
} from './lcov'
import { Config } from './config'
import { buildBadgeUrl } from './badge'

export function buildMessage(
  projects: CoveredProject[],
  url: string,
  sha: string
): string {
  if (projects.length === 0) {
    return ''
  }
  const shaShort = sha.slice(0, 8)
  const commit = `[<code>${shaShort}</code>](${url}/commits/${sha})`
  let md = ''
  md += '# Coverage Report\n'
  md += `Automatic coverage report for ${commit}.\n`
  md += '\n'

  if (projects.length > 1) {
    md += buildTotalTable(projects) + '\n'
  }

  for (const project of projects) {
    md += buildTable(project) + '\n'
  }
  md += '\n'
  md += '---\n'
  md += `> Generated by [dart-coverage-assistant](https://github.com/whynotmake-it/dart-coverage-assistant)\n`
  return md
}

function buildTotalTable(projects: CoveredProject[]): string {
  let md = ''
  const combined = getTotalPercentage(projects)
  if (combined !== undefined) {
    const badge = buildBadge(
      Config.upperCoverageThreshold,
      Config.lowerCoverageThreshold,
      combined
    )
    md += `## Total coverage: \n`
    md += '\n'
    md += `| Coverage | Diff |\n`
    md += `| --- | --- |\n`
    md += `| ${badge} | ${buildDiffString(getTotalDiff(projects))} |\n`
  }
  return md
}

function buildTable(project: CoveredProject): string {
  let md = ''
  md += buildHeader(project) + '\n'
  md += '\n'
  md += buildBody(project) + '\n'
  return md
}

function buildHeader(project: CoveredProject): string {
  const percentage = project.coverage
    ? getProjectPercentage(project)
    : undefined
  const diff = buildDiffString(getDiff(project))

  const badgeCell = percentage
    ? `${buildBadge(
        Config.upperCoverageThreshold,
        Config.lowerCoverageThreshold,
        percentage
      )}`
    : ''

  let md = `## \`${project.name}\`\n`
  md += '\n'
  md += `> ${project.description}\n`
  md += '\n'
  md += '| Coverage | Diff |\n'
  md += '| --- | --- |\n'
  md += `| ${badgeCell} | ${diff} |\n`
  return md
}

function buildBody(project: CoveredProject): string {
  if (project.coverage === undefined) {
    return ''
  }
  let tableMd = ''
  tableMd += '| File | Line Percentage | Line Count |\n'
  tableMd += '| --- | --- | --- |\n'
  const folders: Record<string, LcovFile[]> = {}

  // Group files by folder
  for (const file of project.coverage) {
    const parts = file.file.split('/')
    const folder = parts.slice(0, -1).join('/')
    folders[folder] = folders[folder] || []
    folders[folder].push(file)
  }

  // Add all folders to the table
  for (const folder of Object.keys(folders).sort()) {
    tableMd += `| **${folder}** |   |   |\n`
    for (const file of folders[folder]) {
      const name = file.file.split('/').slice(-1)[0]
      tableMd += `| ${name} | ${getLcovPercentage([file])} | ${
        file.lines.details.length
      } |\n`
    }
  }

  let md = '<details>\n'
  md += `<summary>Coverage Details for <strong>${project.name}</strong></summary>\n`
  md += '\n'
  md += tableMd
  md += '\n'
  md += '</details>'
  return md
}

function buildDiffString(diff: number | undefined): string {
  if (diff === undefined) {
    return '-'
  }
  if (diff === 0) {
    return `➡️ ${diff.toFixed(2)}%`
  } else if (diff > 0) {
    return `⬆️ +${diff.toFixed(2)}%`
  } else {
    return `⬇️ ${diff.toFixed(2)}%`
  }
}

function getDiff(project: CoveredProject): number | undefined {
  if (project.coverageBefore === undefined || !project.coverage) {
    return undefined
  }
  const current = getLcovPercentage(project.coverage)
  const before =
    project.coverageBefore === null
      ? 0
      : getLcovPercentage(project.coverageBefore)
  return current - before
}

function getTotalDiff(projects: CoveredProject[]): number | undefined {
  const current = getTotalPercentage(projects)
  const before = getTotalPercentageBefore(projects)
  if (current === undefined || before === undefined) {
    return undefined
  }
  return current - before
}

function buildBadge(upper: number, lower: number, percentage: number): string {
  const alt =
    percentage >= upper ? 'pass' : percentage >= lower ? 'warning' : 'fail'
  const url = buildBadgeUrl(undefined, upper, lower, percentage)
  return `![${alt}](${encodeURI(url)} "${alt}")`
}
