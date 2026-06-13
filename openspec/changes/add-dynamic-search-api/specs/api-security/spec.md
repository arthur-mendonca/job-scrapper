## ADDED Requirements

### Requirement: Dynamic search API protection
Dynamic search API routes SHALL be protected API routes and MUST require `X-Internal-Api-Secret` when `API_REQUIRE_INTERNAL_AUTH` is true.

#### Scenario: Dynamic search route lacks secret
- **WHEN** `API_REQUIRE_INTERNAL_AUTH` is true and a client calls a dynamic search API route without `X-Internal-Api-Secret`
- **THEN** the API rejects the request before creating, modifying, deleting, or testing dynamic search configurations

### Requirement: Dynamic test-search throttling
The dynamic search test endpoint SHALL apply endpoint-specific request throttling and max result limits to reduce SearXNG abuse risk.

#### Scenario: Test-search endpoint is spammed
- **WHEN** a client exceeds the configured dynamic test-search request threshold
- **THEN** the API returns a rate-limit response without calling SearXNG

#### Scenario: Test-search limit is too high
- **WHEN** a client requests more preview results than the allowed maximum
- **THEN** the API rejects or clamps the request according to the documented contract before calling SearXNG

### Requirement: Dynamic search anti-abuse at API boundary
Dynamic search API behavior MUST NOT introduce login-based scraping, cookies, CAPTCHA bypass, private search APIs, stealth browser automation, or user-provided arbitrary target URLs that bypass SearXNG safety controls.

#### Scenario: Client requests bypass behavior
- **WHEN** a dynamic search API request attempts to configure cookies, credentials, private APIs, CAPTCHA solving, stealth automation, or unsupported direct scraping behavior
- **THEN** the API rejects the request and does not call SearXNG or any target site
