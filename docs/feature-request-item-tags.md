# Feature Request: Item Tags

## Summary

Add tagging support to items so users can organize and filter their tasks using custom labels.

## Problem

Users with many items struggle to find and organize related tasks. The current system only supports filtering by completion status, which is insufficient for users managing complex projects with cross-cutting concerns.

## Target Users

- **Power Users** — manage 50+ active items across multiple projects
- **Team Leads** — need to categorize items by project, priority area, or sprint

## Proposed Solution

### Tag Management
- Users can create, rename, and delete tags scoped to their account
- Each tag has a name (max 30 chars) and an optional color (hex code)
- Tags are unique per user (case-insensitive)
- Maximum 50 tags per user

### Item-Tag Association
- Items can have 0-5 tags assigned
- Many-to-many relationship between items and tags
- Assigning/removing tags from items via the update endpoint

### Filtering
- Extend GET /api/items to accept `?tags=tag1,tag2` query parameter
- Support AND/OR filter modes via `?tagMode=and|or` (default: OR)
- Tag filter combines with existing `?completed` filter

### API Endpoints
- `GET /api/tags` — list user's tags
- `POST /api/tags` — create a tag `{ name, color? }`
- `PUT /api/tags/:id` — update tag name/color
- `DELETE /api/tags/:id` — delete tag (removes from all items)
- `PUT /api/items/:id` — extend to accept `{ tagIds: string[] }`

### Database Changes
- New `Tag` model: id, name, color, userId, createdAt
- New `ItemTag` join table: itemId, tagId
- Unique constraint on (userId, name) for Tag

## Success Criteria

- Users can create and manage tags
- Items can be tagged and filtered by tags
- Tag operations do not degrade list performance (< 100ms p95)
- Existing API contracts remain backward-compatible

## Constraints

- No breaking changes to existing endpoints
- Tag names must be sanitized (alphanumeric + hyphens + spaces)
- Colors must be valid hex codes when provided
- Pagination must work correctly with tag filters

## Priority

Medium — enhances usability for power users without blocking core functionality.
