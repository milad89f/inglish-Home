# Architecture Guide

This project follows a clean MVC architecture with additional layers for better organization.

## Project Structure

```
app/
├── controllers/          # Request handlers
│   ├── application_controller.rb  # Base controller with JSON helpers
│   └── api/
│       └── v1/           # API version 1 controllers
│           ├── base_controller.rb
│           └── health_controller.rb
│
├── models/               # ActiveRecord models (database layer)
│   ├── application_record.rb
│   └── concerns/
│
├── serializers/          # JSON serialization layer
│   ├── base_serializer.rb
│   └── health_serializer.rb
│
└── services/             # Business logic layer
    └── base_service.rb
```

## Architecture Layers

### 1. Controllers (`app/controllers/`)
- Handle HTTP requests and responses
- Parse and validate input parameters
- Call services or interact with models
- Return JSON responses using serializers

**Base Classes:**
- `ApplicationController` - Base controller with JSON helpers and error handling
- `Api::V1::BaseController` - Base for all API v1 endpoints

**Response Helpers:**
- `render_success(data:, message:, status:)` - Success response
- `render_error(message:, errors:, status:)` - Error response

### 2. Models (`app/models/`)
- Represent database tables
- Handle data validation
- Define associations and scopes
- Contain model-specific business logic

**Base Class:**
- `ApplicationRecord` - Base model class

### 3. Serializers (`app/serializers/`)
- Format data into JSON structure
- Control what fields are exposed in API responses
- Handle nested associations
- Transform data for presentation

**Base Class:**
- `BaseSerializer` - Base serializer with common functionality

**Usage:**
```ruby
UserSerializer.new(user).as_json
```

### 4. Services (`app/services/`)
- Contain complex business logic
- Coordinate between multiple models
- Handle external API calls
- Encapsulate operations that don't fit in models

**Base Class:**
- `BaseService` - Base service with result handling

**Result Pattern:**
```ruby
result = SomeService.call(params)
if result.success?
  # Handle success
else
  # Handle error
end
```

## Request Flow

1. **Request** → Controller receives HTTP request
2. **Validation** → Controller validates parameters
3. **Service/Model** → Controller calls service or model
4. **Business Logic** → Service/model performs operation
5. **Serialization** → Data is serialized using serializer
6. **Response** → Controller returns JSON response

## JSON-Only Configuration

The application is configured to respond only with JSON:

1. `config.api_only = true` - API-only mode
2. `config.action_dispatch.default_formats = [:json]` - Default to JSON
3. `ApplicationController#set_default_response_format` - Force JSON format
4. `config/initializers/json_response.rb` - JSON response initializer

## Error Handling

All errors are returned as JSON with consistent structure:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["error message"]
  }
}
```

**Exception Handlers:**
- `ActiveRecord::RecordNotFound` → 404 Not Found
- `ActiveRecord::RecordInvalid` → 422 Unprocessable Entity
- `ActionController::ParameterMissing` → 400 Bad Request

## Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

## Best Practices

1. **Controllers** should be thin - delegate to services
2. **Models** should handle data validation and associations
3. **Services** should contain business logic
4. **Serializers** should format output only
5. **Always use serializers** for API responses
6. **Handle errors consistently** using base controller helpers




