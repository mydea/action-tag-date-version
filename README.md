# action-tag-date-version

This action will create a tag with a date version.

## Example usage

Create a file named `.github/workflows/deploy.yml` in your repo and add the following:

```yaml
name: ember-cli-code-coverage

on: [pull_request]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@master
    - uses: mydea/action-tag-date-version@v20
    - run: deploy-app
```

You can also specify an option `prerelease` to create versions like `20.3.5-beta.0`:


```yaml
name: ember-cli-code-coverage

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@master
    - uses: mydea/action-tag-date-version@v20
      with:
        prerelease: beta
    - run: deploy-app
```
