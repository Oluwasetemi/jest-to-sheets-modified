# Jest Test Reporter

A GitHub Action that reports Jest test statistics to Google Sheets for coding challenges and assessments.

## Features

- 📊 Reports Jest test results to Google Sheets via API
- 🔄 Supports multiple challenges/tasks in a single run
- 🌐 Works with JavaScript, Python, and PHP projects
- 📈 Tracks test attempts and success rates
- 🎯 Optimized for educational coding challenges

## Inputs

### `challenge`
**Required** Comma-separated list of challenges or tasks to report on.
- Example: `task-1,task-2,task-3`

### `lang`
**Required** Programming language in use.
- Supported: `javascript`, `python`, `php`
- Example: `javascript`

### `server`
**Required** Base API URL for the reporting service.
- Example: `https://api.example.com`

### `sheetid`
**Required** Google Spreadsheet ID for storing results.
- Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### `token`
**Required** Authentication token for API calls.
- Example: `ghp_xxxxxxxxxxxxxxxxxxxx`

### `sheet`
**Required** Google Spreadsheet name for storing results.
- Ensure the sheet is created in the spreadsheet and contains the column names you are posting to
- Example: `month1`

## Example Usage

### Basic Usage
```yaml
- name: Test Results Reporter
  uses: Oluwasetemi/jest-to-sheets-modified@v2.1.5
  with:
    challenge: task-1;task-2
    lang: javascript
    server: ${{ secrets.API_SERVER }}
    sheetid: ${{ secrets.SHEET_ID }}
    token: ${{ secrets.API_TOKEN }}
    sheet: month1
```

### With Multiple Challenges
```yaml
- name: Report All Challenges
  uses: Oluwasetemi/jest-to-sheets-modified@v2.1.5
  with:
    challenge: task-1;task-2;task-3
    lang: python
    server: ${{ secrets.API_SERVER }}
    sheetid: ${{ secrets.SHEET_ID }}
    token: ${{ secrets.API_TOKEN }}
    sheet: month1
```

## What's New in v2.1.5

- 🔍 **Enhanced Record Matching**: Searches by both repo and owner for precise identification
- 📊 **Aggregated Records**: Combines multiple tasks into single repository records
- 🔄 **Proper Attempt Tracking**: Correct attempt increment logic for existing records
- 🛠️ **Comprehensive Debug Logging**: Detailed logging for troubleshooting
- 🎯 **Single API Call Strategy**: One record per repository instead of multiple calls
- 📝 **Task Combination**: Multiple tasks stored as `Challenge-01;Challenge-02;Challenge-03`

## What's New in v2.0.0

- 🚀 **Faster Builds**: Migrated from @zeit/ncc to Bun
- ✨ **Enhanced Metadata**: Better descriptions and examples
- 🎨 **Branding**: Added icon and color to the action
- 📦 **ES Modules**: Updated to modern JavaScript format
- 🔧 **Updated Dependencies**: Latest versions of all packages
- 📝 **Improved Documentation**: Clearer input descriptions

## Development

### Prerequisites
- [Bun](https://bun.sh/) (for building)

### Build
```bash
# Install dependencies
bun install

# Build the action
bun run package
```

### Local Testing
```bash
# Run tests
bun test

# Lint code
bun run lint
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
