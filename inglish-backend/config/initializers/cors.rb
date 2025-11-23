# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Development origins - allow all localhost ports for web development
    if Rails.env.development?
      # In development, allow all localhost and 127.0.0.1 ports
      origins /^http:\/\/localhost:\d+$/,           # All localhost ports
              /^http:\/\/127\.0\.0\.1:\d+$/,         # All 127.0.0.1 ports
              /^http:\/\/192\.168\.\d+\.\d+:\d+$/,   # Local network IPs (for mobile devices)
              /^http:\/\/10\.0\.\d+\.\d+:\d+$/,      # Android emulator IPs
              'http://localhost:8081',               # Expo web (explicit)
              'http://localhost:19006',              # Expo web alternative
              'http://127.0.0.1:8081',                # Expo web (explicit)
              'http://127.0.0.1:19006'                # Expo web alternative
    else
      # Production - specify exact origins
      origins ENV.fetch('ALLOWED_ORIGINS', 'https://yourdomain.com').split(',')
    end

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization', 'Content-Type']  # Expose headers for frontend
  end
end
