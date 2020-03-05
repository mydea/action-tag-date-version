const {getInput, setFailed} = require('@actions/core');
const {exec} = require('@actions/exec');

async function run() {
    try {
        await exec('git fetch --tags');

        let allTags = [];

        let options = {
            listeners: {
                stdout: (data) => {
                    let tag = data.toString().replace(/\s/g, '');
                    allTags.push(tag);
                }
            }
        };

        await exec('git tag', [], options);

        console.log('Found tags:');
        console.log(JSON.stringify(allTags));

        let versionTags = allTags.map(processVersion).filter(Boolean).sort((a, b) => a.localeCompare(b));

        let nextVersion = getCurrentDateVersion(versionTags[0]);

        console.log(`Next version: ${nextVersion}`);

        // await exec(`git tag ${nextVersion}`);
        // await exec(`git push ${nextVersion}`);

    } catch (error) {
        setFailed(error.message);
    }
}

run();

function getCurrentDateVersion(latestVersion) {
    let latestVersionParts = latestVersion.split('.');

    let date = new Date();

    let year = date
        .getUTCFullYear()
        .toString()
        .substr(-2);
    let month = date.getUTCMonth() + 1;

    let newVersionParts = [`${year}`, `${month}`, '0'];

    if (
        latestVersionParts[0] === newVersionParts[0] &&
        latestVersionParts[1] === newVersionParts[1]
    ) {
        newVersionParts[2] = latestVersionParts[2] * 1 + 1;
    }

    return newVersionParts.join('.');
}

function processVersion(version) {
    console.log('process version', version);
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

    if (year < 19 || year > 99) {
        return false;
    }

    if (month < 1 || month > 12) {
        return false;
    }

    if (patch < 0) {
        return false;
    }

    return `${year}.${month}.${patch}`
}
