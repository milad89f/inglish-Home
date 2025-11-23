# JSON Response Configuration
# Ensures all responses are in JSON format

Rails.application.config.to_prepare do
  # Set default response format to JSON for all controllers
  ActionController::API.include(Module.new do
    def respond_to_mime_type(_mime_type)
      # Always respond with JSON
      true
    end
  end)
end




