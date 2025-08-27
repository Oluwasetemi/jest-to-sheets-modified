# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.5] - 2025-08-26

### Added
- **Aggregated Repository Records**: Combined multiple tasks into single records per repository
- **Task Combination**: Tasks now stored as `Challenge-01;Challenge-02;Challenge-03` format
- **Proper Attempt Tracking**: Enhanced attempt counting with global attempts variable
- **Single API Call Per Repo**: One record per repository instead of multiple records

### Changed
- **Data Structure**: Moved from individual task records to aggregated repository records
- **API Call Strategy**: Collect all task data first, then make single API call
- **Test Calculation**: Sum of all tests and passed tests across all tasks
- **Function Architecture**: Separated data collection from API operations

### Removed
- **Individual Task Records**: No longer creates separate records for each task
- **Multiple API Calls**: Eliminated multiple API calls per repository

## [2.1.4] - 2025-08-26

### Added
- **Enhanced Debug Logging**: Added comprehensive logging for data payload and API responses
- **Improved Error Handling**: Better error diagnostics and debugging information
- **API Response Logging**: Detailed logging of API responses for troubleshooting

### Fixed
- **API Endpoint Consistency**: Ensured consistent use of sheet name in all API calls
- **Error Reporting**: Enhanced error reporting with more detailed information

## [2.1.3] - 2025-08-26

### Fixed
- **API Error Handling**: Added comprehensive error handling for Sheetson API calls
- **Debug Logging**: Added detailed logging for API requests and responses
- **Endpoint Structure**: Fixed API endpoint structure to use correct sheet name format
- **Error Diagnostics**: Enhanced error messages with status codes and response data

### Changed
- **API Calls**: Updated to use proper sheet name in URL path (`/month1`)
- **Error Reporting**: Better error reporting for debugging API issues

## [2.1.1] - 2025-08-26

### Fixed
- **Node.js Compatibility**: Fixed action to use supported `node20` instead of unsupported `node22`
- **Runtime Support**: Action now works properly in GitHub Actions environment

## [2.1.0] - 2025-08-26

### Changed
- **Single Sheet Storage**: Replaced sharded sheet system with single `month1` sheet
- **Simplified Data Management**: All test results now stored in one location
- **Removed Sharding Logic**: Eliminated complex partitioning based on owner names

### Removed
- **Sharding System**: Removed `alphabets` array and `shards` object
- **Partitioning Function**: Removed `ownerToSheetPartition()` function
- **Complex Logic**: Simplified sheet selection to use `getSheetName()` function

## [2.0.0] - 2025-08-26

### Added
- 🚀 **Bun Integration**: Replaced @zeit/ncc with Bun for faster builds
- ✨ **Enhanced Action Metadata**: Better descriptions, examples, and branding
- 🎨 **Visual Branding**: Added icon (bar-chart-2) and green color theme
- 📦 **ES Modules**: Updated to modern JavaScript format with `type: module`
- 🔧 **Updated Dependencies**: Latest versions of all packages
- 📝 **Improved Documentation**: Comprehensive README with usage examples
- 🛠️ **Development Scripts**: Added lint, test, clean, and dev scripts
- 🔄 **Automated Releases**: GitHub workflow for automated releases

### Changed
- **Build System**: Migrated from @zeit/ncc to Bun bundler
- **Module System**: Converted to ES modules format
- **Action Name**: Updated from "Report Audit" to "Jest Test Reporter"
- **Input Descriptions**: Enhanced with examples and better clarity
- **Package Version**: Bumped to v2.0.0

### Breaking Changes
- **Build Requirement**: Now requires Bun instead of @zeit/ncc
- **Module Format**: Uses ES modules instead of CommonJS
- **Action Reference**: Users should update to `@v2` tag

### Migration Guide
To upgrade from v1 to v2:

1. Update your workflow to use the v2 tag:
   ```yaml
   - name: Jest Test Reporter
     uses: Oluwasetemi/jest-to-sheets-modified@v2
   ```

2. Ensure you have Bun installed for local development:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. Update any custom build scripts to use Bun:
   ```bash
   bun run package  # instead of ncc build
   ```

## [1.0.0] - Initial Release

### Added
- Initial implementation of Jest test reporting to Google Sheets
- Support for JavaScript, Python, and PHP projects
- Multiple challenge/task reporting
- GitHub Classroom repository support
- Test attempt tracking
