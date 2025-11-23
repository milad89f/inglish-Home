# Inglish Backend API

Rails 8.1.1 API-only backend application for the Inglish language learning platform.

## 🚀 Quick Start

### Prerequisites
- Ruby 3.4+
- PostgreSQL 9.3+
- Bundler

### Installation

1. **Install dependencies:**
   ```bash
   bundle install
   ```

2. **Set up the database:**
   ```bash
   rails db:create
   rails db:migrate
   ```

3. **Start the server:**
   ```bash
   rails server
   ```

   The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
app/
  controllers/
    api/
      v1/
        base_controller.rb      # Base controller for API v1
        health_controller.rb    # Health check endpoint
    application_controller.rb
config/
  database.yml                  # PostgreSQL configuration
  routes.rb                     # API routes
  initializers/
    cors.rb                     # CORS configuration
```

## 🔌 API Endpoints

### Health Check
- **GET** `/api/v1/health`
  - Returns API status and timestamp
  - Response:
    ```json
    {
      "status": "ok",
      "message": "Inglish Backend API is running",
      "timestamp": "2025-01-19T12:00:00Z"
    }
    ```

## 🗄️ Database

The application uses PostgreSQL. Configure your database connection in `config/database.yml`.

### Development Database Setup
```bash
# Create databases
rails db:create

# Run migrations
rails db:migrate

# Seed data (if needed)
rails db:seed
```

## 🔧 Configuration

### CORS
CORS is configured in `config/initializers/cors.rb`. Currently set to allow all origins for development. **Update this for production!**

### Environment Variables
Create a `.env` file in the root directory for environment-specific configurations:
```
DATABASE_URL=postgresql://localhost/inglish_backend_development
```

## 🧪 Testing

```bash
# Run tests
rails test

# Run specific test file
rails test test/controllers/api/v1/health_controller_test.rb
```

## 📝 Next Steps

1. Create models for your application
2. Add authentication (JWT, Devise Token Auth, etc.)
3. Implement API endpoints for your features
4. Add API documentation (Swagger/OpenAPI)
5. Set up environment variables for production

## 📚 Resources

- [Rails API Guide](https://guides.rubyonrails.org/api_app.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
