# ai-review-cv-workflow Specification

## Purpose
TBD - created by archiving change migrate-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: AI review is shortlist-based
The post-MVP system SHALL run AI analysis only for selected, eligible, or top-ranked jobs rather than every collected job by default.

#### Scenario: Collection returns many jobs
- **WHEN** a collection cycle creates or updates many jobs
- **THEN** AI analysis is limited to configured shortlist rules or manual user selection

### Requirement: AI cost controls
The post-MVP system SHALL enforce configurable AI limits such as maximum analyses per run, maximum analyses per day, minimum score threshold, model selection, and manual or assisted mode.

#### Scenario: Daily AI limit is reached
- **WHEN** the configured daily AI analysis limit has already been used
- **THEN** additional AI analysis requests are blocked or queued rather than executed immediately

### Requirement: AI review queue
The post-MVP system SHALL provide an AI review queue that shows candidate jobs with title, company, heuristic score, source, stack tags, risk flags, status, estimated cost, and available actions.

#### Scenario: User analyzes selected jobs
- **WHEN** the user selects jobs in the AI review queue and starts analysis
- **THEN** only those selected eligible jobs are sent for AI review

### Requirement: Short AI result format
AI triage SHALL produce a compact complementary result that is separate from heuristic scoring and includes AI score, fit level, short comment, risk summary, suggested action, and analysis timestamp.

#### Scenario: AI analysis completes
- **WHEN** an eligible job is analyzed
- **THEN** the AI result is stored separately from heuristic match reasons and risk flags

### Requirement: Professional skill profile
The post-MVP system SHALL maintain a professional skill profile with skill name, category, level, scoring weight, CV weight, synonyms, evidence, and active state.

#### Scenario: Scoring references skill profile
- **WHEN** configurable scoring or CV generation uses profile data
- **THEN** it can resolve skill synonyms and evidence from the stored profile

### Requirement: Career truth base
The post-MVP system SHALL maintain a truth base for claims the user can state, state with caution, or must not state in generated application material.

#### Scenario: CV generation evaluates a claim
- **WHEN** a generated CV would imply a prohibited skill, certification, seniority, or leadership claim
- **THEN** the system prevents or flags that claim before final output

### Requirement: CV generation by selected job
The post-MVP system SHALL generate CV content only for selected jobs using the job description, requirements, professional skills, truth base, chosen template, and target language.

#### Scenario: User requests CV for one job
- **WHEN** the user selects a job and a CV template
- **THEN** the system generates reviewable Markdown or HTML output before any later PDF or DOCX export

### Requirement: Lightweight application CRM
The post-MVP system SHALL track application workflow using job status, events, recruiter/company data, and later application artifacts such as generated CVs or messages when introduced.

#### Scenario: User applies to a job
- **WHEN** the user records an application
- **THEN** the system stores the application state and enough history to support follow-up, interview, rejection, ghosting, or offer tracking

