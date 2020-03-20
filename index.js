const {setFailed, getInput} = require('@actions/core');
const {exec} = require('@actions/exec');

async function run() {
    try {
        let prerelease = getInput('prerelease', {required: false});

        await exec('git fetch --tags');

        let allTags = [];

        let options = {
            listeners: {
                stdout: (data) => {
                    let tags = data.toString().split('\n');
                    allTags = allTags.concat(tags);
                }
            }
        };

        await exec('git tag', [], options);

        let previousVersionTags = allTags.map(processVersion).filter(Boolean).sort((a, b) => a.localeCompare(b));

        let nextVersion = prerelease ? getPrereleaseVersion(previousVersionTags, prerelease) : getNextDateVersion(previousVersionTags);

        console.log(`Next version: ${nextVersion}`);

        await exec(`git tag ${nextVersion}`);
        await exec(`git push origin ${nextVersion}`);
    } catch (error) {
        setFailed(error.message);
    }
}

run();

function getNextDateVersion(previousVersionTags) {
    let {year, month} = getDateParts();
    let newVersionParts = [`${year}`, `${month}`, 0];

    while (_tagExists(newVersionParts, previousVersionTags)) {
        newVersionParts[2]++;
    }

    return newVersionParts.join('.');
}

function getPrereleaseVersion(previousVersionTags, prerelease) {
    let nextVersion = getNextDateVersion(previousVersionTags);
    let nextVersionParts = nextVersion.split('.');

    let prereleaseVersion = 0;
    while (_tagExists(nextVersionParts, previousVersionTags, [prerelease, prereleaseVersion])) {
        prereleaseVersion++;
    }

    return `${nextVersion}-${prerelease}.${prereleaseVersion}`;
}

function _tagExists(tagParts, previousVersionTags, prereleaseParts) {
    let newTag = tagParts.join('.');

    if (prereleaseParts) {
        let [prerelease, prereleaseVersion] = prereleaseParts;
        newTag = `${newTag}-${prerelease}.${prereleaseVersion}`;
    }

    return previousVersionTags.find((tag) => tag === newTag);
}

function processVersion(version) {
    let parts = version.split('.');

    if (parts.length !== 3) {
        return false;
    }

    let year = parts[0];
    let month = parts[1] * 1;
    let patch = parts[2] * 1;

    if (year.match(/^v\d*/)) {
        year = year.substr(1);
    }

    year = year * 1;

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(patch)) {
        return false;
    }

    let {year: currentYear, month: currentMonth} = getDateParts();

    if (year !== currentYear || month !== currentMonth) {
        return false;
    }

    return `${year}.${month}.${patch}`
}

function getDateParts() {
    let date = new Date();
    let year = date
        .getUTCFullYear()
        .toString()
        .substr(-2) * 1;
    let month = date.getUTCMonth() + 1;

    return {year, month};
}
