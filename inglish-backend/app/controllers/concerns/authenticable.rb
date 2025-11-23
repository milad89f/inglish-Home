module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    token = extract_token_from_header
    @current_user = JwtService.current_user(token)

    unless @current_user
      render_error(
        message: "Unauthorized. Invalid or missing token.",
        status: :unauthorized
      )
    end
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Support both "Bearer TOKEN" and "TOKEN" formats
    token = auth_header.split(' ').last
    token.presence
  end

  def user_signed_in?
    @current_user.present?
  end
end




