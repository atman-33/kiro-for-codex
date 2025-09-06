# UpdateChecker Unit Test Cases

## Test File

`updateChecker.test.ts`

## Test Purpose

Ensure that the UpdateChecker service continues to work properly after code updates, including core functionality such as version checking, notification display, user interaction, and rate limiting.

## Test Case Overview

| Case ID | Function Description                    | Test Type     |
| ------- | --------------------------------------- | ------------- |
| UC-01   | Get latest version from GitHub API     | Positive test |
| UC-02   | Handle API network errors              | Exception test|
| UC-03   | Handle non-200 responses               | Exception test|
| UC-04   | Compare semantic version numbers       | Positive test |
| UC-05   | Display update notification            | Positive test |
| UC-06   | Click to view update changelog         | Positive test |
| UC-07   | Click to skip version                  | Positive test |
| UC-08   | No more prompts after skipping version| Positive test |
| UC-09   | No duplicate checks within 24 hours   | Positive test |
| UC-10   | Force check ignores rate limiting     | Positive test |

## Detailed Test Steps

### UC-01: Get latest version from GitHub API

**Test Purpose**: Verify that UpdateChecker can successfully get latest version information from GitHub API

**Test Data**:

- Mock fetch to return successful response
- Simulate GitHub Release API response format:

  ```json
  {
    "tag_name": "v0.1.8",
    "name": "Release v0.1.8",
    "html_url": "https://github.com/notdp/kiro-for-cc/releases/tag/v0.1.8",
    "body": "Release notes"
  }
  ```

**Test Steps**:

1. Create UpdateChecker instance
2. Call `checkForUpdates()` method
3. Verify fetch is called correctly
4. Check log output

**Expected Results**:

- fetch calls URL: `https://api.github.com/repos/notdp/kiro-for-cc/releases/latest`
- Log contains: `[UpdateChecker] Fetching latest release from GitHub...`
- Log contains: `[UpdateChecker] Latest release: v0.1.8`

### UC-02: Handle API network errors

**Test Purpose**: Verify system can gracefully handle network errors

**Test Data**:

- Mock fetch to throw network error
- Error message: `Network error`

**Test Steps**:

1. Configure fetch mock to throw error
2. Call `checkForUpdates()`
3. Verify error is caught
4. Check error logs

**Expected Results**:

- No uncaught exceptions thrown
- Log contains: `[UpdateChecker] ERROR: Failed to fetch latest release: Error: Network error`
- System continues running normally

### UC-03: Handle non-200 responses

**Test Purpose**: Verify system can correctly handle HTTP error status codes

**Test Data**:

- Mock fetch to return 404 response
- Status text: `Not Found`

**Test Steps**:

1. Configure fetch to return non-OK response
2. Call `checkForUpdates()`
3. Verify response handling logic
4. Check log output

**Expected Results**:

- No update notification displayed
- Log contains: `[UpdateChecker] GitHub API returned 404: Not Found`
- Method returns normally

### UC-04: Compare semantic version numbers

**Test Purpose**: Verify correctness of version comparison logic

**Test Data**:

- Test case matrix:

  | Current Version | Latest Version | Should Update |
  | --------------- | -------------- | ------------- |
  | 0.1.8          | v0.1.9         | Yes           |
  | 0.1.8          | v0.2.0         | Yes           |
  | 0.1.8          | v1.0.0         | Yes           |
  | 0.1.8          | v0.1.8         | No            |
  | 0.1.9          | v0.1.8         | No            |
  | 1.0.0          | v0.9.9         | No            |

**Test Steps**:

1. For each test case:
   - Set current version
   - Mock API to return latest version
   - Call `checkForUpdates()`
   - Verify if notification is displayed

**Expected Results**:

- Show notification for newer versions
- No notification for same or older versions
- Version prefix 'v' is handled correctly

### UC-05: Display update notification

**Test Purpose**: Verify update notification display format and content

**Test Data**:

- Current version: 0.1.8
- Latest version: v0.1.9

**Test Steps**:

1. Configure version difference to trigger update
2. Call `checkForUpdates()`
3. Verify notification content
4. Check button options

**Expected Results**:

- Notification message: `🎉 Kiro for CC 0.1.9 is available! (current: 0.1.8)`
- Button options: ["View Changelog", "Skip"]
- Uses showInformationMessage method

### UC-06: Click to view update changelog

**Test Purpose**: Verify behavior when clicking "View Changelog" button

**Test Data**:

- Mock user clicking "View Changelog"
- Expected URL: `https://github.com/notdp/kiro-for-cc/releases/latest`

**Test Steps**:

1. Trigger update notification
2. Simulate user clicking "View Changelog"
3. Wait for async operations to complete
4. Verify external link call

**Expected Results**:

- vscode.env.openExternal is called
- Correct GitHub releases URL is passed
- Uses vscode.Uri.parse to handle URL

### UC-07: Click to skip version

**Test Purpose**: Verify skip version functionality implementation

**Test Data**:

- Mock user clicking "Skip"
- Skipped version: 0.1.9

**Test Steps**:

1. Trigger update notification
2. Simulate user clicking "Skip"
3. Wait for async operations to complete
4. Verify state saving

**Expected Results**:

- globalState.update is called
- Save key: `kfc.skipVersion`
- Save value: `0.1.9`
- Shows 5-second auto-dismiss confirmation notification

### UC-08: No more prompts after skipping version

**Test Purpose**: Verify that skipped versions won't prompt again

**Test Data**:

- Set skipped version: 0.1.9
- API returns same version

**Test Steps**:

1. Mock globalState to return skipped version
2. Call `checkForUpdates()`
3. Verify notification behavior

**Expected Results**:

- No update notification displayed
- Version updates are ignored even if available
- Log normally records check process

### UC-09: No duplicate checks within 24 hours

**Test Purpose**: Verify rate limiting functionality prevents frequent checks

**Test Data**:

- Set last check time: 1 hour ago
- Check interval: 24 hours

**Test Steps**:

1. Mock last check timestamp
2. Call `checkForUpdates()`
3. Verify API calls

**Expected Results**:

- fetch is not called
- Returns directly, skipping check
- Reduces unnecessary API requests

### UC-10: Force check ignores rate limiting

**Test Purpose**: Verify force check parameter can bypass rate limiting

**Test Data**:

- Set last check time: 1 hour ago
- Use force parameter

**Test Steps**:

1. Mock last check timestamp
2. Call `checkForUpdates(true)`
3. Verify API is called

**Expected Results**:

- fetch is called normally
- Rate limiting is ignored
- Last check time is updated

## Test Considerations

### Mock Strategy

- Use Jest mock to simulate vscode API
- Mock fetch global function
- Mock NotificationUtils to avoid actual notifications
- Clean all mocks before each test

### Async Processing

- Notification button callbacks are asynchronous
- Use `setTimeout(resolve, 0)` to wait for async operations
- Ensure Promise chain completes before verification

### State Management

- globalState used for persistent configuration
- Skip version information needs persistent storage
- Last check time used for rate limiting

### Version Number Handling

- GitHub tags may contain 'v' prefix
- Need to remove prefix for internal comparison
- Support major.minor.patch format

### Error Boundaries

- Network errors should not affect extension operation
- API rate limiting returning 403 needs graceful handling
- Invalid version number formats need fault tolerance
