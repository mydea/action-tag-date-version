const {setFailed} = require('@actions/core');
const {exec} = require('@actions/exec');

async function run() {
    try {
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

        let nextVersion = getCurrentDateVersion(previousVersionTags);

        console.log(`Next version: ${nextVersion}`);

        await exec(`git tag ${nextVersion}`);
        await exec(`git push origin ${nextVersion}`);
    } catch (error) {
        setFailed(error.message);
    }
}

run();

function getCurrentDateVersion(previousVersionTags) {
    let {year, month} = getDateParts();
    let newVersionParts = [`${year}`, `${month}`, '0'];

    while (_tagExists(newVersionParts, previousVersionTags)) {
        newVersionParts[2]++;
    }

    return newVersionParts.join('.');
}

function _tagExists(tagParts, previousVersionTags) {
    let newTag = tagParts.join('.');
    console.log(newTag, JSON.stringify(previousVersionTags));
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
    console.log({year, month, currentYear, currentMonth});

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
