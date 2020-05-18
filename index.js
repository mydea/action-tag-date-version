const { setFailed, getInput } = require("@actions/core");
const { exec } = require("@actions/exec");
const semver = require("semver");

async function run() {
  try {
    let prerelease = getInput("prerelease", { required: false });

    await exec("git fetch --tags");

    let allTags = [];

    let options = {
      listeners: {
        stdout: (data) => {
          let tags = data.toString().split("\n");
          allTags = allTags.concat(tags);
        },
      },
    };

    await exec("git tag", [], options);

    let previousVersionTags = allTags
      .map(processVersion)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    let nextVersion = prerelease
      ? getPrereleaseVersion(previousVersionTags, prerelease)
      : getNextDateVersion(previousVersionTags);

    console.log(`Next version: ${nextVersion}`);

    await exec(`git tag ${nextVersion}`);
    await exec(`git push origin ${nextVersion}`);

    // try this...
  } catch (error) {
    setFailed(error.message);
  }
}

run();

function getNextDateVersion(previousVersionTags) {
  let { year, month } = getDateParts();
  let newVersionParts = [`${year}`, `${month}`, 0];

  while (_tagExists(newVersionParts, previousVersionTags)) {
    newVersionParts[2]++;
  }

  return newVersionParts.join(".");
}

function getPrereleaseVersion(previousVersionTags, prerelease) {
  let nextVersion = getNextDateVersion(previousVersionTags);
  let nextVersionParts = nextVersion.split(".");

  let prereleaseVersion = 0;
  while (
    _tagExists(nextVersionParts, previousVersionTags, [
      prerelease,
      prereleaseVersion,
    ])
  ) {
    prereleaseVersion++;
  }

  return `${nextVersion}-${prerelease}.${prereleaseVersion}`;
}

function _tagExists(tagParts, previousVersionTags, prereleaseParts) {
  let newTag = tagParts.join(".");

  if (prereleaseParts) {
    let [prerelease, prereleaseVersion] = prereleaseParts;
    newTag = `${newTag}-${prerelease}.${prereleaseVersion}`;
  }

  return previousVersionTags.find((tag) => tag === newTag);
}

function processVersion(version) {
  if (!semver.valid(version)) {
    return false;
  }

  let {
    major,
    minor,
    patch,
    prerelease,
    version: parsedVersion,
  } = semver.parse(version);

  let { year: currentYear, month: currentMonth } = getDateParts();

  if (major !== currentYear || minor !== currentMonth) {
    return false;
  }

  return parsedVersion;
}

function getDateParts() {
  let date = new Date();
  let year = date.getUTCFullYear().toString().substr(-2) * 1;
  let month = date.getUTCMonth() + 1;

  return { year, month };
}
