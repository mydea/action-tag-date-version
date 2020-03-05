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
    - uses: mydea/actions-tag-date-version@v20
    - run: deploy-app
```

Note that the `GITHUB_TOKEN` secret is automatically available, so you don't need to do anything else about that.
