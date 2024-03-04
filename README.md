# jest-to-sheets-modified

This action sends the Jest tests summary to a backend Google sheet via an API

## Inputs

### `challenge`

**Required** The challenge in the assessment that Jest ran and needs to report on.

### `lang`

**Required** The primary language with which the developer coded the solution being tested

### `server`

**Required** The base backend API endpoint to send the report data to.

## Example Usage

```bash
- name: Report Tests
  uses: Oluwasetemi/jest-to-sheets-modified@v1
  with:
    challenge: ch-2
    lang: javascript
    server: https://the-server-url/endpoint
```
