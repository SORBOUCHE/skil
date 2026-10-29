# OpenAPI 3.1 Specification Cheatsheet

A concise, high-density reference guide for authoring, reviewing, and maintaining OpenAPI 3.1 API contract definitions.

---

## 1. Root Document Structure

```yaml
openapi: 3.1.0
info:
  title: Workspace Enterprise API
  summary: Core API for workspace operations
  description: Markdown-enabled API description.
  version: 1.0.0
  termsOfService: https://workspace.internal/terms
  contact:
    name: API Platform Team
    email: api-platform@workspace.internal
  license:
    name: Apache 2.0
    identifier: Apache-2.0

servers:
  - url: https://api.workspace.internal/v1
    description: Production Cluster
  - url: https://staging-api.workspace.internal/v1
    description: Staging Environment
  - url: http://localhost:{port}/v1
    description: Local Dev Server
    variables:
      port:
        default: "4000"
        enum: ["4000", "8080"]

tags:
  - name: Users
    description: Identity, profile, and authorization
  - name: Documents
    description: Collaborative document management
```

---

## 2. Operation & Path Structure

```yaml
paths:
  /v1/organizations/{orgId}/members:
    parameters:
      - name: orgId
        in: path
        required: true
        description: Unique UUID of the organization
        schema:
          type: string
          format: uuid

    get:
      tags: [Users]
      summary: List organization members
      operationId: listOrgMembers
      parameters:
        - name: role
          in: query
          required: false
          schema:
            type: string
            enum: [admin, member, guest]
        - name: cursor
          in: query
          required: false
          schema:
            type: string
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 25
      responses:
        '200':
          description: Paginated member list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MemberPaginationEnvelope'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

    post:
      tags: [Users]
      summary: Invite new member
      operationId: inviteOrgMember
      requestBody:
        required: true
        description: Member invitation details
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InviteMemberRequest'
      responses:
        '201':
          description: Invitation created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Member'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'
```

---

## 3. Schema Definitions (JSON Schema Draft 2020-12)

OpenAPI 3.1 aligns 100% with modern JSON Schema.

### Nullability & Primitive Types
```yaml
components:
  schemas:
    # Non-nullable string with format constraint
    EmailField:
      type: string
      format: email

    # Nullable string in OpenAPI 3.1 (Array notation)
    NullableNickname:
      type: ["string", "null"]
      maxLength: 50

    # Integers and floats with boundaries
    BoundedPercentage:
      type: number
      minimum: 0.0
      maximum: 100.0

    # Unix Timestamp (seconds)
    UnixTimestamp:
      type: integer
      minimum: 0
      example: 1791925020
```

### Complex Objects & Required Keys
```yaml
    Member:
      type: object
      required:
        - id
        - email
        - role
        - joinedAt
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, member, guest]
        avatarUrl:
          type: ["string", "null"]
          format: uri
        joinedAt:
          type: string
          format: date-time
        permissions:
          type: array
          items:
            type: string
          uniqueItems: true
      additionalProperties: false
```

### Polymorphism & Composition
```yaml
    # Discriminated Union
    PaymentMethod:
      type: object
      required: [type]
      discriminator:
        propertyName: type
        mapping:
          card: '#/components/schemas/CardPayment'
          wire: '#/components/schemas/WirePayment'
      oneOf:
        - $ref: '#/components/schemas/CardPayment'
        - $ref: '#/components/schemas/WirePayment'
```

---

## 4. RFC 7807 Problem Details Error Schemas

Reusable standardized error response schemas:

```yaml
components:
  schemas:
    ProblemDetails:
      type: object
      required:
        - type
        - title
        - status
        - detail
      properties:
        type:
          type: string
          format: uri
          example: https://errors.workspace.internal/validation-error
        title:
          type: string
          example: Validation Failed
        status:
          type: integer
          example: 422
        detail:
          type: string
          example: The provided payload did not satisfy schema requirements.
        instance:
          type: string
          example: /v1/organizations/org_123/members
        errors:
          type: array
          items:
            type: object
            required: [field, message]
            properties:
              field: { type: string, example: email }
              message: { type: string, example: Invalid email format }

  responses:
    Unauthorized:
      description: Authentication is missing or invalid
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
    NotFound:
      description: Target resource was not found
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
    UnprocessableEntity:
      description: Semantic validation failed
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
```

---

## 5. Security Schemes

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Provide JWT bearer token in Authorization header.
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: Service-to-service API key.

# Applied globally to all operations:
security:
  - BearerAuth: []
```
