import * as exec from '@actions/exec'
import { context } from '@actions/github'
import { Config } from './config'

export async function configureGit(): Promise<void> {
  await exec.exec('git', ['config', 'user.name', 'github-actions[bot]'])
  await exec.exec('git', [
    'config',
    'user.email',
    'github-actions[bot]@users.noreply.github.com'
  ])
  await exec.exec('git', [
    'remote',
    'set-url',
    'origin',
    `https://x-access-token:${Config.githubToken}@github.com/${context.payload.repository?.full_name}`
  ])
}

export async function checkout(ref: string): Promise<void> {
  // Checkout the branch while keeping local changes
  await exec.exec('git', ['branch', '-a'], { outStream: process.stdout })
  await exec.exec('git', ['stash'])
  await exec.exec('git', ['checkout', `"${ref}"`])
  await exec.exec('git', ['stash', 'pop'])
}

export async function commitAndPushChanges(
  commitMessage: string
): Promise<void> {
  await exec.exec('git', ['add', '.'])
  await exec.exec('git', ['commit', '-am', commitMessage])
  await exec.exec('git', ['push', 'origin'])
}
