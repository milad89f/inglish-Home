# Swagger/OpenAPI Documentation Setup

## Overview

This project uses **rswag** gem to generate Swagger/OpenAPI documentation automatically from RSpec tests.

## Accessing Swagger UI

After starting the Rails server, access Swagger UI at:
```
http://localhost:3000/api-docs
```

## Generating Swagger Documentation

### Method 1: Generate from RSpec tests (Recommended)

```bash
# Run RSpec tests to generate swagger.yaml
bundle exec rake rswag:specs:swaggerize
```

This will:
1. Run the Swagger specs in `spec/requests/api/v1/swagger_spec.rb`
2. Generate `swagger/v1/swagger.yaml` file
3. Make it available at `/api-docs`

### Method 2: Manual generation

```bash
# Run all specs
bundle exec rspec

# Or run just Swagger specs
bundle exec rspec spec/requests/api/v1/swagger_spec.rb
```

Then generate the YAML:
```bash
bundle exec rake rswag:specs:swaggerize
```

## File Structure

```
inglish-backend/
├── spec/
│   ├── swagger_helper.rb          # Swagger configuration
│   ├── spec_helper.rb              # RSpec configuration
│   ├── rails_helper.rb             # Rails test configuration
│   └── requests/
│       └── api/
│           └── v1/
│               └── swagger_spec.rb # API endpoint specs
├── swagger/
│   └── v1/
│       └── swagger.yaml            # Generated OpenAPI spec (auto-generated)
└── config/
    ├── initializers/
    │   ├── rswag_api.rb            # API configuration
    │   └── rswag_ui.rb             # UI configuration
    └── routes.rb                   # Routes with Swagger mounts
```

## Swagger UI Features

### Authentication

Swagger UI supports JWT Bearer token authentication:

1. Click **Authorize** button (top right)
2. Enter your JWT token
3. Click **Authorize**
4. All protected endpoints will use this token

### Testing Endpoints

1. Select an endpoint
2. Click **Try it out**
3. Fill in parameters/request body
4. Click **Execute**
5. View response

## Documented Endpoints

All endpoints are documented in `spec/requests/api/v1/swagger_spec.rb`:

### Public Endpoints:
- ✅ GET /api/v1/health
- ✅ POST /api/v1/users/signup
- ✅ POST /api/v1/users/login
- ✅ GET /api/v1/auth/me

### Protected Endpoints:
- ✅ GET /api/v1/users/:id/courses
- ✅ POST /api/v1/courses
- ✅ GET /api/v1/courses/:id
- ✅ GET /api/v1/courses/:id/videos
- ✅ GET /api/v1/courses/:id/reports
- ✅ GET /api/v1/courses/:id/subjects

## Updating Documentation

To update the Swagger documentation:

1. **Edit specs** in `spec/requests/api/v1/swagger_spec.rb`
2. **Add/update** endpoint documentation
3. **Run generation**: `bundle exec rake rswag:specs:swaggerize`
4. **Refresh** Swagger UI

## Schemas

All data models are defined in `spec/swagger_helper.rb`:

- User
- Course
- Video
- Report
- Subject
- Error
- SuccessResponse
- AuthResponse

## Example Workflow

```bash
# 1. Start Rails server
rails server

# 2. In another terminal, generate Swagger docs
bundle exec rake rswag:specs:swaggerize

# 3. Open browser
# Navigate to: http://localhost:3000/api-docs

# 4. Test endpoints in Swagger UI
```

## Troubleshooting

### Swagger UI not loading

**Problem:** Can't access `/api-docs`

**Solutions:**
1. Check gems are installed: `bundle install`
2. Verify routes: Check `config/routes.rb` has Swagger mounts
3. Check initializers exist: `config/initializers/rswag_*.rb`
4. Restart Rails server

### Swagger YAML not generated

**Problem:** `swagger/v1/swagger.yaml` doesn't exist

**Solutions:**
1. Run: `bundle exec rake rswag:specs:swaggerize`
2. Check `spec/swagger_helper.rb` exists
3. Check `spec/requests/api/v1/swagger_spec.rb` exists
4. Run RSpec: `bundle exec rspec spec/requests/api/v1/swagger_spec.rb`

### Authentication not working in Swagger UI

**Problem:** Protected endpoints return 401

**Solutions:**
1. Login via `/api/v1/users/login` endpoint
2. Copy the token from response
3. Click **Authorize** in Swagger UI
4. Paste token and click **Authorize**

### Specs failing

**Problem:** RSpec tests failing

**Solutions:**
1. Ensure database is set up: `rails db:create db:migrate`
2. Check test database exists
3. Run migrations: `rails db:migrate RAILS_ENV=test`
4. Check model validations match spec expectations

## Exporting Swagger Spec

To export the Swagger YAML:

```bash
# Copy the generated file
cp swagger/v1/swagger.yaml swagger-openapi.yaml

# Or access via API
curl http://localhost:3000/api-docs/v1/swagger.yaml
```

## Integration with Other Tools

### Import to Postman

1. Export Swagger YAML
2. In Postman: Import → Link or File
3. Select `swagger/v1/swagger.yaml`
4. Collection is imported with all endpoints

### Import to Insomnia

1. File → Import → From File
2. Select `swagger/v1/swagger.yaml`
3. All endpoints imported

### Generate Client SDKs

Use tools like:
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)
- [OpenAPI Generator](https://openapi-generator.tech/)

Example:
```bash
openapi-generator generate -i swagger/v1/swagger.yaml -g javascript -o ./client-sdk
```

## Configuration Files

### swagger_helper.rb

Main configuration file with:
- OpenAPI version
- API info (title, version, description)
- Security schemes (JWT Bearer)
- Data schemas/models
- Server URLs

### rswag_api.rb

Configures where Swagger JSON/YAML files are served from.

### rswag_ui.rb

Configures Swagger UI endpoints and appearance.

## Next Steps

1. Run `bundle install` to install rswag gems
2. Generate Swagger docs: `bundle exec rake rswag:specs:swaggerize`
3. Start server: `rails server`
4. Access Swagger UI: `http://localhost:3000/api-docs`
5. Test endpoints and explore API documentation

Happy documenting! 📚




