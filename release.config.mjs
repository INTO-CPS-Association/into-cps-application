/**
 * @type {import('semantic-release').Options}
 */
const config = {
  branches: [
    'main',
    { name: 'development', prerelease: false },
    { name: 'test-merge-draft', channel: 'test-merge-draft' }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
        draft: true,
        assets: ['./release/**'],
        releaseName: 'INTO-CPS Application ${nextRelease.version}',
      },
    ],
  ],
};

export default config;