# Swagger Endpoint Grouping Design

## Goal

Group the API operations in Swagger UI by the existing endpoint modules so the
documentation is displayed as collapsible sections, similar to the provided
reference image.

## Scope

- Add OpenAPI tags to the existing FastEndpoints.
- Use the endpoint namespace/folder as the source of the tag name.
- Keep the existing English module names: `Auth`, `Places`, `Chat`, `Trips`,
  `Users`, `Blogs`, `Friends`, `Reviews`, `Geography`, `Catalog`, `Itineraries`,
  `Proposals`, and `Foods`.
- Do not change routes, request or response contracts, authorization,
  rate-limiting, handlers, or business logic.
- Leave health-check route mapping unchanged.

## Implementation

Each endpoint's `Configure()` method will call `Tags("ModuleName")` alongside
its existing route and endpoint metadata. Endpoints in the same module receive
the same tag, causing NSwag/FastEndpoints to render them under one Swagger UI
section.

The change is intentionally explicit rather than convention-based. This keeps
the displayed tag stable if a file is moved, makes exceptions visible in the
endpoint itself, and avoids coupling document generation to filesystem
discovery.

## Validation

1. Build the API project.
2. Verify every endpoint under `API/Endpoints` has a module tag.
3. Run the existing targeted tests if the build or endpoint metadata changes
   expose any related failures.
4. Confirm no route or runtime behavior changes are introduced.
