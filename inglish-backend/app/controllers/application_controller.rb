class ApplicationController < ActionController::API
  # Force JSON responses only
  before_action :set_default_response_format

  # Handle exceptions and return JSON responses
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity
  rescue_from ActionController::ParameterMissing, with: :render_bad_request

  private

  def set_default_response_format
    request.format = :json
  end

  # Standard JSON response helpers
  def render_success(data: nil, message: nil, status: :ok)
    response = { success: true }
    response[:data] = data if data.present?
    response[:message] = message if message.present?
    render json: response, status: status
  end

  def render_error(message:, errors: {}, status: :unprocessable_entity)
    render json: {
      success: false,
      message: message,
      errors: errors
    }, status: status
  end

  # Exception handlers
  def render_not_found(exception)
    render_error(
      message: "Resource not found",
      errors: { resource: [exception.message] },
      status: :not_found
    )
  end

  def render_unprocessable_entity(exception)
    render_error(
      message: "Validation failed",
      errors: exception.record.errors.to_hash,
      status: :unprocessable_entity
    )
  end

  def render_bad_request(exception)
    render_error(
      message: "Bad request",
      errors: { parameter: [exception.message] },
      status: :bad_request
    )
  end
end
